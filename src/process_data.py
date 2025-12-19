import csv
import json
import math
import sys
from datetime import datetime, timedelta

# Import centralized configuration
from config import *


def parse_german_date(date_str):
    return datetime.strptime(date_str, "%d.%m.%Y")


def get_load_curve_probabilities():
    # Simple daily curve for electricity: Peak Morning (8am), Dip Day, Peak Evening (7pm)
    curve = []
    for i in range(STEPS_PER_DAY):
        hour = i / STEPS_PER_HOUR
        # Base
        val = BASE_LOAD_FACTOR
        # Morning Peak
        val += MORNING_PEAK_INTENSITY * math.exp(
            -((hour - MORNING_PEAK_HOUR) ** 2) / MORNING_PEAK_WIDTH
        )
        # Evening Peak
        val += EVENING_PEAK_INTENSITY * math.exp(
            -((hour - EVENING_PEAK_HOUR) ** 2) / EVENING_PEAK_WIDTH
        )
        curve.append(val)
    total = sum(curve)
    return [c / total for c in curve]


def get_heat_curve_probabilities():
    # Heat pump runs typically flat or slightly more in day if optimized,
    # but let's assume flat demand for simplicity as instructed "Guess all usage curves"
    return [1.0 / STEPS_PER_DAY] * STEPS_PER_DAY


LOAD_PROFILE = get_load_curve_probabilities()
HEAT_PROFILE = get_heat_curve_probabilities()


def read_monthly_data():
    """
    Reads wa_pu_data.csv.
    Assumes row date is the 'recording' date for the PREVIOUS month's usage (typical for bills).
    Or is it?
    Let's check the logic:
    01.09.2024 -> 0 (August usage? 0 makes sense)
    01.01.2025 -> 331 (Dec usage? High. Makes sense)
    01.02.2025 -> 344 (Jan usage? Highest. Makes sense)

    Structure: Date,Gas,Strom(Reading)
    Returns: { (year, month): { 'gas': m3, 'ele': kwh } }
    """
    data = {}
    rows = []
    with open(MONTHLY_USAGE_FILE, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)

    # Need to sort by date to calculate Strom delta
    rows.sort(key=lambda x: parse_german_date(x["Date"]))

    for i in range(1, len(rows)):
        prev = rows[i - 1]
        curr = rows[i]

        curr_date = parse_german_date(curr["Date"])
        curr_gas = float(curr["Gas"])  # This seems to be usage during the interval

        curr_strom = float(curr["Strom"])
        prev_strom = float(prev["Strom"])
        strom_usage = curr_strom - prev_strom

        # Determine which month this usage belongs to.
        # If Current is 01.02.2025, usage is for Jan 2025.
        # So we go back 1 day from curr_date to find the month.
        target_month_date = curr_date - timedelta(days=5)
        key = (target_month_date.year, target_month_date.month)

        data[key] = {"gas": curr_gas, "ele": strom_usage}

    return data


def read_solar_reference():
    """
    Reads 12 CSV files E3DC-Export(1..12).csv
    Assumes format: timestamp;...;...;Solarproduktion
    Returns list of 15-min values (Watts)
    """
    yearly_solar = []  # List of tuples (datetime, watts)

    # 2025 is not leap, 365 days.
    # We iterate 1 to 12.
    for month in range(1, 13):
        fname = f"{SOLAR_DATA_DIR}/E3DC-Export({month}).csv"
        with open(fname, "r") as f:
            # Skip first line if it's header. Check first char.
            lines = f.readlines()
            # E3DC exports often have some header metadata but here line 1 is header
            for line in lines[1:]:
                if not line.strip():
                    continue
                parts = line.split(";")
                if len(parts) < 4:
                    continue

                ts_str = parts[0]  # "2025-01-01 00:00"
                watts = float(parts[-1])

                # Parse TS
                ts = datetime.strptime(ts_str, "%Y-%m-%d %H:%M")
                yearly_solar.append({"ts": ts, "val": watts})

    return yearly_solar


def process():
    monthly_targets = read_monthly_data()
    solar_raw = read_solar_reference()

    # We build the final dataset
    # We need to map solar_raw timestamps to our simulation year (2025).
    # The solar files ARE 2025. Perfect.

    final_data = []  # List of {ts, solar, load, hp}

    # Convert raw solar to list for index shifting
    solar_values = [x["val"] for x in solar_raw]
    n_points = len(solar_values)

    current_month_idx = -1
    month_days = 0
    daily_ele_budget = 0
    daily_hp_budget = 0

    for i, item in enumerate(solar_raw):
        ts = item["ts"]

        # New month check
        if ts.month != current_month_idx:
            current_month_idx = ts.month

            # Get targets
            key = (ts.year, ts.month)
            if key in monthly_targets:
                targets = monthly_targets[key]

                # Calc Monthly totals
                # Days in month?
                if ts.month == 12:
                    next_month = datetime(ts.year + 1, 1, 1)
                else:
                    next_month = datetime(ts.year, ts.month + 1, 1)
                days_in_month = (next_month - datetime(ts.year, ts.month, 1)).days

                # Daily budgets
                daily_ele_budget = targets["ele"] / days_in_month

                heat_energy_kwh = targets["gas"] * GAS_TO_KWH
                hp_ele_kwh = heat_energy_kwh / HP_COP
                daily_hp_budget = hp_ele_kwh / days_in_month

            else:
                # Fallback if specific month data missing (e.g. Dec 2025 might naturally be missing if file ends early?
                # But we saw 01.01.2026 data... wait, file ended 01.12.2025?
                # File ended 01.12.2025 reading, which covers Nov usage.
                # Do we have Dec usage?
                # 01.12.2025 row is there. Usage is for Nov.
                # Dec 2025 usage would be in 01.01.2026.
                # We assume loop or copy previous Dec?
                # Let's use Dec 2024 data (from 01.01.2025 row) for Dec 2025 fallback.
                pass
                # For now simplify: if missing, use last valid? Or zero.
                if (2025, 12) not in monthly_targets and ts.month == 12:
                    # Use (2024, 12) if available
                    # Actually (2024, 12) would be keyed as (2024, 12).
                    # The date 01.01.2025 gives us Dec 2024 usage.
                    if (2024, 12) in monthly_targets:
                        targets = monthly_targets[(2024, 12)]
                        daily_ele_budget = targets["ele"] / 31
                        heat_energy_kwh = targets["gas"] * GAS_TO_KWH
                        daily_hp_budget = (heat_energy_kwh / HP_COP) / 31

        # 1. Synthesize Solar (East/West)
        # Shift indices. Wrap around is negligible for year, but Day wrap matters?
        # Solar is effectively 0 at midnight so simplified index shift is okay.

        # East: Peak is earlier. Time t corresponds to South t+shift.
        # e.g. at 9am (t), we want South intensity from 11am (t+shift)
        idx_east = min(i + EAST_SHIFT, n_points - 1)
        idx_west = max(i + WEST_SHIFT, 0)

        solar_east = solar_values[idx_east] if 0 <= idx_east < n_points else 0
        solar_west = solar_values[idx_west] if 0 <= idx_west < n_points else 0

        # Combine
        sim_solar_w = (solar_east * SOLAR_SCALING) + (solar_west * SOLAR_SCALING)

        # 2. Synthesize Loads
        time_of_day_idx = (ts.hour * 4) + (ts.minute // 15)

        # Normal Load (Watts = Energy_15min_kWh * 4 * 1000)
        # Energy_15min = Daily_Budget * Profile[idx]
        ele_kwh_15 = daily_ele_budget * LOAD_PROFILE[time_of_day_idx]
        ele_watts = ele_kwh_15 * 4 * 1000

        # Heat Pump Load
        hp_kwh_15 = daily_hp_budget * HEAT_PROFILE[time_of_day_idx]
        hp_watts = hp_kwh_15 * 4 * 1000

        # Scale solar data to match real production
        # CSV data needs scaling factor to match 20kWp system production
        raw_solar_w = (
            solar_values[i] * SOLAR_DATA_SCALE_FACTOR
        )  # Scale to match 17.13kWh on Dec 18th

        final_data.append(
            {
                "ts": ts.strftime("%Y-%m-%d %H:%M"),
                "solar_w": int(raw_solar_w),
                "load_w": int(ele_watts),
                "hp_w": int(hp_watts),
            }
        )

    # Write to data.js
    # Format: const SIM_DATA = [ ... ];
    js_content = "const SIM_DATA = " + json.dumps(final_data) + ";"
    with open(DATA_OUTPUT_FILE, "w") as f:
        f.write(js_content)

    print(f"Processed {len(final_data)} records. Wrote to {DATA_OUTPUT_FILE}")


if __name__ == "__main__":
    process()

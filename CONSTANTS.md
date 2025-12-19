# SolarSim Constants Documentation

This document outlines all constants used in the SolarSim project, their purposes, and typical values.

## 🕐 Time & Simulation Constants

| Constant | Value | Purpose |
|----------|--------|---------|
| `STEPS_PER_HOUR` | 4 | Number of 15-minute intervals per hour |
| `STEPS_PER_DAY` | 96 | Total 15-minute intervals in 24 hours |
| `MINUTES_PER_STEP` | 15 | Duration of each simulation step |

## ☀️ Solar System Configuration

| Constant | Value | Purpose |
|----------|--------|---------|
| `REFERENCE_SOLAR_SIZE_KWP` | 20.0 | Baseline solar system size for scaling calculations |
| `EAST_SHIFT` | 10 | Time shift for East-facing panels (2.5 hours earlier peak) |
| `WEST_SHIFT` | -10 | Time shift for West-facing panels (2.5 hours later peak) |
| `SOLAR_SCALING` | 0.6 | Efficiency factor for East/West vs South-facing panels |
| `SOLAR_DATA_SCALE_FACTOR` | 5.424 | Scaling factor to match real 20kWp production |

## 🔋 Battery Configuration

| Constant | Value | Purpose |
|----------|--------|---------|
| `DEFAULT_BATTERY_CAPACITY_KWH` | 10.0 | Default battery storage capacity |
| `DEFAULT_BATTERY_MAX_POWER_KW` | 5.0 | Default maximum charge/discharge rate |

## 🚗 Electric Vehicle (EV) Configuration

| Constant | Value | Purpose |
|----------|--------|---------|
| `EV_KWH_PER_KM` | 0.2 | Energy consumption (20 kWh per 100km) |
| `EV_CHARGE_POWER_KW` | 11.0 | Home charging power rate |
| `EV_START_HOUR` | 18 | Hour when EV typically returns home (6 PM) |

## 🏠 Heat Pump Configuration

| Constant | Value | Purpose |
|----------|--------|---------|
| `HP_COP` | 3.5 | Coefficient of Performance (efficiency) |
| `DEFAULT_HP_FACTOR` | 0.85 | Load scaling factor to reduce grid export |
| `GAS_TO_KWH` | 10.0 | Conversion factor from gas m³ to kWh |

## 📊 Load Profile Configuration

| Constant | Value | Purpose |
|----------|--------|---------|
| `MORNING_PEAK_HOUR` | 8 | Hour of morning electricity peak |
| `EVENING_PEAK_HOUR` | 19 | Hour of evening electricity peak |
| `MORNING_PEAK_INTENSITY` | 0.6 | Relative intensity of morning peak |
| `EVENING_PEAK_INTENSITY` | 0.9 | Relative intensity of evening peak |
| `MORNING_PEAK_WIDTH` | 4 | Standard deviation for morning peak curve |
| `EVENING_PEAK_WIDTH` | 5 | Standard deviation for evening peak curve |
| `BASE_LOAD_FACTOR` | 0.3 | Base electricity load level |

## 📁 File Paths & Data Configuration

| Constant | Value | Purpose |
|----------|--------|---------|
| `SOLAR_DATA_DIR` | "solar" | Directory containing solar data files |
| `DATA_OUTPUT_FILE` | "data.js" | Output file for processed simulation data |
| `MONTHLY_USAGE_FILE` | "solar/wa_pu_data.csv" | Monthly utility usage data |
| `SOLAR_EXPORT_PATTERN` | "E3DC-Export({month}).csv" | Pattern for solar export files |

## 🎨 UI Configuration

| Constant | Value | Purpose |
|----------|--------|---------|
| `DEFAULT_SIMULATION_DATE` | "2025-01-01" | Default start date for simulation |

### Input Control Ranges

| Parameter | Min | Max | Step | Purpose |
|-----------|-----|-----|------|---------|
| Solar Size | 0.0 | 50.0 | 0.5 | Solar system size range (kWp) |
| Battery Capacity | 0.0 | 50.0 | 0.5 | Battery capacity range (kWh) |
| Battery Power | 0.0 | 20.0 | 0.5 | Battery power range (kW) |
| EV Distance | 0 | 200 | 5 | Daily EV distance range (km) |
| HP Factor | 0.5 | 2.0 | 0.1 | Heat pump load scaling range |

## 🎯 Performance Targets

| Constant | Value | Purpose |
|----------|--------|---------|
| `TARGET_DAILY_GRID_EXPORT_KWH` | 0.32 | Target daily grid export (Dec 18th) |
| `TARGET_DAILY_BATTERY_IN_KWH` | 5.72 | Target daily battery charge |
| `TARGET_DAILY_BATTERY_OUT_KWH` | 6.03 | Target daily battery discharge |

## 🎨 Visualization Colors

| Constant | Value | Purpose |
|----------|--------|---------|
| `COLOR_SOLAR` | "#facc15" | Yellow - Solar production |
| `COLOR_GRID_IMPORT` | "#ef4444" | Red - Grid import |
| `COLOR_GRID_EXPORT` | "#4ade80" | Green - Grid export |
| `COLOR_BATTERY` | "#22c55e" | Green - Battery charge/discharge |
| `COLOR_LOAD_NORMAL` | "#60a5fa" | Blue - Normal household load |
| `COLOR_LOAD_HP` | "#f472b6" | Pink - Heat pump load |
| `COLOR_LOAD_EV` | "#a78bfa" | Purple - EV charging load |

## 🔄 Data Processing Constants

| Constant | Value | Purpose |
|----------|--------|---------|
| `WH_TO_KWH` | 0.001 | Convert Watt-hours to kWh |
| `KW_TO_W` | 1000.0 | Convert kilowatts to watts |
| `ENERGY_PER_STEP` | 0.25 | Hours per 15-minute step |

## 💡 Usage Guidelines

### Modifying Constants

1. **Time Constants**: Changing `STEPS_PER_HOUR` will affect the entire simulation logic
2. **Solar Values**: Adjust based on your actual solar system specifications
3. **Battery Values**: Set according to your battery installation
4. **Load Profiles**: Modify to match your household consumption patterns
5. **Performance Targets**: Use as optimization goals for system sizing

### Scaling Factors

- Solar scaling accounts for panel orientation and efficiency losses
- Load profiles use Gaussian curves to simulate realistic daily consumption
- Time-based calculations ensure accurate energy accounting across intervals

### Color Scheme

The color palette follows standard visualization conventions:
- **Warm colors** (yellow/red) for production/import
- **Cool colors** (blue/purple) for consumption  
- **Green** for battery and export (positive outcomes)

For more detailed information about the simulation logic, see the main README.md file.
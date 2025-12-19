
// Time Constants
const STEPS_PER_HOUR = 4;
const STEPS_PER_DAY = 24 * STEPS_PER_HOUR;
const MINUTES_PER_STEP = 15;

// EV Configuration
const EV_KWH_PER_KM = 0.2; // 20 kWh / 100km
const EV_CHARGE_POWER_KW = 11.0;
const EV_START_HOUR = 18; // 6 PM returns home

// Default State Values
const DEFAULT_BATTERY_CAPACITY = 10.0; // kWh
const DEFAULT_BATTERY_POWER = 5.0; // kW
const DEFAULT_HP_FACTOR = 0.85; // Load scaling
const DEFAULT_SOLAR_SIZE = 20.0; // kWp
const DEFAULT_EV_DISTANCE = 0; // km

// State
let state = {
    batteryCapacity: DEFAULT_BATTERY_CAPACITY,
    maxPower: DEFAULT_BATTERY_POWER,
    hpFactor: DEFAULT_HP_FACTOR,
    solarSize: DEFAULT_SOLAR_SIZE,
    evDailyDist: DEFAULT_EV_DISTANCE,
    currentDate: new Date('2025-01-01'),
    simulationResults: [] // Parallel to SIM_DATA
};

// LocalStorage functions
function saveState() {
    const stateToSave = {
        batteryCapacity: state.batteryCapacity,
        maxPower: state.maxPower,
        hpFactor: state.hpFactor,
        solarSize: state.solarSize,
        evDailyDist: state.evDailyDist
    };
    localStorage.setItem('solarSimState', JSON.stringify(stateToSave));
}

function loadState() {
    const saved = localStorage.getItem('solarSimState');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            state.batteryCapacity = data.batteryCapacity || DEFAULT_BATTERY_CAPACITY;
            state.maxPower = data.maxPower || DEFAULT_BATTERY_POWER;
            state.hpFactor = data.hpFactor || DEFAULT_HP_FACTOR;
            state.solarSize = data.solarSize || DEFAULT_SOLAR_SIZE;
            state.evDailyDist = data.evDailyDist || DEFAULT_EV_DISTANCE;
            
        // Update UI inputs to reflect loaded values
        document.getElementById('battery-cap').value = state.batteryCapacity;
        document.getElementById('battery-power').value = state.maxPower;
        document.getElementById('hp-factor').value = state.hpFactor;
        document.getElementById('solar-size').value = state.solarSize;
        document.getElementById('ev-dist').value = state.evDailyDist;
        document.getElementById('hp-factor-val').innerText = state.hpFactor + 'x';
        } catch (e) {
            console.warn('Failed to load saved state:', e);
        }
    }
}

// Simulation Logic
function runSimulation() {
    const batteryCapWh = state.batteryCapacity * 1000;
    const solarScale = state.solarSize / 20.0; // Reference data is based on 20kWp system (user's actual system)

    let currentBattWh = 0; // Start empty? Or 50%? Let's say 0 for winter start

    state.simulationResults = SIM_DATA.map(step => {
        // Calculate EV Load for this step
        // EV needs (dist * 0.2) kWh daily.
        // It charges starting 18:00 at 11kW until full.
        // We need to track "EV Energy Needed" per day and deplete it?
        // Simpler: Pre-calculate EV profile?
        // Since we map simply, we need to know "Day Index".

        let evLoadW = 0;

        // Parse time
        const hour = parseInt(step.ts.split(' ')[1].split(':')[0]);
        const minute = parseInt(step.ts.split(' ')[1].split(':')[1]);

        // Crude daily check: If 18:00 <= t, charge.
        // But how long?
        // Energy needed = evDailyDist * EV_KWH_PER_KM
        // Time needed = Energy / 11kW
        // Hours = (dist * 0.2) / 11
        // e.g. 50km -> 10kWh -> ~1 hour.

        const dailyNeededWh = state.evDailyDist * EV_KWH_PER_KM * 1000;
        const chargePowerW = EV_CHARGE_POWER_KW * 1000;

        // This logic is slightly flawed for a simple .map() because we don't carry state easily between steps for "amount charged today".
        // But let's approximate: 
        // Charge happens between 18:00 and X.

        if (dailyNeededWh > 0) {
            const hoursNeeded = dailyNeededWh / chargePowerW;
            const fractionalHoursSince18 = (hour - EV_START_HOUR) + (minute / 60.0);

            if (fractionalHoursSince18 >= 0 && fractionalHoursSince18 < hoursNeeded) {
                // Full power
                evLoadW = chargePowerW;
            } else if (fractionalHoursSince18 >= 0 && fractionalHoursSince18 < (hoursNeeded + 0.25)) {
                // Partial last step? Simplified: just Cutoff.
                // We ignore partial step precision for now or spread it.
                // If we are mostly done, we stop.
            }
        }

        const hpLoadW = step.hp_w * state.hpFactor;
        const normalLoadW = step.load_w;
        const totalLoad = normalLoadW + hpLoadW + evLoadW;

        const solar = step.solar_w * solarScale;

        const net = solar - totalLoad;

        let gridImport = 0;
        let gridExport = 0;
        let battCharge = 0;
        let battDischarge = 0;

        if (net > 0) {
            // Surplus -> Charge Battery
            const spaceInBatt = batteryCapWh - currentBattWh;
            // Use configurable max power
            const maxPowerW = state.maxPower * 1000;
            const maxEnergyPerStep = maxPowerW * (MINUTES_PER_STEP / 60.0); // max Wh per step
            const potentialCharge = Math.min(net * 0.25, maxEnergyPerStep);

            const actualCharge = Math.min(potentialCharge, spaceInBatt);
            currentBattWh += actualCharge;
            battCharge = actualCharge * 4; // Convert back to Avg Watts for chart

            // Remainder -> Export
            // Remainder Power = (Net - ChargedPower)
            // ChargedPower = actualCharge * 4
            const remainderPower = net - (actualCharge * 4);
            gridExport = remainderPower;

        } else {
            // Deficit -> Discharge Battery
            const deficit = -net; // Positive Watts needed
            const energyNeeded = deficit * (MINUTES_PER_STEP / 60.0);
            // Use configurable max power
            const maxPowerW = state.maxPower * 1000;
            const maxEnergyPerStep = maxPowerW * (MINUTES_PER_STEP / 60.0);
            const potentialDischarge = Math.min(energyNeeded, maxEnergyPerStep);

            const actualDischarge = Math.min(potentialDischarge, currentBattWh);
            currentBattWh -= actualDischarge;
            battDischarge = actualDischarge * 4;

            const remainderDeficit = deficit - (actualDischarge * 4);
            gridImport = remainderDeficit;
        }

        return {
            ...step,
            final_load: totalLoad,
            normal_w: normalLoadW,
            hp_w: hpLoadW,
            ev_w: evLoadW,
            batt_soc: (currentBattWh / batteryCapWh) * 100, // %
            batt_wh: currentBattWh,
            grid_import: gridImport,
            grid_export: gridExport,
            batt_power: battCharge - battDischarge // Positive = Charging
        };
    });

    updateTotals();
    updateMonthly();
    renderDay();
}

// Aggregation
function updateTotals() {
    let tSolar = 0, tLoad = 0, tImport = 0, tExport = 0;

        state.simulationResults.forEach(r => {
            const stepHours = MINUTES_PER_STEP / 60.0;
            tSolar += r.solar_w * stepHours;
            tLoad += r.final_load * stepHours;
            tImport += r.grid_import * stepHours;
            tExport += r.grid_export * stepHours;
        });

    // Update DOM
    document.getElementById('total-import').innerText = (tImport / 1000).toFixed(0) + " kWh";
    document.getElementById('total-export').innerText = (tExport / 1000).toFixed(0) + " kWh";
    document.getElementById('total-solar').innerText = (tSolar / 1000).toFixed(0) + " kWh";
    document.getElementById('total-load').innerText = (tLoad / 1000).toFixed(0) + " kWh"; // Show total consumption including HP

    // KPIs
    // Self Sufficiency = 1 - (Import / Load)
    const suff = tLoad > 0 ? (1 - (tImport / tLoad)) * 100 : 0;
    document.getElementById('kpi-sufficiency').innerText = suff.toFixed(1) + "%";

    // Self Consumption = 1 - (Export / Solar)
    const cons = tSolar > 0 ? (1 - (tExport / tSolar)) * 100 : 0;
    document.getElementById('kpi-consumption').innerText = cons.toFixed(1) + "%";
}

// Charts
let dailyChartCtx, dailyChart;
let batteryChartCtx, batteryChart;
let monthlyChartCtx, monthlyChart;

function initCharts() {
    dailyChartCtx = document.getElementById('dailyChart').getContext('2d');
    batteryChartCtx = document.getElementById('batteryChart').getContext('2d');
    monthlyChartCtx = document.getElementById('monthlyChart').getContext('2d');

    // Common Options
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { color: '#94a3b8' } }
        },
        scales: {
            y: { grid: { color: '#2d333b' }, ticks: { color: '#94a3b8' } },
            x: { grid: { color: '#2d333b' }, ticks: { color: '#94a3b8' } }
        }
    };

    dailyChart = new Chart(dailyChartCtx, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
            ...commonOptions,
            interaction: { mode: 'index', intersect: false },
            elements: { point: { radius: 0 } },
            plugins: { ...commonOptions.plugins, title: { display: false, text: 'Power' } }
        }
    });

    batteryChart = new Chart(batteryChartCtx, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
            ...commonOptions,
            interaction: { mode: 'index', intersect: false },
            elements: { point: { radius: 0 } },
            layout: { padding: { top: 0, bottom: 0 } },
            scales: {
                ...commonOptions.scales,
                y: { ...commonOptions.scales.y, min: 0, max: 100, ticks: { ...commonOptions.scales.y.ticks, callback: v => v + '%' } }
            }
        }
    });

    monthlyChart = new Chart(monthlyChartCtx, {
        type: 'bar',
        data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], datasets: [] },
        options: {
            ...commonOptions,
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: { stacked: true, grid: { color: '#2d333b' } }
            }
        }
    });
}

function renderDay() {
    const dayStr = state.currentDate.toISOString().split('T')[0];
    document.getElementById('date-picker').value = dayStr;

    // Filter data for this day
    // TS format in data is "YYYY-MM-DD HH:MM"
    const startPrefix = dayStr;
    const dayData = state.simulationResults.filter(d => d.ts.startsWith(startPrefix));

    if (dayData.length === 0) return;

    const labels = dayData.map(d => d.ts.split(' ')[1]);

    // Calculate Daily Stats
    let dSolar = 0, dLoad = 0, dImport = 0, dExport = 0;
    const stepHours = MINUTES_PER_STEP / 60.0;
    dayData.forEach(d => {
        dSolar += d.solar_w * stepHours;
        dLoad += d.final_load * stepHours;
        dImport += d.grid_import * stepHours;
        dExport += d.grid_export * stepHours;
    });

    document.getElementById('day-solar').innerText = (dSolar / 1000).toFixed(1) + " kWh";
    document.getElementById('day-load').innerText = (dLoad / 1000).toFixed(1) + " kWh";

    // Batt Cycle?
    const stepHours = MINUTES_PER_STEP / 60.0;
    const battIn = dayData.reduce((acc, d) => acc + (d.batt_power > 0 ? d.batt_power * stepHours : 0), 0);
    const battOut = dayData.reduce((acc, d) => acc + (d.batt_power < 0 ? -d.batt_power * stepHours : 0), 0);
    // document.getElementById('day-batt').innerText = `+${(battIn/1000).toFixed(1)} / -${(battOut/1000).toFixed(1)} kWh`;
    // Just show net grid
    document.getElementById('day-grid').innerText = ((dImport - dExport) / 1000).toFixed(1) + " kWh";
    document.getElementById('day-batt').innerText = (battIn / 1000).toFixed(1) + " kWh (Chg)";

    // Datasets
    // Area Chart style

    dailyChart.data = {
        labels: labels,
        datasets: [
            {
                label: 'Solar',
                data: dayData.map(d => d.solar_w),
                borderColor: '#facc15',
                backgroundColor: 'rgba(250, 204, 21, 0.2)',
                fill: true,
                tension: 0.3
            },
            {
                label: 'Normal Load',
                data: dayData.map(d => d.normal_w),
                borderColor: '#60a5fa',
                backgroundColor: '#60a5fa',
                borderWidth: 0,
                fill: true,
                stack: 'load'
            },
            {
                label: 'Heat Pump',
                data: dayData.map(d => d.hp_w),
                borderColor: '#f472b6', // Pink
                backgroundColor: '#f472b6',
                borderWidth: 0,
                fill: true,
                stack: 'load'
            },
            {
                label: 'EV Charge',
                data: dayData.map(d => d.ev_w),
                borderColor: '#a78bfa', // Purple
                backgroundColor: '#a78bfa',
                borderWidth: 0,
                fill: true,
                stack: 'load'
            },
            {
                label: 'Battery Power (+Chg/-Dis)',
                data: dayData.map(d => d.batt_power),
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderWidth: 1,
                fill: true
            },
            {
                label: 'Grid Import',
                data: dayData.map(d => d.grid_import),
                borderColor: '#ef4444',
                borderWidth: 1,
                borderDash: [5, 5],
                fill: false
            }
        ]
    };
    dailyChart.update();

    batteryChart.data = {
        labels: labels,
        datasets: [{
            label: 'Battery Level (%)',
            data: dayData.map(d => d.batt_soc),
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            fill: true,
            tension: 0.1
        }]
    };
    batteryChart.update();
}

function updateMonthly() {
    // Aggregate by month
    const months = new Array(12).fill(0).map(() => ({ prod: 0, cons: 0, imp: 0, exp: 0, hp: 0, ev: 0, normal: 0 }));

    const stepHours = MINUTES_PER_STEP / 60.0;
    state.simulationResults.forEach(r => {
        // TS: "YYYY-MM-DD ..."
        const mIdx = parseInt(r.ts.split('-')[1]) - 1;
        months[mIdx].prod += r.solar_w * stepHours / 1000; // kWh
        months[mIdx].cons += r.final_load * stepHours / 1000;
        months[mIdx].hp += r.hp_w * stepHours / 1000;
        months[mIdx].ev += r.ev_w * stepHours / 1000;
        months[mIdx].normal += r.normal_w * stepHours / 1000;

        months[mIdx].imp += r.grid_import * stepHours / 1000;
        months[mIdx].exp += r.grid_export * stepHours / 1000;

        // Self consumed solar = prod - exp
        // Or calculated directly: min(prod, cons+batt_charge?)
    });

    // Bar chart: Stacked
    // Stack 1: Self Consumed Solar vs Exported Solar
    // Stack 2: Grid Import vs Self Consumed Solar (Consumption side)

    // Let's just show: Production (Yellow), Consumption (Blue) as separate bars?
    // Or Stacked Consumption: Solar-Covered (Green) + Grid-Imported (Red).

    const solarCovered = months.map(m => m.cons - m.imp); // Rough approximation

    monthlyChart.data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                label: 'Normal Usage',
                data: months.map(m => m.normal),
                backgroundColor: '#60a5fa',
                stack: 'Stack 0'
            },
            {
                label: 'Heat Pump',
                data: months.map(m => m.hp),
                backgroundColor: '#f472b6',
                stack: 'Stack 0'
            },
            {
                label: 'EV',
                data: months.map(m => m.ev),
                backgroundColor: '#a78bfa',
                stack: 'Stack 0'
            },
            {
                label: 'Exported',
                data: months.map(m => m.exp),
                backgroundColor: '#facc15',
                stack: 'Stack 1' // Separate stack for production view? Or keep simple.
            }
        ]
    };
    monthlyChart.update();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initCharts();

    // Check if SIM_DATA exists
    if (typeof SIM_DATA === 'undefined') {
        alert("Data not found. Please run 'python process_data.py' first.");
        return;
    }

    // Input bindings
    const batCapInput = document.getElementById('battery-cap');
    const batPwrInput = document.getElementById('battery-power');
    const hpFactorInput = document.getElementById('hp-factor');
    const solarSizeInput = document.getElementById('solar-size');
    const evDistInput = document.getElementById('ev-dist');
    const hpValDisplay = document.getElementById('hp-factor-val');

    function updateParams() {
        state.batteryCapacity = parseFloat(batCapInput.value);
        state.maxPower = parseFloat(batPwrInput.value);
        state.hpFactor = parseFloat(hpFactorInput.value);
        state.solarSize = parseFloat(solarSizeInput.value);
        state.evDailyDist = parseFloat(evDistInput.value);
        hpValDisplay.innerText = state.hpFactor + 'x';

        // Save to localStorage
        saveState();

        runSimulation();
    }

    document.getElementById('recalc-btn').addEventListener('click', updateParams);
    hpFactorInput.addEventListener('input', (e) => {
        hpValDisplay.innerText = e.target.value + 'x';
    });

    // Date Nav
    document.getElementById('prev-day').addEventListener('click', () => {
        state.currentDate.setDate(state.currentDate.getDate() - 1);
        renderDay();
    });
    document.getElementById('next-day').addEventListener('click', () => {
        state.currentDate.setDate(state.currentDate.getDate() + 1);
        renderDay();
    });
    document.getElementById('date-picker').addEventListener('change', (e) => {
        state.currentDate = new Date(e.target.value);
        renderDay();
    });

    // Load saved state and run initial simulation
    loadState();
    runSimulation();
});

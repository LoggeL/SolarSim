# SolarSim ☀️

A sophisticated solar energy simulation tool that models household energy consumption, battery storage, electric vehicle charging, and grid interaction. Built with real-world data and configurable parameters for accurate energy system analysis.

![SolarSim Dashboard](https://img.shields.io/badge/SolarSim-2025-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Python](https://img.shields.io/badge/python-3.8+-blue)
![JavaScript](https://img.shields.io/badge/javascript-ES6+-yellow)

## 🌟 Features

- **Real-time Energy Simulation**: 15-minute interval analysis across entire year
- **Interactive Dashboard**: Beautiful, responsive web interface with live charts
- **Configurable Parameters**: Adjust solar size, battery capacity, EV usage, and heat pump load
- **Advanced Load Modeling**: Realistic consumption patterns with morning/evening peaks
- **Battery Optimization**: Smart charge/discharge logic with power limits
- **EV Integration**: Simulate electric vehicle charging schedules
- **Grid Interaction**: Track import/export with self-sufficiency metrics
- **Solar Orientation**: Model East/West panel arrays with efficiency factors

## 🏠 Project Structure

```
SolarSim/
├── 📄 README.md              # This file
├── 📄 CONSTANTS.md           # Complete constants documentation
├── 📁 data/                  # Solar data files
│   └── 📁 solar/             # E3DC export data & usage records
├── 📁 src/                   # Source code
│   ├── 🐍 config.py          # Centralized configuration
│   └── 🐍 process_data.py    # Data processing script
├── 📄 app.js                 # Main application logic
├── 📄 index.html             # Web interface
├── 📄 style.css              # Styling
└── 📄 data.js                # Generated simulation data
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- Web browser with JavaScript support

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SolarSim
   ```

2. **Process simulation data**
   ```bash
   python src/process_data.py
   ```
   This converts raw solar data and utility records into simulation-ready format.

3. **Open the web application**
   ```bash
   # Option 1: Simple file open
   open index.html
   
   # Option 2: Local server (recommended)
   python -m http.server 8000
   # Then visit http://localhost:8000
   ```

### First Run

The simulator will load with default parameters optimized for a 20kWp solar system with 10kWh battery. Adjust the controls in the sidebar to match your setup and click "Update Simulation".

## 🎛️ Configuration Parameters

### Solar System
- **System Size**: Solar panel capacity (kWp)
- **Orientation**: Automatically models East/West arrays with efficiency factors

### Battery Storage
- **Capacity**: Total storage capacity (kWh)
- **Max Power**: Maximum charge/discharge rate (kW)

### Electric Vehicle
- **Daily Distance**: Kilometers driven per day
- **Charging**: Automatically charges at 11kW starting 6PM

### Heat Pump
- **Load Factor**: Scales heat pump electricity consumption
- **COP**: 3.5 efficiency factor built-in

## 📊 Dashboard Features

### Key Performance Indicators
- **Self Sufficiency**: Percentage of energy produced vs consumed
- **Self Consumption**: Percentage of solar energy used locally

### Real-time Metrics
- Total Grid Import/Export
- Solar Production
- Household Consumption
- Battery State of Charge

### Interactive Charts
- **Daily Power Flow**: Solar, loads, battery, and grid interaction
- **Battery SOC**: Real-time state of charge tracking
- **Monthly Overview**: Yearly performance by month

## 🔧 Technical Details

### Simulation Logic

The simulator runs on 15-minute intervals (96 steps per day) with:

1. **Solar Generation**: East/West panel arrays with time-shifted production curves
2. **Load Modeling**: Gaussian profiles for realistic consumption patterns
3. **Battery Management**: Priority-based charge/discharge with power limits
4. **EV Charging**: Scheduled charging with daily energy requirements
5. **Grid Interaction**: Import/export tracking with optimization targets

### Data Sources

- **Solar Data**: E3DC export files with 15-minute production readings
- **Usage Records**: Monthly utility data (electricity + gas for heat pump)
- **Load Profiles**: Statistical models of household consumption

### Key Algorithms

- Battery charge prioritization when surplus solar available
- EV charging scheduled for evening return time
- Heat pump load scaling based on gas consumption data
- Grid export minimization through optimal battery sizing

## 📈 Use Cases

### System Sizing
- Optimize solar panel capacity based on consumption patterns
- Determine ideal battery size for maximum self-sufficiency
- Calculate ROI for energy storage investments

### Energy Planning
- Model impact of adding electric vehicle
- Plan heat pump integration with existing solar
- Forecast annual energy costs and savings

### Performance Analysis
- Track self-sufficiency improvements over time
- Identify periods of excess grid export
- Optimize charge/discharge scheduling

## 🔍 Advanced Configuration

All constants are centralized in `src/config.py` and documented in `CONSTANTS.md`. Key areas for customization:

- **Time Resolution**: Adjust simulation interval granularity
- **Load Profiles**: Modify consumption patterns for different households
- **Solar Orientation**: Tweak panel efficiency factors
- **Performance Targets**: Set optimization goals for your specific needs

## 🛠️ Development

### Architecture
- **Backend**: Python data processing pipeline
- **Frontend**: Vanilla JavaScript with Chart.js visualization
- **Styling**: Modern CSS with custom properties for theming
- **Data Format**: JSON-based simulation dataset

### Extending the Simulator
1. Add new load types in `process_data.py`
2. Modify UI controls in `index.html`
3. Update visualization in `app.js`
4. Adjust constants in `src/config.py`

## 📝 Data Format

The simulator processes data into a standardized JSON format:

```javascript
{
  "ts": "2025-01-01 00:00",    // Timestamp
  "solar_w": 0,                 // Solar generation (Watts)
  "load_w": 500,                // Normal household load (Watts)
  "hp_w": 200,                  // Heat pump load (Watts)
}
```

Runtime simulation adds:
- Battery state and power flow
- Grid import/export values
- Electric vehicle charging loads

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with appropriate documentation
4. Submit a pull request with detailed description

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- E3DC for solar production data export format
- Chart.js for beautiful, responsive visualizations
- Real-world household data for accurate modeling

## 📞 Support

For questions, issues, or feature requests:
- Check `CONSTANTS.md` for configuration details
- Review the technical documentation in code comments
- Open an issue with detailed description of your use case

---

**SolarSim** - Empowering sustainable energy decisions through data-driven simulation. 🌍⚡
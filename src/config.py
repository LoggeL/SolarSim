#!/usr/bin/env python3
"""
Central configuration constants for SolarSim project.
This file contains all configurable parameters used across the application.
"""

# =============================================================================
# TIME AND SIMULATION CONSTANTS
# =============================================================================

# Time resolution (15-minute intervals)
STEPS_PER_HOUR = 4
STEPS_PER_DAY = 24 * 4
MINUTES_PER_STEP = 15

# =============================================================================
# SOLAR SYSTEM CONFIGURATION
# =============================================================================

# Reference solar system size (kWp) - used as baseline for scaling
REFERENCE_SOLAR_SIZE_KWP = 20.0

# Solar array orientation and efficiency
EAST_SHIFT = 10  # 15-min intervals (2.5 hours earlier for peak)
WEST_SHIFT = -10  # 15-min intervals (2.5 hours later for peak)
SOLAR_SCALING = 0.6  # Efficiency factor for East/West vs South-facing panels

# Solar data scaling factor to match real production
# CSV data needs scaling to match 20kWp system production
SOLAR_DATA_SCALE_FACTOR = 5.424

# =============================================================================
# BATTERY CONFIGURATION
# =============================================================================

# Default battery specifications
DEFAULT_BATTERY_CAPACITY_KWH = 10.0
DEFAULT_BATTERY_MAX_POWER_KW = 5.0

# =============================================================================
# ELECTRIC VEHICLE (EV) CONFIGURATION
# =============================================================================

# EV energy consumption
EV_KWH_PER_KM = 0.2  # 20 kWh per 100km
EV_CHARGE_POWER_KW = 11.0  # Home charging power
EV_START_HOUR = 18  # 6 PM - when EV typically returns home

# =============================================================================
# HEAT PUMP CONFIGURATION
# =============================================================================

# Heat pump efficiency and load factors
HP_COP = 3.5  # Coefficient of Performance
DEFAULT_HP_FACTOR = 0.85  # Load scaling factor to reduce grid export

# Gas to energy conversion
GAS_TO_KWH = 10.0  # Approximate conversion factor from m³ to kWh

# =============================================================================
# LOAD PROFILES
# =============================================================================

# Load profile timing (hours for peak consumption)
MORNING_PEAK_HOUR = 8
EVENING_PEAK_HOUR = 19

# Load profile distribution parameters
MORNING_PEAK_INTENSITY = 0.6
MORNING_PEAK_WIDTH = 4  # Standard deviation for Gaussian
EVENING_PEAK_INTENSITY = 0.9
EVENING_PEAK_WIDTH = 5  # Standard deviation for Gaussian
BASE_LOAD_FACTOR = 0.3

# =============================================================================
# FILE PATHS AND DATA CONFIGURATION
# =============================================================================

# Directory structure
SOLAR_DATA_DIR = "data/solar"
DATA_OUTPUT_FILE = "data.js"

# Input data files
MONTHLY_USAGE_FILE = "data/solar/wa_pu_data.csv"
SOLAR_EXPORT_PATTERN = "E3DC-Export({month}).csv"

# =============================================================================
# UI CONFIGURATION
# =============================================================================

# Default simulation start date
DEFAULT_SIMULATION_DATE = "2025-01-01"

# Input control ranges and steps
SOLAR_SIZE_MIN = 0.0
SOLAR_SIZE_MAX = 50.0
SOLAR_SIZE_STEP = 0.5

BATTERY_CAPACITY_MIN = 0.0
BATTERY_CAPACITY_MAX = 50.0
BATTERY_CAPACITY_STEP = 0.5

BATTERY_POWER_MIN = 0.0
BATTERY_POWER_MAX = 20.0
BATTERY_POWER_STEP = 0.5

EV_DISTANCE_MIN = 0
EV_DISTANCE_MAX = 200
EV_DISTANCE_STEP = 5

HP_FACTOR_MIN = 0.5
HP_FACTOR_MAX = 2.0
HP_FACTOR_STEP = 0.1

# =============================================================================
# SIMULATION PERFORMANCE TARGETS
# =============================================================================

# Target values for optimization (based on December 18th analysis)
TARGET_DAILY_GRID_EXPORT_KWH = 0.32
TARGET_DAILY_BATTERY_IN_KWH = 5.72
TARGET_DAILY_BATTERY_OUT_KWH = 6.03

# =============================================================================
# VISUALIZATION CONFIGURATION
# =============================================================================

# Chart colors (CSS-compatible hex codes)
COLOR_SOLAR = "#facc15"  # Yellow
COLOR_GRID_IMPORT = "#ef4444"  # Red
COLOR_GRID_EXPORT = "#4ade80"  # Green
COLOR_BATTERY = "#22c55e"  # Green
COLOR_LOAD_NORMAL = "#60a5fa"  # Blue
COLOR_LOAD_HP = "#f472b6"  # Pink
COLOR_LOAD_EV = "#a78bfa"  # Purple

# =============================================================================
# DATA PROCESSING CONSTANTS
# =============================================================================

# Energy conversion factors
WH_TO_KWH = 0.001
W_TO_W = 1.0  # No conversion needed, kept for clarity
KW_TO_W = 1000.0

# Time-based energy calculations
ENERGY_PER_STEP = MINUTES_PER_STEP / 60.0  # 0.25 hours for 15-min steps

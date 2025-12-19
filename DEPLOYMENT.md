# GitHub Pages Deployment

## 🌐 Live Site URL
**https://loggel.github.io/SolarSim/**

## 📋 Deployment Status
- ✅ GitHub Pages enabled
- ✅ Source: Master branch 
- ✅ Root path: `/`
- ⏳ Status: Building (usually takes 2-5 minutes)

## 🔧 Deployment Details
- **Branch**: master
- **Source Path**: `/` (root directory)
- **HTTPS**: Enforced
- **Custom Domain**: None

## 🌍 Access Instructions

### Direct Access
Visit: https://loggel.github.io/SolarSim/

### Local Development
1. Clone the repository
2. Run `python src/process_data.py` to generate data.js
3. Open `index.html` in browser or serve with local web server

### File Structure for Pages
```
├── index.html          # Main page (automatically served)
├── app.js              # Application logic
├── style.css           # Styling
├── data.js            # Generated simulation data
└── src/               # Source files (not used by Pages)
```

## 🚀 Automatic Updates
Any push to the `master` branch will automatically redeploy the GitHub Pages site.

## ⚠️ Important Notes
- Raw CSV data files are excluded from the repository
- Users must run `python src/process_data.py` locally to generate `data.js`
- The site will load without data if `data.js` is missing

## 📱 Features Available Online
- Interactive solar simulation dashboard
- Real-time battery and grid analysis
- Configurable parameters (if data.js exists)
- Responsive design for all devices

The site should be live within a few minutes at https://loggel.github.io/SolarSim/
# 🏎️ Racecraft
### Formula One Analytics, Storytelling & Performance Intelligence

> *Racecraft is more than a Formula One dashboard. It's a modern platform that combines motorsport history, advanced analytics, machine-learning insights, and immersive storytelling into one premium experience.*

---

## 📖 About Racecraft

Formula One is much more than championship standings and race results. It's a sport built on legendary drivers, iconic circuits, engineering brilliance, historic rivalries, and unforgettable moments.

While developing this project, I realized that Formula One information is scattered across multiple platforms. One website provides statistics, another focuses on news, another covers race schedules, and another explores history. Racecraft brings these experiences together into a single platform.

The goal of Racecraft is to create an immersive Formula One experience where users can explore the sport through interactive dashboards, machine-learning analytics, beautiful visualizations, and premium storytelling inspired by modern editorial design.

Instead of simply displaying numbers, Racecraft presents Formula One as the incredible story it truly is.

It currently covers the **2014–2026 seasons**, with all data ingested into its own database so the app never depends on a live third-party API at request time.

---

# ✨ Features

## 🏠 Interactive Dashboard

The dashboard is the command center of Racecraft and gives a complete overview of the current season.

- Driver Championship Standings
- Constructor Championship Standings
- Upcoming Grand Prix Countdown
- Championship Progress
- Trending Stats & Form
- Current Championship Leaders
- Latest Race Summary
- Interactive Charts

---

## 👤 Driver Analytics

Detailed driver profiles including:

- Career Statistics
- Championships
- Race Wins
- Podiums
- Pole Positions
- Fastest Laps
- Average Finish Position
- Recent Form Guide
- Computed Performance Ratings
- Wet-Weather Performance
- Head-to-Head Comparison

---

## 🏎 Constructor Analytics

Every Formula One team explored through:

- Team History
- Championship Records
- Current & Historic Driver Line-ups
- Performance Trends
- Season-by-Season Statistics
- Team Performance Ratings

---

## 🌍 Circuit Explorer

Every Formula One circuit includes:

- Circuit Information & Characteristics
- Interactive Track Map on Satellite Imagery
- Derived Racing Lines
- Performance Heatmap (modelled corner speed)
- Historical Winners
- Lap Records
- DRS Zones
- Weather & Conditions Analysis
- Track Suitability & Driver Success Rate
- Tyre Strategy Insights

---

## ⚔ Driver Comparison

Compare two drivers side-by-side using:

- Head-to-Head Statistics
- Championships, Wins, Podiums, Poles
- Performance Radar Charts
- Career Trajectories

---

## 🤖 AI Race Predictor

Predict race outcomes with machine-learning models trained on historical performance.

Choose:

- The Grand Prix
- The starting grid source (official, from qualifying, or estimated)

The prediction engine provides:

- Win Probability
- Podium Probability
- Expected Finishing Order

It also runs a **Monte Carlo championship simulation** that projects title probabilities across the rest of the season. Win prediction is benchmarked honestly against a pole-position baseline, so the numbers are never dressed up.

---

## 📈 Strategy Simulator

Experiment with different race strategies and see how they play out.

Simulate:

- Tyre Compounds & Stint Lengths
- One, Two, or Three-Stop Plans
- Tyre Wear Scenarios (low / normal / high)
- Per-Circuit Pit Loss & Fuel Effects

The simulator returns the optimal plan with a full lap-time breakdown.

---

## 🎮 Prediction League

Play against the data and against other users.

- Predict the pole, race winner, podium, and fastest lap for upcoming races
- Automatic scoring once each race finishes
- Points, accuracy breakdown, and a global leaderboard
- Personal accounts with saved favorite drivers, teams, and circuits

---

## 🧠 Natural-Language Assistant

Ask about Formula One in plain English — *"Verstappen at Monza"*, *"compare Hamilton and Leclerc"*, *"who leads the championship?"*

- Understands drivers, teams, and circuits
- Career profiles, head-to-heads, standings, next race, and driver-at-circuit records
- Answers come straight from the database, so every response is reproducible

---

## 📅 Race Calendar

Stay up to date with:

- Full Formula One Calendar
- Upcoming Grand Prix
- Weekend Schedule
- Countdown Timers
- Race Information

---

## 🌦 Performance Insights

Analyze how conditions influence performance.

- Wet Weather Performance
- Dry Weather Performance
- Circuit Suitability
- Temperature & Conditions Trends
- Historical Race Data

---

## 📊 Data Visualization

Racecraft turns complex Formula One data into clear, readable visualizations.

- Championship Progression
- Driver Performance Trends
- Constructor Performance
- Performance Heatmaps
- Radar Charts
- Historical Comparisons
- Performance Timelines

---

# 🎨 Design Philosophy

Racecraft is inspired by the visual language of modern Formula One.

The interface focuses on:

- Editorial storytelling
- Cinematic layouts
- Premium typography
- Large immersive photography
- Smooth animations
- Minimal yet elegant design
- A Formula One-inspired color palette
- A fully responsive experience across all devices

Rather than resembling a traditional analytics dashboard, Racecraft aims to feel like an interactive Formula One experience where every page tells a story.

---

# 🛠 Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts
- Leaflet

### Backend

- FastAPI
- Python
- PostgreSQL
- SQLAlchemy

### Machine Learning

- Scikit-learn
- XGBoost
- Pandas
- NumPy

### Data

- Jolpica-F1 API (the Ergast successor)
- FastF1

---

# 🚧 Roadmap

Ideas I'd like to build next:

- AI-generated race and driver summaries
- Pit-stop performance analytics (once pit-stop timing data is ingested)
- Driver of the Week and Featured Circuit spotlights
- Constructor-vs-constructor comparison
- Famous moments and richer circuit storytelling
- Deeper team reliability analysis

---

# 👨‍💻 Developer

**Sanskar AKA Athex**

---

# 🙏 Acknowledgements

Racecraft is built for educational and portfolio purposes using publicly available Formula One data.

Data comes from the [Jolpica-F1](https://github.com/jolpica/jolpica-f1) community API (the Ergast successor) and [FastF1](https://github.com/theOehrly/Fast-F1). Special thanks to those projects and the wider Formula One community whose open work makes motorsport data accessible to developers and enthusiasts around the world.

This is an unofficial project and is not affiliated with Formula 1, the FIA, or any team.

---

> *"Formula One is more than speed. It's strategy, precision, innovation, and legacy. Racecraft is my attempt to bring that experience into a single platform."*

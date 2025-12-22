# 🤖 AI-Based Robot Health Monitoring

This project monitors robot health using IoT data and AI. Robots send real-time telemetry data such as battery, motor current, temperature, CPU load, and velocity to a backend server. 
An AI model (Random Forest) detects problems like overheating, battery issues, or abnormal velocity patterns. A web dashboard visualizes live status, warnings, and trends.
## Project Structure

├── backend/ # Server (Node.js / Express)
├── frontend/ # Web dashboard (React/Vite)
├── robot-simulator/ # Robot telemetry simulator
└── README.md

## Architecture

![Project Architecture](docs/architecture.png)


The architecture shows how the robot simulator, backend, MQTT broker, AI model, and frontend dashboard communicate in real-time.

## Getting Started

### Environment Variables
This project requires environment variables for both the backend and frontend. Create a .env file in each folder and add the following variables.

### Backend
Create a .env file in the backend/ folder:
   ```bash
MONGO_URI=your_mongodb_connection_string
MQTT_BROKER_URL=your_mqtt_broker_url
MQTT_TOPIC=your_mqtt_topic
PORT=5000
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
```
### Frontend
Create a .env file in the frontend/ folder:
   ```bash
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=ws://localhost:5000
```

### Backend
1. Navigate to `backend/`
2. Install dependencies:
   ```bash
   npm install
3. Start the server
   ```bash
   nodemon server.js
   ```
### Frontend
1. Navigate to `frontend/`
2. Install dependencies:
  ```bash
   npm install
```
3. Start the dashboard
  ```bash
   npm run dev
```
### Robot Simulator
1. Navigate to robot-simulator/
2.Install dependencies :
  ```bash
pip install -r requirements.txt
```
3. Run the simulator:
  ```bash
python simulator.py
```

### Features

- Real-time telemetry monitoring (battery, motor current, temperature, CPU load, velocity)

- AI-based anomaly detection using Random Forest

- Web dashboard with live status, trends, and warnings

- Simulated robot data for testing and development

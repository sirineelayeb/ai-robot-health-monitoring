#!/bin/bash
echo "🤖 AI Robot Health Monitoring - Startup Script"
echo "=============================================="

# Clean up
echo "1. Cleaning previous containers..."
docker-compose down 2>/dev/null || true

# Build
echo "2. Building services..."
docker-compose build 2>&1 | grep -E "(Step|Successfully|ERROR|error)" | tail -20

# Start core services
echo "3. Starting MongoDB and MQTT..."
docker-compose up -d mongo mqtt
sleep 8

echo "4. Starting backend..."
docker-compose up -d backend
sleep 5

# Check status
echo "5. Checking services..."
docker-compose ps

# Test
echo "6. Testing backend API..."
echo "Waiting for backend to start..."
for i in {1..10}; do
  if curl -s http://localhost:3000/health >/dev/null 2>&1; then
    echo "✅ Backend is responding!"
    echo ""
    echo "🎉 SYSTEM STATUS:"
    echo "   Backend: http://localhost:3000/health"
    echo "   MongoDB: localhost:27017"
    echo "   MQTT: localhost:1883"
    echo ""
    echo "📡 Test MQTT (in another terminal):"
    echo "   mosquitto_sub -h localhost -t 'robot/#' -v"
    echo ""
    echo "🚀 To start other services:"
    echo "   docker-compose up -d simulator frontend"
    exit 0
  fi
  echo -n "."
  sleep 2
done

echo "❌ Backend not responding after 20 seconds"
echo "Checking logs..."
docker-compose logs backend --tail=20

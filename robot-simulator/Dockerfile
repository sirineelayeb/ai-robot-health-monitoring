FROM python:3.9-alpine
WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir paho-mqtt psutil

# Copy the simulator script
COPY simulator.py .

# Run the simulator 
CMD ["python", "simulator.py"]
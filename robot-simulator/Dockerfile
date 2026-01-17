FROM python:3.9-alpine

WORKDIR /app

# Install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir paho-mqtt psutil

# Copy the simulator script
COPY simulator.py .

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

USER appuser

CMD ["python", "-u", "simulator.py"]
FROM python:3.11-slim

WORKDIR /app

# Install Node.js
RUN apt-get update && apt-get install -y nodejs npm && apt-get clean

# Install Python packages (skip heavy ML packages for initial test)
RUN pip install --no-cache-dir \
    pymongo==4.6.0 \
    fastapi==0.104.1 \
    uvicorn[standard]==0.24.0 \
    paho-mqtt==1.6.1

# Install Node dependencies
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]

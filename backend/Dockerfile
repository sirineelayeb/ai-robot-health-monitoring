FROM python:3.11-slim

WORKDIR /app

# Install Node.js from NodeSource
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    build-essential \
    libgomp1 \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python ML dependencies (no --break-system-packages needed)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Install Node.js dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application code
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]

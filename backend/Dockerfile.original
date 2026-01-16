FROM node:18-slim

# Install Python and essentials
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first (better caching)
COPY requirements.txt .

# Setup Python environment
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

# Install Python dependencies
RUN pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r requirements.txt

# Install additional packages that might be missing
RUN pip install joblib scikit-learn xgboost pandas numpy matplotlib pymongo paho-mqtt

# Verify installations
RUN python -c "import joblib; print(f'joblib {joblib.__version__} installed')"
RUN python -c "import sklearn; print(f'scikit-learn {sklearn.__version__} installed')"
RUN python -c "import xgboost; print(f'xgboost {xgboost.__version__} installed')"

# Copy Node.js files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Fix JavaScript error in advance
RUN sed -i 's/\.filter(g =>/\.filter(issue =>/g' services/telemetryService.js
RUN sed -i 's/g\.severity/issue.severity/g' services/telemetryService.js
RUN sed -i 's/g\.type/issue.type/g' services/telemetryService.js

EXPOSE 3000
CMD ["node", "server.js"]

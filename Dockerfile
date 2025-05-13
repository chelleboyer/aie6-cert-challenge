# Build frontend
FROM node:18 AS frontend-builder
WORKDIR /frontend

# Copy frontend files and install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN npm run build

# Build backend and serve
FROM python:3.9-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    gcc \
    g++ \
    git \
    && rm -rf /var/apt/lists/*

# Install Python packages with correct versions
RUN pip install --no-cache-dir \
    chainlit>=2.0.4 \
    numpy==1.26.4 \
    openai==1.59.9 \
    pydantic==2.10.1 \
    pypdf2==3.0.1 \
    websockets>=14.2 \
    fastapi>=0.115.6 \
    uvicorn>=0.34.0 \
    python-multipart>=0.0.18 \
    aiofiles==23.2.1

# Copy backend code
COPY api_app.py .
COPY aimakerspace/ aimakerspace/

# Copy built frontend from previous stage
COPY --from=frontend-builder /frontend/build/ static/

# Create and copy the combined app file
COPY app_hf.py .

# Expose port
EXPOSE 7860

# Start the application
CMD ["uvicorn", "app_hf:app", "--host", "0.0.0.0", "--port", "7860"]
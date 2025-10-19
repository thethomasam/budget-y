# Base image (use ARM version if Oracle Ampere A1 instance)
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy files
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose the app port
EXPOSE 8000

# Command to start the app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

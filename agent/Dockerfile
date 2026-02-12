# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory to /app
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt /app/

# Install system dependencies required for psycopg and other packages
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the current directory contents into the container at /app/agent
COPY . /app/agent

# Set PYTHONPATH so python can find the 'agent' module
ENV PYTHONPATH=/app

# Expose port 8000
EXPOSE 8000

# Define environment variable
# ENV NAME World

# Run uvicorn when the container launches
CMD ["uvicorn", "agent.main:app", "--host", "0.0.0.0", "--port", "8000"]

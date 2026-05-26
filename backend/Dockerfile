FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Optional local VLM dependencies are large. Keep the default image light and
# enable them with --build-arg INSTALL_LOCAL_VLM=true when needed.
ARG INSTALL_LOCAL_VLM=false
COPY requirements-local.txt /app/
RUN if [ "$INSTALL_LOCAL_VLM" = "true" ]; then \
      pip install --no-cache-dir \
        --index-url https://download.pytorch.org/whl/cu121 \
        --extra-index-url https://pypi.org/simple \
        -r requirements-local.txt; \
    fi

# Copy project files
COPY . /app/

# Create uploads folder and ensure permissions
RUN mkdir -p /app/uploads

# Expose API port
EXPOSE 8000

# Command to run application
CMD ["python", "main.py"]

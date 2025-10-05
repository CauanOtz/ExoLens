FROM tensorflow/tensorflow:2.12.0

# Working directory inside the container
WORKDIR /app

# Copy ExoMiner repository into the image (from monorepo path in build context)
COPY AI/_source_repos/ExoMiner /app/ExoMiner

# Copy requirements and install (from pipeline folder in the repo)
COPY AI/pipelines/pipeline_kepler/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy orchestrator from pipeline folder
COPY AI/pipelines/pipeline_kepler/run_kepler_process.py /app/run_kepler_process.py

# Entrypoint runs the orchestrator; pass CLI args when running the container
ENTRYPOINT ["python", "run_kepler_process.py"]
FROM python:3.10-slim

# Use /app as working directory
WORKDIR /app

# Ensure pip and build tools are recent
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        gcc \
        git \
    && python -m pip install --upgrade pip setuptools wheel \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy ExoMiner repository into the image from the monorepo path in the build context
COPY AI/_source_repos/ExoMiner /app/ExoMiner

# Copy requirements and install (from pipeline folder in the repo)
COPY AI/pipelines/pipeline_kepler/requirements.txt /app/requirements.txt

# Install TensorFlow first (binary wheel) then the rest of requirements
RUN pip install --no-cache-dir tensorflow==2.12.0 && \
    pip install --no-cache-dir -r /app/requirements.txt

# Copy orchestrator from pipeline folder
COPY AI/pipelines/pipeline_kepler/run_kepler_process.py /app/run_kepler_process.py

# Default working directory
WORKDIR /app

# Entrypoint runs the orchestrator; pass CLI args when running the container
ENTRYPOINT ["python", "run_kepler_process.py"]
FROM tensorflow/tensorflow:2.12.0

# Set workdir
# Working directory inside the container
WORKDIR /app

# Copy ExoMiner repository into the image.
# The ExoMiner sources live under AI/_source_repos/ExoMiner in this workspace, so when building
# from the project root (ExoLens) use that path as the build context source.
# Example build command (from project root):
#   docker build -t exominer-kepler -f AI/pipelines/pipeline_kepler/Dockerfile .
# This COPY expects the build context root to be the project root so the following path exists
# in the context: AI/_source_repos/ExoMiner
COPY AI/_source_repos/ExoMiner /app/ExoMiner

# Copy requirements and install (from pipeline folder in the repo)
COPY AI/pipelines/pipeline_kepler/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy orchestrator from pipeline folder
COPY AI/pipelines/pipeline_kepler/run_kepler_process.py /app/run_kepler_process.py

# Default working directory
WORKDIR /app

# Entrypoint runs the orchestrator; pass CLI args when running the container
ENTRYPOINT ["python", "run_kepler_process.py"]

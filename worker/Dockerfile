# Stage 1: Build dependencies
FROM python:3.12-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Final runner
FROM python:3.12-slim

WORKDIR /app

# Create a non-root user and group
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -m appuser

# Copy installed libraries from builder stage
COPY --from=builder /root/.local /home/appuser/.local
COPY worker.py operations.py ./

# Adjust folder ownership for the non-root user
RUN chown -R appuser:appgroup /app

# Ensure local bin is in PATH
ENV PATH=/home/appuser/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

USER appuser

EXPOSE 8080

CMD ["python", "worker.py"]

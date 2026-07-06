"""
Python Background Worker for AI Task Processing Platform.

Consumes tasks from a Redis queue, processes them using defined operations,
and updates results in MongoDB.
"""

import json
import os
import signal
import sys
import time
import threading
import logging
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import redis
import redis.exceptions
import pymongo
from flask import Flask, jsonify
from dotenv import load_dotenv
from bson import ObjectId

# Load .env from backend/.env relative to this file
load_dotenv(Path(__file__).parent.parent / "backend" / ".env")

from operations import OPERATIONS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Configuration from environment variables
REDIS_URL = os.environ.get("REDIS_URL")
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/ai-task-platform')
WORKER_HEALTH_PORT = int(os.environ.get('WORKER_HEALTH_PORT', 8080))

# Shutdown flag
shutdown_flag = threading.Event()


def signal_handler(signum, frame):
    """Handle shutdown signals gracefully."""
    logger.info(f'Received signal {signum}. Shutting down gracefully...')
    shutdown_flag.set()


signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)


# --- Redis Connection with Retry ---
def connect_redis(max_retries=10, retry_delay=3):
    """Connect to Redis with retry logic."""
    for attempt in range(1, max_retries + 1):
        try:
            client = redis.from_url(
                REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
            )
            client.ping()
            logger.info(f"Connected to Redis using {REDIS_URL}")
            return client
        except redis.ConnectionError as e:
            logger.warning(f'Redis connection attempt {attempt}/{max_retries} failed: {e}')
            if attempt < max_retries:
                time.sleep(retry_delay)
    logger.error('Failed to connect to Redis after all retries')
    sys.exit(1)


# --- MongoDB Connection with Retry ---
def connect_mongodb(max_retries=10, retry_delay=3):
    """Connect to MongoDB with retry logic."""
    for attempt in range(1, max_retries + 1):
        try:
            client = pymongo.MongoClient(
                MONGO_URI,
                serverSelectionTimeoutMS=5000
            )
            client.admin.command('ping')
            
            # Robustly parse out the database name with urlparse
            parsed = urlparse(MONGO_URI)
            db_name = parsed.path.lstrip("/") or "ai-task-platform"
                
            db = client[db_name]
            logger.info(f'Connected to MongoDB database: "{db_name}"')
            return db
        except pymongo.errors.ConnectionFailure as e:
            logger.warning(f'MongoDB connection attempt {attempt}/{max_retries} failed: {e}')
            if attempt < max_retries:
                time.sleep(retry_delay)
    logger.error('Failed to connect to MongoDB after all retries')
    sys.exit(1)


# --- Health Check Server ---
def create_health_app(redis_client, db):
    """Create Flask health check application."""
    app = Flask(__name__)

    @app.route('/health')
    def health():
        redis_healthy = False
        mongo_healthy = False
        try:
            redis_client.ping()
            redis_healthy = True
        except Exception:
            pass
        try:
            db.client.admin.command('ping')
            mongo_healthy = True
        except Exception:
            pass

        status = 'healthy' if (redis_healthy and mongo_healthy) else 'unhealthy'
        code = 200 if status == 'healthy' else 503
        return jsonify({
            'status': status,
            'redis': redis_healthy,
            'mongodb': mongo_healthy,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), code

    return app


def start_health_server(redis_client, db):
    """Start health check server in a daemon thread."""
    app = create_health_app(redis_client, db)
    thread = threading.Thread(
        target=lambda: app.run(host='0.0.0.0', port=WORKER_HEALTH_PORT, use_reloader=False),
        daemon=True
    )
    thread.start()
    logger.info(f'Health check server started on port {WORKER_HEALTH_PORT}')


# --- Task Processing ---
def process_task(task_data, tasks_collection):
    """Process a single task from the queue."""
    try:
        task = json.loads(task_data)
    except json.JSONDecodeError as e:
        logger.error(f'Failed to parse task data: {e}')
        return

    task_id = task.get('taskId')
    input_text = task.get('inputText', '')
    operation_type = task.get('operationType', '')
    title = task.get('title', 'Unknown')

    if not task_id:
        logger.error('Task data missing taskId')
        return

    logger.info(f'Processing task {task_id}: {title} ({operation_type})')

    try:
        # Update status to running
        tasks_collection.update_one(
            {'_id': ObjectId(task_id)},
            {
                '$set': {'status': 'running', 'updatedAt': datetime.now(timezone.utc)},
                '$push': {'executionLogs': {
                    'timestamp': datetime.now(timezone.utc),
                    'message': 'Task picked up by worker - status changed to running'
                }}
            }
        )

        # Look up operation
        operation_func = OPERATIONS.get(operation_type)
        if not operation_func:
            raise ValueError(f'Unknown operation type: {operation_type}')

        # Add processing log
        tasks_collection.update_one(
            {'_id': ObjectId(task_id)},
            {'$push': {'executionLogs': {
                'timestamp': datetime.now(timezone.utc),
                'message': f'Starting {operation_type} operation on input text ({len(input_text)} characters)'
            }}}
        )

        # Execute operation
        result = operation_func(input_text)

        # Simulate some processing time for realistic behavior
        time.sleep(1)

        # Update with success
        tasks_collection.update_one(
            {'_id': ObjectId(task_id)},
            {
                '$set': {
                    'status': 'success',
                    'result': str(result),
                    'updatedAt': datetime.now(timezone.utc)
                },
                '$push': {'executionLogs': {
                    'timestamp': datetime.now(timezone.utc),
                    'message': f'Operation completed successfully. Result length: {len(str(result))} characters'
                }}
            }
        )

        logger.info(f'Task {task_id} completed successfully')

    except Exception as e:
        logger.error(f'Task {task_id} failed: {str(e)}')
        try:
            tasks_collection.update_one(
                {'_id': ObjectId(task_id)},
                {
                    '$set': {
                        'status': 'failed',
                        'updatedAt': datetime.now(timezone.utc)
                    },
                    '$push': {'executionLogs': {
                        'timestamp': datetime.now(timezone.utc),
                        'message': f'Error: {str(e)}'
                    }}
                }
            )
        except Exception as update_err:
            logger.error(f'Failed to update task {task_id} status to failed: {update_err}')


# --- Main Worker Loop ---
def main():
    """Main worker entry point."""
    logger.info('=' * 60)
    logger.info('AI Task Processing Worker')
    logger.info(f"Redis URL: {REDIS_URL}")
    logger.info(f'MongoDB: {MONGO_URI}')
    logger.info(f'Health Port: {WORKER_HEALTH_PORT}')
    logger.info('=' * 60)

    # Connect to services
    redis_client = connect_redis()
    db = connect_mongodb()
    tasks_collection = db['tasks']

    # Start health check server
    start_health_server(redis_client, db)

    logger.info('Worker is ready. Waiting for tasks...')

    # Main loop
    while not shutdown_flag.is_set():
        try:
            # BRPOP with 5-second timeout to allow checking shutdown flag
            result = redis_client.brpop('task_queue', timeout=5)

            if result is None:
                continue

            # Using _ since queue_name is unneeded 
            _, task_data = result
            process_task(task_data, tasks_collection)

        except (redis.exceptions.TimeoutError, TimeoutError):
            # No jobs available during the timeout block; keep waiting normally
            continue

        except redis.ConnectionError as e:
            logger.error(f"Redis connection lost: {e}")
            time.sleep(3)
            try:
                redis_client = connect_redis(max_retries=5)
            except SystemExit:
                logger.error('Failed to reconnect to Redis. Exiting.')
                break

        except Exception as e:
            # Captures full traceback details for true anomalies
            logger.exception("Unexpected worker error")
            time.sleep(1)

    logger.info('Worker shut down gracefully.')


if __name__ == '__main__':
    main()
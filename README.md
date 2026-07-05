# AI Task Processing Platform

A production-ready, full-stack asynchronous AI task processing platform built with the MERN stack (MongoDB, Express, React, Node.js), a Python worker, Redis, Docker, Kubernetes, and GitOps (Argo CD).

---

## Features
- **Secure Authentication**: Register and login using JWTs and password hashing with bcrypt.
- **Asynchronous Task Queue**: Create AI processing tasks which are instantly enqueued to a Redis message queue and consumed by background workers.
- **Rich Operations**: Supports:
  - **Uppercase**: Convert characters to uppercase.
  - **Lowercase**: Convert characters to lowercase.
  - **Reverse String**: Reverse the text string.
  - **Word Count**: Count total words in text.
- **Real-Time Monitoring**: Interactive dashboard presenting task execution progress, output results, and real-time step-by-step logs from the worker.
- **Micro-Animations & Premium Theme**: Responsive dark theme with glassmorphism visual styling.
- **Containerization**: Separate, multi-stage Docker builds configured to run as non-root users.
- **Orchestration**: Kubernetes manifests including Deployments, Services, ConfigMaps, Secrets, Ingress, PersistentVolumeClaims, and HorizontalPodAutoscalers.
- **GitOps Ready**: Integrated with Argo CD configuration.

---

## Overall System Architecture

```
[React SPA Frontend] (Port 3000)
       │
       ▼ (REST API & JWT)
[Node.js + Express API] (Port 5000)
       │
       ├─► [MongoDB] (User & Task state storage)
       │
       └─► [Redis Queue] (Enqueues processing tasks)
             │
             ▼ (BRPOP Consume)
       [Python Background Worker]
             │
             └─► [MongoDB] (Updates task status, results & logs)
```

---

## Repository Structure

- `backend/`: Node.js Express REST API server.
- `frontend/`: React Vite SPA UI.
- `worker/`: Python task processing queue worker.
- `docker-compose.yml`: Local multi-container development configuration.
- `.github/workflows/`: GitHub Actions CI/CD configuration.
- `ARCHITECTURE.md`: Extensive architecture details, scaling models, and database design.

---

## Getting Started (Local Development)

### Prerequisites
- Node.js (v20+)
- Python (v3.12+)
- Docker and Docker Compose

### Running with Docker Compose (Recommended)

1. Clone this repository.
2. Navigate to the project root:
   ```bash
   cd ai-task-platform
   ```
3. Run the full stack in detached mode:
   ```bash
   docker-compose up --build -d
   ```
4. Access the services:
   - **Frontend UI**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:5000/healthz](http://localhost:5000/healthz)

### Manual Setup (Without Docker)

#### 1. Start MongoDB and Redis
Ensure MongoDB (port `27017`) and Redis (port `6379`) are running on your system.

#### 2. Run Backend
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create your `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run in development mode:
   ```bash
   npm run dev
   ```

#### 3. Run Background Worker
1. Navigate to the worker folder:
   ```bash
   cd ../worker
   ```
2. Create and activate a python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate # On Windows use: venv\Scripts\activate
   ```
3. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```
4. Run worker script:
   ```bash
   python worker.py
   ```

#### 4. Run Frontend
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open your browser to [http://localhost:5173](http://localhost:5173) (Vite default port).

---

## Configuration Reference

### Backend Environment Variables (`backend/.env`)
- `PORT`: Port backend server listens on (default: `5000`).
- `MONGO_URI`: MongoDB connection string.
- `REDIS_HOST` / `REDIS_PORT`: Redis queue host and port.
- `JWT_SECRET`: Secret key used to sign JSON Web Tokens.
- `CORS_ORIGIN`: CORS allowed origin (default: `*`).

### Worker Environment Variables
- `MONGO_URI`: MongoDB connection string.
- `REDIS_HOST` / `REDIS_PORT`: Redis queue host and port.
- `WORKER_HEALTH_PORT`: Port for internal Flask health checks (default: `8080`).

---

## Production Deployment (Kubernetes & GitOps)

All production manifests are stored in the companion infrastructure repository: `ai-task-platform-infra/`.

### 1. Install to Kubernetes
To apply manifests manually to your cluster (e.g. k3s):

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply ConfigMaps & Secrets
kubectl apply -f k8s/configmaps.yaml
kubectl apply -f k8s/secrets.yaml

# Deploy Databases
kubectl apply -f k8s/mongodb/
kubectl apply -f k8s/redis/

# Deploy Applications
kubectl apply -f k8s/backend/
kubectl apply -f k8s/worker/
kubectl apply -f k8s/frontend/

# Apply Ingress
kubectl apply -f k8s/ingress.yaml
```

### 2. Configure Argo CD (GitOps)
To deploy the platform via GitOps:

1. Install Argo CD on your cluster.
2. Apply the application manifest:
   ```bash
   kubectl apply -f argocd/application.yaml
   ```
3. Argo CD will automatically sync manifests from the repository and deploy them to the `ai-task-platform` namespace, enabling self-healing and pruning on configuration drift.

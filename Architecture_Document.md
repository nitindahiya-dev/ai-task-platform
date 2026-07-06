# AI Task Platform -- Architecture Document

## Overview

The AI Task Platform is a distributed application that allows
authenticated users to create text-processing tasks. Tasks are processed
asynchronously using a Redis queue and a Python background worker. The
system is designed with a decoupled architecture to improve scalability
and responsiveness.

------------------------------------------------------------------------

# High-Level Architecture

``` text
                +------------------+
                |     Browser      |
                +--------+---------+
                         |
                    HTTPS Requests
                         |
                         v
               +-------------------+
               | React Frontend    |
               | (Vercel)          |
               +---------+---------+
                         |
                         |
                         v
               +-------------------+
               | Express Backend   |
               | (Render)          |
               +---------+---------+
                         |
         +---------------+---------------+
         |                               |
         |                               |
         v                               v
 +---------------+               +----------------+
 | MongoDB Atlas |               | Redis Cloud    |
 +---------------+               +-------+--------+
                                         |
                                   Task Queue
                                         |
                                         v
                               +--------------------+
                               | Python Worker      |
                               | (Railway)          |
                               +--------------------+
                                         |
                                         |
                                         v
                                  Update MongoDB
                                         |
                                         |
                               Frontend Polls Backend
```

------------------------------------------------------------------------

# Components

## 1. Frontend (React)

**Responsibilities**

-   User registration and login
-   JWT-based authentication
-   Dashboard displaying user tasks
-   Create new AI tasks
-   View task details
-   Poll backend every 5 seconds while tasks are running

**Deployment**

-   Hosted on **Vercel**

------------------------------------------------------------------------

## 2. Backend (Express.js)

**Responsibilities**

-   Authentication
-   Task CRUD APIs
-   Input validation
-   Push new tasks into Redis queue
-   Retrieve task status and results

**Deployment**

-   Hosted on **Render**

------------------------------------------------------------------------

## 3. Redis Queue

Redis acts as the message broker.

**Responsibilities**

-   Store queued tasks
-   Decouple API from processing
-   Enable asynchronous execution

The backend pushes tasks into the queue, and the worker consumes them.

------------------------------------------------------------------------

## 4. Python Worker

The background worker continuously listens for new tasks.

**Workflow**

1.  Wait for task in Redis
2.  Read task payload
3.  Execute requested text operation
4.  Update MongoDB with status, logs, and result

Supported operations:

-   Uppercase
-   Lowercase
-   Reverse
-   Word Count

**Deployment**

-   Hosted on **Railway**

------------------------------------------------------------------------

## 5. MongoDB Atlas

MongoDB stores all application data.

Collections include:

-   Users
-   Tasks
-   Execution logs

Each task stores:

-   Title
-   Input text
-   Operation
-   Status
-   Result
-   Logs
-   Timestamps

------------------------------------------------------------------------

# Request Flow

1.  User creates a task.
2.  Backend stores the task with **Pending** status.
3.  Backend pushes the task into Redis.
4.  Python worker consumes the task.
5.  Worker executes the operation.
6.  Worker updates MongoDB.
7.  Frontend polls backend and displays the updated status and result.

------------------------------------------------------------------------

# Technology Stack

  Layer            Technology
  ---------------- --------------------------
  Frontend         React, React Router, CSS
  Backend          Express.js, Node.js
  Authentication   JWT
  Database         MongoDB Atlas
  Queue            Redis Cloud
  Worker           Python
  Deployment       Vercel, Render, Railway

------------------------------------------------------------------------

# Design Decisions

-   **Asynchronous processing** prevents long-running tasks from
    blocking API responses.
-   **Redis queue** separates request handling from task execution.
-   **Dedicated Python worker** allows processing independently of the
    backend.
-   **MongoDB** provides flexible storage for task metadata and logs.
-   **Polling** keeps the UI updated without requiring WebSockets.

------------------------------------------------------------------------

# Deployment Summary

  Component   Platform
  ----------- ---------------
  Frontend    Vercel
  Backend     Render
  Worker      Railway
  MongoDB     MongoDB Atlas
  Redis       Redis Cloud

------------------------------------------------------------------------

# Future Improvements

-   WebSocket-based live updates
-   Retry mechanism for failed jobs
-   Task cancellation
-   Multiple worker instances for horizontal scaling
-   Monitoring and centralized logging
-   Docker Compose for local development
-   Full Kubernetes deployment managed with Argo CD

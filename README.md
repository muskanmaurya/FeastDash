# 🛵 Feast Dash — Event-Driven Food Delivery Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18+-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 📌 Executive Summary

**Feast Dash** is a full-stack, distributed microservices platform mimicking modern food delivery ecosystems like Zomato and Swiggy. Built with an event-driven architecture, the system orchestrates asynchronous workflows between **Customers**, **Restaurant Sellers**, and **Delivery Riders**.

Key features include high-frequency GPS tracking with **Leaflet GeoJSON routing**, real-time socket updates, durable asynchronous messaging with **RabbitMQ**, containerized microservice deployments via **Docker**, and multi-gateway payment processing (**Razorpay** and **Stripe**).

---

## 📽️ Core System Demos

### 1. End-to-End Order Lifecycle & Live GPS Tracking

*Real-time Socket.IO synchronization across Customer, Seller, and Rider apps.*

[▶ Watch Real-time tracking Video](https://github.com/user-attachments/assets/dae5a1e6-4eb9-44f1-b133-c3e7aeaf444d)

### 2. Interactive Geocoding & Payment Processing

*Leaflet address selection, dynamic fee calculation, and Stripe/Razorpay integration.*

[▶ Watch Checkout Demo Video](https://github.com/user-attachments/assets/618c55c6-22f2-4286-bdc5-f8fab3ff5bc0)

### 3. Multi-Role Onboarding & Management

*Seller onboarding, rider registration, and admin approval workflows.*

[▶ Watch Multi-Role Onboarding & Management Video](https://github.com/user-attachments/assets/92ba666a-ff43-4b49-b1ac-91e0d181e488)

---

## 📸 Application Screenshots

<div align="center">

### 1. Multi-Role Live Workflows & Order Tracking
*Synchronized Customer checkout, Restaurant order management, and Rider dispatch in real time.*

![Multi-Role Live Workflow](./frontend/src/assets/screenshots/multi-role-checkout.png)

<br/>

| Customer Cart & Menu | Interactive Map & Live GPS Route |
| :---: | :---: |
| <img src="./frontend/src/assets/screenshots/cart-menu.png" width="450"/> | <img src="./frontend/src/assets/screenshots/live-route-tracking.png" width="450"/> |

<br/>

### 2. Admin Verification Portal
*Role-Based Access Control (RBAC) dashboard for onboarding restaurants and approving riders.*

![Admin Dashboard](./frontend/src/assets/screenshots/admin-dashboard.png)

</div>

---

## 🏗️ System Architecture & Event Flow

The platform relies on an API Gateway routing mechanism while isolated microservices communicate asynchronously via a RabbitMQ message broker and publish real-time events through a dedicated Socket.IO layer.

```mermaid
graph TD
    %% Frontend to Gateway
    UI[React Frontend App<br>Vite + Tailwind CSS] -->|HTTPS / WSS| GW[API Gateway Router / Proxy]

    %% Gateway to Microservices
    GW --> Auth[Auth Service<br>Port 5001]
    GW --> Rest[Restaurant Service<br>Port 5002]
    GW --> Adm[Admin Service<br>Port 5003]
    GW --> Rid[Rider Service<br>Port 5005]
    GW --> Util[Utils / Payment Service<br>Port 5006]

    %% Microservices to Message Broker
    Auth -.-> Bus[RabbitMQ Asynchronous Bus<br>Durable Queues & Exchanges]
    Rest -.-> Bus
    Adm -.-> Bus
    Rid -.-> Bus
    Util -.-> Bus

    %% Broker to Realtime Engine
    Bus ==> Socket[Realtime / Socket.IO Service<br>Port 5004]
    Socket -->|Room Emitters| UI

    %% Styling
    style UI fill:#61DAFB,stroke:#333,stroke-width:2px,color:#000
    style GW fill:#eaeaea,stroke:#333,stroke-width:2px,color:#000
    style Bus fill:#FF6600,stroke:#333,stroke-width:2px,color:#fff
    style Socket fill:#010101,stroke:#333,stroke-width:2px,color:#fff
```

---

## ⚙️ Service Catalog

| Service Name | Primary Responsibilities | Stack / Dependencies | Port |
| :--- | :--- | :--- | :--- |
| **`auth-service`** | Authentication, JWT token lifecycle, role RBAC | Node.js, Express, MongoDB, JWT | `5001` |
| **`restaurant-service`** | Menu CRUD, restaurant onboarding, catalog sync | Node.js, Express, Multer, RabbitMQ | `5002` |
| **`admin-service`** | System governance, multi-tenant approvals, user/vendor oversight | Node.js, Express, Mongoose, RabbitMQ | `5003` |
| **`realtime-service`** | Socket.IO rooms, bidirectional event dispatch, real-time GPS broadcast proxy | Node.js, Socket.IO, Express | `5004` |
| **`rider-service`** | GeoJSON indexing, rider assignment, hotspot radius tracking, GPS updates | Node.js, MongoDB 2dsphere, RabbitMQ | `5005` |
| **`utils-service`** | Cloudinary media uploads, Razorpay & Stripe webhooks/payment validation | Node.js, Cloudinary, Razorpay, Stripe | `5006` |

---

## 🔄 Real-Time GPS & Routing Pipeline

Instead of drawing simple direct geometric lines, coordinates are snapped onto real physical streets using the OpenStreetMap system.

```mermaid
sequenceDiagram
    autonumber
    participant R as Rider Mobile Frontend
    participant S as Realtime Socket Service
    participant C as Customer Web Frontend
    participant O as OSRM GeoJSON API

    loop Every 5 Seconds
        R->>S: Emit coordinates via WebSocket (navigator.geolocation)
        S->>C: Broadcast coordinates to Room 'order:ORDER_ID'
        C->>O: Query Route with coordinates (/routed-car/route/v1)
        O-->>C: Return Street-Snapped Node Points
        Note over C: Render dynamic path via React-Leaflet Polyline
    end
```

### Technical Workflow Details:
1. **Location Ingestion:** The Rider frontend polls `navigator.geolocation` every 5 seconds and emits the coordinates to `/api/v1/internal/emit`.
2. **Socket Partitioning:** The `realtime-service` broadcasts the position to subscribers joining room `order:<ORDER_ID>`.
3. **Street-Snapped Route Calculation:** Instead of drawing direct Euclidean lines, the application queries OpenStreetMap DE OSRM endpoints, receiving hundreds of street node points rendered dynamically via React-Leaflet `<Polyline>`.

---

## 💻 Tech Stack

* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Leaflet, Socket.io-client, Axios.
* **Backend:** Node.js, Express.js, TypeScript, Socket.io, JSON Web Tokens (JWT), Multer.
* **Database & Messaging:** MongoDB (Mongoose), MongoDB 2dsphere Spatial Indexing, RabbitMQ (`amqplib`).
* **DevOps & External APIs:** Docker, Docker Compose, Razorpay API, Stripe API, Cloudinary API, OpenStreetMap OSRM.


---

## 🚀 Environment Variables Configuration

Create a `.env` file within each respective service directory, or pass them directly through your `docker-compose.yml` environment blocks.

### Core Configuration Parameters

```env
# Server Network Ports
PORT=5000
REALTIME_SERVICE_URL=http://localhost:5004

# Database & Authentication
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/feastdash
JWT_SECRET=your_jwt_secret_key
INTERNAL_SERVICE_KEY=your_internal_microservice_secret

# Message Broker (RabbitMQ)
RABBITMQ_URL=amqp://guest:guest@localhost:5672
PAYMENT_QUEUE=payment_queue
ORDER_READY_QUEUE=order_ready_queue
RIDER_QUEUE=rider_queue

# Third-Party Cloud Integrations (Utils Service)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payment Gateways (Utils Service)
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
```

---

## 🐳 Docker Containerized Execution

To spin up the entire microservices mesh alongside managed instances of MongoDB and RabbitMQ automatically, use Docker Compose.

```bash
# 1. Clone the repository
git clone https://github.com/your-username/feast-dash.git
cd feast-dash

# 2. Build images and start the distributed application mesh
docker-compose up --build -d

# 3. Verify that all service containers are running normally
docker-compose ps
```

---

## 🛠️ Local Development Setup

If you prefer to debug individual codebases natively on your machine without running Docker containers:

### 1. Install Dependencies Across Microservices
Execute npm installation targeting individual workspace directories:

```bash
npm install --prefix services/auth-service
npm install --prefix services/restaurant-service
npm install --prefix services/order-service
npm install --prefix services/rider-service
npm install --prefix services/utils-service
npm install --prefix services/realtime-service
npm install --prefix frontend
```

### 2. Start Services Concurrently
Launch your required database instances locally, then spin up the frontend and backend microservices:

```bash
# Start your targeted target service
npm run dev --prefix services/auth-service

# Start your UI client layer
npm run dev --prefix frontend
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.



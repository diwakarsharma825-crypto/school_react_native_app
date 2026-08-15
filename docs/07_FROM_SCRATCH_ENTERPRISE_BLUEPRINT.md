# 07 — Enterprise Scratch Blueprint & Scalability Master Plan

This document outlines the architectural blueprint, backend infrastructure, database schema, caching layers, and frontend design system if building a next-generation **Institute App** from scratch to handle millions of Daily Active Users (DAU) and high-concurrency peak traffic.

---

## 1. Architectural Vision & High-Traffic Blueprint

```text
                                Client Access Layer
             ┌───────────────────────────┼───────────────────────────┐
             ▼                           ▼                           ▼
       iOS Mobile App             Android Mobile App             Web Application
    (React Native / Expo)      (React Native / Expo)         (Expo Web / Next.js)
             │                           │                           │
             └───────────────────────────┼───────────────────────────┘
                                         ▼
                             CDN & Edge Network Layer
                      (Cloudflare / AWS CloudFront / Fastly)
                                         │
                                         ▼
                            API Gateway / Load Balancer
                       (Kong / AWS ALB / NGINX Ingress)
                                         │
             ┌───────────────────────────┼───────────────────────────┐
             ▼                           ▼                           ▼
     Auth Service Microservice   Academic Service Microservice  Notification Microservice
      (Go / Node.js / Rust)       (Go / Node.js / Rust)        (BullMQ / Redis Queue)
             │                           │                           │
             ├───────────────────────────┴───────────────────────────┤
             ▼                                                       ▼
      Redis Cache Cluster                               Primary Database Cluster
   (Session, Cache, Tokens)                           (PostgreSQL with Read Replicas)
```

---

## 2. Recommended Tech Stack

| Layer | Component | Technology Selection | Rationale |
|---|---|---|---|
| **Mobile Frontend** | Cross-Platform Framework | React Native (Expo SDK 52) + Expo Router v4 | Native performance on iOS/Android, single codebase, web output compatibility, robust ecosystem. |
| **Web Frontend** | Web Renderer / SSR | Expo Web + Next.js SSR for Public Landing Pages | Fast initial load, SEO optimization for public pages, Instant hydration for app routes. |
| **State & Data Fetching** | Client State & Caching | TanStack Query (React Query) + Zustand | Automatic background refetching, query deduplication, optimistic updates, offline mutation queuing. |
| **UI Components & Icons** | Design System | Vanilla React Native StyleSheet + `@lucide/lab` / `@expo/vector-icons` | High performance, zero runtime CSS-in-JS overhead, complete theme engine control. |
| **Backend Framework** | Microservices Architecture | Go (Golang) or Node.js NestJS | High concurrency throughput, low memory footprint, strict typing, rapid response execution. |
| **Primary Database** | Relational Database | PostgreSQL 16 with Connection Pooling (PgBouncer) | ACID compliance, JSONB support for dynamic schemas, read replica scaling for heavy traffic. |
| **Caching & Queues** | In-Memory Data Store | Redis Cluster (ElastiCache) + BullMQ | Sub-millisecond session validation, API response caching, async job queues for FCM push notifications. |
| **Search Engine** | Full-Text Search | Meilisearch or Elasticsearch | Instant sub-10ms search across student rosters, homework, notices, and fee records. |
| **Object Storage** | Media Assets Storage | AWS S3 / Cloudflare R2 + ImageKit / Cloudinary | CDN-backed storage with automatic WebP/AVIF image compression and resizing. |

---

## 3. Key Scalability Pillars

### 3.1 Read Replica Routing
- **90% of app traffic is read-only** (students viewing homework, parents checking attendance, visitors viewing news).
- Separate read queries (`SELECT`) to PostgreSQL Read Replicas behind a round-robin load balancer. Only write operations (`INSERT`/`UPDATE`/`DELETE`) hit the Primary Master database.

### 3.2 Redis Response Caching & Cache Invalidation
- Cache public endpoints (`/home`, `/settings`, `/notices`, `/events`, `/gallery`) in Redis with Time-To-Live (TTL) of 5–15 minutes.
- Invalidate specific cache keys instantly whenever a teacher creates or updates a notice/event.

### 3.3 Asynchronous Queue-Based Push Notifications
- When a teacher marks attendance or posts homework, the HTTP request should **not** block waiting for 50+ push notifications to send.
- The backend pushes an async job into a **BullMQ / Redis Queue**. A pool of background worker processes processes the queue concurrently via Firebase Cloud Messaging (FCM) HTTP v1 API.

### 3.4 Offline-First Synchronization Engine
- Implement an offline sync engine using **WatermelonDB** or **Expo SQLite**.
- Teachers can mark attendance or draft homework while offline (in low-connectivity classrooms); the app queues local actions and auto-syncs when internet connection is restored.

---

## 4. Phased Implementation Roadmap

```text
Phase 1: Core Foundation (Weeks 1-4)
├── Set up Expo Router, TypeScript, and central Design Tokens theme engine
├── Implement JWT authentication, Secure Store token persistence, and role guards
└── Establish PostgreSQL schema, migrations, and Go/NestJS API gateway

Phase 2: Academic Modules (Weeks 5-8)
├── Build Homework Calendar, Attendance Mark Sheet, and Student Roster modules
├── Integrate universal PDF Exporter and Excel import/export helpers
└── Implement TanStack Query caching and offline optimistic UI state

Phase 3: Communication & Media (Weeks 9-12)
├── Deploy BullMQ / Redis push notification queuing service
├── Integrate Cloudflare R2 / AWS S3 media upload pipeline with WebP optimization
└── Build Event Calendar, Notices Circulars, and Gallery albums

Phase 4: High-Traffic Scaling & Production Launch (Weeks 13-16)
├── Configure PostgreSQL Read Replicas and Redis endpoint caching layer
├── Implement stress testing (k6 / Locust) for 100,000+ concurrent requests
└── Deploy automated CI/CD pipeline (GitHub Actions -> Expo EAS / Docker Kubernetes)
```

# Oor Nithi (ஊர் நிதி) - Sangam Collection & Community Finance Management System

A multi-tenant SaaS platform built for village Sangams, Temple Committees (Kovil Thiruvizha), and community financial management.

---

## 🏛️ Architecture Overview

```
Temple App 2/
├── Templet-api/            # Java 17 + Spring Boot 3 REST API Backend
│   ├── src/main/java/com/oornithi/
│   │   ├── config/         # JWT Security & ThreadLocal TenantContext
│   │   ├── controller/     # Auth, Sangam, Members, Collections, Events, Ledger
│   │   ├── dto/            # Dynamic Excel Matrix DTOs & ApiResponse
│   │   ├── entity/         # PostgreSQL JPA Entities with sangam_id FKs
│   │   ├── repository/     # Spring Data JPA Repositories
│   │   └── service/        # Double-Entry Ledger, Collections, Members
│   └── src/main/resources/
│       ├── application.yml
│       └── db/migration/V1__initial_schema.sql
│
├── Temple-web/             # Modern Angular 18+ Web Application
│   ├── src/app/
│   │   ├── core/           # i18n Tamil/English Service, ApiService Wrapper
│   │   ├── features/       # Landing, Login, Matrix, Dashboards, Events, Ledger
│   │   └── layout/         # Responsive Navbar & Bi-lingual Switcher
│   └── src/styles.css      # Deep Temple Green & Gold Design System
│
└── Temple-Mobile/          # React Native Cross-Platform App (Android / iOS)
    └── src/                # Role-Based Navigation, Agent Collector Flow
```

---

## 🚀 Key Features

1. **Multi-Tenant Security**: Every database entity includes `sangam_id`. Automatic ThreadLocal context isolation in Spring Boot backend ensures Sangam A cannot access Sangam B data.
2. **Dynamic Collection Matrix**: Excel-inspired responsive matrix view (`September` - `August` or custom configured cycles). Auto-provisions expected member collection slots and renders real-time color badges (`PAID`, `PENDING`, `PARTIAL`).
3. **Double-Entry Financial Ledger**: Immutable ledger (`MEMBER_COLLECTION`, `DONATION`, `EXPENSE`, `EVENT_EXPENSE`) calculates current available balance on-the-fly.
4. **Temple Festival & Expense Management**: Track Kovil Thiruvizha event budgets against line-item expenses (*Melam*, *Santha Melam*, *Serial Light*, *Arch*, *Pandhal*, *Annadhanam*, *Transport*).
5. **Bi-lingual English & Tamil (i18n)**: Seamless translation toggle across web landing page, admin dashboards, collection matrix, and mobile app.
6. **5-Step Sangam Self-Registration Wizard**: Public registration with instant 1-month free trial provisioning.
7. **Mobile Agent Collection App**: React Native mobile app for agents to collect contributions on-the-go with receipt generation.

---

## ⚙️ Quick Start Guide

### 1. Backend (`Templet-api`)
```bash
cd Templet-api
mvn clean spring-boot:run
```
*Port*: `http://localhost:8080/api`

### 2. Web Application (`Temple-web`)
```bash
cd Temple-web
npm install
npm start
```
*URL*: `http://localhost:4200`

### 3. Mobile Application (`Temple-Mobile`)
```bash
cd Temple-Mobile
npm install
npx expo start
```

---

## 🔑 Default Super Admin Credentials
- **Mobile Number**: `9999999999`
- **Password**: `admin123`
- **Role**: `SUPER_ADMIN`

# CRM Application with RBAC & Pipeline Management

A comprehensive Customer Relationship Management (CRM) platform built with Node.js, Express, TypeScript, PostgreSQL, and React.

## 🚀 Key Features Implemented

- **Role-Based Access Control (RBAC):** Distinct roles (CEO, CFO, Manager, Sales Agent) with permission-based routing and query filtering.
- **Authentication & Security:** Secure user registration/login using JWT (JSON Web Tokens) and bcrypt password hashing.
- **Deals Pipeline:** Interactive deal management categorized by pipeline stages, featuring per-user data isolation.
- **Task Management:** Real-time task tracking with priorities, categories, due dates, and deal associations.
- **Relational Database:** Fully structured PostgreSQL schema with foreign keys and cascading deletes.

## 🛠️ Tech Stack

- **Backend:** Node.js, Express, TypeScript, `node-postgres` (pg pool)
- **Database:** PostgreSQL
- **Frontend:** React.js, Tailwind CSS
- **Authentication:** JWT, bcryptjs

## 🗄️ Database Setup

All database tables and relationships are documented in:
`backend/schema.sql`

To initialize the schema locally, run the SQL commands from `schema.sql` in pgAdmin or your PostgreSQL CLI.

## 💻 Local Setup & Installation

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```
### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev 


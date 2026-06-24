# SiteSecure (SafeSite) - Comprehensive Project Documentation

## 1. Project Overview
**SiteSecure** is a professional-grade Incident Management and Security Auditing platform. It is designed to bridge the gap between physical security hazards and digital reporting systems. By using digital map overlays (floor plans/site maps), the system allows for precise tracking, verification, and resolution of security incidents in real-time.

---

## 2. System Architecture & Concept
The project follows a modular **Full-Stack Architecture** with a clear separation between the client and server.

### Conceptual Model
The system revolves around the life cycle of an **Incident**:
1. **Reporting**: A user (Flagger) marks a hazard on a digital map.
2. **Verification**: The report is vetted by both Online and Ground Verifiers to ensure accuracy.
3. **Resolution**: A assigned Resolver fixes the issue and provides proof.
4. **Auditing**: Admins track every step via security logs and analytics dashboards.

---

## 3. Technology Stack
### Frontend (Client)
- **Framework**: React 18+ with Vite
- **Language**: TypeScript (Strict typing for safety)
- **Styling**: Tailwind CSS (Modern, utility-first UI)
- **Mapping**: Leaflet.js (via React-Leaflet) for 2D image-based coordinate mapping.
- **Icons**: Lucide-React

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (NoSQL) with Mongoose ODM
- **Security**: JWT (JSON Web Tokens) for authentication and Bcrypt for password encryption.

---

## 4. Key Modules & Features
### A. Multi-Role Dashboard System
The application implements **Role-Based Access Control (RBAC)** with 6 distinct roles:
- **Flagger**: Reports incidents.
- **Online Verifier**: Preliminary digital verification.
- **Ground Verifier**: On-site physical verification.
- **Resolver**: Fixes/Resolves reported issues.
- **Site Admin**: Manages specific site maps and users.
- **Super Admin**: Global system oversight.

### B. Map-Based Incident Tracking
Unlike traditional forms, SiteSecure uses **Coordinate Mapping**:
- **Image Overlays**: Admins upload a site map (e.g., a building blueprint).
- **Pixel-to-GPS Mapping**: The system captures both the pixel location (X,Y) on the drawing and the real-world GPS coordinates (Lat, Lng) to guide security personnel accurately.

### C. Automated Security Logs
Every action (status change, user login, resolution) is automatically logged in the database, creating an immutable audit trail for compliance and safety reviews.

---

## 5. Technical Implementation Details
### Database Models
- **User**: Stores credentials and role assignments.
- **Site**: Represents a physical location with its primary map.
- **Subsite**: Represents specific rooms or areas within a site.
- **Incident**: The core data unit containing location, severity, status, and evidence.
- **Log**: Tracking history for system audits.

### Workflow Logic
The incident status transitions through a strict pipeline:
`Reported` → `Approved/Rejected` → `Verified` → `Resolved` → `Closed`

---

## 6. Project Structure
```text
SiteSecure/
├── client/                # React + Vite Frontend
│   ├── src/
│   │   ├── components/    # Reusable UI (Map, Cards, Navbar)
│   │   ├── pages/         # Dashboard views for each role
│   │   └── context/       # Auth and Global State
├── server/                # Node.js + Express Backend
│   ├── models/            # MongoDB Schemas
│   ├── controllers/       # Business Logic
│   ├── routes/            # API Endpoints
│   └── middleware/        # Auth & Role verification
```

---

## 7. How to Run
1. **Backend**: 
   - `cd server`
   - `npm install`
   - Create `.env` with `MONGO_URI` and `JWT_SECRET`
   - `npm start`
2. **Frontend**:
   - `cd client`
   - `npm install`
   - `npm run dev`

---

## 8. Summary
SiteSecure is a robust solution for modern security management, combining high-end web visualization with enterprise-grade data handling to ensure physical safety and accountability.

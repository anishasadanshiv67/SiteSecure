# SiteSecure CP

SiteSecure is a comprehensive safety and compliance management platform designed for industrial and commercial facilities. It enables multi-role collaboration for identification, verification, and resolution of site hazards.

## 🚀 Project Overview

The platform provides specialized dashboards for different roles:
- **Admin**: System management and oversight.
- **Flagger**: Incident reporting and safety inspections.
- **Online Verifier**: Remote validation of reported incidents.
- **Ground Verifier**: On-site verification and severity assessment.
- **Resolver**: Hazard resolution and proof submission.
- **Compliance Officer**: Final audit and closure of resolved hazards.

## 🛠 Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide Icons, i18next (Multilingual).
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB with Mongoose.
- **Security**: JWT Authentication, Role-Based Access Control (RBAC).

## 📂 Project Structure

```text
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Auth and global state
│   │   ├── i18n/           # Localization files (EN/HI/AR)
│   │   ├── pages/          # Dashboard views and layouts
│   │   └── utils/          # API and helper functions
├── server/                 # Backend Node.js application
│   ├── config/             # Database configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Auth and upload middleware
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API endpoints
│   └── uploads/            # Incident proof storage (ignored)
```

## ⚙️ Installation & Setup

### 1. Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
```
Update the `.env` file with your MongoDB URI and JWT Secret.

### 3. Frontend Setup
```bash
cd client
npm install
```

## 🏃 Running the Application

### Start Backend
```bash
cd server
npm run dev
```

### Start Frontend
```bash
cd client
npm run dev
```

The application will be available at `http://localhost:5173`.

## 🌍 Multilingual Support
The application supports English (EN), Hindi (HI), and Arabic (AR). Translations are managed in `client/src/i18n/locales`.

## 📜 License
Private/Internal Use Only.

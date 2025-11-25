# CSSECDV - Course Management System

A full-stack course management system with role-based access control built with React, Express.js, and MongoDB.

## Prerequisites

- **Node.js** (v14+)
- **MongoDB** (running on `mongodb://localhost:27017`)

## Installation

```bash
# Install all dependencies
npm run install-all
```

## Configuration

Create `.env` files:

**backend/.env:**
```env
MONGO_URI=mongodb://localhost:27017/secdev
JWT_SECRET=your_secret_key
PORT=5000
```

**frontend/.env:**
```env
VITE_API_URL=http://localhost:5000/api
```

## Running the Application

```bash
# Start both backend and frontend
npm start

# Or run separately
npm run server:dev      # Backend only
npm run client:dev      # Frontend only
```

## Database Seeding

```bash
npm run seed --prefix backend
```

Default credentials:
- Admin: `admin@example.com`
- Teacher: `teacher1@example.com`
- Student: `student1@example.com`
- Password: `P@ssword123`

## Features

- **Admin**: Manage users, view audit logs
- **Teacher**: Create courses, grade students, manage enrollments
- **Student**: Browse courses, enroll/drop, view grades
- **All**: Update profile, change password, view audit logs

## Tech Stack

- **Backend**: Node.js, Express, MongoDB, JWT
- **Frontend**: React 18, Vite, React Router, Axios
- **Styling**: CSS Modules + Global Design System

## Project Structure

```
SecDEV/
├── backend/          # Express API
├── frontend/         # React app
└── package.json      # Root scripts
```

## Troubleshooting

- **MongoDB not connecting**: Ensure MongoDB is running (`mongod`)
- **Port in use**: Change port in `backend/.env` or `frontend/vite.config.js`
- **Dependencies fail**: Run `npm cache clean --force` then `npm run install-all`

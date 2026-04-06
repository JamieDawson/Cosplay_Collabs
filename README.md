# 🎭 Collab Cosplay

A platform built for cosplayers to **connect, collaborate, and create together**.

Whether you're looking for a photoshoot partner, a group cosplay, or just want to meet others in your fandom—Collab Cosplay helps you find your people.

---

## ✨ What you can do

- 📢 Post cosplay Instagram post so others can discover and reach out to you
- 🔎 Browse a real-time feed of cosplay opportunities (newest first)
- 🔐 Log in securely with Auth0 and manage your profile
- 🧭 Explore posts with tags, locations, and other filters
- 🤝 Connect with other cosplayers in your community

---

## ✨ The Home page:

https://github.com/user-attachments/assets/d5e5505f-7e4b-4ceb-b3a3-1b984132babe

## Click user profiles to see all their post:

https://github.com/user-attachments/assets/cf8d74cc-b872-4b62-91ae-1ca53d78b7c7

## Map feature to find users near you:

https://github.com/user-attachments/assets/55687fa9-701f-4247-aedc-1f1db9d072e9

## Search tags to find your fandom:

https://github.com/user-attachments/assets/5f84d5aa-b480-4792-bd41-a0cb77e632d1

## 🧱 How the pieces fit together

This project is made up of a few independent systems that work together seamlessly:

### 1. 🎨 Frontend (React on Vercel)

- Lives in the `frontend/` directory
- Deployed as a single-page app on Vercel
- Handles routing, UI, and user interactions
- Fetches data from the backend API

---

### 2. 🔐 Authentication (Auth0)

- Handles secure login/logout
- After authentication, users are redirected to `/post-login`
- The app then fetches the user’s profile from the backend

---

### 3. ⚙️ Backend API (Express on Node.js)

- Located in the `backend/` directory
- Exposes REST endpoints under `/api/...`
- Typically deployed on services like Render (or any Node-compatible host)
- Responsible for:
  - Fetching and storing cosplay posts
  - Managing user profiles
  - Serving data to the frontend

---

### 4. 🗄️ Database (Neon Postgres)

- Hosted PostgreSQL database via Neon
- The backend connects using `DATABASE_URL` (with SSL enabled)
- Stores:
  - User profiles
  - Cosplay post
  - Related metadata

---

## 🚀 Local development (quick start)

### 1. Frontend

```bash
cd frontend
npm install
npm start
```

### 2. Backend

```cd backend
npm install
npm start
```

### 3. Environment variables

Copy & configure enviroment files

```
frontend/.env.example → frontend/.env
backend/.env.example → backend/.env
```

## 🌐 Deployment Notes

### 🎨 Frontend (Vercel)

- Deploy the `frontend/` directory
- Set `REACT_APP_API_URL` to your backend URL

---

### ⚙️ Backend (Node host like Render)

- Deploy the `backend/` directory
- Set `DATABASE_URL` to your Neon Postgres connection string

---

### 🔐 Auth0

- Add your deployed frontend URL to:
  - Allowed Callback URLs
  - Allowed Logout URLs
  - Allowed Web Origins

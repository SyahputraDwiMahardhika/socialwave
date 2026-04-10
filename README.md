# 🌊 SocialWave — Setup Guide (Fixed)

## 📋 Requirements
- PHP 8.2+
- Composer
- Node.js 18+ & npm
- MySQL 8.0+

---

## 🚀 Step-by-Step Setup

### STEP 1 — Extract ZIP
Extract ke folder `htdocs` (XAMPP) atau `www` (Laragon):
```
htdocs/
└── socialwave/
    ├── backend/
    └── frontend/
```

---

### STEP 2 — Buat Database MySQL
Buka phpMyAdmin atau MySQL CLI:
```sql
CREATE DATABASE socialwave CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### STEP 3 — Setup Backend (Laravel)

Buka terminal di folder `backend`:

```bash
cd backend
```

**3a. Install dependencies (wajib, termasuk Sanctum):**
```bash
composer install
```

**3b. Copy file environment:**
```bash
cp .env.example .env
```

**3c. Generate app key:**
```bash
php artisan key:generate
```

**3d. Edit `.env` — sesuaikan database:**
```
DB_DATABASE=socialwave
DB_USERNAME=root
DB_PASSWORD=           ← isi password MySQL kamu (kosong jika tidak ada)
```

**3e. Install Sanctum & publish config:**
```bash
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

**3f. Jalankan migrations:**
```bash
php artisan migrate
```

**3g. Isi data demo:**
```bash
php artisan db:seed
```

**3h. Buat storage link:**
```bash
php artisan storage:link
```

**3i. Jalankan server:**
```bash
php artisan serve
```
Backend berjalan di: **http://localhost:8000**

---

### STEP 4 — Setup Frontend (React)

Buka terminal BARU di folder `frontend`:

```bash
cd frontend
npm install
npm run dev
```
Frontend berjalan di: **http://localhost:5173**

---

## 🔑 Demo Accounts

| Role  | Email                   | Password |
|-------|-------------------------|----------|
| Admin | admin@socialwave.com    | password |
| User  | budi@example.com        | password |
| User  | sari@example.com        | password |

Buka browser: **http://localhost:5173**

---

## ⚠️ Troubleshooting

### Error: `Table 'users' already exists`
Database sudah pernah di-migrate. Jalankan:
```bash
php artisan migrate:fresh --seed
```

### Error: `SQLSTATE: Access denied`
Password MySQL salah di `.env`. Periksa `DB_PASSWORD`.

### Error: `Class "Laravel\Sanctum\..." not found`
Sanctum belum terinstall. Jalankan:
```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

### CORS Error di browser
Pastikan di `.env`:
```
SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173
```
Lalu restart server: `php artisan serve`

### Frontend tidak bisa connect ke backend
Periksa `frontend/vite.config.js` — proxy harus ke `http://localhost:8000`.

---

## 📁 Project Structure

```
socialwave/
├── backend/                          ← Laravel 12 API
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   │   ├── AuthController.php
│   │   │   ├── UserController.php
│   │   │   ├── PostController.php
│   │   │   ├── CommentController.php
│   │   │   └── AdminController.php
│   │   ├── Http/Middleware/
│   │   │   └── AdminMiddleware.php
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── Post.php
│   │   │   └── Comment.php
│   │   └── Services/
│   │       └── ContentModerationService.php
│   ├── bootstrap/app.php
│   ├── config/{cors,sanctum,filesystems}.php
│   ├── database/
│   │   ├── migrations/               ← 5 migration files (correct order)
│   │   └── seeders/DatabaseSeeder.php
│   └── routes/api.php
│
└── frontend/                         ← React 18 + Vite
    └── src/
        ├── pages/{Login,Register,Home,Profile,AdminDashboard}.jsx
        ├── components/{Navbar,PostCard,PostFormModal,CommentSection,ModerationTable}.jsx
        ├── context/AuthContext.jsx
        └── services/api.js
```

# 📚 Library Loan API

REST API sederhana untuk **pencatatan peminjaman buku perpustakaan**, dibangun dengan **Node.js + Express.js**, database **Supabase (PostgreSQL)**, dan di-deploy ke **Vercel**.

🔗 **Base URL (Vercel):** `https://GANTI-DENGAN-LINK-VERCEL-ANDA.vercel.app`

> Contoh endpoint: `https://GANTI-DENGAN-LINK-VERCEL-ANDA.vercel.app/loans`

---

## 1. Deskripsi Umum & Tujuan Proyek

Proyek ini adalah backend layanan perpustakaan yang mencatat siapa meminjam buku apa, kapan harus kembali, dan apakah peminjaman sudah dikembalikan atau terlambat.

**Tujuan:**
- Menyediakan operasi **CRUD** (Create, Read, Update, Delete) untuk data peminjaman buku oleh anggota.
- Menyediakan **filter query** untuk menyaring data, misalnya `GET /loans?status=Terlambat`.
- Menerapkan arsitektur berlapis (**routes → controllers → models**) dan integrasi **Supabase**.
- Dapat diakses publik melalui **deployment Vercel**.

**Fitur utama**
- CRUD data peminjaman
- Filter berdasarkan `status`, `nama_anggota`, `judul_buku`
- Pengurutan (`sort`, `order`) dan paginasi (`page`, `limit`)
- Status **Terlambat otomatis**: peminjaman berstatus `Dipinjam` yang melewati `tanggal_jatuh_tempo` diubah menjadi `Terlambat` setiap kali data dibaca
- `tanggal_kembali` terisi otomatis saat status diubah menjadi `Dikembalikan`
- Validasi input dan format error JSON yang konsisten

**Tech stack:** Node.js, Express.js 5, Supabase (`@supabase/supabase-js`), Vercel.

---

## 2. Struktur Data / Schema

Tabel **`loans`** (SQL lengkap ada di [`supabase/schema.sql`](supabase/schema.sql)):

| Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `id` | `uuid` | otomatis | Primary key (`gen_random_uuid()`) |
| `nama_anggota` | `text` | ✅ | Nama anggota peminjam |
| `judul_buku` | `text` | ✅ | Judul buku yang dipinjam |
| `tanggal_pinjam` | `date` | – | Default hari ini. Format `YYYY-MM-DD` |
| `tanggal_jatuh_tempo` | `date` | ✅ | Batas pengembalian. Tidak boleh sebelum `tanggal_pinjam` |
| `tanggal_kembali` | `date` | – | Terisi saat buku dikembalikan (`null` jika belum) |
| `status` | `text` | – | `Dipinjam` (default), `Dikembalikan`, atau `Terlambat` |
| `created_at` | `timestamptz` | otomatis | Waktu data dibuat |
| `updated_at` | `timestamptz` | otomatis | Waktu data terakhir diubah |

**Struktur project**
```
├── api/index.js                 # entry point Vercel (serverless)
├── src/
│   ├── index.js                 # menjalankan server lokal
│   ├── app.js                   # konfigurasi Express & route
│   ├── config/supabaseClient.js # koneksi Supabase
│   ├── routes/loanRoutes.js     # definisi endpoint
│   ├── controllers/loanController.js
│   ├── models/loanModel.js      # query ke Supabase
│   ├── middleware/errorHandler.js
│   └── utils/                   # validator & HttpError
├── supabase/schema.sql          # skema tabel + data contoh
├── vercel.json
└── .env.example
```

---

## 3. Daftar Endpoint

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/loans` | Daftar peminjaman (mendukung filter) |
| GET | `/loans/:id` | Detail satu peminjaman |
| POST | `/loans` | Tambah peminjaman baru |
| PUT / PATCH | `/loans/:id` | Ubah data peminjaman (boleh sebagian field) |
| DELETE | `/loans/:id` | Hapus peminjaman |

### Query Parameter `GET /loans`

| Parameter | Contoh | Keterangan |
|---|---|---|
| `status` | `Terlambat` | Filter status: `Dipinjam` / `Dikembalikan` / `Terlambat` |
| `nama_anggota` | `budi` | Pencarian parsial, tidak peka huruf besar/kecil |
| `judul_buku` | `clean` | Pencarian parsial, tidak peka huruf besar/kecil |
| `sort` | `tanggal_jatuh_tempo` | Kolom urutan. Default `created_at` |
| `order` | `asc` / `desc` | Arah urutan. Default `desc` |
| `page` | `1` | Halaman. Default `1` |
| `limit` | `10` | Data per halaman. Default `10`, maksimal `100` |

---

## 4. Contoh Request & Response

### 4.1 Tambah peminjaman — `POST /loans`

**Request**
```bash
curl -X POST {BASE_URL}/loans \
  -H "Content-Type: application/json" \
  -d '{
    "nama_anggota": "Budi Santoso",
    "judul_buku": "Laskar Pelangi",
    "tanggal_pinjam": "2026-10-01",
    "tanggal_jatuh_tempo": "2026-10-15"
  }'
```

**Response `201 Created`**
```json
{
  "success": true,
  "message": "Peminjaman berhasil dicatat",
  "data": {
    "id": "3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b",
    "nama_anggota": "Budi Santoso",
    "judul_buku": "Laskar Pelangi",
    "tanggal_pinjam": "2026-10-01",
    "tanggal_jatuh_tempo": "2026-10-15",
    "tanggal_kembali": null,
    "status": "Dipinjam",
    "created_at": "2026-10-10T03:21:45.123Z",
    "updated_at": "2026-10-10T03:21:45.123Z"
  }
}
```

### 4.2 Daftar peminjaman — `GET /loans`

**Request**
```bash
curl "{BASE_URL}/loans?page=1&limit=10"
```

**Response `200 OK`**
```json
{
  "success": true,
  "meta": { "page": 1, "limit": 10, "total": 1, "total_pages": 1 },
  "data": [
    {
      "id": "3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b",
      "nama_anggota": "Budi Santoso",
      "judul_buku": "Laskar Pelangi",
      "tanggal_pinjam": "2026-10-01",
      "tanggal_jatuh_tempo": "2026-10-15",
      "tanggal_kembali": null,
      "status": "Dipinjam",
      "created_at": "2026-10-10T03:21:45.123Z",
      "updated_at": "2026-10-10T03:21:45.123Z"
    }
  ]
}
```

### 4.3 Filter status — `GET /loans?status=Terlambat`

**Request**
```bash
curl "{BASE_URL}/loans?status=Terlambat&sort=tanggal_jatuh_tempo&order=asc"
```

**Response `200 OK`**
```json
{
  "success": true,
  "meta": { "page": 1, "limit": 10, "total": 1, "total_pages": 1 },
  "data": [
    {
      "id": "7a1c9d2e-8b3f-4c5d-a6e7-0f1a2b3c4d5e",
      "nama_anggota": "Budi Santoso",
      "judul_buku": "Laskar Pelangi",
      "tanggal_pinjam": "2026-09-20",
      "tanggal_jatuh_tempo": "2026-10-04",
      "tanggal_kembali": null,
      "status": "Terlambat",
      "created_at": "2026-09-20T02:00:00.000Z",
      "updated_at": "2026-10-10T03:25:10.000Z"
    }
  ]
}
```

### 4.4 Detail peminjaman — `GET /loans/:id`

**Request**
```bash
curl {BASE_URL}/loans/3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b
```

**Response `200 OK`**
```json
{
  "success": true,
  "data": {
    "id": "3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b",
    "nama_anggota": "Budi Santoso",
    "judul_buku": "Laskar Pelangi",
    "tanggal_pinjam": "2026-10-01",
    "tanggal_jatuh_tempo": "2026-10-15",
    "tanggal_kembali": null,
    "status": "Dipinjam",
    "created_at": "2026-10-10T03:21:45.123Z",
    "updated_at": "2026-10-10T03:21:45.123Z"
  }
}
```

### 4.5 Ubah data (mengembalikan buku) — `PATCH /loans/:id`

**Request**
```bash
curl -X PATCH {BASE_URL}/loans/3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b \
  -H "Content-Type: application/json" \
  -d '{ "status": "Dikembalikan" }'
```

**Response `200 OK`** (`tanggal_kembali` terisi otomatis)
```json
{
  "success": true,
  "message": "Data peminjaman berhasil diperbarui",
  "data": {
    "id": "3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b",
    "nama_anggota": "Budi Santoso",
    "judul_buku": "Laskar Pelangi",
    "tanggal_pinjam": "2026-10-01",
    "tanggal_jatuh_tempo": "2026-10-15",
    "tanggal_kembali": "2026-10-10",
    "status": "Dikembalikan",
    "created_at": "2026-10-10T03:21:45.123Z",
    "updated_at": "2026-10-10T03:30:00.000Z"
  }
}
```

### 4.6 Hapus peminjaman — `DELETE /loans/:id`

**Request**
```bash
curl -X DELETE {BASE_URL}/loans/3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b
```

**Response `200 OK`**
```json
{
  "success": true,
  "message": "Data peminjaman berhasil dihapus",
  "data": { "id": "3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b", "...": "..." }
}
```

### 4.7 Contoh response error

**`400 Bad Request`** — validasi gagal
```json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": [
    "nama_anggota wajib diisi",
    "judul_buku wajib diisi",
    "tanggal_jatuh_tempo wajib diisi"
  ]
}
```

**`400 Bad Request`** — filter tidak valid (`GET /loans?status=Salah`)
```json
{
  "success": false,
  "message": "status harus salah satu dari: Dipinjam, Dikembalikan, Terlambat"
}
```

**`404 Not Found`**
```json
{ "success": false, "message": "Data peminjaman tidak ditemukan" }
```

| Kode | Arti |
|---|---|
| 200 | Berhasil |
| 201 | Data berhasil dibuat |
| 400 | Input / parameter tidak valid |
| 404 | Data atau route tidak ditemukan |
| 500 | Kesalahan server |

---

## 5. Panduan Instalasi & Menjalankan Lokal

**Prasyarat:** Node.js 18+ dan akun [Supabase](https://supabase.com).

1. **Clone repository**
   ```bash
   git clone https://github.com/USERNAME/NAMA-REPO.git
   cd NAMA-REPO
   ```
2. **Install dependency**
   ```bash
   npm install
   ```
3. **Siapkan database Supabase**
   - Buat project baru di Supabase.
   - Buka **SQL Editor**, lalu jalankan seluruh isi `supabase/schema.sql`.
4. **Atur environment variable**
   ```bash
   cp .env.example .env
   ```
   Isi `.env` (ambil dari *Project Settings → API*):
   ```env
   SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   SUPABASE_KEY=<service_role key>
   PORT=3000
   ```
5. **Jalankan server**
   ```bash
   npm run dev     # mode development (nodemon)
   # atau
   npm start
   ```
6. **Uji API** di `http://localhost:3000/loans` (Postman / curl / browser).

---

## 6. Deployment ke Vercel

1. Push project ke repository GitHub (file `.env` tidak ikut karena sudah di `.gitignore`).
2. Di [vercel.com](https://vercel.com): **Add New → Project** → import repository.
3. Pada **Environment Variables**, tambahkan `SUPABASE_URL` dan `SUPABASE_KEY`.
4. Klik **Deploy**.
5. Salin URL hasil deploy, lalu tempel pada bagian **Base URL** di atas.

Konfigurasi `vercel.json` mengarahkan seluruh request ke `api/index.js`, sehingga semua endpoint (`/loans`, `/loans/:id`) berjalan sebagai serverless function.

---

## 7. Link Hasil Deployment

| | |
|---|---|
| **Base URL** | `https://GANTI-DENGAN-LINK-VERCEL-ANDA.vercel.app` |
| **Contoh endpoint** | `https://GANTI-DENGAN-LINK-VERCEL-ANDA.vercel.app/loans` |
| **Filter contoh** | `https://GANTI-DENGAN-LINK-VERCEL-ANDA.vercel.app/loans?status=Terlambat` |

---

## Lisensi
ISC

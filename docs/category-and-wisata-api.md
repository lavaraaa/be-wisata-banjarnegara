# Category Admin API and Tourism Category Changes

Last updated: February 13, 2026

## Overview

This document covers:

1. New admin category CRUD endpoints under `/api/admin/kategori`.
2. Category-related behavior changes in tourism endpoints (`/api/wisata`).

## Base URL

All paths below are relative to your backend base URL, for example:

`https://your-domain.com/api`

## Authentication

All category admin endpoints require:

- Header: `Authorization: Bearer <JWT_TOKEN>`
- JWT user role must be `admin`

If the role is not admin, the API returns:

```json
{
  "message": "Hanya admin yang dapat mengakses data kategori."
}
```

Status: `403`

## Endpoints: Admin Category (`/api/admin/kategori`)

### 1) Create Category

- Method: `POST`
- Path: `/api/admin/kategori`
- Auth: Required (admin)
- Content-Type: `application/json`

Request body:

```json
{
  "nama": "Wisata Alam"
}
```

Success response:

- Status: `201`

```json
{
  "message": "Kategori berhasil ditambahkan.",
  "data": {
    "id": 12,
    "nama": "Wisata Alam"
  }
}
```

Possible errors:

- `400`

```json
{
  "message": "Nama kategori wajib diisi."
}
```

- `409`

```json
{
  "message": "Kategori sudah ada."
}
```

- `500`

```json
{
  "message": "Gagal menambah kategori",
  "error": "..."
}
```

### 2) Get All Categories

- Method: `GET`
- Path: `/api/admin/kategori`
- Auth: Required (admin)

Success response:

- Status: `200`

```json
[
  {
    "id": 1,
    "nama": "Wisata Alam",
    "created_at": "2026-02-13T10:00:00.000Z"
  },
  {
    "id": 2,
    "nama": "Desa Wisata",
    "created_at": "2026-02-13T10:02:00.000Z"
  }
]
```

Possible errors:

- `500`

```json
{
  "message": "Gagal mengambil data kategori",
  "error": "..."
}
```

### 3) Update Category

- Method: `PUT`
- Path: `/api/admin/kategori/:id`
- Auth: Required (admin)
- Content-Type: `application/json`

Path params:

- `id` (integer, must be `> 0`)

Request body:

```json
{
  "nama": "Wisata Alam & Curug"
}
```

Success response:

- Status: `200`

```json
{
  "message": "Kategori berhasil diubah.",
  "data": {
    "id": 1,
    "nama": "Wisata Alam & Curug"
  }
}
```

Possible errors:

- `400`

```json
{
  "message": "ID kategori tidak valid."
}
```

or

```json
{
  "message": "Nama kategori wajib diisi."
}
```

- `404`

```json
{
  "message": "Kategori tidak ditemukan."
}
```

- `409`

```json
{
  "message": "Nama kategori sudah digunakan."
}
```

- `500`

```json
{
  "message": "Gagal mengubah kategori",
  "error": "..."
}
```

### 4) Delete Category

- Method: `DELETE`
- Path: `/api/admin/kategori/:id`
- Auth: Required (admin)

Path params:

- `id` (integer, must be `> 0`)

Success response:

- Status: `200`

```json
{
  "message": "Kategori berhasil dihapus."
}
```

Possible errors:

- `400`

```json
{
  "message": "ID kategori tidak valid."
}
```

- `404`

```json
{
  "message": "Kategori tidak ditemukan."
}
```

- `409` (category is still linked to tourism data)

```json
{
  "message": "Kategori masih digunakan oleh data wisata dan tidak dapat dihapus."
}
```

- `500`

```json
{
  "message": "Gagal menghapus kategori",
  "error": "..."
}
```

## Tourism Endpoint Changes (`/api/wisata`)

### A) POST `/api/wisata` (Create Tourism)

No route-level auth is currently enforced in `routes/wisataRoutes.js`.

Content type: `multipart/form-data`

Relevant category-related input:

- `kategori`: JSON string array of category names
  - Example: `["Wisata Alam","Desa Wisata"]`

Validation behavior:

- If one or more categories do not exist in `kategori_wisata`, request fails with `400`.

Error response:

```json
{
  "message": "Kategori tidak ditemukan. Tambahkan kategori terlebih dahulu lewat endpoint admin.",
  "missing_kategori": ["Kategori X"]
}
```

Success response:

- Status: `200`

```json
{
  "message": "Wisata berhasil ditambahkan"
}
```

### B) PUT `/api/wisata/:id` (Update Tourism)

No route-level auth is currently enforced in `routes/wisataRoutes.js`.

Content type: `multipart/form-data`

Relevant category-related input:

- `kategori`: JSON string array of category names

Validation behavior:

- Same category validation as create endpoint.

Error response:

```json
{
  "message": "Kategori tidak ditemukan. Tambahkan kategori terlebih dahulu lewat endpoint admin.",
  "missing_kategori": ["Kategori X"]
}
```

Success response:

- Status: `200`

```json
{
  "message": "Berhasil update wisata"
}
```

### C) GET `/api/wisata` and GET `/api/wisata/:id`

Response compatibility:

- Field `kategori` is returned as a string array.
- Backend now reads category names from relational tables (`wisata_kategori` + `kategori_wisata`).
- If relation data is not available for a row, backend falls back to legacy `wisata.kategori` data.

Example snippet from response item:

```json
{
  "id": 17,
  "judul": "Seakong Agro Eduwisata",
  "kategori": ["Wisata Rekreasi", "Waduk", "Wisata Edukasi"]
}
```

## Recommended Usage Flow

1. Create category master data with `POST /api/admin/kategori`.
2. Use those category names in `POST /api/wisata` or `PUT /api/wisata/:id`.
3. If category does not exist, create it first via admin endpoint.
4. Delete category only when it is not used by any tourism data.

## Notes

- Category field name remains `kategori` in request and response for backward compatibility.
- Internal storage has been normalized into:
  - `kategori_wisata` (category master)
  - `wisata_kategori` (many-to-many relation)

## Frontend Migration Checklist

Use this checklist to update frontend behavior safely.

### 1) Category master must exist before tourism submit

- Integrate admin category management using:
  - `POST /api/admin/kategori`
  - `GET /api/admin/kategori`
  - `PUT /api/admin/kategori/:id`
  - `DELETE /api/admin/kategori/:id`
- In admin tourism forms, load options from `GET /api/admin/kategori` instead of free-text category input.

### 2) Send correct category payload format for tourism create/update

- For `POST /api/wisata` and `PUT /api/wisata/:id` (multipart form), send:
  - `kategori` as JSON string array
  - Example value: `["Wisata Alam","Desa Wisata"]`
- Do not send plain text category labels outside JSON array format.

### 3) Handle category validation errors on submit

- If API returns `400` with:

```json
{
  "message": "Kategori tidak ditemukan. Tambahkan kategori terlebih dahulu lewat endpoint admin.",
  "missing_kategori": ["..."]
}
```

- Show a user-friendly warning in UI.
- Guide admin to create missing categories first.
- Retry submit after category master data is updated.

### 4) Make response parsing robust for `kategori`

- Current API returns `kategori` as `string[]` in:
  - `GET /api/wisata`
  - `GET /api/wisata/:id`
- If legacy frontend code still does `JSON.parse(item.kategori)`, update it to:
  - Use value directly when it is already an array.
  - Fallback parse only when value is still a string (defensive compatibility).

### 5) Keep delete category UX consistent with API constraints

- Deleting a category that is still used by tourism data returns `409`.
- In UI, show a clear message that the category is still linked and cannot be deleted yet.

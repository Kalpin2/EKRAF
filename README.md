# NexusEsports OS

> **Esports Player & Coaching Management System** — *Tactical Command Center*
>
> Monorepo full-stack: **MySQL 8 · NestJS · React 18 + Vite · Prisma · pnpm + Turborepo**

Sistem terpadu untuk manajemen operasional tim esports: roster, jadwal & absensi, scrim tracker,
playbook taktis dengan proteksi anti-leak, analitik performa, kontrak & brankas dokumen terenkripsi,
kalkulator prize pool, wellness log, dan pipeline rekrutmen.

---

## 1. Struktur Proyek

```
.
├── apps/
│   ├── api/                 NestJS REST API (modular monolith, JWT + RBAC, AES-256-GCM)
│   └── web/                 React 18 + Vite SPA (Tailwind, Zustand, TanStack Query, Recharts, PWA)
├── packages/
│   ├── db/                  Prisma schema (MySQL), migrasi, seed data demo
│   └── shared/              Role/permission matrix, design tokens, helper prize pool
├── infra/
│   ├── docker-compose.yml   MySQL 8 + Redis
│   ├── Dockerfile.web       Build web → nginx (SPA fallback)
│   └── nginx.conf
├── vercel.json              Deploy Vercel (rewrite SPA)
└── .env.example             Template environment variables
```

## 2. Menjalankan (Papan Atas → Bawah)

### Prasyarat
- Node.js ≥ 20, pnpm 9 (via `corepack enable`), Docker Desktop

### Langkah

```bash
# 1. Aktifkan pnpm (jika belum)
corepack enable
corepack prepare pnpm@9.15.0 --activate

# 2. Install dependensi
pnpm install

# 3. Nyalakan MySQL + Redis
pnpm infra:up

# 4. Generate Prisma client + push schema + seed data dummy
pnpm db:generate
pnpm db:push
pnpm db:seed

# 5. Jalankan API dan Web bersamaan
pnpm dev
```

Buka:
- **Web** → http://localhost:5173
- **API** → http://localhost:4000/api

> **Standalone demo (disarankan untuk deploy):** jalankan cukup `pnpm --filter @nexus/web dev`.
> Web **tidak pernah** menghubungi API/DB — semua data berasal dari rich mock dataset lokal
> (`src/lib/mock.ts`) dengan state interaktif persisten di localStorage (`src/lib/demoStore.ts`).
> Tidak ada request ke `localhost:4000`, tidak ada error CORS saat backend mati.

## 3. Login Demo (satu halaman, auto-routing per role)

Halaman login **satu** untuk semua role tier. Form **terisi otomatis dari `.env`** dengan
kredensial Player, jadi tinggal klik **Login**. Tombol quick-switch **"Isi Akun Player"** dan
**"Isi Akun Admin/Manager"** mengganti isi field dari env masing-masing tier.

| Tier | Kredensial `.env` | Redirect |
| :--- | :--- | :--- |
| Player | `VITE_PLAYER_USERNAME` / `VITE_PLAYER_PASSWORD` | `/player/dashboard` |
| Admin / Manager | `VITE_ADMIN_USERNAME` / `VITE_ADMIN_PASSWORD` | `/dashboard` |

Konfigurasi `apps/web/.env` (lihat `apps/web/.env.example`):

```env
VITE_ADMIN_USERNAME=admin@nexus.gg
VITE_ADMIN_PASSWORD=nexus123
VITE_PLAYER_USERNAME=player@nexus.gg
VITE_PLAYER_PASSWORD=nexus123
VITE_DEMO_MODE=true
```

Role-tier guard: `PLAYER` tidak bisa membuka `/dashboard`, `/contracts`, `/finance`,
`/recruitment`, `/audit-logs` (dialihkan ke `/player/dashboard`); sidebar otomatis menyesuaikan.
Kredensial ini untuk demo UI, bukan rahasia produksi — `VITE_*` terekspos ke browser.

### Akun demo bawaan

Password untuk semua akun: **`nexus123`** (dapat diubah lewat `DEMO_PASSWORD` di `.env`)

| Peran | Email |
| :--- | :--- |
| Org Admin | `admin@nexus.gg` |
| Head Coach | `coach@nexus.gg` |
| Team Manager | `manager@nexus.gg` |
| Analyst | `analyst@nexus.gg` |
| Finance | `finance@nexus.gg` |
| Player | `player@nexus.gg` |

## 4. Modul & Fitur

| Modul | Fitur Utama |
| :--- | :--- |
| Dashboard | Role-adaptive workspace, ringkasan KPI, jadwal, kontrak, patch timeline |
| Roster | Profil pemain, IGN, role, agent pool, status Starting/Sub/Bench/Trial |
| Jadwal & Absensi | Kalender terpusat, pencatatan keterlambatan, pengingat H-1/H-15 |
| Scrim & Match | Input cepat skor + statistik pemain, VOD notes ber-timestamp, action items |
| Playbook Taktis | Kanvas minimap, marker rotasi/utility, **dynamic watermark**, blokir copy/print, auto-blur saat tab tidak fokus, read receipts & nudge |
| Analitik | Grafik tren ACS/scorecard lintas patch, readiness ≥95%, rekap kehadiran |
| Kontrak & Finance | Status kontrak, reminder H-90/60/30/14, brankas AES-256-GCM, kalkulator prize pool |
| Rekrutmen | Kanban 7 tahap scouting → offer, penilaian trial |
| Wellness | Daily check-in < 30 detik, riwayat kondisi tim |
| Opponent Scouting | Agregasi kecenderungan lawan dari riwayat pertandingan |
| Audit Log | Catatan permanen akses playbook, dokumen legal, perubahan hak akses |
| Mode Matchday | Satu toggle menyembunyikan menu administratif, fokus taktis |

### 4a. Player Workspace (Role-Adaptive, US-07)

Login sebagai `player@nexus.gg` / `nexus123` otomatis masuk ke workspace khusus Player:

| Rute | Isi |
| :--- | :--- |
| `/player/dashboard` | *Today's Command Center* — jadwal hari ini + countdown H-15 dan konversi zona waktu, playbook belum dibaca, action item dengan checkbox status, quick wellness check-in |
| `/player/playbooks` | Filter Map & Scenario, indikator status baca, Mode Matchday dari cache IndexedDB |
| `/player/playbooks/:id` | Viewer taktis read-only — watermark `[IGN]-[USER_ID]-[IP]-[TIMESTAMP]`, blokir context-menu/copy/print, auto-blur saat jendela tidak fokus, pelacakan durasi baca, tombol konfirmasi |
| `/player/performance` | Statistik per mode (Ranked/Scrim/Official) dengan font mono tabular, tren + penanda patch, scorecard coach, VOD notes `MM:SS`, dan transisi status action item |
| `/player/wellness` | Check-in 1–10 (tidur, burnout, fisik, mental) + grafik 14 hari |
| `/player/schedule` | Kalender harian/mingguan divisi, rekap kehadiran, skor disiplin |
| `/player/profile` | Status roster & kontrak **read-only** (tanpa gaji/buyout), biodata non-sensitif, agent pool, dan device binding |

Endpoint pendukung: `/api/player/*` (18 endpoint) — semuanya di-scope ke `userId` + `divisionId` + `orgId`.
Role PLAYER ditolak dari endpoint workspace/admin oleh `PermissionsGuard` via metadata `@PlayerRestricted()`,
dan routing web mengalihkan PLAYER dari `/dashboard` ke `/player/dashboard` (dan sebaliknya).

> **Template `next-shadcn-dashboard-starter` dipakai sebagai referensi:** pattern layout (sidebar grup collapsible
> + icon rail 3rem, header h-14 dengan breadcrumbs, `PageContainer` header, kartu `rounded-lg`),
> sistem **warna semantic token berformat OKLCH** (`--background`, `--card`, `--primary`, `--sidebar-*`, `--chart-1..5`)
> yang dipetakan ke Tailwind lewat `<alpha-value>`, **font** (CSS variable `--font-sans/--font-display/--font-mono`,
> Geist sebagai fallback), serta **cara penulisan** (utility `cn()` dari `clsx` + `tailwind-merge`,
> heading `text-2xl font-semibold tracking-tight text-balance`, deskripsi `text-pretty`, tombol ringkas).
> Arah visual mengikuti palet **Warm High-Craft Tactical** baru di SPEC §1.1 (dark & light) — stack tidak diganti ke Next.js.

## 4b. Audit & hardening tambahan

- **Isolasi tenant:** seluruh query analytics/playbook/match/attendance memfilter `orgId` + `divisionId` (diuji oleh `isolation.spec.ts`).
- **Device binding:** login menerima header `X-Device-Id`; akses playbook hanya dari perangkat yang pernah terdaftar untuk user tersebut.
- **Reminder kontrak:** `packages/workers` (BullMQ + Redis) menjadwalkan notifikasi H-90/H-60/H-30/H-14 dan scan harian pukul 00:00 Asia/Jakarta. Jalankan dengan `pnpm workers:dev`.
- **Ekspor laporan:** CSV dari API (`/api/export/attendance.csv`, `/api/export/performance.csv`) dan ekspor CSV/PDF sisi web (Recharts/performance + prize pool).
- **Offline matchday:** playbook bertanda *Matchday Ready* disimpan ke IndexedDB (`nexus-offline`) dan otomatis dipakai saat koneksi putus.
- **Zona waktu:** jadwal bisa ditampilkan dalam timezone lain (Asia/Jakarta, Singapore, UTC, dll).
- **Anti-leak:** watermark `[IGN] - [USER_ID] - [IP] - [TIMESTAMP]`, blokir context menu/copy/print, auto-blur saat `window.onblur`, audit log setiap pembukaan.
- **Test:** `pnpm --filter @nexus/api test` (RBAC, isolasi divisi, AES-GCM, prize pool) dan `pnpm --filter @nexus/web test` (domain helpers).

# 5. Keputusan Teknis (Disetujui)

| Keputusan | Nilai |
| :--- | :--- |
| Database | MySQL 8 (Prisma `provider = "mysql"`, UUID sebagai `CHAR(36)`, `Json` untuk canvas/scorecard) |
| Backend | NestJS modular monolith — REST API + Swagger-ready, Passport JWT |
| Frontend | React 18 + Vite SPA — React Router, PWA (`vite-plugin-pwa`) |
| Auth | Access token 15 menit (memory), refresh token 7 hari (httpOnly cookie) |
| RBAC | Matriks permission global + isolasi `orgId` / `divisionId` di semua query |
| Enkripsi | AES-256-GCM untuk dokumen legal & nilai kontrak |
| Timeline acuan | 18 minggu / 9 sprint / 3 fase (PRD + SPEC) |

## 6. Script

```bash
pnpm dev            # API + web concurrently
pnpm build          # Build semua paket
pnpm db:generate    # Prisma generate
pnpm db:push        # Sync schema ke MySQL
pnpm db:seed        # Isi data demo
pnpm db:studio      # Prisma Studio
pnpm infra:up       # MySQL + Redis via Docker
pnpm infra:down
pnpm workers:dev    # BullMQ contract reminder worker (butuh Redis)
pnpm test           # seluruh test suite workspace
```

## 7. Catatan Implementasi

- Semua endpoint API ber-prefix `/api` dan dilindungi JWT kecuali `/api/auth/login|register|refresh`.
- Permission dicek dua lapis: dekorator `@RequirePermissions` di API dan filter navigasi di UI.
- Nilai gaji/buyout hanya bisa dibuka oleh `ORG_ADMIN` dan `FINANCE`; `TEAM_MANAGER` melihat dokumen legal tanpa nominal.
- Playbook viewer memblokir context menu, `Ctrl+C/P/S/U/A`, `PrintScreen`, dan memburamkan layar saat jendela kehilangan fokus. Setiap pembukaan menulis `audit_logs` berisi IGN, user ID, IP, dan device fingerprint.
- Prize pool dihitung: `net = gross × (1 − pajak)`, lalu dibagi persentase pemain/staf/organisasi.

## 8. Deploy

**Deploy web saja sudah cukup** untuk demo: tidak perlu MySQL, Redis, atau NestJS. Image Docker
`infra/Dockerfile.web`, `vercel.json`, dan `_redirects` hanya menyajikan `apps/web/dist`.

SPA memakai client-side routing (`/player/*`, `/dashboard/*`), jadi server harus mengembalikan
`index.html` untuk rute non-aset.

**Vercel** — `vercel.json` sudah berisi `rewrites` + perintah build monorepo. Set environment
variables `VITE_*` di dashboard Vercel, lalu deploy root repository.

**Netlify / Cloudflare Pages** — `apps/web/public/_redirects` berisi `/* /index.html 200`.
Build command: `pnpm --filter @nexus/web build`, publish directory: `apps/web/dist`.

**Docker / VM** — bangun image web saja:

```bash
docker build -f infra/Dockerfile.web -t nexus-web .
docker run -p 8080:80 \
  -e VITE_API_URL=https://api.domain.com/api \
  nexus-web
```

> `VITE_*` di-inline saat build. Untuk mengubah API URL di Docker, berikan `--build-arg`
> atau rebuild dengan env yang sesuai. Untuk produksi penuh, jalankan juga API (NestJS) + MySQL + Redis
> dan arahkan `VITE_API_URL` ke endpoint API tersebut.

## 9. Migrasi UI dari template

Primitive `next-shadcn-dashboard-starter` sudah **di-port nyata** ke `apps/web`
(`src/components/ui/primitives.tsx`): `Button`, `Badge`, `Card` (+ sub-komponen), `Input`,
`Separator`, `Skeleton`, `Heading`, `PageContainer`, tabel, dan breadcrumb — memakai CVA
(`class-variance-authority`) seperti template, dengan Base UI diganti elemen HTML native agar
kompatibel dengan React 18 + Tailwind v3. Layout, token OKLCH, font, dan konvensi penulisan
mengikuti template; palet utama adalah **Warm High-Craft Tactical** (Charcoal Espresso & Terracotta / Alabaster Paper & Clay) dengan Theme Switcher Dark/Light. Stack tidak diganti ke Next.js.

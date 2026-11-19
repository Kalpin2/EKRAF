# Technical & UX Specification (`SPEC.md`)
## NexusEsports OS — Esports Player & Coaching Management System

| Metadata Spesifikasi | Keterangan |
| :--- | :--- |
| **Referensi Dokumen** | `PRD_Esports_Management_System.md` (v1.0) |
| **Versi SPEC** | 1.0 |
| **Target Stack** | Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL, Redis, AWS S3 |
| **Fokus Dokumen** | Arsitektur Teknis, Desain Sistem & UX, Keamanan Anti-Leak, & Rencana Iterasi |

---

## 1. Identitas Visual & Pengalaman Pengguna (UI/UX Design System)

Desain antarmuka **NexusEsports OS** dirancang dengan pendekatan **"Tactical Command Center"**—mengutamakan kejelasan data tingkat tinggi (*high-density data readability*), minim kelelahan mata saat sesi *bootcamp* panjang (*dark-mode first*), serta navigasi cepat di bawah tekanan hari turnamen (*matchday*).

### 1.1 Identitas Visual & Palet Warna (*Color Tokens*)
Arah visual **Sage Olive & Warm Clay**: **Deep Moss Charcoal & Muted Sage** (dark, default) dan **Natural Off-White & Deep Forest Sage** (light). Keduanya diimplementasikan sebagai CSS Variables (`--bg-canvas`, `--bg-surface`, `--bg-elevated`, `--border-subtle`, `--text-primary`, `--text-secondary`, `--accent-primary`, `--accent-secondary`, `--semantic-win`, `--semantic-loss`, `--semantic-warn`) dengan Theme Switcher persisten di `localStorage`. Mengikuti pedoman anti-slop Hermes: **tanpa** gradien ungu/cyan, glassmorphism, atau glow berlebihan — layouts asimetris, tipografi ketat, tekstur noise halus, hairline border 1px.

**Dark Mode — Deep Moss Charcoal & Muted Sage (default):**

| Token CSS | Nama Warna | HEX | Penggunaan |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | *Deep Moss Charcoal* | `#141614` | Latar aplikasi |
| `--bg-surface` | *Moss Slate* | `#1C1F1C` | Card, sidebar, panel |
| `--bg-elevated` | *Raised Moss* | `#252925` | Modal, dropdown, hover |
| `--border-subtle` | *Faint Olive Line* | `#2F342F` | Hairline divider 1px |
| `--accent-primary` | *Muted Sage* | `#6B8E78` | CTA & indikator aktif (teks `#F4F5F4`, hover `#5B7A67`) |
| `--accent-secondary` | *Warm Clay* | `#B8A48A` | Highlight taktis, badge divisi, link |
| `--text-primary` | *Soft Alabaster* | `#F2F3F0` | Judul, angka kunci |
| `--text-secondary` | *Stone Sage* | `#9CA19B` | Metadata, timestamp |
| `--semantic-win` | *Calm Green* | `#558B6E` | Menang, siap, aktif |
| `--semantic-loss` | *Muted Clay Red* | `#B85D58` | Kalah, expired, burnout |
| `--semantic-warn` | *Soft Ochre* | `#C4934B` | H-30, bench, belum dibaca |

**Light Mode — Natural Off-White & Deep Forest Sage:**

| Token CSS | Nama Warna | HEX | Penggunaan |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | *Natural Off-White* | `#F5F5F2` | Latar aplikasi |
| `--bg-surface` | *Pale Sage Paper* | `#EAECE7` | Card, sidebar, panel |
| `--bg-elevated` | *Crisp White* | `#FFFFFF` | Modal, dropdown, hover |
| `--border-subtle` | *Sand Olive Line* | `#D8DBD3` | Hairline divider 1px |
| `--accent-primary` | *Deep Forest Sage* | `#4A6B56` | CTA & aktif (teks `#FFFFFF`, hover `#3D5947`) |
| `--accent-secondary` | *Warm Clay Ink* | `#7D6B56` | Highlight taktis, badge divisi, link |
| `--text-primary` | *Charcoal Ink* | `#1C1F1C` | Judul, angka kunci |
| `--text-secondary` | *Umber Sage* | `#626861` | Metadata, timestamp |
| `--semantic-win` | *Deep Forest* | `#3B7356` | Menang, siap, aktif |
| `--semantic-loss` | *Clay Red* | `#A34843` | Kalah, expired, burnout |
| `--semantic-warn` | *Warm Ochre* | `#A6762E` | H-30, bench, belum dibaca |

*Dynamic watermark* menyesuaikan kontras: dark `rgba(242, 243, 240, 0.14)`, light `rgba(28, 31, 28, 0.12)`.

### 1.2 Tipografi (*Typography Scale*)
* **Primary UI Font (`Plus Jakarta Sans`):** navigasi, formulir, dan teks panjang (fallback `Inter`).
* **Display / Heading Font (`Space Grotesk`):** judul modul, skor pertandingan, dan *header* kartu — tajam dan kompetitif.
* **Monospace Font (`JetBrains Mono`):** **Wajib** untuk seluruh angka statistik (K/D/A, ACS, persentase kemenangan), *timestamp* VOD, ID pemain, timer, dan *dynamic watermark* dengan `tabular-nums`.

### 1.3 Prinsip Pengalaman Pengguna (*UX Principles*)
1. **3-Click Rule untuk Aksi Harian:** Pengguna harus dapat mencatat hasil *scrim*, mengecek jadwal latihan, atau membuka *playbook* map dalam maksimal 3 kali klik dari *dashboard* utama.
2. **Role-Adaptive Workspace:**
   * **Player View:** Fokus pada *Today's Schedule*, *Unread Playbooks* (dengan tombol konfirmasi baca), *Daily Wellness Check-in*, dan *Assigned VOD Action Items*.
   * **Coach/Analyst View:** Fokus pada *Scrim Performance Trends*, *Drafting/Playbook Builder*, *Opponent Scouting*, dan *Roster Readiness Matrix*.
   * **Manager/Admin View:** Fokus pada *Attendance Tracker*, *Contract Expiration Alerts*, *Roster Pipeline*, dan *Prize Pool Calculator*.
3. **Zero-Distraction Matchday Mode:** Satu tombol *toggle* untuk menyembunyikan menu administratif dan hanya menampilkan *Playbook Map*, *Drafting Notes*, dan *Opponent Tendencies* dengan waktu muat instan (< 200ms).

---

## 2. Spesifikasi Arsitektur & Teknis Sistem

### 2.1 Arsitektur Aplikasi (*High-Level Architecture*)
* **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Zustand (state management), TanStack Query (caching & optimistic UI), HTML5 Canvas / Konva.js (untuk *Tactical Map Playbook Builder*).
* **Backend API:** Node.js (NestJS atau Next.js API Routes) dengan arsitektur *Modular Monolith* untuk kecepatan iterasi awal namun mudah dipecah menjadi *microservices*.
* **Database Utama:** PostgreSQL (menyimpan data relasional: *Users, Organizations, Divisions, Matches, Contracts, Audit Logs*).
* **Caching & Real-time:** Redis (untuk *session management*, *rate limiting*, dan *caching* data statistik agregat).
* **Penyimpanan File:** AWS S3 / Cloudflare R2 dengan *Server-Side Encryption (SSE-KMS)* untuk dokumen legal pemain dan aset gambar taktis.

### 2.2 Skema Model Data Inti (*Core Entity Relationship*)
Berikut adalah struktur tabel utama dalam PostgreSQL:

* `organizations`: `id`, `name`, `slug`, `subscription_tier`, `created_at`
* `divisions`: `id`, `org_id`, `game_title` (e.g., Valorant, MLBB, CS2, Dota 2), `region`
* `users`: `id`, `org_id`, `email`, `password_hash`, `full_name`, `ign` (In-Game Name), `global_role`
* `division_members`: `id`, `user_id`, `division_id`, `division_role` (`HEAD_COACH`, `ANALYST`, `MANAGER`, `PLAYER`), `roster_status` (`STARTING`, `SUBSTITUTE`, `BENCH`, `TRIAL`), `primary_role`
* `matches`: `id`, `division_id`, `match_type` (`SCRIM`, `OFFICIAL`, `RANKED`), `opponent_name`, `map_name`, `patch_version`, `score_us`, `score_them`, `result` (`WIN`, `LOSS`, `DRAW`), `vod_url`, `played_at`
* `player_match_stats`: `id`, `match_id`, `user_id`, `character_played`, `kills`, `deaths`, `assists`, `acs_or_rating`, `coach_scorecard_json`
* `playbooks`: `id`, `division_id`, `map_name`, `scenario_type` (`ATTACK`, `DEFENSE`, `PISTOL`, `ECO`), `title`, `canvas_data_json`, `version`, `is_archived`
* `playbook_read_receipts`: `id`, `playbook_id`, `user_id`, `read_duration_seconds`, `acknowledged_at`
* `contracts`: `id`, `user_id`, `status` (`ACTIVE`, `TRIAL`, `EXPIRED`), `start_date`, `end_date`, `base_salary_encrypted`, `buyout_clause_encrypted`, `prize_pool_percentage`, `document_s3_key`
* `audit_logs`: `id`, `org_id`, `actor_user_id`, `action_type`, `target_resource`, `ip_address`, `device_fingerprint`, `created_at`

### 2.3 Spesifikasi Keamanan & Proteksi Anti-Leak
1. **Role-Based Access Control (RBAC) Multi-Divisi:**
   * Isolasi ketat berbasis `division_id`. Pelatih divisi *Valorant* tidak dapat melihat *playbook* atau statistik divisi *Mobile Legends* kecuali memiliki izin eksplisit dari `ORG_ADMIN`.
2. **Proteksi Dokumen Strategi (*Playbook Anti-Leak*):**
   * **Dynamic Canvas Watermarking:** Lapisan `<canvas>` transparan (*pointer-events: none*) yang merender teks berulang diagonal berisi `[IGN] - [USER_ID] - [IP_ADDRESS] - [YYYY-MM-DD HH:mm:ss]` di atas seluruh area strategi.
   * **Anti-Exfiltration Measures:** Menonaktifkan *context menu* (klik kanan), *text selection* (`user-select: none`), pintasan `Ctrl+C` / `Ctrl+P`, serta mendeteksi kehilangan fokus jendela (*window blur*) untuk memburamkan layar (*auto-blur*) saat tab tidak aktif.
   * **Signed URLs:** Semua aset gambar taktis menggunakan *Pre-signed URL* dengan masa berlaku maksimal 15 menit.
3. **Enkripsi Dokumen Legal & Kontrak:**
   * Dokumen identitas (KTP/Paspor) dan nilai finansial kontrak dienkripsi menggunakan standar **AES-256-GCM** sebelum disimpan ke penyimpanan objek/database. Setiap pembukaan file mencatat entri permanen ke tabel `audit_logs`.

### 2.4 Non-Functional Requirements (NFR)
* **Latensi:** Waktu respons API p95 `< 150ms` untuk pembacaan *playbook* dan statistik; waktu muat halaman awal `< 1.5 detik`.
* **Ketersediaan (*Availability*):** Target *uptime* `99.9%`, terutama pada akhir pekan (*Friday–Sunday*) yang merupakan puncak jadwal turnamen resmi.
* **Skalabilitas:** Mendukung hingga 500 organisasi dengan rata-rata 50 anggota aktif per organisasi secara bersamaan tanpa degradasi performa.

---

## 3. Rencana Iterasi & Baseline Pengembangan

Pengembangan dilakukan secara bertahap menggunakan metodologi **Agile Scrum (sprint 2 mingguan)** untuk memastikan fitur inti dapat segera menggantikan penggunaan Excel dan Notion dalam waktu singkat.

### 3.1 Baseline Operasional (Kondisi Awal / Sprint 0)
Sebelum peluncuran versi pertama, berikut adalah *baseline* metrik dari tim percontohan (*pilot team*) yang saat ini menggunakan alat terpisah:

| Metrik Baseline | Nilai Saat Ini (Alat Terpisah) | Alat Lama yang Digunakan |
| :--- | :--- | :--- |
| **Waktu Input Data Pasca-Scrim** | 50 menit / hari | Google Sheets + Screenshot manual |
| **Waktu Distribusi & Konfirmasi Taktik Baru** | 24–48 jam (tidak terukur pasti) | Notion + Ping di Discord |
| **Tingkat Kepatuhan Pengisian Wellness/Absensi** | ~55% | Google Forms / Chat Discord |
| **Waktu Audit Kontrak & Perhitungan Prize Pool** | 3–4 jam / bulan | Excel Manual |
| **Jumlah Aplikasi Aktif Harian per Staf** | 4 aplikasi (Sheets, Notion, Discord, GCal) | Terfragmentasi |

### 3.2 Roadmap Iterasi Pengembangan (3 Fase Utama)

#### **Fase 1: Core Operations & Scrim Analytics (MVP) — Minggu 1 s.d. 6 (Sprint 1–3)**
*Fokus: Menggantikan Google Sheets & Discord untuk pencatatan pertandingan, jadwal harian, dan manajemen roster dasar.*
* **Sprint 1 (Fondasi & Auth):** Setup arsitektur, autentikasi multi-organisasi, manajemen divisi, dan struktur RBAC dasar.
* **Sprint 2 (Roster & Schedule):** Manajemen profil pemain, status *roster* (*Starting/Bench*), kalender terpusat (*Scrim/Tournament*), dan sistem pencatatan kehadiran/keterlambatan.
* **Sprint 3 (Scrim Tracker & VOD):** Formulir input cepat hasil *scrim*, statistik individu lintas mode, integrasi tautan VOD dengan *timestamped notes*, dan *dashboard* tren performa dasar.
* **Target Exit Criteria Fase 1:** Tim percontohan menghentikan pencatatan hasil *scrim* di Excel dan memindahkan 100% jadwal latihan ke sistem.

#### **Fase 2: Tactical Playbook, Anti-Leak & Deep Performance — Minggu 7 s.d. 12 (Sprint 4–6)**
*Fokus: Menggantikan Notion/Docs dengan sistem taktik aman dan evaluasi pelatih yang objektif.*
* **Sprint 4 (Interactive Playbook Builder):** Pengembangan kanvas *minimap* taktis (*Attack/Defense*, penempatan ikon *utility*, jalur rotasi) dan *Drafting/Pick-Ban Planner*.
* **Sprint 5 (Anti-Leak & Readiness Tracker):** Implementasi *Dynamic Watermarking*, blokir *copy/export*, sistem *read-receipt* pemain, serta *Opponent Scouting Database*.
* **Sprint 6 (Scorecard & Patch Impact):** Modul *Player Performance Scorecard* oleh pelatih, *Daily Wellness Check-in* pemain, dan grafik korelasi performa terhadap rilis *Game Patch*.
* **Target Exit Criteria Fase 2:** 100% dokumen strategi tim bermigrasi dari Notion ke Playbook Builder dengan tingkat keterbacaan pemain $\ge 90\%$ sebelum pertandingan.

#### **Fase 3: Contract Vault, Finance & Recruitment Pipeline — Minggu 13 s.d. 18 (Sprint 7–9)**
*Fokus: Mengamankan aspek legal, finansial organisasi, dan alur rekrutmen pemain akademi/pro.*
* **Sprint 7 (Encrypted Contract Vault):** Penyimpanan dokumen legal terenkripsi AES-256, manajemen siklus kontrak, klausul *buyout/trial*, dan sistem notifikasi otomatis H-90/H-60/H-30.
* **Sprint 8 (Prize Pool & Audit Log):** Kalkulator pembagian *prize pool* turnamen otomatis sesuai persentase kontrak dan tampilan *Security Audit Log* lengkap untuk *Org Admin*.
* **Sprint 9 (Scouting Kanban & Polishing):** Papan *Kanban Pipeline* untuk rekrutmen dan evaluasi *trial* pemain baru, optimasi performa (*Matchday Mode*), dan *User Acceptance Testing (UAT)* penuh.
* **Target Exit Criteria Fase 3:** Seluruh KPI utama pada PRD tercapai (waktu rekap < 15 menit/hari, 0 insiden kebocoran strategi, 0 keterlambatan perpanjangan kontrak).

---

## 4. Kriteria Penerimaan Teknis (*Definition of Done*)
Setiap fitur dalam iterasi dianggap selesai (*Done*) apabila memenuhi syarat berikut:
1. Kode telah melewati *code review* dan *automated unit/integration testing* dengan cakupan minimal 80% pada modul kritis (RBAC, Enkripsi Kontrak, Kalkulator Prize Pool).
2. Antarmuka telah diverifikasi responsif pada resolusi *desktop* standar (`1920x1080` dan `1366x768`) serta tampilan *mobile* untuk pengecekan jadwal dan *wellness check-in* pemain.
3. Tidak ada kebocoran data lintas divisi atau lintas organisasi dalam pengujian keamanan (*penetration/access test*).
4. Dokumentasi API (*OpenAPI/Swagger*) telah diperbarui sesuai dengan *endpoint* terbaru.
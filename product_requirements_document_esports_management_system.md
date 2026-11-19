# Product Requirements Document (PRD)
## Esports Player & Coaching Management System

| Metadata Dokumen | Keterangan |
| :--- | :--- |
| **Nama Produk** | NexusEsports OS (Esports Player & Coaching Management System) |
| **Versi Dokumen** | 1.0 |
| **Status** | Final Draft / Siap Pengembangan |
| **Target Rilis** | Q1 – Q4 (Bertahap dalam 3 Fase) |
| **Penulis** | Product Management Team |

---

## 1. Latar Belakang & Masalah

### 1.1 Konteks Pengguna & Kondisi Saat Ini (*Current Workflow*)
Dalam operasional organisasi esports modern—mulai dari tim semi-pro hingga organisasi *tier-1* multi-divisi—**Head Coach** dan **Manajer Tim** memikul beban operasional yang sangat tinggi. Saat ini, mereka mengandalkan berbagai aplikasi umum yang terpisah-pisah (*fragmented tools*) untuk menjalankan operasional harian tim:
* **Microsoft Excel / Google Sheets:** Digunakan secara manual untuk mencatat hasil *scrim*, statistik individu pemain, rekap kehadiran, hingga masa berlaku kontrak pemain.
* **Notion / Google Docs:** Digunakan untuk menyusun *playbook*, taktik per *map*, dan catatan *scouting* lawan. Dokumen ini sering kali menumpuk, sulit dinavigasi saat hari pertandingan (*matchday*), dan sangat rentan terhadap kebocoran informasi (*leak*).
* **Discord:** Menjadi pusat komunikasi untuk membagikan jadwal latihan harian, mengirim tautan rekaman pertandingan (VOD), serta melakukan evaluasi pasca-pertandingan melalui obrolan teks yang cepat tenggelam.

### 1.2 Akar Permasalahan (*Pain Points*)
1. **Fragmentasi Data Operasional:** Data tersebar di berbagai *platform*. Ketika pelatih ingin mengorelasikan performa pemain di *scrim* dengan tingkat kehadiran atau kondisi kesehatan pemain, mereka harus menggabungkan data dari tiga sumber berbeda secara manual.
2. **Kurangnya Pelacakan Performa yang Objektif:** Evaluasi pemain sering kali masih bersifat subjektif atau ingatan jangka pendek setelah pertandingan. Tidak ada riwayat terpusat mengenai bagaimana performa pemain berubah seiring bergantinya *patch* atau *meta* permainan.
3. **Distribusi Strategi & Playbook yang Tidak Terpusat serta Rawan Bocor:** Tautan Google Docs atau Notion mudah dibagikan ke pihak eksternal tanpa jejak audit. Selain itu, pelatih tidak memiliki visibilitas apakah pemain benar-benar telah membaca dan memahami pembaruan taktik sebelum pertandingan dimulai.
4. **Administrasi Kontrak & Keuangan yang Berisiko:** Pengelolaan tanggal kedaluwarsa kontrak, klausul *buyout*, masa *trial* pemain akademi, serta pembagian *prize pool* turnamen yang masih menggunakan *spreadsheet* manual berisiko tinggi menimbulkan kelalaian administratif dan sengketa finansial.

---

## 2. Tujuan & Success Metrics

Tujuan utama dari sistem ini adalah menghadirkan **satu platform terpadu (*Single Source of Truth*)** yang menyatukan operasional manajerial, analitik performa berbasis data, serta manajemen strategi taktis yang aman bagi organisasi esports.

| Kategori Tujuan | Key Performance Indicator (KPI) | Baseline (Saat Ini) | Target (6 Bulan Pasca-Rilis) | Metode Pengukuran |
| :--- | :--- | :--- | :--- | :--- |
| **Efisiensi Operasional** | Waktu yang dihabiskan Coach/Manajer untuk input & rekap data pasca-*scrim* | ~45–60 menit / hari | **< 15 menit / hari** (reduksi >70%) | *In-app telemetry* durasi input form |
| **Kesiapan Strategi** | Tingkat keterbacaan *playbook* oleh pemain sebelum hari pertandingan (*Strategy Readiness Rate*) | Tidak terukur (~50% estimasi) | **$\ge 95\%$** strategi terbaca H-1 pertandingan | Log *read-receipt* pada modul Playbook |
| **Adopsi Harian (Stickiness)** | *Daily Active Users* (DAU) pada hari latihan dan hari turnamen | N/A (tersebar di 3+ aplikasi) | **$\ge 85\%$** dari total anggota *roster* & staf aktif | *Analytics dashboard* (Login & interaksi harian) |
| **Keamanan & Kepatuhan** | Insiden kebocoran dokumen strategi internal atau keterlambatan perpanjangan kontrak | 1–2 insiden / musim | **0 insiden** kebocoran & **0 keterlambatan** notifikasi kontrak | *Security audit log* & sistem notifikasi otomatis |
| **Akurasi Evaluasi** | Persentase sesi *scrim* & turnamen yang memiliki catatan *VOD Review* dan *Scorecard* lengkap | ~40% | **$\ge 90\%$** dari total pertandingan resmi & *scrim* | Rasio pertandingan terjadwal vs laporan terisi |

---

## 3. Target User / Personas

| Persona | Peran & Tanggung Jawab Utama | Kebutuhan Kunci dalam Sistem | Pain Points Utama |
| :--- | :--- | :--- | :--- |
| **1. Manajer Tim (*Team Manager*)** | Mengatur operasional harian tim, jadwal *scrim* & turnamen, kedisiplinan, logistik perjalanan, serta administrasi dasar pemain. | Kalender terpusat dengan pengingat otomatis, pelacak kehadiran/keterlambatan, akses cepat ke profil & dokumen pemain. | Harus mengingatkan pemain satu per satu di Discord dan merekap absensi secara manual di akhir bulan. |
| **2. Head Coach & Analyst** | Merancang taktik permainan, menyusun *drafting/pick-ban*, menganalisis statistik *scrim*, memimpin *VOD review*, dan mengevaluasi *roster*. | *Playbook builder* interaktif per *map*, grafik tren performa lintas *patch*, *scorecard* evaluasi, dan *opponent scouting*. | Kesulitan melacak apakah pemain sudah mempelajari taktik baru dan repot menarik data statistik dari berbagai sumber. |
| **3. Pro / Academy Player** | Bertanding, mengikuti sesi latihan/*scrim*, mempelajari strategi tim, menjaga kondisi fisik/mental, dan menyelesaikan *action items* evaluasi. | Tampilan jadwal harian yang jelas, akses mudah dan rapi ke *playbook* tim, serta umpan balik terukur dari pelatih. | Ketinggalan pembaruan strategi di grup *chat* yang tenggelam dan tidak tahu metrik spesifik apa yang harus diperbaiki. |
| **4. Org Admin & Finance** | Mengelola kontrak legal pemain, negosiasi *buyout*, penggajian bulanan, pembagian *prize pool*, serta mengatur hak akses (*RBAC*) antar divisi game. | Penyimpanan dokumen legal terenkripsi, pengingat masa kontrak berakhir, kalkulator *prize pool*, dan *audit log* keamanan. | Risiko denda atau kehilangan pemain secara gratis karena lupa tanggal berakhirnya kontrak di Excel. |

---

## 4. Fitur Utama Secara Mendalam

### 4.1 Profil & Statistik Pemain (*Player Profile & Multi-Mode Stats*)
* **Biodata & Identitas Kompetitif:** Informasi lengkap meliputi nama asli, *in-game name* (IGN), *role*/posisi utama & sekunder, *agent/hero pool*, ID akun game, serta ukuran *jersey* dan preferensi perjalanan.
* **Dokumen Legal Terenkripsi:** Brankas digital dengan enkripsi tingkat tinggi untuk menyimpan KTP, Paspor, Visa, NPWP, dan dokumen pendukung lainnya. Hanya dapat diakses oleh peran yang memiliki otorisasi (*Org Admin* dan *Manajer Tim*).
* **Statistik Lintas Mode:** Agregasi dan pemisahan statistik performa berdasarkan jenis pertandingan:
  * *Ranked / Solo Queue* (untuk memantau aktivitas latihan individu).
  * *Scrim* (latihan tertutup melawan tim lain).
  * *Official Tournament* (pertandingan resmi liga/turnamen).
* **Wellness & Condition Log:** Formulir cek singkat harian (*daily check-in* < 30 detik) bagi pemain untuk mencatat kualitas tidur, tingkat kelelahan (*burnout index*), kondisi kesehatan fisik (misal: nyeri pergelangan tangan), dan kesiapan mental sebelum latihan dimulai.

### 4.2 Performa & Analitik Mendalam (*Performance & Deep Analytics*)
* **Pencatatan Hasil Scrim & Match:** Input cepat skor pertandingan, skor per *map*, komposisi tim/lawan, serta metrik kunci (K/D/A, *ACS/Damage per Round*, *Objective Control*, *First Blood Rate*).
* **Player Performance Scorecard:** Matriks penilaian terstruktur yang diisi oleh *Head Coach/Analyst* pasca-*scrim* atau turnamen berdasarkan parameter objektif dan subjektif (Mekanik, Komunikasi, *Map Awareness*, Eksekusi Taktik, dan Mentalitas).
* **Grafik Tren Performa & Dampak Patch Game:** Visualisasi garis waktu (*timeline chart*) yang menandai tanggal rilis pembaruan versi game (*Game Patch*, misal: *Patch 8.04*). Pelatih dapat melihat apakah perubahan *meta* atau *nerf/buff* karakter berdampak positif atau negatif terhadap performa pemain tertentu.
* **Post-Match & Scrim VOD Review:** Modul terintegrasi untuk menempelkan tautan video (YouTube Unlisted / Twitch / Cloud Drive) dengan fitur *timestamped notes* (catatan terikat pada menit/detik tertentu) serta daftar **Action Items** yang ditugaskan langsung ke pemain spesifik beserta tenggat waktunya.

### 4.3 Strategy & Playbook Builder
* **Taktik per Map & Skenario Attack/Defense:** Kanvas taktis berbasis *minimap* resolusi tinggi untuk setiap *map* kompetitif. Pelatih dapat menempatkan ikon pemain, jalur rotasi, titik lempar *utility* (*smoke, flash, molly*), dan memisahkan skenario berdasarkan fase (*Pistol Round, Eco, Force Buy, Full Buy*, serta *Attack vs. Defense*).
* **Drafting & Pick/Ban Planner:** Simulator fase *veto map* dan *pick/ban hero/agent* untuk mempersiapkan skenario melawan tim lawan tertentu, lengkap dengan rekomendasi *counter-pick* berdasarkan statistik tim.
* **Opponent Scouting Database:** Profil tim lawan yang berisi kecenderungan pemilihan *map*, pola serangan favorit di ronde krusial, kebiasaan pemain bintang lawan, serta tautan VOD pertandingan terakhir mereka.
* **Strategy Readiness Tracker:** Fitur pelacakan wajib (*acknowledgment system*) yang mencatat kapan dan berapa lama setiap pemain membuka serta membaca dokumen strategi baru. Pelatih dapat melihat status *"Belum Dibaca"*, *"Sedang Dipelajari"*, atau *"Siap Dieksekusi"*.
* **Proteksi Anti-Leak:**
  * *Dynamic Watermarking:* Menampilkan nama lengkap, IGN, ID pengguna, dan *timestamp* secara transparan di atas layar (*overlay*) setiap kali dokumen strategi dibuka.
  * *Disable Copy/Export:* Memblokir fungsi salin teks (*copy-paste*), klik kanan, dan pengunduhan dokumen untuk akun dengan peran *Player*.
  * *Session & Device Binding:* Membatasi akses dokumen strategi hanya pada perangkat yang terdaftar milik pemain.

### 4.4 Kontrak & Gaji (*Contract & Payroll Management*)
* **Siklus Kontrak Pemain & Staf:** Pelacakan status kontrak (*Active, Trial, Loan, Inactive/Bench, Expired*) lengkap dengan rincian gaji pokok, tunjangan, dan bonus performa.
* **Pengingat Otomatis Sebelum Expired:** Sistem notifikasi berjenjang (H-90, H-60, H-30, dan H-14) melalui email dan aplikasi kepada *Org Admin* dan *Manajer Tim* sebelum masa berlaku kontrak berakhir.
* **Manajemen Klausul Buyout & Trial:** Pencatatan nilai klausul pelepasan (*buyout clause*), durasi masa percobaan (*trial period*), serta syarat aktivasi perpanjangan kontrak otomatis (*club option*).
* **Kalkulator Pembagian Prize Pool:** Fitur simulasi dan pencatatan distribusi hadiah turnamen berdasarkan persentase kesepakatan dalam kontrak (misal: 70% dibagi rata ke 5 pemain utama, 15% untuk pelatih/analis, 15% untuk organisasi) setelah dipotong pajak.

### 4.5 Jadwal Latihan & Turnamen (*Schedule & Attendance*)
* **Kalender Terpusat:** Satu tampilan kalender (Harian, Mingguan, Bulanan) yang mencakup jadwal *Scrim*, sesi *VOD Review*, *Media Day / Sponsor Shoot*, dan pertandingan resmi turnamen.
* **Integrasi Zona Waktu & Pengingat Otomatis:** Konversi zona waktu otomatis untuk pemain yang sedang mengikuti *bootcamp* di luar negeri, dilengkapi pengingat H-1 jam dan H-15 menit sebelum sesi dimulai.
* **Pelacakan Kehadiran & Ketepatan Waktu:** Pencatatan status kehadiran (*Hadir Tepat Waktu, Terlambat [menit], Izin, Sakit, Tanpa Keterangan*) yang terhubung langsung dengan metrik kedisiplinan di profil pemain.

### 4.6 Roster & Rekrutmen (*Roster & Scouting Pipeline*)
* **Manajemen Lineup:** Pengaturan struktur *roster* aktif secara *real-time* untuk menentukan komposisi *Starting Lineup*, *Substitute* (Cadangan), *Inactive/Bench*, dan *Academy Roster* per divisi game.
* **Kanban Pipeline Scouting & Trial:** Papan visual bergaya Kanban (*Target Scouting $\rightarrow$ Dihubungi $\rightarrow$ Jadwal Trial $\rightarrow$ Evaluasi Coach $\rightarrow$ Penawaran Kontrak $\rightarrow$ Diterima/Ditolak*) untuk mengelola calon rekrutan baru.
* **Penilaian Trial Terstandar:** Formulir evaluasi khusus selama masa *trial* yang membandingkan statistik kandidat langsung dengan rata-rata statistik pemain utama saat ini.

---

## 5. User Stories

| ID | Role | User Story | Acceptance Criteria (Kriteria Penerimaan) |
| :--- | :--- | :--- | :--- |
| **US-01** | Head Coach | Sebagai Head Coach, saya ingin membuat taktik per *map* dengan skenario *Attack/Defense* dan menugaskannya ke pemain, agar seluruh tim memiliki pemahaman yang sama sebelum *scrim*. | - Coach dapat memilih *map*, menambahkan penanda posisi/rotasi, dan menyimpan skenario.<br>- Sistem otomatis mengirim notifikasi ke pemain di divisi terkait.<br>- Layar strategi menampilkan *watermark* identitas pemain yang membukanya. |
| **US-02** | Head Coach | Sebagai Head Coach, saya ingin memantau siapa saja pemain yang sudah membaca *playbook* terbaru, agar saya tahu siapa yang belum siap sebelum pertandingan dimulai. | - Dashboard *Strategy Readiness* menampilkan daftar pemain beserta status baca (*Read/Unread*) dan waktu terakhir dibuka.<br>- Coach dapat mengirim pengingat (*nudge*) sekali klik ke pemain yang berstatus *Unread*. |
| **US-03** | Coach / Analyst | Sebagai Analyst, saya ingin mencatat hasil *scrim* dan mengisi *Player Performance Scorecard* dengan referensi *patch* game saat ini, agar evaluasi pemain bersifat objektif. | - Form input *scrim* mendukung skor tim, statistik individu, dan tag versi *patch* aktif.<br>- *Scorecard* menghitung rata-rata skor otomatis dan menampilkannya pada grafik tren profil pemain. |
| **US-04** | Coach / Analyst | Sebagai Head Coach, saya ingin menambahkan catatan ber-timestamp pada tautan VOD pertandingan dan menetapkan *action items* ke pemain, agar kesalahan tidak terulang. | - Coach dapat memasukkan URL video dan menambahkan catatan pada format waktu `MM:SS`.<br>- Setiap *action item* dapat di-*assign* ke pemain tertentu dan muncul di daftar tugas (*to-do list*) pemain tersebut. |
| **US-05** | Manajer Tim | Sebagai Manajer Tim, saya ingin membuat jadwal *scrim* dan turnamen dalam satu kalender serta mencatat keterlambatan pemain, agar kedisiplinan tim terjaga. | - Jadwal baru otomatis mengirimkan notifikasi pengingat H-15 menit.<br>- Manajer dapat menandai status kehadiran (*Tepat Waktu/Terlambat*) yang langsung terekam dalam laporan bulanan pemain. |
| **US-06** | Manajer Tim | Sebagai Manajer Tim, saya ingin memindahkan calon pemain baru di papan *Kanban Recruitment* dan melihat hasil penilaian *trial*-nya, agar proses rekrutmen lebih rapi. | - Kartu kandidat dapat digeser antar tahap (*Scouting* hingga *Offer*).<br>- Profil kandidat menyimpan riwayat skor *scrim* selama masa *trial* dan catatan evaluasi dari pelatih. |
| **US-07** | Pro Player | Sebagai Pro Player, saya ingin melihat jadwal latihan harian, membaca taktik *map*, dan mengisi *wellness check-in* dari satu aplikasi, agar saya fokus bertanding. | - Halaman utama pemain menampilkan jadwal hari ini, tugas *VOD action items*, dan *playbook* yang belum dibaca.<br>- Pemain dapat mengisi *wellness log* dalam waktu kurang dari 30 detik. |
| **US-08** | Org Admin / Finance | Sebagai Org Admin, saya ingin menerima pengingat otomatis sebelum kontrak pemain habis dan menghitung pembagian *prize pool*, agar administrasi keuangan akurat dan aman. | - Sistem mengirim peringatan otomatis pada H-90, H-60, dan H-30 sebelum tanggal akhir kontrak.<br>- Kalkulator *prize pool* menghitung pembagian nominal bersih untuk pemain, staf, dan organisasi sesuai persentase kontrak. |

---

## 6. Requirement Fungsional & Non-Fungsional

### 6.1 Requirement Fungsional
1. **Multi-Division Architecture:** Satu akun organisasi harus mampu mengelola beberapa divisi game secara terpisah (misal: Valorant, Mobile Legends, Dota 2, Counter-Strike 2) dengan parameter statistik yang menyesuaikan karakteristik masing-masing game.
2. **Role-Based Access Control (RBAC) Granular:** Pembatasan hak akses berbasis peran dan divisi:
   * *Org Admin:* Akses penuh ke seluruh divisi, kontrak, keuangan, dan pengaturan sistem.
   * *Team Manager:* Akses penuh ke jadwal, profil pemain, absensi, dan dokumen identitas (tanpa akses ke detail nominal gaji/finansial organisasi).
   * *Head Coach / Analyst:* Akses penuh ke strategi, analitik, *scrim*, *VOD review*, dan evaluasi *trial* pada divisi game yang ditugaskan saja.
   * *Player:* Akses baca (*read-only*) ke jadwal, *playbook* divisinya, statistik pribadi, serta akses tulis (*write*) hanya untuk *wellness log* dan status *action items*.
3. **Sistem Notifikasi Multi-Kanal:** Dukungan notifikasi *in-app*, *push notification* (mobile/desktop), dan *webhook integration* ke kanal privat Discord tim untuk pengingat jadwal latihan.
4. **Export Laporan:** Kemampuan mengekspor laporan performa bulanan, rekap kehadiran, dan rincian pembagian *prize pool* ke format PDF dan CSV.

### 6.2 Requirement Non-Fungsional
1. **Keamanan & Enkripsi Data:**
   * Seluruh dokumen legal pemain (KTP, Paspor, Kontrak) harus dienkripsi saat disimpan (*Encryption at Rest* menggunakan standar **AES-256**) dan saat ditransmisikan (*Encryption in Transit* menggunakan **TLS 1.3**).
   * Dokumen *Playbook* dilindungi oleh mekanisme *Dynamic Watermarking* dan pencegahan *scraping/hotlinking* pada URL aset gambar taktik.
2. **Performa & Latensi Rendah saat Hari Turnamen (*Matchday Reliability*):**
   * Waktu muat (*page load time*) untuk modul **Strategy & Playbook Builder** serta **Drafting Planner** harus **$< 1,5\text{ detik}$** agar dapat diakses secara instan saat jeda antar-*map* (*tactical timeout* atau pergantian *game*) di hari turnamen.
   * Ketersediaan sistem (*Uptime SLA*) minimal **99,9%**, terutama pada akhir pekan yang merupakan puncak jadwal turnamen resmi.
3. **Audit Log Komprehensif:**
   * Sistem wajib mencatat setiap aktivitas sensitif secara permanen (*immutable log*), meliputi: siapa yang membuka dokumen strategi, kapan dokumen dibuka, pengunduhan dokumen legal, perubahan status kontrak, dan perubahan hak akses pengguna.
4. **Responsivitas & Dukungan Perangkat:**
   * Antarmuka web responsif (*Desktop-first* untuk Coach/Manajer/Admin yang bekerja dengan layar ganda, serta *Mobile-friendly / PWA* untuk pemain yang sering mengecek jadwal dan strategi melalui ponsel saat berada di *venue* turnamen).

---

## 7. Scope (Ruang Lingkup Pengembangan)

### 7.1 In-Scope (Termasuk dalam Pengembangan)
* Manajemen multi-divisi game dalam satu organisasi esports.
* Profil lengkap pemain, penyimpanan dokumen identitas terenkripsi, dan pencatatan statistik manual/semi-otomatis lintas mode (*Ranked, Scrim, Tournament*).
* *Wellness & condition log* harian pemain.
* Modul *Performance & Analytics* (*Scorecard*, grafik tren per *patch*, dan *VOD review* berbasis tautan eksternal dengan *timestamp*).
* *Strategy & Playbook Builder* interaktif berbasis gambar *minimap*, *pick/ban planner*, *readiness tracker*, dan *watermarking* anti-kebocoran.
* Manajemen siklus kontrak, notifikasi masa berakhir, dan kalkulator pembagian *prize pool*.
* Kalender jadwal latihan/turnamen, pelacakan kehadiran, serta *Kanban pipeline* untuk rekrutmen dan *trial*.

### 7.2 Out-of-Scope (Di Luar Ruang Lingkup Saat Ini)
* **Integrasi API Otomatis Penuh ke Seluruh Publisher Game:** Penarikan data *match history* secara otomatis langsung dari server Riot Games/Valve/Moonton tidak termasuk dalam rilis awal karena keterbatasan kebijakan API *scrim* privat (*custom lobby*). Input dilakukan melalui formulir terstruktur atau unggah file rekap (*CSV/JSON parser*).
* **Hosting & Streaming Video Internal:** Aplikasi tidak menyimpan file video mentah (`.mp4`/`.mkv`) berukuran gigabita di server sendiri, melainkan menggunakan integrasi tautan tersemat (*embed*) dari YouTube Unlisted, Twitch, atau Google Drive.
* **Sistem Payroll Perbankan Otomatis (Disbursement):** Aplikasi menghitung pembagian gaji dan *prize pool*, namun eksekusi transfer dana ke rekening bank pemain tetap dilakukan oleh tim keuangan di luar sistem.
* **Manajemen Sponsorship, Merchandise, & Media Sosial Publik:** Fokus sistem adalah operasional internal tim dan performa kompetitif, bukan manajemen komersial atau *fan engagement*.

---

## 8. Asumsi & Risiko

### 8.1 Asumsi Utama
1. Organisasi esports memiliki koneksi internet yang stabil di *gaming house* (GH) maupun *venue* turnamen untuk mengakses aplikasi berbasis *cloud*.
2. *Head Coach* atau *Analyst* bersedia meluangkan waktu 10–15 menit setelah sesi *scrim* untuk menginput data pertandingan dan mengisi *scorecard* demi mendapatkan analitik jangka panjang.
3. Pemain menggunakan perangkat pribadi (PC/Laptop/Smartphone) yang telah didaftarkan ke dalam sistem untuk mengakses *playbook*.

### 8.2 Matriks Identifikasi & Mitigasi Risiko

| Kategori Risiko | Deskripsi Risiko | Tingkat Dampak | Probabilitas | Strategi Mitigasi |
| :--- | :--- | :---: | :---: | :--- |
| **Keamanan & Kebocoran Data** | Pemain atau mantan staf membocorkan strategi tim (*playbook*) dengan cara memotret layar (*foto eksternal*) atau membagikan akses akun ke pihak lawan. | **Sangat Tinggi** | Sedang | 1. Menerapkan *Dynamic Watermarking* (menampilkan nama, ID, dan waktu akses di seluruh layar taktik) sehingga pelaku foto layar dapat langsung diidentifikasi.<br>2. Fitur *Instant Revoke Access* sekali klik saat pemain berstatus *Bench/Released*.<br>3. *Audit log* lengkap untuk setiap akses dokumen. |
| **Resistensi Pengguna (Adopsi)** | Pemain dan pelatih merasa malas menginput data karena sudah terbiasa menggunakan obrolan cepat di Discord dan menganggap aplikasi baru menambah beban kerja. | **Tinggi** | Tinggi | 1. Merancang UX input skor *scrim* yang sangat cepat (< 2 menit) dengan *template* otomatis.<br>2. Menyediakan fitur *Wellness Check-in* dan jadwal harian berbasis notifikasi *mobile* yang praktis.<br>3. Integrasi pengingat satu arah ke Discord agar pemain tetap terhubung dari ekosistem lama mereka. |
| **Perubahan Meta & Patch Game** | Publisher game merilis pembaruan besar (*patch* baru) yang mengubah daftar *map*, *hero/agent*, atau mekanik permainan sehingga taktik lama menjadi usang. | **Sedang** | Tinggi | 1. Menyediakan fitur manajemen aset *map* dan *hero* yang dinamis oleh *Admin/Coach* tanpa perlu menunggu pembaruan kode aplikasi.<br>2. Fitur *Archive Playbook* per versi *patch* sehingga taktik lama tetap tersimpan rapi sebagai referensi tanpa mengotori *playbook* aktif. |
| **Ketergantungan Koneksi di Venue Turnamen** | Koneksi internet di lokasi turnamen *offline* (LAN) terkadang tidak stabil saat tim membutuhkan akses cepat ke catatan strategi. | **Tinggi** | Rendah | 1. Menerapkan *caching* lokal terenkripsi sementara (*offline-ready mode*) pada peramban perangkat terotorisasi khusus untuk dokumen strategi yang telah ditandai sebagai *"Matchday Ready"*. |

---

## 9. Roadmap Pengembangan

Pengembangan produk dibagi menjadi **3 Fase utama** untuk memastikan tim dapat segera merasakan manfaat operasional sejak rilis pertama (*MVP*) sebelum beralih ke fitur analitik dan finansial yang lebih kompleks.

### Fase 1: Minimum Viable Product (MVP) — Fondasi Operasional & Scrim (Bulan 1 – 2)
*Fokus: Menggantikan penggunaan Excel manual dan chat Discord yang berantakan untuk pencatatan latihan harian.*
* **Autentikasi & Manajemen Akun Dasar:** Registrasi organisasi, pembuatan divisi game, dan pengaturan hak akses (*RBAC* dasar: Admin, Coach, Manager, Player).
* **Profil Pemain Dasar:** Biodata, IGN, posisi/*role*, dan status *roster* (*Starting, Sub, Bench*).
* **Modul Catat Hasil Scrim:** Input skor pertandingan, statistik dasar pemain per *match*, dan riwayat/filter pertandingan berdasarkan tanggal atau lawan.
* **Jadwal Latihan & Turnamen:** Kalender terpusat untuk jadwal *scrim* dan turnamen dengan sistem pengingat otomatis serta pencatatan kehadiran pemain.

### Fase 2: Analitik Performa & Strategy Playbook Builder (Bulan 3 – 4)
*Fokus: Memberikan keunggulan kompetitif bagi Head Coach dan Analyst dalam merancang taktik dan mengevaluasi pemain.*
* **Strategy & Playbook Builder:** Kanvas taktis per *map* (skenario *Attack/Defense*), *Drafting & Pick/Ban Planner*, serta database *Opponent Scouting*.
* **Proteksi Anti-Leak & Readiness Tracker:** Implementasi *Dynamic Watermarking*, pelacakan status baca pemain (*Read Receipts*), dan *Audit Log* akses strategi.
* **Performa & Analitik Mendalam:** *Player Performance Scorecard*, grafik tren performa lintas mode (*Ranked/Scrim/Official*) dengan penanda *Patch Game*, serta modul *Post-Match VOD Review* ber-timestamp dan *action items*.
* **Wellness & Condition Log:** Formulir cek kondisi harian pemain sebelum latihan.

### Fase 3: Administrasi Kontrak, Keuangan & Rekrutmen Lanjutan (Bulan 5 – 6)
*Fokus: Menutup celah risiko legal, finansial, dan ekspansi talenta jangka panjang organisasi.*
* **Brankas Dokumen Legal Terenkripsi:** Penyimpanan dokumen identitas (KTP/Paspor/Kontrak) dengan enkripsi tingkat lanjut (AES-256).
* **Manajemen Kontrak & Kalkulator Prize Pool:** Pelacakan siklus kontrak, pengingat otomatis sebelum kontrak berakhir (H-90 hingga H-14), pencatatan klausul *buyout/trial*, dan simulasi pembagian *prize pool*.
* **Roster & Rekrutmen Pipeline:** Papan *Kanban Scouting* dan formulir evaluasi terstandar untuk kandidat pemain *trial*.
* **Optimasi Matchday & Mobile PWA:** Peningkatan performa latensi rendah untuk akses cepat di hari turnamen.
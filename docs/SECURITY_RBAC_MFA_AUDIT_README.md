# Dokumen Panduan Keamanan Sistem: RBAC, Super Admin Bootstrap, MFA, & Audit Trail Tamper-Evident
## Unit Pengelolaan Bahaya Satwa Liar (WHU) — Bandar Udara Internasional Soekarno-Hatta (CGK / WIII)

Dokumen ini menjelaskan implementasi arsitektur keamanan, manajemen hak akses berbasis peran (RBAC), prosedur bootstrap SuperAdmin pertama kali, Multi-Factor Authentication (MFA), mekanisme persetujuan dua pihak (*Two-Person Rule*), dan pencatatan audit log tahan manipulasi (*tamper-evident SHA-256 hash chain*) untuk sistem keselamatan operasional penerbangan WHMS WIII.

---

## 1. Ikhtisar Arsitektur Keamanan (Security Overview)

Sistem WHMS adalah aplikasi pendukung keselamatan penerbangan (*safety-related aviation system*) yang mengacu pada standar **ICAO Annex 14 Volume I**, **ICAO Doc 9137 Part 3 (Wildlife Control and Reduction)**, dan regulasi Ditjen Perhubungan Udara **KP 326 / KP 83**.

### Prinsip Keamanan Inti:
1. **Default Deny**: Semua endpoint API dan operasi data secara *default* menolak akses kecuali memiliki token otentikasi valid dan izin (*permission policy*) yang sesuai.
2. **Server-Side Enforcement**: Pengecekan izin dan isolasi bandara (*Airport Scoping*) divalidasi langsung di *middleware backend* (`server/security/authMiddleware.ts`), bukan sekadar menyembunyikan elemen UI di browser.
3. **No Credential Logging**: Kata sandi, token otentikasi, rahasia MFA TOTP, dan kode pemulihan **TIDAK PERNAH** ditulis ke dalam berkas log, konsol, atau audit trail.
4. **Tamper-Evident Audit Logging**: Setiap aksi kritis disimpan dalam rantai kriptografi SHA-256 (*cryptographic hash chain*) di mana setiap baris merangkum hash dari baris sebelumnya.

---

## 2. Model Peran & Matriks Kebijakan Izin (RBAC Permission Matrix)

Sistem mengadopsi 5 peran terdefinisi secara granular:

| Peran | Lingkup Bandara | MFA Diwajibkan? | Wewenang & Tanggung Jawab Utama | Kebijakan Izin Terpetakan |
|---|---|:---:|---|---|
| **SuperAdmin** | Semua Bandara (Global) | **YA** | Mengelola pengguna, alokasi peran, konfigurasi bandara, threshold risiko satwa, inisiasi & persetujuan Two-Person Rule, inspeksi dan verifikasi audit chain. | `Users.Manage`, `Roles.Assign`, `SuperAdmin.Grant`, `AirportConfig.Edit`, `RiskRules.Edit`, `Strikes.Create`, `Strikes.Edit`, `Strikes.Delete`, `Corrections.Request`, `Corrections.Approve`, `AuditLogs.View`, `AuditChain.Verify`, `Reports.Export` |
| **AirportAdmin** | Bandara Terdaftar (CGK / WIII) | **YA** | Mengelola pengguna & operasional dalam bandara yang ditugaskan, memantau riwayat audit lokal. Tidak dapat mengangkat SuperAdmin. | `Users.Manage`, `AirportConfig.Edit`, `RiskRules.Edit`, `Strikes.Create`, `Strikes.Edit`, `Corrections.Request`, `AuditLogs.View`, `Reports.Export` |
| **WildlifeOfficer** | Bandara Terdaftar | Opsional | Petugas lapangan airside: input formulir WOR (patroli/observasi), WHR (hazard), WSR (strike), checklist kendaraan. Dapat mengajukan permohonan koreksi data tetapi **tidak dapat menyetujuinya**. | `Strikes.Create`, `Strikes.Edit`, `Corrections.Request`, `Reports.Export` |
| **DataReviewer** | Bandara Terdaftar | **YA** | Kepala pleton / supervisor safety: meninjau data lapangan, menyetujui atau menolak permohonan koreksi laporan satwa. | `Strikes.Create`, `Corrections.Approve`, `Reports.Export` |
| **Viewer** | Bandara Terdaftar | Opsional | Manajemen eksekutif / maskapai: hak akses baca (*read-only*) untuk dasbor cuaca, visualisasi hotspot, dan rekapitulasi. | `Reports.Export` (Read-only) |

---

## 3. Bootstrap SuperAdmin Pertama Kali (First Deployment)

### 3.1. Variabel Lingkungan (*Environment Variables*)
Pada saat pertama kali aplikasi dijalankan di lingkungan produksi atau server baru, atur variabel lingkungan berikut pada server:

```bash
# Wajib: Email & Kata Sandi Inisialisasi SuperAdmin Pertama
SUPERADMIN_EMAIL="superadmin.whms@cgk-airport.co.id"
SUPERADMIN_INITIAL_PASSWORD="GantiSegeraPass!2026WIII"

# Opsional: Pengaturan Sesi & Keamanan
PORT=3000
SESSION_SECRET="whms-cgk-super-secret-key-prod-random-token-2026"
```

### 3.2. Perilaku Bootstrap Sistem
1. Pada startup server (`server.ts` -> `securityDb.bootstrapSuperAdminFromEnv()`), sistem mengecek keberadaan akun `SuperAdmin` dalam database (`data/securityStore.json`).
2. Jika belum ada akun SuperAdmin:
   - Akun SuperAdmin pertama dibuat dengan atribut `mustChangePassword = true` dan `mfaEnabled = false`.
   - Kata sandi di-*hash* menggunakan **PBKDF2-HMAC-SHA512** (100.000 iterasi) dengan *salt* acak unik 16-byte kriptografis.
   - Entri audit log penciptaan akun dicatat ke dalam *hash chain*.
3. **Idempotensi & Keamanan**:
   - Jika akun SuperAdmin sudah ada dalam database dan variabel `SUPERADMIN_INITIAL_PASSWORD` masih ada di lingkungan, sistem **TIDAK AKAN** mengubah kata sandi akun yang sudah ada. Kredensial tidak pernah di-*reset* secara otomatis oleh skrip bootstrap.

### 3.3. Alur Login Pertama SuperAdmin
1. SuperAdmin masuk menggunakan email dan kata sandi bootstrap.
2. Sistem mendeteksi `mustChangePassword === true` dan secara otomatis mengunci antarmuka serta menampilkan modal **Pembaruan Kata Sandi Wajib**.
3. SuperAdmin memasukkan kata sandi baru yang memenuhi kriteria kebijakan korporat:
   - Minimal 12 karakter.
   - Mengandung huruf besar, huruf kecil, angka, dan simbol khusus.
   - Tidak termasuk dalam daftar sandi umum / rentan bobol (*breached passwords blocklist*).
4. Setelah kata sandi baru disimpan, sistem langsung mengarahkan ke modal **Pendaftaran Multi-Factor Authentication (MFA)**:
   - Memindai QR Code dengan aplikasi Google Authenticator / Microsoft Authenticator.
   - Memasukkan 6-digit kode TOTP.
   - Mengunduh dan menyimpan 10 **Kode Pemulihan Darurat (Emergency Recovery Codes)** yang di-*hash* aman di server.

---

## 4. Rekomendasi Minimal 2 SuperAdmin & Proteksi Akun Terakhir

Sistem menerapkan aturan kontinuitas operasional ketat:
- **Peringatan < 2 SuperAdmin**: Terdapat indikator peringatan visual di bilah navigasi atas (badge kuning berkedip) jika jumlah SuperAdmin aktif kurang dari 2.
- **Proteksi Last Active SuperAdmin**: Sistem menolak keras tindakan penghapusan (*delete*), penonaktifan (*deactivate*), atau penurunan peran (*demote*) terhadap akun SuperAdmin terakhir yang aktif. Hal ini mencegah terjadinya *lockout* sistem secara permanen.

---

## 5. Prosedur Perubahan Hak Istimewa: Aturan Dua Pihak (Two-Person Rule)

Untuk mencegah eskalasi wewenang sepihak atau penyalahgunaan akun yang terkompromi:
1. **Hanya SuperAdmin yang dapat mengusulkan pengangkatan atau pencabutan SuperAdmin**.
2. **Tidak Dapat Mengubah Peran Sendiri**: Pengguna dilarang mengubah perannya sendiri melalui UI maupun endpoint API.
3. **Verifikasi Kata Sandi Pemohon**: Saat mengajukan (*request*), SuperAdmin pemohon wajib memasukkan ulang kata sandinya (*re-authentication*).
4. **Persetujuan SuperAdmin Kedua**: Permintaan masuk ke antrean *pending* dengan masa kedaluwarsa 24 jam. Permintaan **wajib disetujui oleh SuperAdmin kedua yang berbeda** dengan memasukkan kata sandi SuperAdmin kedua tersebut.
5. **Rotasi Security Stamp & Invalidasi Sesi**: Begitu persetujuan disahkan, `securityStamp` pengguna target dirotasi, sehingga seluruh sesi aktif target di perangkat lain otomatis tidak berlaku (*session invalidated*).

---

## 6. Pengerasan Otentikasi (Authentication Hardening)

1. **MFA TOTP Berbasis Waktu (RFC 6238)**:
   - Periode langkah 30 detik dengan toleransi *drift* jendela ±1 langkah.
   - Wajib untuk peran: `SuperAdmin`, `AirportAdmin`, dan `DataReviewer`.
2. **10 Kode Pemulihan Sekali Pakai (Single-Use Recovery Codes)**:
   - Disimpan dalam format *hash* SHA-256 (bukan teks polos).
   - Setiap kali kode digunakan, kode tersebut ditandai `used = true` dan tanggal pemakaiannya dicatat di audit log.
3. **Pencegahan Brute-Force & Account Lockout**:
   - Akun dikunci otomatis selama 15 menit setelah 5 kali kesalahan kata sandi berturut-turut.
   - Pesan galat bersifat umum (*generic error message*): *"Kredensial tidak valid atau akun dikunci sementara demi keamanan."* untuk mencegah *account enumeration*.
   - *Rate limiting* diterapkan pada endpoint `/api/auth/login` (maks 10 percobaan / 5 menit) dan `/api/auth/verify-mfa` (maks 10 percobaan / 5 menit).
4. **Kebijakan Sesi**:
   - Batas *idle session* (tidak aktif): 30 menit.
   - Masa hidup mutlak sesi (*absolute lifetime*): 12 jam.
   - Sesi menggunakan *token bearer* terenkripsi dengan validasi *security stamp* pada setiap permintaan API.

---

## 7. Jejak Audit Tahan Manipulasi (Tamper-Evident Audit Trail)

Semua tindakan operasional dan keamanan dicatat secara permanen (*append-only*):
- Login berhasil & gagal, penguncian akun karena kesalahan sandi.
- Pendaftaran & verifikasi MFA, penggunaan kode pemulihan darurat.
- Pembuatan pengguna, perubahan peran, aktivasi/penonaktifan akun.
- Permintaan dan persetujuan Two-Person Rule.
- Perubahan aturan risiko satwa dan persetujuan koreksi data.

### Mekanisme Kriptografi Hash-Chain:
Setiap entri baris audit log menghitung hash SHA-256 sebagai berikut:
$$\text{RowHash}_n = \text{SHA256}(\text{RowHash}_{n-1} + \text{Timestamp} + \text{ActorId} + \text{Action} + \text{EntityType} + \text{EntityId} + \text{PayloadJson})$$

Jika seorang administrator basis data mencoba mengubah isi catatan log lampau (misalnya mengubah catatan persetujuan atau menghapus jejak kegagalan login), seluruh *hash* pada baris-baris berikutnya akan menjadi tidak valid (*chain broken*).

### Verifikasi Mandiri Hash-Chain:
SuperAdmin dapat menjalankan tombol **"Verifikasi Rantai Hash SHA-256"** di Konsol Keamanan:
- Sistem memverifikasi seluruh tautan dari baris *genesis* (entri pertama) hingga entri terbaru.
- Menampilkan status *"Integritas Terverifikasi Kriptografis"* atau mendeteksi baris persis di mana manipulasi data terjadi.

---

## 8. Prosedur Rotasi Kata Sandi & Pemulihan Darurat SuperAdmin

### 8.1. Rotasi Berkala Kata Sandi
1. Masuk ke aplikasi menggunakan akun SuperAdmin.
2. Buka menu **Lainnya** -> **Pusat Keamanan & RBAC** -> tab **Manajemen Pengguna**.
3. Klik tombol **Ganti Kata Sandi**.
4. Masukkan kata sandi saat ini dan kata sandi baru (minimal 12 karakter kombinasi).

### 8.2. Prosedur Jika Kehilangan Ponsel Authenticator
1. Pada layar login MFA, klik opsi **"Gunakan Kode Pemulihan"**.
2. Masukkan salah satu dari 10 kode pemulihan darurat yang telah diunduh saat pendaftaran.
3. Setelah masuk, segera buka tab **Aktivasi / Kelola MFA (TOTP)** untuk mendaftarkan ulang perangkat baru (kunci rahasia lama otomatis diganti dengan yang baru).

---

## 9. Menjalankan Pengujian Integrasi Otomatis (Unit & Integration Tests)

Untuk memverifikasi kepatuhan seluruh skenario keamanan, jalankan perintah pengujian berikut di terminal:

```bash
# Menjalankan suite pengujian keamanan RBAC, MFA, Password, & Hash-Chain
npx tsx tests/authSecurity.test.ts

# Atau menjalankan semua test aplikasi (termasuk weather widget)
npm test
```

### Lingkup Pengujian yang Dicakup (`tests/authSecurity.test.ts`):
1. **Password Policy & Breached Blocklist**: Verifikasi panjang minimal 12 karakter, keberadaan huruf besar/kecil/angka/simbol, dan penolakan sandi umum (`Password12345!`).
2. **RFC 6238 TOTP Generator & Verifier**: Verifikasi perhitungan HMAC-SHA1 pada timestamp saat ini dan penolakan token acak.
3. **Emergency Recovery Codes**: Verifikasi hashing kode darurat dan pencatatan status penggunaan satu kali.
4. **RBAC & Permission Mapping**: Verifikasi wewenang SuperAdmin, AirportAdmin, WildlifeOfficer, DataReviewer, dan Viewer.
5. **SuperAdmin Bootstrap & Last Active Protection**: Verifikasi pencegahan demosi/penghapusan akun SuperAdmin tunggal.
6. **Two-Person Rule Workflow**: Verifikasi bahwa pemohon tidak dapat menyetujui permintaannya sendiri dan masa kedaluwarsa 24 jam.
7. **Tamper-Evident Hash-Chain**: Verifikasi integritas rantai valid, dan simulasi pendeteksian manipulasi baris riwayat audit log.

---

## 10. Daftar Periksa Kepatuhan Keamanan (Security Checklist)

- [x] **Default Deny Policy**: Semua rute `/api/users`, `/api/superadmin-requests`, dan `/api/audit-logs` memvalidasi sesi dan izin spesifik.
- [x] **Server-Side Airport Isolation**: Query data satwa dan audit log mengisolasi data berdasarkan `user.assignedAirports`.
- [x] **No Password or Secret in Logs**: Hash chain dan logger tidak pernah menyimpan *raw password*, *JWT/session secret*, atau *recovery code plaintext*.
- [x] **Two-Person Integrity**: Perubahan hak SuperAdmin memerlukan persetujuan dari 2 SuperAdmin terpisah dengan verifikasi kata sandi ulang.
- [x] **Brute-Force & Lockout Guard**: 5 kegagalan login memicu penguncian akun 15 menit dengan pesan galat seragam tanpa *user enumeration*.
- [x] **Session Expiry & Rotation**: Batas tidak aktif 30 menit, rotasi *security stamp* seketika saat hak akses berubah.
- [x] **SHA-256 Tamper Evident**: Rantai hash audit log dapat diverifikasi kapan saja oleh SuperAdmin.
- [x] **Mobile & Responsive**: Antarmuka konsol keamanan teroptimasi untuk ponsel operasional maupun tablet inspeksi airside.

---
*Dokumen ini diterbitkan oleh Unit Wildlife Hazard Management (WHU), Bandar Udara Internasional Soekarno-Hatta (CGK / WIII).*

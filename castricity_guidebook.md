# 📘 Castricity — Panduan Pengguna

> **Castricity** adalah platform peramalan permintaan listrik berbasis AI yang menyediakan dasbor operasional, peramalan multi-horizon, deteksi anomali, dan kecerdasan buatan yang dapat dijelaskan (Explainable AI) untuk manajemen jaringan listrik modern.

---

## Daftar Isi

1. [Tentang Castricity](#1-tentang-castricity)
2. [Memulai — Registrasi & Masuk](#2-memulai--registrasi--masuk)
3. [Navigasi Aplikasi](#3-navigasi-aplikasi)
4. [Halaman Beranda](#4-halaman-beranda)
5. [Dashboard Operasional](#5-dashboard-operasional)
6. [Forecast (Peramalan Multi-Horizon)](#6-forecast-peramalan-multi-horizon)
7. [Anomaly Center (Pusat Anomali)](#7-anomaly-center-pusat-anomali)
8. [Feature Drivers (Pendorong Fitur)](#8-feature-drivers-pendorong-fitur)
9. [Alur Kerja Pengguna](#9-alur-kerja-pengguna)
10. [Glosarium](#10-glosarium)

---

## 1. Tentang Castricity

Castricity adalah sistem cerdas yang membantu operator jaringan listrik, analis energi, dan ilmuwan data untuk:

- **Memantau** permintaan listrik secara real-time melalui dasbor operasional
- **Meramalkan** kebutuhan listrik hingga 2 tahun ke depan menggunakan model hybrid Prophet + LightGBM
- **Mendeteksi** anomali permintaan (lonjakan atau penurunan tidak wajar) secara otomatis
- **Memahami** faktor-faktor yang memengaruhi prediksi melalui analisis SHAP (Explainable AI)
- **Mensimulasikan** skenario "bagaimana-jika" untuk melihat dampak perubahan cuaca atau hari libur terhadap permintaan

### Siapa yang Menggunakan Castricity?

| Peran | Kegunaan |
|-------|----------|
| Operator jaringan | Memantau permintaan terkini dan mendeteksi anomali lebih dini |
| Analis energi | Menganalisis tren, peramalan, dan skenario permintaan |
| Ilmuwan data | Menjelajahi kepentingan fitur model dan kontribusi SHAP |
| Manajer operasi | Mendapatkan ringkasan metrik akurasi dan peringatan anomali |

---

## 2. Memulai — Registrasi & Masuk

### Membuat Akun Baru

1. Buka halaman utama Castricity
2. Klik tombol **"Daftar"** di pojok kanan atas
3. Isi formulir pendaftaran:
   - **Nama** — nama lengkap Anda (minimal 2 karakter)
   - **Email** — alamat email aktif
   - **Kata Sandi** — minimal 8 karakter
4. Klik **"Buat akun"**
5. Anda akan langsung diarahkan ke Dashboard

### Masuk ke Akun

1. Klik tombol **"Masuk"** di pojok kanan atas halaman utama
2. Masukkan **Email** dan **Kata Sandi** Anda
3. Klik **"Masuk"**
4. Jika berhasil, Anda akan diarahkan ke Dashboard Operasional

> [!TIP]
> Jika Anda sudah masuk, tombol di navbar akan berubah menjadi **"Pergi Dashboard"** yang langsung membawa Anda ke ruang kontrol.

### Perlindungan Halaman

Halaman Dashboard, Forecast, Anomaly Center, dan Feature Drivers **hanya dapat diakses setelah masuk**. Jika Anda mencoba mengakses halaman tersebut tanpa masuk, sistem akan mengarahkan Anda ke halaman login terlebih dahulu.

---

## 3. Navigasi Aplikasi

Setelah masuk, Anda akan melihat **sidebar navigasi** di sisi kiri layar. Sidebar ini adalah pusat navigasi Anda di dalam aplikasi.

### Struktur Menu Sidebar

```
┌──────────────────────────┐
│  C  Castricity           │
│     Peramalan permintaan  │
├──────────────────────────┤
│  OPERASI                 │
│  ┣ 📊 Dashboard          │
│  ┣ 📈 Forecast           │
│  ┗ ⚠️ Anomaly Center     │
├──────────────────────────┤
│  DATA                    │
│  ┗ 🔀 Feature Drivers    │
├──────────────────────────┤
│  SISTEM                  │
│  ┗ 📖 Panduan            │
├──────────────────────────┤
│  🟢 Aliran data aktif    │
│  v2.4.1 · build a17f3    │
└──────────────────────────┘
```

| Menu | Fungsi |
|------|--------|
| **Dashboard** | Ringkasan operasional: metrik utama, validasi model, dan anomali terkini |
| **Forecast** | Peramalan multi-horizon (7 hari hingga 2 tahun) + simulasi bagaimana-jika |
| **Anomaly Center** | Daftar lengkap titik anomali yang terdeteksi oleh model |
| **Feature Drivers** | Katalog fitur model beserta tingkat kepentingan SHAP |
| **Panduan** | Buku panduan ini |

> [!NOTE]
> Di layar kecil (mobile), sidebar akan tersembunyi. Klik ikon hamburger (☰) di pojok kiri atas untuk membukanya.

---

## 4. Halaman Beranda

Halaman beranda (`/`) adalah halaman publik yang menampilkan informasi umum tentang Castricity. Halaman ini terdiri dari:

1. **Navbar** — Logo Castricity, tautan navigasi (Features, Cara Kerja), dan tombol Masuk/Daftar
2. **Hero Section** — Judul besar "Forecast Electricity Demand" dengan latar animasi grid, dan tombol "Lihat Dashboard"
3. **Fitur Utama** — Tiga kartu yang menjelaskan kemampuan platform:
   - 📈 **AI-Powered Forecasts** — Prediksi permintaan harian dan mingguan
   - 🛡️ **Anomaly Detection** — Identifikasi otomatis pola konsumsi anomali
   - 🧠 **Explainable AI** — Skenario bagaimana-jika dan analisis faktor penyebab
4. **Footer** — Tautan produk dan informasi versi

---

## 5. Dashboard Operasional

Dashboard adalah halaman utama setelah masuk. Halaman ini menyajikan gambaran lengkap kondisi jaringan listrik secara real-time.

### Komponen Dashboard

#### 5.1 Topbar (Bilah Atas)

Di bagian atas dashboard, Anda akan menemukan:

- **Breadcrumb** — Menunjukkan posisi Anda saat ini: `Operations › Dashboard`
- **Pemilih Wilayah** — Dropdown untuk memilih wilayah yang ingin dipantau:

| Kode | Wilayah |
|------|---------|
| SYS-00 | System total (seluruh jaringan) |
| ZN-NTH | Northern Zone |
| ZN-MTR | Metro / Capital |
| ZN-CST | Coastal Belt |
| ZN-INL | Inland Plains |

- **Jam Langsung** — Menampilkan waktu terkini, diperbarui setiap 30 detik
- **Tombol Refresh** — Klik ikon ↻ untuk memperbarui data secara manual

#### 5.2 Kartu Metrik Utama (Hero Metrics)

Dua kartu besar di bagian atas:

| Kartu | Isi |
|-------|-----|
| **Puncak Permintaan Besok** | Prediksi puncak permintaan (MW) untuk 24 jam ke depan, termasuk rentang kepercayaan P10–P90 dan grafik mini (sparkline) |
| **Akurasi Peramalan · MAPE** | Mean Absolute Percentage Error — semakin rendah semakin baik |

#### 5.3 Strip Anomali

Baris horizontal yang menampilkan anomali terbaru sebagai badge berwarna:
- 🔴 **Critical** — Deviasi sangat besar (contoh: gelombang panas)
- 🟠 **Warning** — Deviasi sedang (contoh: penurunan tenaga surya)
- 🔵 **Info** — Deviasi ringan

**Klik salah satu badge** untuk membuka panel penjelasan faktor penyebab anomali.

#### 5.4 Kartu Validasi (Actual vs. Predicted)

Grafik utama yang menampilkan perbandingan antara **permintaan aktual** dan **prediksi model**:

- **Pemilih Tanggal** — Pilih rentang tanggal yang ingin dilihat menggunakan kalender
- **Brush (Zoom)** — Gunakan penggeser di bawah grafik untuk memperbesar area tertentu
- **Mode Galat** — Toggle antara tampilan galat absolut (MW) atau persentase (%)
- **Klik titik data** — Menampilkan panel penjelasan (Explainer) untuk titik tersebut

#### 5.5 Panel Penjelasan (Explainer)

Saat Anda mengklik titik data pada grafik atau badge anomali, panel ini muncul dan menampilkan:

- **Judul** — Jenis analisis (rincian faktor peramalan / pendorong peramalan)
- **Deskripsi** — Penjelasan singkat tentang deviasi
- **Faktor Kontribusi** — Daftar faktor yang memengaruhi prediksi (contoh: suhu, hari kerja, jam, kejadian khusus), ditampilkan sebagai bar horizontal yang menunjukkan kontribusi masing-masing faktor

### Pembaruan Otomatis

Dashboard secara otomatis memperbarui data setiap **60 detik**. Indikator hijau berkedip (🟢) di topbar menunjukkan koneksi aktif. Jika koneksi terputus, status akan berubah menjadi "Terputus".

---

## 6. Forecast (Peramalan Multi-Horizon)

Halaman Forecast memungkinkan Anda melihat proyeksi permintaan listrik untuk periode yang lebih panjang dan menjalankan simulasi skenario.

### 6.1 Mengatur Horizon Peramalan

Di bagian atas halaman, Anda dapat memilih jangka waktu peramalan:

| Preset | Periode |
|--------|---------|
| 7 hari | Satu minggu ke depan |
| 30 hari | Satu bulan ke depan |
| 90 hari | Tiga bulan ke depan |
| 180 hari | Enam bulan ke depan |
| 1 tahun | Satu tahun ke depan |
| 2 tahun | Dua tahun ke depan |
| Kustom | Masukkan jumlah hari secara manual |

Anda juga dapat mengaktifkan/menonaktifkan **Pita Keyakinan** (confidence band) — area berwarna di sekitar garis prediksi yang menunjukkan rentang ketidakpastian.

### 6.2 Kartu Ringkasan

Tiga kartu di bawah pengaturan menampilkan:

| Kartu | Keterangan |
|-------|------------|
| **Puncak (MW)** | Nilai prediksi tertinggi dalam horizon |
| **Rata-rata (MW)** | Rata-rata prediksi selama horizon |
| **Lembah (MW)** | Nilai prediksi terendah dalam horizon |

### 6.3 Grafik Trajektori Peramalan

Grafik interaktif yang menampilkan garis prediksi beserta pita keyakinan (jika diaktifkan).

- **Arahkan kursor** ke titik data untuk melihat nilai prediksi harian
- **Klik satu titik** untuk mengunci tanggal tersebut dan memuatnya ke panel Bagaimana-Jika

> [!IMPORTANT]
> Peramalan dimulai dari hari setelah set pelatihan berakhir, **bukan dari hari ini**. Tanggal awal ditampilkan di bawah judul grafik.

### 6.4 Panel Skenario Bagaimana-Jika (What-If)

Panel ini memungkinkan Anda mensimulasikan dampak perubahan kondisi terhadap permintaan listrik. Anda dapat mengatur:

| Parameter | Cara Mengisi | Contoh |
|-----------|-------------|--------|
| **Tanggal Target** | Klik ikon kalender untuk memilih tanggal | 15 Jun 2026 |
| **Suhu Rata-rata (°C)** | Ketik angka suhu rata-rata harian | 28.5 |
| **Curah Hujan (mm)** | Ketik angka curah hujan harian | 12.4 |
| **Hari Libur Nasional** | Toggle Ya/Tidak | Ya |

Setelah mengisi parameter, klik **"Jalankan Skenario"**.

#### Hasil Simulasi

Setelah simulasi dijalankan, Anda akan melihat:

1. **Permintaan Terprediksi** — Total permintaan yang diprediksi (MW)
2. **Acuan Dasar** — Prediksi dasar dari model Prophet (MW)
3. **Delta** — Selisih dari acuan dasar (positif = lebih tinggi, negatif = lebih rendah)
4. **Kontribusi SHAP** — Grafik bar horizontal yang menunjukkan seberapa besar masing-masing faktor memengaruhi prediksi:
   - Bar **ke kanan** (biru) = faktor meningkatkan permintaan
   - Bar **ke kiri** (merah) = faktor menurunkan permintaan

> [!TIP]
> Coba ubah suhu menjadi sangat tinggi (misal 38°C) untuk melihat dampak gelombang panas terhadap prediksi permintaan. Bandingkan juga dampak hari libur vs. hari kerja.

---

## 7. Anomaly Center (Pusat Anomali)

Halaman ini menampilkan semua titik permintaan yang terdeteksi sebagai anomali oleh model Isolation Forest.

### 7.1 Filter dan Kontrol

| Kontrol | Fungsi |
|---------|--------|
| **Jendela Waktu** | Pilih rentang data: 24 jam, 3 hari, 7 hari, atau 30 hari terakhir |
| **Filter Tingkat** | Tampilkan semua anomali, atau filter berdasarkan: Critical / Warning / Info |
| **Tombol Perbarui** | Klik untuk memuat ulang data anomali terbaru |

### 7.2 Kartu Ringkasan

Empat kartu di bagian atas menampilkan jumlah anomali berdasarkan tingkat keparahan:

| Kartu | Warna | Keterangan |
|-------|-------|------------|
| Total | Putih | Jumlah seluruh anomali dalam jendela waktu |
| Critical | 🔴 Merah | Anomali kritis — deviasi sangat besar yang memerlukan tindakan segera |
| Warning | 🟠 Oranye | Anomali peringatan — deviasi sedang yang perlu diperhatikan |
| Info | 🔵 Biru | Anomali informasi — deviasi ringan untuk kesadaran |

### 7.3 Tabel Anomali

Tabel utama menampilkan daftar anomali dengan kolom:

| Kolom | Keterangan |
|-------|------------|
| **#** | Nomor urut |
| **Tingkat** | Badge warna (critical / warning / info) |
| **Judul** | Deskripsi singkat anomali |
| **Aset** | Bagian jaringan yang terpengaruh |
| **Waktu** | Kapan anomali terjadi |
| **Δ (MW)** | Selisih antara aktual dan prediksi (merah = di atas, hijau = di bawah) |
| **Aktual** | Nilai permintaan aktual (MW) |
| **Prediksi** | Nilai yang diprediksi model (MW) |

Tabel menggunakan **paginasi** — 10 entri per halaman. Gunakan tombol "Sebelumnya" dan "Berikutnya" untuk navigasi.

### 7.4 Detail Anomali

**Klik baris mana pun** di tabel untuk membuka dialog detail yang menampilkan:

1. **Badge Tingkat** dan **Judul** anomali
2. **Waktu** dan **Aset** yang terdampak
3. **Tiga kartu nilai**:
   - Actual — Permintaan yang sebenarnya terjadi
   - Predicted — Prediksi model
   - Delta — Selisih (warna merah jika di atas, hijau jika di bawah prediksi)
4. **Deskripsi** — Penjelasan naratif tentang penyebab anomali
5. **Faktor Kontribusi** — Bar horizontal yang menunjukkan kontribusi masing-masing faktor (suhu, kelembapan, tutupan awan, kecepatan angin, dll.)

---

## 8. Feature Drivers (Pendorong Fitur)

Halaman ini menampilkan semua fitur (variabel) yang digunakan oleh model prediksi, beserta seberapa penting masing-masing fitur dalam memengaruhi hasil prediksi.

### 8.1 Kartu Ringkasan

| Kartu | Keterangan |
|-------|------------|
| **Total fitur** | Jumlah seluruh fitur yang digunakan model |
| **Input pengguna** | Jumlah fitur yang dapat dimasukkan pengguna (contoh: suhu, curah hujan) |
| **Kategori** | Jumlah kategori fitur yang berbeda |

### 8.2 Grafik Kepentingan Fitur (SHAP)

Grafik bar horizontal yang menampilkan **rata-rata |SHAP value|** untuk setiap fitur. Semakin panjang bar, semakin besar pengaruh fitur tersebut terhadap prediksi model.

> [!NOTE]
> **SHAP (SHapley Additive exPlanations)** adalah metode untuk menjelaskan kontribusi setiap fitur terhadap prediksi individual. Nilai SHAP yang tinggi berarti fitur tersebut memiliki pengaruh besar terhadap hasil prediksi.

### 8.3 Katalog Fitur

Tabel yang menampilkan seluruh fitur dengan kolom:

| Kolom | Keterangan |
|-------|------------|
| **#** | Nomor urut (diurutkan berdasarkan kepentingan) |
| **Nama fitur** | Nama teknis fitur |
| **Kategori** | Jenis fitur (lihat tabel di bawah) |
| **Deskripsi** | Penjelasan singkat tentang fitur |
| **SHAP** | Nilai kepentingan + bar visual |
| **Input** | Apakah fitur ini dapat dimasukkan pengguna (Ya/—) |

### Kategori Fitur

| Kategori | Warna Badge | Contoh | Penjelasan |
|----------|-------------|--------|------------|
| **Temporal** | 🟣 Ungu | jam, hari, bulan | Fitur yang berkaitan dengan waktu |
| **Lag** | 🔵 Biru | permintaan 1 hari lalu | Nilai historis permintaan sebelumnya |
| **Rolling** | 🟢 Hijau | rata-rata 7 hari | Statistik bergerak dari data historis |
| **Eksogen** | 🟠 Oranye | suhu, curah hujan | Faktor eksternal (cuaca, dll.) |
| **Kategorikal** | 🔴 Merah | hari libur, akhir pekan | Penanda kategori Ya/Tidak |

### Pencarian dan Filter

- **Kotak Pencarian** — Ketik nama atau deskripsi fitur untuk mencari
- **Dropdown Kategori** — Filter berdasarkan kategori (Temporal, Lag, Rolling, Eksogen, Kategorikal)

---

## 9. Alur Kerja Pengguna

### Alur Umum Penggunaan Harian

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  1. MASUK   │────▶│  2. CEK DASHBOARD │────▶│ 3. PERIKSA ANOMALI│
│  Sign In    │     │  Metrik & Validasi│     │  Ada peringatan?  │
└─────────────┘     └──────────────────┘     └───────────────────┘
                                                       │
                              ┌─────────────────────────┘
                              ▼
                    ┌───────────────────┐     ┌───────────────────┐
                    │ 4. LIHAT FORECAST │────▶│ 5. SIMULASI       │
                    │ Proyeksi ke depan │     │ Skenario What-If  │
                    └───────────────────┘     └───────────────────┘
```

### Skenario: Mempersiapkan Beban Puncak Musim Panas

1. **Buka Dashboard** — Periksa kartu "Puncak Permintaan Besok"
2. **Cek Anomaly Center** — Apakah ada anomali critical terkait gelombang panas?
3. **Buka Forecast** — Pilih horizon 30 hari, periksa tren kenaikan
4. **Jalankan What-If** — Atur suhu ke 38°C, lihat dampaknya pada permintaan
5. **Periksa Feature Drivers** — Konfirmasi bahwa suhu memang faktor paling berpengaruh

### Skenario: Menganalisis Anomali yang Terdeteksi

1. **Buka Anomaly Center** — Filter ke "Critical" saja
2. **Klik anomali** — Baca deskripsi dan faktor kontribusi
3. **Pergi ke Dashboard** — Lihat konteks anomali pada grafik Actual vs. Predicted
4. **Jalankan What-If** — Simulasikan kondisi yang sama untuk memvalidasi temuan

---

## 10. Glosarium

| Istilah | Penjelasan |
|---------|------------|
| **MW (Megawatt)** | Satuan daya listrik. 1 MW = 1.000 kW, cukup untuk menyalakan ~750 rumah |
| **MAPE** | Mean Absolute Percentage Error — rata-rata galat prediksi dalam persen. Semakin rendah semakin akurat |
| **RMSE** | Root Mean Square Error — akar rata-rata galat kuadrat. Sensitif terhadap galat besar |
| **MAE** | Mean Absolute Error — rata-rata galat absolut dalam MW |
| **R²** | Koefisien determinasi — seberapa baik model menjelaskan variasi data (0–1, semakin tinggi semakin baik) |
| **Bias** | Rata-rata selisih antara aktual dan prediksi. Positif = model cenderung under-predict |
| **SHAP** | SHapley Additive exPlanations — metode untuk menjelaskan kontribusi setiap fitur terhadap prediksi |
| **Prophet** | Model peramalan time series dari Meta/Facebook, digunakan sebagai komponen dasar |
| **LightGBM** | Model machine learning gradient boosting, digunakan untuk menangkap pola non-linear |
| **Isolation Forest** | Algoritma deteksi anomali yang mengidentifikasi titik data yang tidak biasa |
| **P10 / P90** | Persentil ke-10 dan ke-90, membentuk rentang kepercayaan 80% dari prediksi |
| **Pita Keyakinan** | Area berwarna di sekitar garis prediksi yang menunjukkan rentang ketidakpastian |
| **Horizon** | Jangka waktu peramalan ke depan (contoh: 7 hari, 30 hari) |
| **What-If** | Simulasi skenario hipotesis — "bagaimana jika suhu naik 5°C?" |
| **Eksogen** | Faktor eksternal di luar data historis permintaan (contoh: cuaca, hari libur) |

---

> **Castricity** · Panduan Pengguna · v2.4.1

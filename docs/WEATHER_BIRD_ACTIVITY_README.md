# Current Weather & Bird Activity Conditions Widget
### Soekarno-Hatta International Airport (IATA: CGK, ICAO: WIII)
**Wildlife Hazard Management System (WHMS)**

---

## 1. Overview & Architecture

Widget **Current Weather & Bird Activity Conditions** mengintegrasikan kondisi meteorologis real-time sisi udara (*airside*) dengan sistem evaluasi risiko aktivitas satwa liar (*Bird Activity Risk*).

### Komponen Utama
- **Frontend Widget (`src/components/WeatherBirdActivityWidget.tsx`)**:
  - **Panel Kiri**: Kondisi cuaca utama (temperatur besar, feels-like, dew point, ikon kondisi cuaca, indikator badai petir tropis, curah hujan/presipitasi, *Mixing / Thermal Height*, serta banner *Bird Activity Risk* dengan badge terakreditasi).
  - **Panel Kanan ("Right Now")**: Metrik tersusun vertikal yang dipisahkan oleh divider:
    1. Arah & kecepatan angin (dalam knot sebagai standar penerbangan, derajat & kompas, serta gust).
    2. Kelembapan udara (RH %) & Dew Point.
    3. Tekanan udara permukaan & QNH resmi dari METAR.
    4. Jarak pandang / visibilitas (km, dan meter jika < 5 km).
    5. Indeks UV & Heat Index (indeks bahaya sengatan panas).
    6. Sub-panel METAR resmi WIII dari NOAA / ICAO Aviation Weather.
  - **Sistem Satuan Dinamis (Unit System Toggle)**:
    - `Aviation` (Default): °C, Knot (kt), hPa (QNH), Kilometer / Meter, Kaki (ft).
    - `Metric`: °C, km/h (atau m/s), hPa, Kilometer / Meter, Meter (m).
    - `Imperial`: °F, mph, inHg, Mil (mi), Kaki (ft).
    *Catatan: Satuan tidak pernah bercampur dalam satu kartu.*
  - **Tab Prakiraan (Forecast 12h)**: Proyeksi per jam untuk 12 jam ke depan dengan estimasi potensi risiko satwa per jam.

---

## 2. Cara Mengubah Konfigurasi Bandara (Koordinat, Elevasi, Timezone)

Konfigurasi bandara disimpan secara terpusat di berkas:
📂 `config/airportConfig.json`

```json
{
  "airport": {
    "id": "WIII",
    "icao": "WIII",
    "iata": "CGK",
    "name": "Soekarno-Hatta International Airport",
    "city": "Tangerang",
    "province": "Banten",
    "country": "Indonesia",
    "coordinates": {
      "latitude": -6.1256,
      "longitude": 106.6559,
      "aipVerification": "Verified against AIP Indonesia WIII AD 2.2 ARP S 06°07'32\" E 106°39'21\""
    },
    "elevation_m": 10.4,
    "elevation_ft": 34,
    "timezone": "Asia/Jakarta",
    "timezoneLabel": "WIB",
    "utcOffsetHours": 7,
    "sources": {
      "primary": "Open-Meteo Numerical Weather Prediction Model",
      "primaryDisclaimer": "Model data, not an airport sensor reading",
      "secondary": "AviationWeather.gov / NOAA & ICAO Official METAR Feed (WIII)",
      "cacheTtlMinutes": 10,
      "staleThresholdMinutes": 30
    }
  }
}
```

### Penjelasan Variabel:
1. **`latitude` & `longitude`**:
   - Titik Pusat Referensi Bandara (*Aerodrome Reference Point / ARP*).
   - Terverifikasi resmi sesuai **AIP Indonesia WIII AD 2.2**: Lintang `06° 07' 32" S` (-6.125556°) dan Bujur `106° 39' 21" E` (106.655833°).
   - Untuk mengubah bandara lain (misal WARR / Juanda atau WADD / Ngurah Rai), perbarui nilai lat/long di berkas ini.
2. **`elevation_m` & `elevation_ft`**:
   - Elevasi resmi bandara di atas permukaan laut (MSL): 10.4 m (34 ft).
3. **`timezone` & `timezoneLabel`**:
   - Timezone IANA: `"Asia/Jakarta"`. Waktu selalu diformat dalam zona waktu bandara (WIB, UTC+7, tanpa DST), bukan waktu lokal browser pengguna.
4. **`cacheTtlMinutes` & `staleThresholdMinutes`**:
   - Cache server: 10 menit.
   - Ambang kedaluwarsa (*stale threshold*): 30 menit. Jika data cuaca lebih tua dari 30 menit, banner peringatan menyala secara visual.

---

## 3. Cara Mengubah & Mengesahkan Ambang Batas Risiko Satwa (*Bird Activity Rules*)

Aturan evaluasi risiko burung dikonfigurasi melalui berkas:
📂 `config/birdActivityRules.json`

Setiap aturan memiliki prioritas (`priority`), tingkat risiko (`LOW`, `MODERATE`, `HIGH`), dan parameter meteorologis pemicu.

```json
{
  "version": "1.0.0",
  "airportIcao": "WIII",
  "approvalStatus": "PENDING_WILDLIFE_HAZARD_TEAM_APPROVAL",
  "rules": [
    {
      "id": "RULE_THUNDERSTORM_CONVECTIVE_DISPLACEMENT",
      "priority": 100,
      "riskLevel": "HIGH",
      "title": "Badai Petir Tropis & Perpindahan Kawanan Satwa Terkejut",
      "conditions": {
        "isThunderstorm": true
      },
      "thresholdsNote": "[PLACEHOLDER - BUTUH PERSETUJUAN TIM WHMS]: WMO code 95, 96, 99."
    },
    {
      "id": "RULE_CREPUSCULAR_PEAK_LOW_VISIBILITY",
      "priority": 90,
      "riskLevel": "HIGH",
      "title": "Jam Puncak Kerepuskular Fajar/Senja dengan Visibilitas Rendah",
      "conditions": {
        "timeOfDay": "CREPUSCULAR",
        "maxVisibilityKm": 4.0
      },
      "thresholdsNote": "[PLACEHOLDER]: Jam fajar 05:30-07:30 WIB / senja 17:30-18:45 WIB & Visibilitas < 4.0 km."
    },
    {
      "id": "RULE_THERMAL_SOARING_CONDITIONS",
      "priority": 75,
      "riskLevel": "MODERATE",
      "title": "Thermal Lift Tinggi & Angin Ringan (Potensi Burung Pemangsa Melayang)",
      "conditions": {
        "minThermalHeightM": 750,
        "maxWindSpeedKt": 9
      },
      "thresholdsNote": "[PLACEHOLDER]: Thermal height > 750m dan angin < 9 knot."
    }
  ]
}
```

### Langkah Kalibrasi oleh Tim Wildlife Hazard Bandara:
1. **Mengubah Ambang Batas Kecepatan Angin**:
   Edit `maxWindSpeedKt` atau `minWindSpeedKt` sesuai pengamatan jenis satwa target (misal: kuntul kerbau tidak terbang jika angin > 18 kt).
2. **Mengubah Ketinggian Kolom Termal (*Thermal Height*)**:
   Edit `minThermalHeightM` (misal dinaikkan ke 850m jika elang bondol baru aktif berputar di atas 850m).
3. **Mengesahkan Status**:
   Ubah `"approvalStatus": "APPROVED_BY_WHMS_DEPT_HEAD"` setelah divalidasi oleh Wildlife Hazard Management Unit.

---

## 4. Metodologi Perhitungan Khusus

### A. Mixing / Thermal Height
- **Formula**: `125 × (T - Td)` meter AGL.
- **Penanganan Edge Case**:
  - Jika data temperatur atau dew point kosong: mengembalikan nilai `null` (ditampilkan sebagai `--`).
  - Jika `T ≤ Td` (kondensasi permukaan, kabut, atau udara jenuh 100%): mixing height ditetapkan sebesar `0 m` (tidak pernah bernilai negatif).
  - Dilengkapi disclaimer resmi bahwa kondisi tropis pesisir lembap membuat nilai estimasi ini sebagai panduan operasional indikatif dan bukan angka resmi ICAO.

### B. Heat Index (Indeks Sengatan Panas)
- Dihitung menggunakan persamaan regresi NOAA Rothfusz saat `T ≥ 27°C` dan `RH ≥ 40%`.

---

## 5. Sumber Data & Lisensi Legal
- **Data Primer**: Open-Meteo API (Akurasi prakiraan numerik resolusi tinggi, bebas biaya, tanpa API key). Dilabeli: *"Model data, not an airport sensor reading"*.
- **Data Sekunder**: AviationWeather.gov (NOAA / ICAO Official METAR Feed WIII). Mengambil data sensor resmi stasiun meteorologi bandara secara berizin dan legal tanpa web scraping.

---

## 6. Menjalankan Unit Tests

Unit tests mencakup:
- Konversi satuan (Aviation, Metric, Imperial) tanpa pencampuran.
- Pemformatan zona waktu WIB (Asia/Jakarta, UTC+7).
- Perhitungan thermal height termasuk kasus batas `T - Td ≤ 0`.
- Logika deteksi data kedaluwarsa (> 30 menit).
- Evaluasi aturan pemicu risiko satwa.

Jalankan perintah berikut di terminal:
```bash
npm test
```
atau
```bash
npx tsx tests/weatherCalculations.test.ts
```

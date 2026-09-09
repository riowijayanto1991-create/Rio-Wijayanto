import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Save, 
  Download, 
  Share2, 
  CheckCircle2, 
  Plus, 
  Trash2,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { OccurrenceReport, Pleton, Dinas, Cuaca, OccurrenceStatus } from '../types';
import { exportOccurrencePDF } from '../utils/pdfExport';

interface OccurrenceFormProps {
  onSaveReport: (report: OccurrenceReport) => void;
  onOpenBroadcast: (report: OccurrenceReport) => void;
}

export const OccurrenceForm: React.FC<OccurrenceFormProps> = ({
  onSaveReport,
  onOpenBroadcast
}) => {
  // I. Data Occurrence
  const [hariTanggal, setHariTanggal] = useState<string>(
    new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  );
  const [waktuKejadian, setWaktuKejadian] = useState<string>('07:45 WIB');
  const [pleton, setPleton] = useState<Pleton>('Pleton 1');
  const [dinas, setDinas] = useState<Dinas>('Dinas Pagi (06:00 - 14:00)');
  const [pod, setPod] = useState<string>('');
  const [lokasi, setLokasi] = useState<string>('Threshold Runway 25L');
  const [gridLocation, setGridLocation] = useState<string>('Grid G12');
  const [runwayTaxiwayArea, setRunwayTaxiwayArea] = useState<string>('Runway 25L - Stopway & PAPI Light Area');
  const [jenisOccurrence, setJenisOccurrence] = useState<string>(
    'Kawanan Burung Kuntul (Flock) melintas rendah di jalur glide path saat pesawat mendekati touchdown.'
  );

  // II. Kronologi Kejadian
  const [kronologi, setKronologi] = useState<string>(
    'Pukul 07:43 WIB ATC TWR menginformasikan pilot GA-152 melihat kawanan burung sekitar 100 kaki di depan threshold 25L. Petugas WHU yang sedang siaga di Holding Bay segera merespon ke lokasi runway shoulder, mengamati sekelompok 15 ekor burung kuntul terbang melingkar. Petugas segera menembakkan bird banger 2 butir dan menyalakan sirine. Kawanan burung langsung bubar ke arah luar perimeter selatan (rawa-rawa) pada pukul 07:47 WIB.'
  );

  // III. Identifikasi Satwa
  const [jenisSatwa, setJenisSatwa] = useState<string>('Burung Kuntul Kerbau (Bubulcus ibis)');
  const [jumlahSatwa, setJumlahSatwa] = useState<number>(15);
  const [kondisiSatwa, setKondisiSatwa] = useState<'Hidup' | 'Mati' | 'Terluka' | 'Tidak teridentifikasi'>('Hidup');
  const [aktivitasPergerakan, setAktivitasPergerakan] = useState<string>(
    'Terbang melingkar pada ketinggian 15-25 meter di atas threshold lalu hinggap di rumput shoulder.'
  );

  // IV. Kondisi Operasional
  const [cuaca, setCuaca] = useState<Cuaca>('Cerah');
  const [suhu, setSuhu] = useState<string>('28°C');
  const [visibility, setVisibility] = useState<string>('> 10 km');
  const [kondisiRunwayTaxiway, setKondisiRunwayTaxiway] = useState<string>('Kering, bersih');
  const [aktivitasPergerakanPesawat, setAktivitasPergerakanPesawat] = useState<string>(
    'Sangat Padat (Pesawat B737-800 GA-152 posisi final approach 4 NM)'
  );

  // V. Potensi Hazard
  const [jenisPotensiHazard, setJenisPotensiHazard] = useState<string>(
    'Potensi tabrakan burung terhadap kaca kokpit atau mesin pesawat saat flare landing.'
  );
  const [potensiDampakOperasi, setPotensiDampakOperasi] = useState<string>(
    'Risiko Go-Around (missed approach) atau bird strike ingestion berkecepatan tinggi.'
  );

  // VI. Tindakan yang Dilakukan
  const [deteksiMonitoring, setDeteksiMonitoring] = useState<string>(
    'Observasi visual menggunakan binokular dari pos holding WHU.'
  );
  const [mobileDispersal, setMobileDispersal] = useState<string>(
    'Kendaraan patroli meluncur ke runway strip mengarahkan arah pengusiran menjauhi centerline.'
  );
  const [auditoryVisualDeterrent, setAuditoryVisualDeterrent] = useState<string>(
    'Penembakan 2 butir pyrotechnic acoustic banger.'
  );
  const [koordinasi, setKoordinasi] = useState<string>(
    'Koordinasi real-time via radio komunikasi aeronautika VHF dengan TWR Controller (Frekuensi 118.1 MHz).'
  );
  const [tindakanLainnya, setTindakanLainnya] = useState<string>(
    'Konfirmasi visual ke pilot GA-152 melalui TWR bahwa runway telah clear.'
  );

  // VII. Hasil Penanganan
  const [hasilPenanganan, setHasilPenanganan] = useState<string>(
    'Kawanan burung berhasil dibubarkan ke luar bandara dalam waktu kurang dari 2 menit. Pesawat GA-152 mendarat selamat pukul 07:49 WIB tanpa kendala.'
  );
  const [status, setStatus] = useState<OccurrenceStatus>('Selesai');

  // VIII. Rekomendasi / Mitigasi
  const [mitigasiList, setMitigasiList] = useState<string[]>([
    'Tingkatkan siaga visual di threshold 25L selama sisa dinas pagi.',
    'Cek area genangan parit pembuangan air di luar perimeter selatan yang menjadi tempat berkumpul burung.',
    'Koordinasikan pemotongan rumput berkala dengan unit landscape agar tidak mengundang cacing/serangga.'
  ]);

  // IX. Dokumentasi
  const [fotoVideoAda, setFotoVideoAda] = useState<boolean>(true);
  const [keteranganDokumentasi, setKeteranganDokumentasi] = useState<string>(
    'Foto dokumentasi kawanan burung dan bekas selongsong pyrotechnic terarsip di unit WHU.'
  );

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const currentReport: OccurrenceReport = {
    id: `occ-${Date.now()}`,
    reportNumber: `WHU/OCC/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString(),
    hariTanggal,
    waktuKejadian,
    pleton,
    dinas,
    pod,
    lokasi,
    gridLocation,
    runwayTaxiwayArea,
    jenisOccurrence,
    kronologi,
    jenisSatwa,
    jumlahSatwa,
    kondisiSatwa,
    aktivitasPergerakan,
    cuaca,
    suhu,
    visibility,
    kondisiRunwayTaxiway,
    aktivitasPergerakanPesawat,
    jenisPotensiHazard,
    potensiDampakOperasi,
    tindakan: {
      deteksiMonitoring,
      mobileDispersal,
      auditoryVisualDeterrent,
      koordinasi,
      tindakanLainnya
    },
    hasilPenanganan,
    status,
    rekomendasiMitigasi: mitigasiList.filter(m => m.trim() !== ''),
    fotoVideoAda,
    keteranganDokumentasi
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveReport(currentReport);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <form onSubmit={handleSave} className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 text-slate-800 space-y-8">
      {/* Official Header */}
      <div className="border-b border-amber-300 pb-5 text-center">
        <span className="text-xs font-bold text-amber-800 uppercase tracking-widest">
          PT ANGKASA PURA INDONESIA - AIRSIDE OPERATION
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 uppercase">
          2. LAPORAN OCCURRENCE WILDLIFE HAZARD
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Formulir Pelaporan Kejadian / Gangguan Satwa Liar di Area Pergerakan Pesawat
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span><strong>Berhasil Disimpan!</strong> Laporan Occurrence telah tercatat ke sistem dan dashboard.</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenBroadcast(currentReport)}
            className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            Kirim Broadcast WA
          </button>
        </div>
      )}

      {/* I. DATA OCCURRENCE */}
      <div className="space-y-4">
        <div className="bg-amber-50 px-3 py-1.5 rounded text-sm font-bold text-amber-900 border-l-4 border-amber-600">
          I. DATA OCCURRENCE
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hari / Tanggal</label>
            <input
              type="text"
              value={hariTanggal}
              onChange={e => setHariTanggal(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Waktu Kejadian</label>
            <input
              type="text"
              value={waktuKejadian}
              onChange={e => setWaktuKejadian(e.target.value)}
              placeholder="e.g. 07:45 WIB"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pleton</label>
            <select
              value={pleton}
              onChange={e => setPleton(e.target.value as Pleton)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 bg-white"
            >
              <option value="Pleton 1">Pleton 1</option>
              <option value="Pleton 2">Pleton 2</option>
              <option value="Pleton 3">Pleton 3</option>
              <option value="Pleton 4">Pleton 4</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dinas</label>
            <select
              value={dinas}
              onChange={e => setDinas(e.target.value as Dinas)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 bg-white"
            >
              <option value="Dinas Pagi (06:00 - 14:00)">Dinas Pagi (06:00 - 14:00)</option>
              <option value="Dinas Siang (14:00 - 22:00)">Dinas Siang (14:00 - 22:00)</option>
              <option value="Dinas Malam (22:00 - 06:00)">Dinas Malam (22:00 - 06:00)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Petugas Pelapor / Pelaksana (Diisi Manual)
            </label>
            <input
              type="text"
              value={pod}
              onChange={e => setPod(e.target.value)}
              placeholder="Ketik Nama Lengkap Petugas Pelapor..."
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 bg-white"
              required
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Diisi manual nama personel unit WHU yang mencatat/menangani kejadian.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Lokasi Detail</label>
            <input
              type="text"
              value={lokasi}
              onChange={e => setLokasi(e.target.value)}
              placeholder="e.g. Threshold Runway 25L"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Koordinat Grid Map CGK 2025</span>
              <span className="text-[10px] text-amber-700 font-mono">14 Col × 7 Row (A-G)</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={gridLocation}
                onChange={e => setGridLocation(e.target.value)}
                placeholder="e.g. Grid G12"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 font-mono font-bold text-amber-900"
              />
              <select
                onChange={e => setGridLocation(e.target.value)}
                className="px-2 py-2 border border-slate-300 rounded bg-slate-50 text-xs font-mono"
                defaultValue=""
              >
                <option value="" disabled>Pilih Grid...</option>
                <optgroup label="Runway 3 (06-24)">
                  <option value="Grid A4">Grid A4 (THR 06)</option>
                  <option value="Grid A7">Grid A7 (Mid RWY 3)</option>
                  <option value="Grid A11">Grid A11 (THR 24)</option>
                </optgroup>
                <optgroup label="Runway 2 (07L-25R)">
                  <option value="Grid B3">Grid B3 (THR 07L)</option>
                  <option value="Grid C5">Grid C5 (TWY Alpha 2)</option>
                  <option value="Grid C8">Grid C8 (TWY C3)</option>
                  <option value="Grid C12">Grid C12 (THR 25R)</option>
                </optgroup>
                <optgroup label="Runway 1 (07R-25L)">
                  <option value="Grid F3">Grid F3 (THR 07R)</option>
                  <option value="Grid F7">Grid F7 (Infield RWY 1)</option>
                  <option value="Grid G12">Grid G12 (THR 25L)</option>
                </optgroup>
                <optgroup label="Apron & Terminals">
                  <option value="Grid E7">Grid E7 (Terminal 1)</option>
                  <option value="Grid D7">Grid D7 (Terminal 2)</option>
                  <option value="Grid D11">Grid D11 (Terminal 3)</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Runway / Taxiway / Area</label>
            <input
              type="text"
              value={runwayTaxiwayArea}
              onChange={e => setRunwayTaxiwayArea(e.target.value)}
              placeholder="e.g. RWY 25L Stopway / TWY Alpha"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jenis Occurrence</label>
            <input
              type="text"
              value={jenisOccurrence}
              onChange={e => setJenisOccurrence(e.target.value)}
              placeholder="Deskripsi singkat jenis gangguan..."
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>
        </div>
      </div>

      {/* II. KRONOLOGI KEJADIAN */}
      <div className="space-y-3">
        <div className="bg-amber-50 px-3 py-1.5 rounded text-sm font-bold text-amber-900 border-l-4 border-amber-600">
          II. KRONOLOGI KEJADIAN
        </div>
        <textarea
          rows={4}
          value={kronologi}
          onChange={e => setKronologi(e.target.value)}
          placeholder="Tuliskan urutan menit demi menit kejadian, pergerakan pesawat, dan tindakan awal..."
          className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
          required
        />
      </div>

      {/* III. IDENTIFIKASI SATWA */}
      <div className="space-y-3">
        <div className="bg-amber-50 px-3 py-1.5 rounded text-sm font-bold text-amber-900 border-l-4 border-amber-600">
          III. IDENTIFIKASI SATWA
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jenis / Spesies</label>
            <input
              type="text"
              value={jenisSatwa}
              onChange={e => setJenisSatwa(e.target.value)}
              placeholder="e.g. Kuntul Kerbau / Anjing Liar"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jumlah (Ekor)</label>
            <input
              type="number"
              min={1}
              value={jumlahSatwa}
              onChange={e => setJumlahSatwa(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 font-bold"
              required
            />
          </div>
        </div>

        {/* Checkbox Options for Kondisi */}
        <div className="text-xs">
          <label className="block font-semibold text-slate-700 mb-2">Kondisi Satwa :</label>
          <div className="flex flex-wrap gap-4">
            {(['Hidup', 'Mati', 'Terluka', 'Tidak teridentifikasi'] as const).map(option => (
              <label key={option} className="flex items-center space-x-1.5 cursor-pointer font-medium text-slate-700">
                <input
                  type="radio"
                  name="kondisiSatwa"
                  checked={kondisiSatwa === option}
                  onChange={() => setKondisiSatwa(option)}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                />
                <span>■ {option}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 text-xs mb-1">Aktivitas / Pergerakan :</label>
          <input
            type="text"
            value={aktivitasPergerakan}
            onChange={e => setAktivitasPergerakan(e.target.value)}
            placeholder="e.g. Bertengger di PAPI Light, terbang menyeberang rwy..."
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* IV. KONDISI OPERASIONAL */}
      <div className="space-y-3">
        <div className="bg-amber-50 px-3 py-1.5 rounded text-sm font-bold text-amber-900 border-l-4 border-amber-600">
          IV. KONDISI OPERASIONAL
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cuaca</label>
            <select
              value={cuaca}
              onChange={e => setCuaca(e.target.value as Cuaca)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 bg-white"
            >
              <option value="Cerah">Cerah</option>
              <option value="Berawan">Berawan</option>
              <option value="Hujan Ringan">Hujan Ringan</option>
              <option value="Hujan Lebat">Hujan Lebat</option>
              <option value="Berkabut">Berkabut</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Suhu</label>
            <input
              type="text"
              value={suhu}
              onChange={e => setSuhu(e.target.value)}
              placeholder="28°C"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Visibility</label>
            <input
              type="text"
              value={visibility}
              onChange={e => setVisibility(e.target.value)}
              placeholder="> 10 km"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kondisi Runway / Taxiway</label>
            <input
              type="text"
              value={kondisiRunwayTaxiway}
              onChange={e => setKondisiRunwayTaxiway(e.target.value)}
              placeholder="Kering / Basah"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Aktivitas Pergerakan Pesawat</label>
            <input
              type="text"
              value={aktivitasPergerakanPesawat}
              onChange={e => setAktivitasPergerakanPesawat(e.target.value)}
              placeholder="e.g. Padat (Pesawat mendekati final approach)"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* V. POTENSI HAZARD */}
      <div className="space-y-3">
        <div className="bg-amber-50 px-3 py-1.5 rounded text-sm font-bold text-amber-900 border-l-4 border-amber-600">
          V. POTENSI HAZARD
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jenis Potensi Hazard :</label>
            <input
              type="text"
              value={jenisPotensiHazard}
              onChange={e => setJenisPotensiHazard(e.target.value)}
              placeholder="Resiko bird strike engine ingestion..."
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Potensi Dampak Operasi :</label>
            <input
              type="text"
              value={potensiDampakOperasi}
              onChange={e => setPotensiDampakOperasi(e.target.value)}
              placeholder="Go-around pesawat, runway closed, dll."
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* VI. TINDAKAN YANG DILAKUKAN */}
      <div className="space-y-3">
        <div className="bg-amber-50 px-3 py-1.5 rounded text-sm font-bold text-amber-900 border-l-4 border-amber-600">
          VI. TINDAKAN YANG DILAKUKAN
        </div>

        <div className="space-y-2 text-xs">
          <div>
            <label className="block text-slate-600 mb-0.5">1. Deteksi / monitoring :</label>
            <input
              type="text"
              value={deteksiMonitoring}
              onChange={e => setDeteksiMonitoring(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-0.5">2. Mobile dispersal :</label>
            <input
              type="text"
              value={mobileDispersal}
              onChange={e => setMobileDispersal(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-0.5">3. Auditory / visual deterrent :</label>
            <input
              type="text"
              value={auditoryVisualDeterrent}
              onChange={e => setAuditoryVisualDeterrent(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-0.5">4. Koordinasi :</label>
            <input
              type="text"
              value={koordinasi}
              onChange={e => setKoordinasi(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-0.5">5. Tindakan lainnya :</label>
            <input
              type="text"
              value={tindakanLainnya}
              onChange={e => setTindakanLainnya(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* VII. HASIL PENANGANAN */}
      <div className="space-y-3">
        <div className="bg-amber-50 px-3 py-1.5 rounded text-sm font-bold text-amber-900 border-l-4 border-amber-600">
          VII. HASIL PENANGANAN
        </div>
        <textarea
          rows={3}
          value={hasilPenanganan}
          onChange={e => setHasilPenanganan(e.target.value)}
          placeholder="Hasil pengusiran atau penanganan..."
          className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
        />

        <div className="text-xs pt-2">
          <label className="block font-semibold text-slate-700 mb-2">Status Penanganan :</label>
          <div className="flex flex-wrap gap-4">
            {(['Selesai', 'Dalam Monitoring', 'Perlu Tindak Lanjut'] as const).map(opt => (
              <label key={opt} className="flex items-center space-x-1.5 cursor-pointer font-semibold text-slate-800">
                <input
                  type="radio"
                  name="statusOccurrence"
                  checked={status === opt}
                  onChange={() => setStatus(opt)}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                />
                <span>■ {opt}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* VIII. REKOMENDASI / MITIGASI */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-amber-50 px-3 py-1.5 rounded border-l-4 border-amber-600">
          <span className="text-sm font-bold text-amber-900">VIII. REKOMENDASI / MITIGASI</span>
          <button
            type="button"
            onClick={() => setMitigasiList([...mitigasiList, ''])}
            className="text-xs text-amber-800 hover:text-amber-900 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Rekomendasi
          </button>
        </div>

        <div className="space-y-2">
          {mitigasiList.map((item, idx) => (
            <div key={idx} className="flex items-start space-x-2 text-xs">
              <span className="font-bold text-slate-600 mt-2">{idx + 1}.</span>
              <input
                type="text"
                value={item}
                onChange={e => {
                  const next = [...mitigasiList];
                  next[idx] = e.target.value;
                  setMitigasiList(next);
                }}
                placeholder="Rekomendasi mitigasi..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
              />
              {mitigasiList.length > 1 && (
                <button
                  type="button"
                  onClick={() => setMitigasiList(mitigasiList.filter((_, i) => i !== idx))}
                  className="p-2 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* IX. DOKUMENTASI */}
      <div className="space-y-3">
        <div className="bg-amber-50 px-3 py-1.5 rounded text-sm font-bold text-amber-900 border-l-4 border-amber-600">
          IX. DOKUMENTASI
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center space-x-6">
            <span className="font-semibold text-slate-700">Foto / Video :</span>
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="radio"
                name="fotoVideoAda"
                checked={fotoVideoAda}
                onChange={() => setFotoVideoAda(true)}
                className="w-4 h-4 text-amber-600"
              />
              <span>■ Ada</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="radio"
                name="fotoVideoAda"
                checked={!fotoVideoAda}
                onChange={() => setFotoVideoAda(false)}
                className="w-4 h-4 text-amber-600"
              />
              <span>■ Tidak Ada</span>
            </label>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Keterangan Dokumentasi :</label>
            <input
              type="text"
              value={keteranganDokumentasi}
              onChange={e => setKeteranganDokumentasi(e.target.value)}
              placeholder="Catatan berkas bukti foto/video..."
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => exportOccurrencePDF(currentReport)}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <Download className="w-4 h-4 text-amber-600" />
          Cetak PDF Resmi
        </button>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onOpenBroadcast(currentReport)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Notifikasi WhatsApp
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-md cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Simpan Laporan Occurrence
          </button>
        </div>
      </div>
    </form>
  );
};

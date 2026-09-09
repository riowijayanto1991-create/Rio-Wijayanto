import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Save, 
  Download, 
  Share2, 
  CheckCircle2, 
  Plus, 
  Trash2,
  Plane,
  FileSpreadsheet
} from 'lucide-react';
import { 
  WildlifeStrikeReport, 
  Pleton, 
  Dinas, 
  SourceInfo, 
  FlightPhase, 
  StrikeDamage, 
  StrikeStatus 
} from '../types';
import { exportStrikePDF } from '../utils/pdfExport';

interface StrikeFormProps {
  onSaveReport: (report: WildlifeStrikeReport) => void;
  onOpenBroadcast: (report: WildlifeStrikeReport) => void;
}

export const StrikeForm: React.FC<StrikeFormProps> = ({
  onSaveReport,
  onOpenBroadcast
}) => {
  // I. DATA KEJADIAN
  const [hariTanggal, setHariTanggal] = useState<string>(
    new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  );
  const [waktuKejadian, setWaktuKejadian] = useState<string>('10:40 WIB');
  const [pleton, setPleton] = useState<Pleton>('Pleton 2');
  const [dinas, setDinas] = useState<Dinas>('Dinas Pagi (06:00 - 14:00)');
  const [pod, setPod] = useState<string>('');
  const [lokasi, setLokasi] = useState<string>('Runway 25R Touchdown Zone (Intersection Taxiway C3)');
  const [gridLocation, setGridLocation] = useState<string>('Grid C8');
  const [runwayTaxiway, setRunwayTaxiway] = useState<string>('Runway 25R');
  const [sumberInformasi, setSumberInformasi] = useState<SourceInfo>('Pilot/Crew');
  const [sumberLainnya, setSumberLainnya] = useState<string>('');

  // II. DATA PESAWAT
  const [operatorAirline, setOperatorAirline] = useState<string>('Garuda Indonesia');
  const [flightNumber, setFlightNumber] = useState<string>('GA-320');
  const [aircraftType, setAircraftType] = useState<string>('Boeing 737-800 NG');
  const [registration, setRegistration] = useState<string>('PK-GMF');
  const [origin, setOrigin] = useState<string>('SUB (Surabaya)');
  const [destination, setDestination] = useState<string>('CGK (Jakarta)');
  const [posisiPesawat, setPosisiPesawat] = useState<string>('Touchdown & Roll Out Runway 25R');

  // III. DATA WILDLIFE
  const [jenisWildlife, setJenisWildlife] = useState<string>('Burung Layang-layang Api (Hirundo rustica)');
  const [jumlahWildlife, setJumlahWildlife] = useState<number>(1);
  const [identifikasi, setIdentifikasi] = useState<'Teridentifikasi' | 'Belum teridentifikasi'>('Teridentifikasi');
  const [kondisiWildlife, setKondisiWildlife] = useState<'Hidup' | 'Mati' | 'Terluka' | 'Carcass/Sisa' | 'Tidak ditemukan'>('Carcass/Sisa');

  // IV. KRONOLOGI WILDLIFE STRIKE
  const [kronologiStrike, setKronologiStrike] = useState<string>(
    'Pukul 10:40 WIB, Pilot in Command GA-320 melaporkan via ground control bahwa saat menyentuh landasan (touchdown) pada kecepatan sekitar 130 knots, teramati burung kecil menabrak bagian sayap kiri depan. Pesawat berhasil keluar runway di Taxiway Charlie dengan selamat menuju gate 24 Terminal 3. Unit WHU dan AMC segera diinstruksikan melakukan runway inspection.'
  );
  const [fasePenerbangan, setFasePenerbangan] = useState<FlightPhase>('Landing roll');
  const [bagianPesawatTerdampak, setBagianPesawatTerdampak] = useState<string>(
    'Leading Edge Sayap Kiri (Port Wing) & Pitot Tube Area'
  );

  // V. DAMPAK TERHADAP PESAWAT
  const [indikasiKerusakan, setIndikasiKerusakan] = useState<StrikeDamage>('Tidak ada');
  const [bagianKerusakan, setBagianKerusakan] = useState<string>(
    'Tidak ditemukan penyok (dent) atau retak pada wing skin. Terdapat bercak darah dan sisa bulu halus pada leading edge slat #2.'
  );
  const [dampakPenerbangan, setDampakPenerbangan] = useState<string>(
    'Normal, pesawat parkir on-block di apron tanpa pembatalan jadwal selanjutnya.'
  );
  const [keteranganDampak, setKeteranganDampak] = useState<string>(
    'Teknisi maskapai melakukan swab sisa bangkai dan pembersihan residu darah.'
  );

  // VI. TINDAKAN WILDLIFE HAZARD UNIT
  const [penerimaanInformasi, setPenerimaanInformasi] = useState<string>(
    'Laporan diterima dari AMC Officer melalui HT Channel 2 pukul 10:42 WIB.'
  );
  const [verifikasiLokasi, setVerifikasiLokasi] = useState<string>(
    'Petugas WHU meluncur bersama Runway Sweeper ke RWY 25R pukul 10:45 WIB.'
  );
  const [pengumpulanEvidence, setPengumpulanEvidence] = useState<string>(
    'Ditemukan sisa bangkai burung di centerline RWY 25R jarak 1.200m dari threshold.'
  );
  const [pengamananPembersihan, setPengamananPembersihan] = useState<string>(
    'Runway sweeping dilakukan oleh mobil penyapu, landasan dinyatakan aman kembali pukul 10:52 WIB.'
  );
  const [dispersalPengendalian, setDispersalPengendalian] = useState<string>(
    'Pengusiran preventif terhadap burung lain yang terbang di sekitarnya.'
  );
  const [koordinasi, setKoordinasi] = useState<string>(
    'Lapor ke Safety Manager (CASO), AMC, Tower ATC, dan Chief of Airport Operation Center.'
  );
  const [dokumentasi, setDokumentasi] = useState<string>(
    'Pengambilan foto bangkai, tagging GPS koordinat, dan pengisian form ICAO Bird Strike Doc 9388.'
  );

  // VII. HASIL INVESTIGASI AWAL
  const [investigasiSpesies, setInvestigasiSpesies] = useState<string>('Hirundo rustica (Barn Swallow)');
  const [investigasiHotspot, setInvestigasiHotspot] = useState<string>('Runway 25R Tengah / Intersection C3');
  const [investigasiKondisiHabitat, setInvestigasiKondisiHabitat] = useState<string>(
    'Kering, cuaca panas terik menghasilkan thermal updraft yang disukai burung layang-layang untuk berburu laron/serangga.'
  );
  const [investigasiPotensiAttractant, setInvestigasiPotensiAttractant] = useState<string>(
    'Flock serangga terbang di atas pantulan panas aspal landasan pacu.'
  );
  const [investigasiPolaFlyway, setInvestigasiPolaFlyway] = useState<string>('Melintas diagonal timur ke barat.');
  const [investigasiIndikasiPenyebab, setInvestigasiIndikasiPenyebab] = useState<string>(
    'Pergerakan burung soliter yang terbang meluncur menyeberang tepat saat pesawat touchdown roll.'
  );

  // VIII. MITIGASI DAN TINDAK LANJUT
  const [mitigasiList, setMitigasiList] = useState<string[]>([
    'Peningkatan frekuensi sweeping termal pada siang hari saat aktivitas serangga aspal meningkat.',
    'Optimalisasi penggunaan sound cannon di titik C3 saat periode migrasi burung swallow (September - November).',
    'Pengambilan sampel bulu dikirim ke Laboratorium Forensik Zoologi untuk verifikasi subspesies.'
  ]);
  const [rekomendasi, setRekomendasi] = useState<string>(
    'Diusulkan pemasangan unit repellent ultra-sonik pada tiang lampu Taxiway C3 guna mencegah serangga berkumpul.'
  );

  // IX. DOKUMENTASI / EVIDENCE
  const [fotoSatwaCarcass, setFotoSatwaCarcass] = useState<boolean>(true);
  const [fotoLokasi, setFotoLokasi] = useState<boolean>(true);
  const [fotoKerusakan, setFotoKerusakan] = useState<boolean>(false);
  const [video, setVideo] = useState<boolean>(false);
  const [evidenceLain, setEvidenceLain] = useState<string>('Sampel bulu dan tagging GPS: Lat -6.1254°, Long 106.6578°');

  // X. STATUS LAPORAN
  const [statusLaporan, setStatusLaporan] = useState<StrikeStatus>('Final Report');
  const [tindakLanjut, setTindakLanjut] = useState<boolean>(false);
  const [keteranganStatus, setKeteranganStatus] = useState<string>(
    'Investigasi telah ditutup, laporan resmi ICAO IBIS diteruskan ke Otoritas Bandara Wilayah I.'
  );

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const currentReport: WildlifeStrikeReport = {
    id: `strike-${Date.now()}`,
    reportNumber: `WHU/STRIKE/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString(),
    hariTanggal,
    waktuKejadian,
    pleton,
    dinas,
    pod,
    lokasi,
    gridLocation,
    runwayTaxiway,
    sumberInformasi,
    sumberInformasiLainnya: sumberLainnya,
    operatorAirline,
    flightNumber,
    aircraftType,
    registration,
    origin,
    destination,
    posisiPesawat,
    jenisWildlife,
    jumlahWildlife,
    identifikasi,
    kondisiWildlife,
    kronologiStrike,
    fasePenerbangan,
    bagianPesawatTerdampak,
    indikasiKerusakan,
    bagianKerusakan,
    dampakPenerbangan,
    keteranganDampak,
    tindakanUnit: {
      penerimaanInformasi,
      verifikasiLokasi,
      pengumpulanEvidence,
      pengamananPembersihan,
      dispersalPengendalian,
      koordinasi,
      dokumentasi
    },
    investigasiAwal: {
      spesies: investigasiSpesies,
      lokasiHotspot: investigasiHotspot,
      kondisiHabitat: investigasiKondisiHabitat,
      potensiAttractant: investigasiPotensiAttractant,
      polaFlyway: investigasiPolaFlyway,
      indikasiPenyebab: investigasiIndikasiPenyebab
    },
    mitigasi: mitigasiList.filter(m => m.trim() !== ''),
    rekomendasi,
    evidence: {
      fotoSatwaCarcass,
      fotoLokasi,
      fotoKerusakan,
      video,
      evidenceLain
    },
    statusLaporan,
    tindakLanjut,
    keteranganStatus
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveReport(currentReport);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <form onSubmit={handleSave} className="max-w-4xl mx-auto bg-white rounded-xl border border-red-200 shadow-sm p-6 sm:p-8 text-slate-800 space-y-8">
      {/* Official Header */}
      <div className="border-b-2 border-red-600 pb-5 text-center">
        <span className="text-xs font-bold text-red-700 uppercase tracking-widest">
          PT ANGKASA PURA INDONESIA - AIRSIDE SAFETY &amp; QUALITY
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 uppercase flex items-center justify-center gap-2">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          3. LAPORAN WILDLIFE STRIKE (ICAO DOC 9388)
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Formulir Investigasi &amp; Pelaporan Tabrakan Satwa Liar Sesuai Standar ICAO IBIS
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span><strong>Laporan Strike Berhasil Disimpan!</strong> Segera kirimkan notifikasi Flash Report ke Manajemen.</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenBroadcast(currentReport)}
            className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            Broadcast Flash Report WA
          </button>
        </div>
      )}

      {/* I. DATA KEJADIAN */}
      <div className="space-y-4">
        <div className="bg-red-50 px-3 py-1.5 rounded text-sm font-bold text-red-900 border-l-4 border-red-600">
          I. DATA KEJADIAN
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hari / Tanggal</label>
            <input
              type="text"
              value={hariTanggal}
              onChange={e => setHariTanggal(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Waktu Kejadian</label>
            <input
              type="text"
              value={waktuKejadian}
              onChange={e => setWaktuKejadian(e.target.value)}
              placeholder="10:40 WIB"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pleton</label>
            <select
              value={pleton}
              onChange={e => setPleton(e.target.value as Pleton)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500 bg-white"
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
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500 bg-white"
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
              placeholder="Ketik Nama Lengkap Petugas Pelapor / Person on Duty..."
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500 bg-white"
              required
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Diisi manual nama personel unit WHU yang merespon/melaporkan insiden.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Lokasi Detail</label>
            <input
              type="text"
              value={lokasi}
              onChange={e => setLokasi(e.target.value)}
              placeholder="e.g. RWY 25R Touchdown Zone"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Koordinat Grid Map CGK 2025</span>
              <span className="text-[10px] text-sky-700 font-mono">14 Col × 7 Row (A-G)</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={gridLocation}
                onChange={e => setGridLocation(e.target.value)}
                placeholder="e.g. Grid C8"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500 font-mono font-bold text-sky-800"
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

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Runway / Taxiway</label>
            <input
              type="text"
              value={runwayTaxiway}
              onChange={e => setRunwayTaxiway(e.target.value)}
              placeholder="e.g. Runway 25R"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
              required
            />
          </div>
        </div>

        {/* Sumber Informasi */}
        <div className="text-xs pt-1">
          <label className="block font-semibold text-slate-700 mb-2">Sumber Informasi :</label>
          <div className="flex flex-wrap gap-4">
            {(['ATC', 'Pilot/Crew', 'AMC', 'WHU', 'Lainnya'] as const).map(src => (
              <label key={src} className="flex items-center space-x-1.5 cursor-pointer font-medium text-slate-700">
                <input
                  type="radio"
                  name="sumberInformasi"
                  checked={sumberInformasi === src}
                  onChange={() => setSumberInformasi(src)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500"
                />
                <span>■ {src}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* II. DATA PESAWAT */}
      <div className="space-y-4">
        <div className="bg-red-50 px-3 py-1.5 rounded text-sm font-bold text-red-900 border-l-4 border-red-600">
          II. DATA PESAWAT
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Operator / Airline</label>
            <input
              type="text"
              value={operatorAirline}
              onChange={e => setOperatorAirline(e.target.value)}
              placeholder="e.g. Garuda Indonesia"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Flight Number</label>
            <input
              type="text"
              value={flightNumber}
              onChange={e => setFlightNumber(e.target.value)}
              placeholder="e.g. GA-320"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500 font-bold"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Aircraft Type</label>
            <input
              type="text"
              value={aircraftType}
              onChange={e => setAircraftType(e.target.value)}
              placeholder="e.g. B737-800 / A320"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Registration</label>
            <input
              type="text"
              value={registration}
              onChange={e => setRegistration(e.target.value)}
              placeholder="e.g. PK-GMF"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Origin</label>
            <input
              type="text"
              value={origin}
              onChange={e => setOrigin(e.target.value)}
              placeholder="SUB (Surabaya)"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Destination</label>
            <input
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              placeholder="CGK (Jakarta)"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block font-semibold text-slate-700 mb-1">Posisi Pesawat Saat Kejadian</label>
            <input
              type="text"
              value={posisiPesawat}
              onChange={e => setPosisiPesawat(e.target.value)}
              placeholder="e.g. Touchdown & Roll Out Runway 25R"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      {/* III. DATA WILDLIFE */}
      <div className="space-y-4">
        <div className="bg-red-50 px-3 py-1.5 rounded text-sm font-bold text-red-900 border-l-4 border-red-600">
          III. DATA WILDLIFE
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jenis Satwa</label>
            <input
              type="text"
              value={jenisWildlife}
              onChange={e => setJenisWildlife(e.target.value)}
              placeholder="e.g. Burung Layang-layang Api (Hirundo rustica)"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jumlah</label>
            <input
              type="number"
              min={1}
              value={jumlahWildlife}
              onChange={e => setJumlahWildlife(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500 font-bold"
              required
            />
          </div>
        </div>

        {/* Identifikasi & Kondisi */}
        <div className="space-y-2 text-xs">
          <div>
            <span className="font-semibold text-slate-700 mr-4">Identifikasi :</span>
            {(['Teridentifikasi', 'Belum teridentifikasi'] as const).map(idOpt => (
              <label key={idOpt} className="inline-flex items-center space-x-1.5 mr-4 cursor-pointer">
                <input
                  type="radio"
                  name="identifikasiSatwa"
                  checked={identifikasi === idOpt}
                  onChange={() => setIdentifikasi(idOpt)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500"
                />
                <span>■ {idOpt}</span>
              </label>
            ))}
          </div>

          <div className="pt-2">
            <span className="font-semibold text-slate-700 block mb-1.5">Kondisi :</span>
            <div className="flex flex-wrap gap-4">
              {(['Hidup', 'Mati', 'Terluka', 'Carcass/Sisa', 'Tidak ditemukan'] as const).map(cond => (
                <label key={cond} className="inline-flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="kondisiWildlife"
                    checked={kondisiWildlife === cond}
                    onChange={() => setKondisiWildlife(cond)}
                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                  />
                  <span>■ {cond}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* IV. KRONOLOGI WILDLIFE STRIKE */}
      <div className="space-y-4">
        <div className="bg-red-50 px-3 py-1.5 rounded text-sm font-bold text-red-900 border-l-4 border-red-600">
          IV. KRONOLOGI WILDLIFE STRIKE
        </div>

        <textarea
          rows={4}
          value={kronologiStrike}
          onChange={e => setKronologiStrike(e.target.value)}
          placeholder="Uraikan detail waktu, kronologi kejadian strike, laporan dari pilot/ATC, dan aksi sweeping..."
          className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
          required
        />

        <div className="text-xs">
          <label className="block font-bold text-slate-800 uppercase tracking-wide mb-2">
            FASE PENERBANGAN :
          </label>
          <div className="flex flex-wrap gap-4">
            {(['Take-off roll', 'Initial climb', 'Approach', 'Landing roll', 'Taxi', 'Lainnya'] as const).map(phase => (
              <label key={phase} className="flex items-center space-x-1.5 cursor-pointer font-medium text-slate-700">
                <input
                  type="radio"
                  name="fasePenerbangan"
                  checked={fasePenerbangan === phase}
                  onChange={() => setFasePenerbangan(phase)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500"
                />
                <span>■ {phase}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="text-xs">
          <label className="block font-bold text-slate-800 uppercase tracking-wide mb-1">
            BAGIAN PESAWAT YANG TERDAMPAK :
          </label>
          <input
            type="text"
            value={bagianPesawatTerdampak}
            onChange={e => setBagianPesawatTerdampak(e.target.value)}
            placeholder="e.g. Leading Edge Sayap Kiri, Engine #1, Radome, Windshield..."
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            required
          />
        </div>
      </div>

      {/* V. DAMPAK TERHADAP PESAWAT */}
      <div className="space-y-4">
        <div className="bg-red-50 px-3 py-1.5 rounded text-sm font-bold text-red-900 border-l-4 border-red-600">
          V. DAMPAK TERHADAP PESAWAT
        </div>

        <div className="text-xs">
          <label className="block font-semibold text-slate-700 mb-2">Indikasi Kerusakan :</label>
          <div className="flex flex-wrap gap-4">
            {(['Tidak ada', 'Ada', 'Belum diketahui'] as const).map(ind => (
              <label key={ind} className="flex items-center space-x-1.5 cursor-pointer font-bold text-slate-800">
                <input
                  type="radio"
                  name="indikasiKerusakan"
                  checked={indikasiKerusakan === ind}
                  onChange={() => setIndikasiKerusakan(ind)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500"
                />
                <span>■ {ind}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Bagian Kerusakan :</label>
            <input
              type="text"
              value={bagianKerusakan}
              onChange={e => setBagianKerusakan(e.target.value)}
              placeholder="Deskripsi dent, retak, atau residu..."
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dampak Penerbangan :</label>
            <input
              type="text"
              value={dampakPenerbangan}
              onChange={e => setDampakPenerbangan(e.target.value)}
              placeholder="Normal / Delay / Aborted take-off / RTB"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Keterangan :</label>
            <input
              type="text"
              value={keteranganDampak}
              onChange={e => setKeteranganDampak(e.target.value)}
              placeholder="Catatan dari teknisi maskapai / Release to service"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      {/* VI. TINDAKAN WILDLIFE HAZARD UNIT */}
      <div className="space-y-3">
        <div className="bg-red-50 px-3 py-1.5 rounded text-sm font-bold text-red-900 border-l-4 border-red-600">
          VI. TINDAKAN WILDLIFE HAZARD UNIT
        </div>

        <div className="space-y-2 text-xs">
          <div>
            <label className="block text-slate-600 mb-0.5">1. Penerimaan informasi :</label>
            <input
              type="text"
              value={penerimaanInformasi}
              onChange={e => setPenerimaanInformasi(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-0.5">2. Verifikasi lokasi :</label>
            <input
              type="text"
              value={verifikasiLokasi}
              onChange={e => setVerifikasiLokasi(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-0.5">3. Pengumpulan evidence :</label>
            <input
              type="text"
              value={pengumpulanEvidence}
              onChange={e => setPengumpulanEvidence(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-0.5">4. Pengamanan / pembersihan :</label>
            <input
              type="text"
              value={pengamananPembersihan}
              onChange={e => setPengamananPembersihan(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-0.5">5. Dispersal / pengendalian :</label>
            <input
              type="text"
              value={dispersalPengendalian}
              onChange={e => setDispersalPengendalian(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-0.5">6. Koordinasi :</label>
            <input
              type="text"
              value={koordinasi}
              onChange={e => setKoordinasi(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-0.5">7. Dokumentasi :</label>
            <input
              type="text"
              value={dokumentasi}
              onChange={e => setDokumentasi(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      {/* VII. HASIL INVESTIGASI AWAL */}
      <div className="space-y-3">
        <div className="bg-red-50 px-3 py-1.5 rounded text-sm font-bold text-red-900 border-l-4 border-red-600">
          VII. HASIL INVESTIGASI AWAL
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Spesies :</label>
            <input
              type="text"
              value={investigasiSpesies}
              onChange={e => setInvestigasiSpesies(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Lokasi / Hotspot :</label>
            <input
              type="text"
              value={investigasiHotspot}
              onChange={e => setInvestigasiHotspot(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kondisi Habitat :</label>
            <input
              type="text"
              value={investigasiKondisiHabitat}
              onChange={e => setInvestigasiKondisiHabitat(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Potensi Attractant :</label>
            <input
              type="text"
              value={investigasiPotensiAttractant}
              onChange={e => setInvestigasiPotensiAttractant(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pola Flyway :</label>
            <input
              type="text"
              value={investigasiPolaFlyway}
              onChange={e => setInvestigasiPolaFlyway(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Indikasi Penyebab :</label>
            <input
              type="text"
              value={investigasiIndikasiPenyebab}
              onChange={e => setInvestigasiIndikasiPenyebab(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      {/* VIII. MITIGASI DAN TINDAK LANJUT */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-red-50 px-3 py-1.5 rounded border-l-4 border-red-600">
          <span className="text-sm font-bold text-red-900">VIII. MITIGASI DAN TINDAK LANJUT</span>
          <button
            type="button"
            onClick={() => setMitigasiList([...mitigasiList, ''])}
            className="text-xs text-red-700 hover:text-red-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Mitigasi
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
                className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
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

        <div className="text-xs pt-1">
          <label className="block font-semibold text-slate-700 mb-1">Rekomendasi :</label>
          <input
            type="text"
            value={rekomendasi}
            onChange={e => setRekomendasi(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
          />
        </div>
      </div>

      {/* IX. DOKUMENTASI / EVIDENCE */}
      <div className="space-y-3">
        <div className="bg-red-50 px-3 py-1.5 rounded text-sm font-bold text-red-900 border-l-4 border-red-600">
          IX. DOKUMENTASI / EVIDENCE
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="font-semibold block mb-1">Foto Satwa/Carcass:</span>
            <div className="space-x-3">
              <label className="cursor-pointer">
                <input type="radio" checked={fotoSatwaCarcass} onChange={() => setFotoSatwaCarcass(true)} className="mr-1 text-red-600" />
                ■ Ada
              </label>
              <label className="cursor-pointer">
                <input type="radio" checked={!fotoSatwaCarcass} onChange={() => setFotoSatwaCarcass(false)} className="mr-1 text-red-600" />
                ■ Tidak
              </label>
            </div>
          </div>

          <div>
            <span className="font-semibold block mb-1">Foto Lokasi:</span>
            <div className="space-x-3">
              <label className="cursor-pointer">
                <input type="radio" checked={fotoLokasi} onChange={() => setFotoLokasi(true)} className="mr-1 text-red-600" />
                ■ Ada
              </label>
              <label className="cursor-pointer">
                <input type="radio" checked={!fotoLokasi} onChange={() => setFotoLokasi(false)} className="mr-1 text-red-600" />
                ■ Tidak
              </label>
            </div>
          </div>

          <div>
            <span className="font-semibold block mb-1">Foto Kerusakan:</span>
            <div className="space-x-3">
              <label className="cursor-pointer">
                <input type="radio" checked={fotoKerusakan} onChange={() => setFotoKerusakan(true)} className="mr-1 text-red-600" />
                ■ Ada
              </label>
              <label className="cursor-pointer">
                <input type="radio" checked={!fotoKerusakan} onChange={() => setFotoKerusakan(false)} className="mr-1 text-red-600" />
                ■ Tidak
              </label>
            </div>
          </div>

          <div>
            <span className="font-semibold block mb-1">Video:</span>
            <div className="space-x-3">
              <label className="cursor-pointer">
                <input type="radio" checked={video} onChange={() => setVideo(true)} className="mr-1 text-red-600" />
                ■ Ada
              </label>
              <label className="cursor-pointer">
                <input type="radio" checked={!video} onChange={() => setVideo(false)} className="mr-1 text-red-600" />
                ■ Tidak
              </label>
            </div>
          </div>
        </div>

        <div className="text-xs pt-1">
          <label className="block font-semibold text-slate-700 mb-1">Evidence lain :</label>
          <input
            type="text"
            value={evidenceLain}
            onChange={e => setEvidenceLain(e.target.value)}
            placeholder="Sampel bulu, DNA, tagging koordinat..."
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
          />
        </div>
      </div>

      {/* X. STATUS LAPORAN */}
      <div className="space-y-4">
        <div className="bg-red-50 px-3 py-1.5 rounded text-sm font-bold text-red-900 border-l-4 border-red-600">
          X. STATUS LAPORAN
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex flex-wrap gap-4">
            {(['Initial Report', 'Preliminary Report', 'Final Report'] as const).map(st => (
              <label key={st} className="flex items-center space-x-1.5 cursor-pointer font-bold text-slate-800">
                <input
                  type="radio"
                  name="statusLaporan"
                  checked={statusLaporan === st}
                  onChange={() => setStatusLaporan(st)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500"
                />
                <span>■ {st}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center space-x-6 pt-2">
            <span className="font-semibold text-slate-700">Tindak Lanjut :</span>
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="radio"
                name="tindakLanjut"
                checked={tindakLanjut}
                onChange={() => setTindakLanjut(true)}
                className="w-4 h-4 text-red-600"
              />
              <span>■ Ya</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="radio"
                name="tindakLanjut"
                checked={!tindakLanjut}
                onChange={() => setTindakLanjut(false)}
                className="w-4 h-4 text-red-600"
              />
              <span>■ Tidak</span>
            </label>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Keterangan :</label>
            <input
              type="text"
              value={keteranganStatus}
              onChange={e => setKeteranganStatus(e.target.value)}
              placeholder="Catatan status investigasi..."
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => exportStrikePDF(currentReport)}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <Download className="w-4 h-4 text-rose-600" />
          Cetak PDF Resmi
        </button>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onOpenBroadcast(currentReport)}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Broadcast Flash Report WA
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-rose-800 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-md cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Simpan Laporan Strike
          </button>
        </div>
      </div>
    </form>
  );
};

import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Save, 
  Download, 
  Share2, 
  CheckCircle2, 
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { PatrolReport, Pleton, Dinas, Cuaca, SpeciesObservation, SelectiveLethalItem } from '../types';
import { exportPatrolPDF } from '../utils/pdfExport';
import { exportSinglePatrolToExcel } from '../utils/excelExport';

interface PatrolFormProps {
  onSaveReport: (report: PatrolReport) => void;
  onOpenBroadcast: (report: PatrolReport) => void;
}

export const PatrolForm: React.FC<PatrolFormProps> = ({
  onSaveReport,
  onOpenBroadcast
}) => {
  const [hariTanggal, setHariTanggal] = useState<string>(
    new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  );
  const [pleton, setPleton] = useState<Pleton>('Pleton 1');
  const [dinas, setDinas] = useState<Dinas>('Dinas Pagi (06:00 - 14:00)');
  const [podList, setPodList] = useState<string[]>(['']);
  const [waktuPatroli, setWaktuPatroli] = useState<string>('06:00 - 08:30 WIB');
  const [durasi, setDurasi] = useState<string>('150 Menit');
  const [cuaca, setCuaca] = useState<Cuaca>('Cerah');
  const [suhu, setSuhu] = useState<string>('28°C');
  const [situasiOperasional, setSituasiOperasional] = useState<string>(
    'Lalu lintas udara lancar, runway 07R/25L dan 07L/25R beroperasi normal.'
  );

  // II. Rute Patroli
  const [rutePatroli, setRutePatroli] = useState<string>(
    'Perimeter Selatan, Perimeter Utara, Infield Runway 07R-25L, Taxiway Alpha, Bravo, Charlie, Delta, Echo, Area Kolam Retensi Barat.'
  );
  const [gridLocation, setGridLocation] = useState<string>('Grid E7');

  // III. Temuan Satwa Liar
  const [temuanSatwa, setTemuanSatwa] = useState<SpeciesObservation[]>([
    { id: '1', spesies: 'Burung Kuntul Kerbau (Bubulcus ibis)', jumlah: 24, keterangan: 'Area rumput shoulder runway 25L' },
    { id: '2', spesies: 'Blekok Sawah (Ardeola speciosa)', jumlah: 8, keterangan: 'Saluran drainase taxiway Delta' },
    { id: '3', spesies: 'Burung Layang-layang Api (Hirundo rustica)', jumlah: 30, keterangan: 'Terbang rendah melintas centerline 07R' }
  ]);

  // IV. Monitoring Habitat dan Vegetasi
  const [kondisiVegetasi, setKondisiVegetasi] = useState<string>(
    'Ketinggian rumput terpantau 10 - 14 cm, kondisi bersih dan terawat.'
  );
  const [kondisiDrainase, setKondisiDrainase] = useState<string>(
    'Aliran air box culvert lancar, tidak ada genangan air sisa hujan semalam.'
  );
  const [potensiAttractant, setPotensiAttractant] = useState<string>(
    'Terdapat koloni serangga belalang kecil di area rumput terpangkas.'
  );
  const [habitatManagement, setHabitatManagement] = useState<string>(
    'Pembersihan genangan mikro dan penyemprotan repellent serangga pada infield.'
  );
  const [areaPerhatian, setAreaPerhatian] = useState<string>(
    'Infield antara Runway 07R dan Taxiway Alpha (titik favorit burung kuntul).'
  );

  // V. Tindakan Pengendalian
  const [mobileDispersal, setMobileDispersal] = useState<string>(
    'Patroli kendaraan WHU-01 menggunakan sirine dan klakson interval tinggi sepanjang shoulder runway.'
  );
  const [auditoryDeterrent, setAuditoryDeterrent] = useState<string>(
    'Penembakan bird banger (pyrotechnics) 6 kali letusan pada koordinat shoulder RWY 25L.'
  );
  const [visualDeterrent, setVisualDeterrent] = useState<string>(
    'Pemasangan reflective ribbon dan pengarahan laser gun hijau pada kawanan burung.'
  );
  const [monitoringFlyway, setMonitoringFlyway] = useState<string>(
    'Jalur lintas burung dari rawa perimeter utara menuju persawahan luar perimeter selatan dipantau intensif.'
  );

  // 5.2 Selective Lethal Control
  const [lethalItems, setLethalItems] = useState<SelectiveLethalItem[]>([
    { id: 'l-1', spesies: 'Burung Gereja Erasia', jumlah: 2 }
  ]);

  // VI. Kesimpulan
  const [kesimpulanList, setKesimpulanList] = useState<string[]>([
    'Aktivitas satwa liar pada shift pagi didominasi burung air (Kuntul dan Blekok) yang tertarik serangga di rerumputan.',
    'Tindakan dispersal non-lethal berhasil mengusir kawanan dari runway safety area (RSA) tanpa mengganggu operasional penerbangan.',
    'Kondisi airside secara umum terkendali dan aman untuk pendaratan serta lepas landas pesawat.'
  ]);

  // VII. Mitigasi
  const [mitigasiList, setMitigasiList] = useState<string[]>([
    'Tingkatkan intensitas mobile dispersal 15 menit sebelum peak arrival penerbangan.',
    'Koordinasi dengan Unit Runway Maintenance untuk pembersihan sampah organik di drainase.',
    'Pemeriksaan rutin fungsi gas cannon di perimeter timur.',
    'Briefing kewaspadaan flyway pagi bersama tower ATC.'
  ]);

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Calculations
  const totalPopulasi = temuanSatwa.reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0);
  const totalLethal = lethalItems.reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0);

  // Handlers for Satwa Liar
  const handleAddSatwa = () => {
    setTemuanSatwa([...temuanSatwa, { id: String(Date.now()), spesies: '', jumlah: 1, keterangan: '' }]);
  };

  const handleUpdateSatwa = (index: number, field: keyof SpeciesObservation, value: any) => {
    const updated = [...temuanSatwa];
    updated[index] = { ...updated[index], [field]: value };
    setTemuanSatwa(updated);
  };

  const handleRemoveSatwa = (index: number) => {
    setTemuanSatwa(temuanSatwa.filter((_, i) => i !== index));
  };

  // Handlers for Lethal
  const handleAddLethal = () => {
    setLethalItems([...lethalItems, { id: String(Date.now()), spesies: '', jumlah: 1 }]);
  };

  const handleRemoveLethal = (index: number) => {
    setLethalItems(lethalItems.filter((_, i) => i !== index));
  };

  // Build Report Object
  const currentReport: PatrolReport = {
    id: `patrol-${Date.now()}`,
    reportNumber: `WHU/PATROL/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString(),
    hariTanggal,
    pleton,
    dinas,
    pod: podList.filter(p => p.trim() !== ''),
    waktuPatroli,
    durasi,
    cuaca,
    suhu,
    situasiOperasional,
    rutePatroli,
    gridLocation,
    temuanSatwa,
    totalPopulasiTeramati: totalPopulasi,
    kondisiVegetasi,
    kondisiDrainase,
    potensiAttractant,
    habitatManagement,
    areaPerhatian,
    nonLethal: {
      mobileDispersal,
      auditoryDeterrent,
      visualDeterrent,
      monitoringFlyway
    },
    selectiveLethal: {
      items: lethalItems,
      totalLethal
    },
    kesimpulan: kesimpulanList.filter(k => k.trim() !== ''),
    mitigasi: mitigasiList.filter(m => m.trim() !== '')
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
      <div className="border-b border-slate-200 pb-5 text-center">
        <span className="text-xs font-bold text-sky-800 uppercase tracking-widest">
          PT ANGKASA PURA INDONESIA - AIRSIDE OPERATION
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 uppercase">
          1. LAPORAN PATROLI / INSPEKSI
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Unit Wildlife Hazard (WHS) • Format Resmi Sesuai Template Standar Bandara
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span><strong>Berhasil Disimpan!</strong> Laporan patroli harian telah tercatat ke sistem dan dashboard.</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenBroadcast(currentReport)}
            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            Kirim Broadcast WA
          </button>
        </div>
      )}

      {/* I. DATA KEGIATAN */}
      <div className="space-y-4">
        <div className="bg-slate-100 px-3 py-1.5 rounded text-sm font-bold text-slate-800 border-l-4 border-sky-600">
          I. DATA KEGIATAN
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hari / Tanggal</label>
            <input
              type="text"
              value={hariTanggal}
              onChange={e => setHariTanggal(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 bg-white"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pleton</label>
            <select
              value={pleton}
              onChange={e => setPleton(e.target.value as Pleton)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 bg-white"
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
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 bg-white"
            >
              <option value="Dinas Pagi (06:00 - 14:00)">Dinas Pagi (06:00 - 14:00)</option>
              <option value="Dinas Siang (14:00 - 22:00)">Dinas Siang (14:00 - 22:00)</option>
              <option value="Dinas Malam (22:00 - 06:00)">Dinas Malam (22:00 - 06:00)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Waktu Patroli &amp; Durasi</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={waktuPatroli}
                onChange={e => setWaktuPatroli(e.target.value)}
                placeholder="06:00 - 08:30 WIB"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
              />
              <input
                type="text"
                value={durasi}
                onChange={e => setDurasi(e.target.value)}
                placeholder="150 Menit"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cuaca &amp; Suhu</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={cuaca}
                onChange={e => setCuaca(e.target.value as Cuaca)}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 bg-white"
              >
                <option value="Cerah">Cerah</option>
                <option value="Berawan">Berawan</option>
                <option value="Hujan Ringan">Hujan Ringan</option>
                <option value="Hujan Lebat">Hujan Lebat</option>
                <option value="Berkabut">Berkabut</option>
              </select>
              <input
                type="text"
                value={suhu}
                onChange={e => setSuhu(e.target.value)}
                placeholder="28°C"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Situasi Operasional</label>
            <input
              type="text"
              value={situasiOperasional}
              onChange={e => setSituasiOperasional(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Nama Pelapor Pelaksana / Person on Duty (POD) */}
        <div className="mt-3 p-3 bg-sky-50/60 rounded-lg border border-sky-100">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block font-semibold text-slate-800 text-xs">
              Nama Personil Pelapor / Pelaksana Tugas (Diisi Manual) :
            </label>
            <span className="text-[10px] text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded font-mono">
              Diisi manual oleh petugas piket
            </span>
          </div>
          <div className="space-y-2">
            {podList.map((pod, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <span className="text-xs text-sky-700 font-bold w-5 text-right font-mono">{idx + 1}.</span>
                <input
                  type="text"
                  value={pod}
                  onChange={e => {
                    const next = [...podList];
                    next[idx] = e.target.value;
                    setPodList(next);
                  }}
                  placeholder="Ketik Nama Lengkap Petugas Pelaksana..."
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 bg-white shadow-2xs"
                  required
                />
                {podList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setPodList(podList.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 cursor-pointer"
                    title="Hapus Petugas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setPodList([...podList, ''])}
              className="text-xs text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1 mt-1.5 px-2 py-1 rounded bg-sky-100/50 hover:bg-sky-100 cursor-pointer transition w-fit"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Petugas Pelaksana Lainnya
            </button>
          </div>
        </div>
      </div>

      {/* II. RUTE PATROLI */}
      <div className="space-y-3">
        <div className="bg-slate-100 px-3 py-1.5 rounded text-sm font-bold text-slate-800 border-l-4 border-sky-600 flex items-center justify-between">
          <span>II. RUTE PATROLI &amp; SEKTOR GRID MAP</span>
          <span className="text-xs text-sky-700 font-mono">Soekarno-Hatta Grid Map 2025</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 text-xs mb-1">Deskripsi Rute Patroli</label>
            <textarea
              rows={2}
              value={rutePatroli}
              onChange={e => setRutePatroli(e.target.value)}
              placeholder="Tuliskan rute patroli perimeter, runway, taxiway, drainase..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 text-xs mb-1">Fokus Koordinat Grid Utama</label>
            <div className="flex space-x-1.5">
              <input
                type="text"
                value={gridLocation}
                onChange={e => setGridLocation(e.target.value)}
                placeholder="e.g. Grid E7"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 font-mono font-bold text-sky-900"
              />
              <select
                onChange={e => setGridLocation(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-300 rounded bg-slate-50 font-mono"
                defaultValue=""
              >
                <option value="" disabled>Pilih...</option>
                <option value="Grid E7">Grid E7 (RWY 1 Infield)</option>
                <option value="Grid C8">Grid C8 (RWY 2 / TWY C3)</option>
                <option value="Grid A7">Grid A7 (RWY 3 Central)</option>
                <option value="Grid G12">Grid G12 (Threshold 25L)</option>
                <option value="Grid B3">Grid B3 (Threshold 07L)</option>
                <option value="Grid D2">Grid D2 (Kolam Retensi Barat)</option>
                <option value="Grid D13">Grid D13 (Water Storage Timur)</option>
              </select>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Koordinat peta grid 14×7 Soekarno-Hatta (WIII)</p>
          </div>
        </div>
      </div>

      {/* III. TEMUAN SATWA LIAR */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded border-l-4 border-sky-600">
          <span className="text-sm font-bold text-slate-800">III. TEMUAN SATWA LIAR</span>
          <button
            type="button"
            onClick={handleAddSatwa}
            className="text-xs bg-sky-600 hover:bg-sky-500 text-white px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Satwa
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2 w-10 text-center">No</th>
                <th className="p-2">Jenis / Nama Satwa</th>
                <th className="p-2 w-28 text-center">Jumlah (Ekor)</th>
                <th className="p-2">Keterangan / Lokasi</th>
                <th className="p-2 w-12 text-center">Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {temuanSatwa.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.spesies}
                      onChange={e => handleUpdateSatwa(idx, 'spesies', e.target.value)}
                      placeholder="e.g. Burung Kuntul Kerbau (Bubulcus ibis)"
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="number"
                      min={0}
                      value={item.jumlah}
                      onChange={e => handleUpdateSatwa(idx, 'jumlah', parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-slate-300 rounded text-center text-xs font-semibold"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.keterangan || ''}
                      onChange={e => handleUpdateSatwa(idx, 'keterangan', e.target.value)}
                      placeholder="Lokasi dan aktivitas..."
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveSatwa(idx)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end p-2 bg-slate-50 rounded border border-slate-200">
          <p className="text-xs font-bold text-slate-800">
            Total Populasi Teramati : <span className="text-sky-700 text-sm">{totalPopulasi} ekor</span>
          </p>
        </div>
      </div>

      {/* IV. MONITORING HABITAT DAN VEGETASI */}
      <div className="space-y-3">
        <div className="bg-slate-100 px-3 py-1.5 rounded text-sm font-bold text-slate-800 border-l-4 border-sky-600">
          IV. MONITORING HABITAT DAN VEGETASI
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              1. Kondisi Vegetasi / Rumput :
            </label>
            <input
              type="text"
              value={kondisiVegetasi}
              onChange={e => setKondisiVegetasi(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              2. Kondisi Drainase / Genangan Air :
            </label>
            <input
              type="text"
              value={kondisiDrainase}
              onChange={e => setKondisiDrainase(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              3. Potensi Wildlife Attractant :
            </label>
            <input
              type="text"
              value={potensiAttractant}
              onChange={e => setPotensiAttractant(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              4. Habitat Management :
            </label>
            <input
              type="text"
              value={habitatManagement}
              onChange={e => setHabitatManagement(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              5. Area Perhatian :
            </label>
            <input
              type="text"
              value={areaPerhatian}
              onChange={e => setAreaPerhatian(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      {/* V. TINDAKAN PENGENDALIAN */}
      <div className="space-y-4">
        <div className="bg-slate-100 px-3 py-1.5 rounded text-sm font-bold text-slate-800 border-l-4 border-sky-600">
          V. TINDAKAN PENGENDALIAN
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            5.1 Non-Lethal Control
          </h4>
          <div className="space-y-2 text-xs">
            <div>
              <label className="block text-slate-600 mb-0.5">• Mobile dispersal :</label>
              <input
                type="text"
                value={mobileDispersal}
                onChange={e => setMobileDispersal(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-0.5">• Auditory deterrent :</label>
              <input
                type="text"
                value={auditoryDeterrent}
                onChange={e => setAuditoryDeterrent(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-0.5">• Visual deterrent :</label>
              <input
                type="text"
                value={visualDeterrent}
                onChange={e => setVisualDeterrent(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-0.5">• Monitoring flyway movement :</label>
              <input
                type="text"
                value={monitoringFlyway}
                onChange={e => setMonitoringFlyway(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {/* 5.2 Selective Lethal Control */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              5.2 Selective Lethal Control
            </h4>
            <button
              type="button"
              onClick={handleAddLethal}
              className="text-xs text-sky-700 hover:text-sky-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Baris
            </button>
          </div>

          <div className="space-y-2">
            {lethalItems.map((item, idx) => (
              <div key={item.id} className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400 font-mono">•</span>
                <input
                  type="text"
                  value={item.spesies}
                  onChange={e => {
                    const next = [...lethalItems];
                    next[idx].spesies = e.target.value;
                    setLethalItems(next);
                  }}
                  placeholder="Spesies target selective lethal"
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded"
                />
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min={0}
                    value={item.jumlah}
                    onChange={e => {
                      const next = [...lethalItems];
                      next[idx].jumlah = parseInt(e.target.value) || 0;
                      setLethalItems(next);
                    }}
                    className="w-20 px-2 py-1.5 border border-slate-300 rounded text-center font-bold"
                  />
                  <span className="text-slate-500">ekor</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLethal(idx)}
                  className="p-1 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs font-bold text-slate-700 text-right">
            Total Selective Lethal : <span className="text-slate-900">{totalLethal} ekor</span>
          </p>
        </div>
      </div>

      {/* VI. KESIMPULAN */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded border-l-4 border-sky-600">
          <span className="text-sm font-bold text-slate-800">VI. KESIMPULAN</span>
          <button
            type="button"
            onClick={() => setKesimpulanList([...kesimpulanList, ''])}
            className="text-xs text-sky-700 hover:text-sky-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Poin
          </button>
        </div>

        <div className="space-y-2">
          {kesimpulanList.map((item, idx) => (
            <div key={idx} className="flex items-start space-x-2 text-xs">
              <span className="font-bold text-slate-600 mt-2">{idx + 1}.</span>
              <input
                type="text"
                value={item}
                onChange={e => {
                  const next = [...kesimpulanList];
                  next[idx] = e.target.value;
                  setKesimpulanList(next);
                }}
                placeholder="Poin kesimpulan..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
              />
              {kesimpulanList.length > 1 && (
                <button
                  type="button"
                  onClick={() => setKesimpulanList(kesimpulanList.filter((_, i) => i !== idx))}
                  className="p-2 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* VII. MITIGASI */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded border-l-4 border-sky-600">
          <span className="text-sm font-bold text-slate-800">VII. MITIGASI</span>
          <button
            type="button"
            onClick={() => setMitigasiList([...mitigasiList, ''])}
            className="text-xs text-sky-700 hover:text-sky-800 font-semibold flex items-center gap-1 cursor-pointer"
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
                placeholder="Tindakan mitigasi lanjutan..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
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

      {/* Form Action Controls */}
      <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => exportPatrolPDF(currentReport)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Download PDF sesuai format resmi"
          >
            <Download className="w-4 h-4 text-rose-600" />
            Cetak PDF Resmi
          </button>
          <button
            type="button"
            onClick={() => exportSinglePatrolToExcel(currentReport)}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-emerald-200"
            title="Download Spreadsheet Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Excel
          </button>
        </div>

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
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-md cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Simpan Laporan Patroli
          </button>
        </div>
      </div>
    </form>
  );
};

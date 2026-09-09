import React from 'react';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  Share2, 
  Printer, 
  CheckCircle2, 
  FileText 
} from 'lucide-react';
import { PatrolReport, OccurrenceReport, WildlifeStrikeReport } from '../types';
import { exportPatrolPDF, exportOccurrencePDF, exportStrikePDF } from '../utils/pdfExport';
import { exportSinglePatrolToExcel } from '../utils/excelExport';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'patrol' | 'occurrence' | 'strike';
  reportData: PatrolReport | OccurrenceReport | WildlifeStrikeReport | null;
  onOpenBroadcast: (type: 'PATROL' | 'OCCURRENCE' | 'STRIKE', report: any) => void;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  onClose,
  reportType,
  reportData,
  onOpenBroadcast
}) => {
  if (!isOpen || !reportData) return null;

  const handleDownloadPDF = () => {
    if (reportType === 'strike') exportStrikePDF(reportData as WildlifeStrikeReport);
    else if (reportType === 'occurrence') exportOccurrencePDF(reportData as OccurrenceReport);
    else exportPatrolPDF(reportData as PatrolReport);
  };

  const handleDownloadExcel = () => {
    if (reportType === 'patrol') {
      exportSinglePatrolToExcel(reportData as PatrolReport);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Action Bar */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <FileText className="w-5 h-5 text-sky-400" />
            <div>
              <p className="text-xs text-sky-400 font-mono font-semibold">PRATINJAU DOKUMEN RESMI</p>
              <h3 className="font-bold text-sm sm:text-base text-white">{reportData.reportNumber}</h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PDF</span>
            </button>

            {reportType === 'patrol' && (
              <button
                onClick={handleDownloadExcel}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            )}

            <button
              onClick={() => onOpenBroadcast(reportType.toUpperCase() as any, reportData)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Broadcast WA</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Document Body (Rendered as paper document layout) */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-slate-50 font-sans text-slate-900 text-xs">
          <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 shadow-md border border-slate-300 space-y-6">
            {/* Header Kop Surat */}
            <div className="text-center border-b-2 border-slate-800 pb-4">
              <h1 className="text-base font-black tracking-wider text-slate-900 uppercase">
                PT ANGKASA PURA INDONESIA
              </h1>
              <p className="text-xs font-bold text-slate-700 uppercase">
                AIRSIDE OPERATION &amp; SAFETY - UNIT WILDLIFE HAZARD
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                No. Registrasi: {reportData.reportNumber}
              </p>
            </div>

            {/* Document Content by Type */}
            {reportType === 'patrol' && (() => {
              const p = reportData as PatrolReport;
              return (
                <div className="space-y-5">
                  <h2 className="text-sm font-black text-center uppercase tracking-wide">
                    1. LAPORAN PATROLI / INSPEKSI
                  </h2>

                  {/* I. DATA KEGIATAN */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">I. DATA KEGIATAN</h3>
                    <div className="grid grid-cols-2 gap-y-1.5 text-xs text-slate-700">
                      <div><strong className="text-slate-900">Hari / Tanggal:</strong> {p.hariTanggal}</div>
                      <div><strong className="text-slate-900">Waktu Patroli:</strong> {p.waktuPatroli}</div>
                      <div><strong className="text-slate-900">Pleton:</strong> {p.pleton}</div>
                      <div><strong className="text-slate-900">Durasi:</strong> {p.durasi}</div>
                      <div><strong className="text-slate-900">Dinas:</strong> {p.dinas}</div>
                      <div><strong className="text-slate-900">Cuaca / Suhu:</strong> {p.cuaca}, {p.suhu}</div>
                      <div className="col-span-2"><strong className="text-slate-900">Situasi Operasional:</strong> {p.situasiOperasional}</div>
                      <div className="col-span-2"><strong className="text-slate-900">POD (Person on Duty):</strong> {p.pod.join(', ')}</div>
                    </div>
                  </div>

                  {/* II. RUTE PATROLI */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">II. RUTE PATROLI</h3>
                    <p className="text-slate-700 bg-slate-50 p-2 border border-slate-200 rounded">{p.rutePatroli}</p>
                  </div>

                  {/* III. TEMUAN SATWA LIAR */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">III. TEMUAN SATWA LIAR</h3>
                    <table className="w-full text-xs border border-slate-300">
                      <thead className="bg-slate-100 font-bold border-b border-slate-300">
                        <tr>
                          <th className="p-1.5 w-8 text-center">No</th>
                          <th className="p-1.5">Spesies / Satwa</th>
                          <th className="p-1.5 w-24 text-center">Jumlah</th>
                          <th className="p-1.5">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {p.temuanSatwa.map((s, idx) => (
                          <tr key={s.id}>
                            <td className="p-1.5 text-center font-mono">{idx + 1}</td>
                            <td className="p-1.5 font-medium">{s.spesies}</td>
                            <td className="p-1.5 text-center font-bold">{s.jumlah} ekor</td>
                            <td className="p-1.5 text-slate-600">{s.keterangan || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="font-bold text-slate-900 mt-1.5 text-right">
                      Total Populasi Teramati: {p.totalPopulasiTeramati} ekor
                    </p>
                  </div>

                  {/* IV. MONITORING HABITAT */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">IV. MONITORING HABITAT DAN VEGETASI</h3>
                    <div className="space-y-1 text-slate-700">
                      <p>1. Kondisi Vegetasi / Rumput : {p.kondisiVegetasi}</p>
                      <p>2. Kondisi Drainase / Genangan Air : {p.kondisiDrainase}</p>
                      <p>3. Potensi Wildlife Attractant : {p.potensiAttractant}</p>
                      <p>4. Habitat Management : {p.habitatManagement}</p>
                      <p>5. Area Perhatian : {p.areaPerhatian}</p>
                    </div>
                  </div>

                  {/* V. TINDAKAN PENGENDALIAN */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">V. TINDAKAN PENGENDALIAN</h3>
                    <p className="font-semibold text-slate-800">5.1 Non-Lethal Control</p>
                    <div className="pl-3 text-slate-700 space-y-0.5 mb-2">
                      <p>- Mobile dispersal : {p.nonLethal.mobileDispersal}</p>
                      <p>- Auditory deterrent : {p.nonLethal.auditoryDeterrent}</p>
                      <p>- Visual deterrent : {p.nonLethal.visualDeterrent}</p>
                      <p>- Monitoring flyway movement : {p.nonLethal.monitoringFlyway}</p>
                    </div>
                    <p className="font-semibold text-slate-800">5.2 Selective Lethal Control</p>
                    <div className="pl-3 text-slate-700">
                      {p.selectiveLethal.items.map((item, idx) => (
                        <p key={idx}>- {item.spesies} : {item.jumlah} ekor</p>
                      ))}
                      <p className="font-bold">Total Selective Lethal : {p.selectiveLethal.totalLethal} ekor</p>
                    </div>
                  </div>

                  {/* VI. KESIMPULAN */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">VI. KESIMPULAN</h3>
                    {p.kesimpulan.map((k, idx) => (
                      <p key={idx} className="text-slate-700">{idx + 1}. {k}</p>
                    ))}
                  </div>

                  {/* VII. MITIGASI */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">VII. MITIGASI</h3>
                    {p.mitigasi.map((m, idx) => (
                      <p key={idx} className="text-slate-700">{idx + 1}. {m}</p>
                    ))}
                  </div>
                </div>
              );
            })()}

            {reportType === 'occurrence' && (() => {
              const o = reportData as OccurrenceReport;
              return (
                <div className="space-y-5">
                  <h2 className="text-sm font-black text-center uppercase tracking-wide">
                    2. LAPORAN OCCURRENCE WILDLIFE HAZARD
                  </h2>

                  {/* I. DATA OCCURRENCE */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">I. DATA OCCURRENCE</h3>
                    <div className="grid grid-cols-2 gap-y-1.5 text-slate-700">
                      <div><strong className="text-slate-900">Hari / Tanggal:</strong> {o.hariTanggal}</div>
                      <div><strong className="text-slate-900">Waktu Kejadian:</strong> {o.waktuKejadian}</div>
                      <div><strong className="text-slate-900">Pleton / Dinas:</strong> {o.pleton} / {o.dinas}</div>
                      <div><strong className="text-slate-900">POD:</strong> {o.pod}</div>
                      <div><strong className="text-slate-900">Lokasi:</strong> {o.lokasi} {o.gridLocation && <span className="font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">[{o.gridLocation}]</span>}</div>
                      <div><strong className="text-slate-900">Runway / Area:</strong> {o.runwayTaxiwayArea}</div>
                      <div className="col-span-2"><strong className="text-slate-900">Jenis Occurrence:</strong> {o.jenisOccurrence}</div>
                    </div>
                  </div>

                  {/* II. KRONOLOGI */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">II. KRONOLOGI KEJADIAN</h3>
                    <p className="text-slate-700 bg-slate-50 p-2 border border-slate-200 rounded">{o.kronologi}</p>
                  </div>

                  {/* III. IDENTIFIKASI SATWA */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">III. IDENTIFIKASI SATWA</h3>
                    <p className="text-slate-700">Jenis : {o.jenisSatwa}</p>
                    <p className="text-slate-700">Jumlah : {o.jumlahSatwa} ekor</p>
                    <p className="text-slate-700">Kondisi : [ {o.kondisiSatwa === 'Hidup' ? '■' : '□'} Hidup ]  [ {o.kondisiSatwa === 'Mati' ? '■' : '□'} Mati ]  [ {o.kondisiSatwa === 'Terluka' ? '■' : '□'} Terluka ]  [ {o.kondisiSatwa === 'Tidak teridentifikasi' ? '■' : '□'} Tidak teridentifikasi ]</p>
                    <p className="text-slate-700">Aktivitas / Pergerakan : {o.aktivitasPergerakan}</p>
                  </div>

                  {/* IV. KONDISI OPERASIONAL */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">IV. KONDISI OPERASIONAL</h3>
                    <p className="text-slate-700">Cuaca : {o.cuaca}   Suhu : {o.suhu}   Visibility : {o.visibility}</p>
                    <p className="text-slate-700">Kondisi Runway / Taxiway : {o.kondisiRunwayTaxiway}</p>
                    <p className="text-slate-700">Aktivitas Pergerakan Pesawat : {o.aktivitasPergerakanPesawat}</p>
                  </div>

                  {/* V. POTENSI HAZARD */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">V. POTENSI HAZARD</h3>
                    <p className="text-slate-700">Jenis Potensi Hazard : {o.jenisPotensiHazard}</p>
                    <p className="text-slate-700">Potensi Dampak Operasi : {o.potensiDampakOperasi}</p>
                  </div>

                  {/* VI. TINDAKAN */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">VI. TINDAKAN YANG DILAKUKAN</h3>
                    <p className="text-slate-700">1. Deteksi / monitoring : {o.tindakan.deteksiMonitoring}</p>
                    <p className="text-slate-700">2. Mobile dispersal : {o.tindakan.mobileDispersal}</p>
                    <p className="text-slate-700">3. Auditory / visual deterrent : {o.tindakan.auditoryVisualDeterrent}</p>
                    <p className="text-slate-700">4. Koordinasi : {o.tindakan.koordinasi}</p>
                    <p className="text-slate-700">5. Tindakan lainnya : {o.tindakan.tindakanLainnya}</p>
                  </div>

                  {/* VII. HASIL PENANGANAN */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">VII. HASIL PENANGANAN</h3>
                    <p className="text-slate-700">{o.hasilPenanganan}</p>
                    <p className="font-bold text-slate-900 mt-1">Status : ■ {o.status}</p>
                  </div>

                  {/* VIII. REKOMENDASI */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">VIII. REKOMENDASI / MITIGASI</h3>
                    {o.rekomendasiMitigasi.map((rm, idx) => (
                      <p key={idx} className="text-slate-700">{idx + 1}. {rm}</p>
                    ))}
                  </div>

                  {/* IX. DOKUMENTASI */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">IX. DOKUMENTASI</h3>
                    <p className="text-slate-700">Foto / Video : [ {o.fotoVideoAda ? '■ Ada' : '□ Tidak Ada'} ]</p>
                    <p className="text-slate-700">Keterangan : {o.keteranganDokumentasi}</p>
                  </div>
                </div>
              );
            })()}

            {reportType === 'strike' && (() => {
              const s = reportData as WildlifeStrikeReport;
              return (
                <div className="space-y-5">
                  <h2 className="text-sm font-black text-center text-red-700 uppercase tracking-wide">
                    3. LAPORAN WILDLIFE STRIKE (ICAO DOC 9388)
                  </h2>

                  {/* I. DATA KEJADIAN */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">I. DATA KEJADIAN</h3>
                    <div className="grid grid-cols-2 gap-y-1.5 text-slate-700">
                      <div><strong className="text-slate-900">Hari / Tanggal:</strong> {s.hariTanggal}</div>
                      <div><strong className="text-slate-900">Waktu Kejadian:</strong> {s.waktuKejadian}</div>
                      <div><strong className="text-slate-900">Pleton / Dinas:</strong> {s.pleton} / {s.dinas}</div>
                      <div><strong className="text-slate-900">POD:</strong> {s.pod}</div>
                      <div><strong className="text-slate-900">Lokasi:</strong> {s.lokasi} {s.gridLocation && <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">[{s.gridLocation}]</span>}</div>
                      <div><strong className="text-slate-900">Runway / Taxiway:</strong> {s.runwayTaxiway}</div>
                      <div className="col-span-2"><strong className="text-slate-900">Sumber Informasi:</strong> ■ {s.sumberInformasi}</div>
                    </div>
                  </div>

                  {/* II. DATA PESAWAT */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">II. DATA PESAWAT</h3>
                    <div className="grid grid-cols-2 gap-y-1.5 text-slate-700">
                      <div><strong className="text-slate-900">Operator / Airline:</strong> {s.operatorAirline}</div>
                      <div><strong className="text-slate-900">Flight Number:</strong> {s.flightNumber}</div>
                      <div><strong className="text-slate-900">Aircraft Type:</strong> {s.aircraftType}</div>
                      <div><strong className="text-slate-900">Registration:</strong> {s.registration}</div>
                      <div><strong className="text-slate-900">Origin / Destination:</strong> {s.origin} - {s.destination}</div>
                      <div><strong className="text-slate-900">Posisi Pesawat:</strong> {s.posisiPesawat}</div>
                    </div>
                  </div>

                  {/* III. DATA WILDLIFE */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">III. DATA WILDLIFE</h3>
                    <p className="text-slate-700">Jenis : {s.jenisWildlife}   Jumlah : {s.jumlahWildlife} ekor</p>
                    <p className="text-slate-700">Identifikasi : ■ {s.identifikasi}</p>
                    <p className="text-slate-700">Kondisi : ■ {s.kondisiWildlife}</p>
                  </div>

                  {/* IV. KRONOLOGI */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">IV. KRONOLOGI WILDLIFE STRIKE</h3>
                    <p className="text-slate-700 bg-slate-50 p-2 border border-slate-200 rounded">{s.kronologiStrike}</p>
                    <p className="mt-2 font-semibold text-slate-900">FASE PENERBANGAN : ■ {s.fasePenerbangan}</p>
                    <p className="font-semibold text-slate-900">BAGIAN PESAWAT YANG TERDAMPAK : {s.bagianPesawatTerdampak}</p>
                  </div>

                  {/* V. DAMPAK */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">V. DAMPAK TERHADAP PESAWAT</h3>
                    <p className="text-slate-700">Indikasi Kerusakan : ■ {s.indikasiKerusakan}</p>
                    <p className="text-slate-700">Bagian Kerusakan : {s.bagianKerusakan}</p>
                    <p className="text-slate-700">Dampak Penerbangan : {s.dampakPenerbangan}</p>
                    <p className="text-slate-700">Keterangan : {s.keteranganDampak}</p>
                  </div>

                  {/* VI. TINDAKAN WHU */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">VI. TINDAKAN WILDLIFE HAZARD UNIT</h3>
                    <div className="space-y-0.5 text-slate-700">
                      <p>1. Penerimaan informasi : {s.tindakanUnit.penerimaanInformasi}</p>
                      <p>2. Verifikasi lokasi : {s.tindakanUnit.verifikasiLokasi}</p>
                      <p>3. Pengumpulan evidence : {s.tindakanUnit.pengumpulanEvidence}</p>
                      <p>4. Pengamanan / pembersihan : {s.tindakanUnit.pengamananPembersihan}</p>
                      <p>5. Dispersal / pengendalian : {s.tindakanUnit.dispersalPengendalian}</p>
                      <p>6. Koordinasi : {s.tindakanUnit.koordinasi}</p>
                      <p>7. Dokumentasi : {s.tindakanUnit.dokumentasi}</p>
                    </div>
                  </div>

                  {/* VII. HASIL INVESTIGASI AWAL */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">VII. HASIL INVESTIGASI AWAL</h3>
                    <div className="space-y-0.5 text-slate-700">
                      <p>Spesies : {s.investigasiAwal.spesies}</p>
                      <p>Lokasi / Hotspot : {s.investigasiAwal.lokasiHotspot}</p>
                      <p>Kondisi Habitat : {s.investigasiAwal.kondisiHabitat}</p>
                      <p>Potensi Attractant : {s.investigasiAwal.potensiAttractant}</p>
                      <p>Pola Flyway : {s.investigasiAwal.polaFlyway}</p>
                      <p>Indikasi Penyebab : {s.investigasiAwal.indikasiPenyebab}</p>
                    </div>
                  </div>

                  {/* VIII. MITIGASI & TINDAK LANJUT */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">VIII. MITIGASI DAN TINDAK LANJUT</h3>
                    {s.mitigasi.map((m, idx) => (
                      <p key={idx} className="text-slate-700">{idx + 1}. {m}</p>
                    ))}
                    <p className="text-slate-700 mt-1"><strong className="text-slate-900">Rekomendasi :</strong> {s.rekomendasi}</p>
                  </div>

                  {/* IX. DOKUMENTASI / EVIDENCE */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">IX. DOKUMENTASI / EVIDENCE</h3>
                    <p className="text-slate-700">
                      Foto Satwa/Carcass: [ {s.evidence.fotoSatwaCarcass ? '■ Ada' : '□ Tidak'} ]   
                      Foto Lokasi: [ {s.evidence.fotoLokasi ? '■ Ada' : '□ Tidak'} ]   
                      Foto Kerusakan: [ {s.evidence.fotoKerusakan ? '■ Ada' : '□ Tidak'} ]
                    </p>
                    <p className="text-slate-700">Video: [ {s.evidence.video ? '■ Ada' : '□ Tidak'} ]   Evidence lain: {s.evidence.evidenceLain}</p>
                  </div>

                  {/* X. STATUS LAPORAN */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">X. STATUS LAPORAN</h3>
                    <p className="text-slate-700">Status: ■ {s.statusLaporan}   |   Tindak Lanjut: ■ {s.tindakLanjut ? 'Ya' : 'Tidak'}</p>
                    <p className="text-slate-700">Keterangan: {s.keteranganStatus}</p>
                  </div>
                </div>
              );
            })()}

            {/* Signatures block */}
            <div className="pt-8 border-t border-slate-300 flex justify-between text-xs text-slate-800">
              <div>
                <p>Diverifikasi oleh (AOCC / CASO):</p>
                <div className="h-14"></div>
                <p className="font-bold">( __________________________ )</p>
              </div>
              <div className="text-right">
                <p>Petugas Pelapor Unit WHU:</p>
                <div className="h-14"></div>
                <p className="font-bold">
                  ( {Array.isArray((reportData as any).pod) ? ((reportData as any).pod.filter(Boolean).join(', ') || 'Petugas Pelaksana WHU') : ((reportData as any).pod || 'Petugas Pelaksana WHU')} )
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

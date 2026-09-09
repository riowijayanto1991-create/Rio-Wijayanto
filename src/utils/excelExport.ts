import * as XLSX from 'xlsx';
import { PatrolReport, OccurrenceReport, WildlifeStrikeReport } from '../types';

export const exportAllToExcel = (
  patrols: PatrolReport[],
  occurrences: OccurrenceReport[],
  strikes: WildlifeStrikeReport[]
) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Patroli Harian
  const patrolData = patrols.map((p, idx) => ({
    No: idx + 1,
    'No Dokumen': p.reportNumber,
    'Hari / Tanggal': p.hariTanggal,
    Pleton: p.pleton,
    Dinas: p.dinas,
    'POD (Person on Duty)': p.pod.join(', '),
    'Koordinat Grid Map CGK': p.gridLocation || '-',
    'Waktu Patroli': p.waktuPatroli,
    Durasi: p.durasi,
    Cuaca: p.cuaca,
    Suhu: p.suhu,
    'Situasi Operasional': p.situasiOperasional,
    'Rute Patroli': p.rutePatroli,
    'Total Populasi Satwa': p.totalPopulasiTeramati,
    'Rincian Satwa': p.temuanSatwa.map(s => `${s.spesies} (${s.jumlah} ekor)`).join('; '),
    'Kondisi Vegetasi': p.kondisiVegetasi,
    'Kondisi Drainase': p.kondisiDrainase,
    'Potensi Attractant': p.potensiAttractant,
    'Habitat Management': p.habitatManagement,
    'Area Perhatian': p.areaPerhatian,
    'Non-Lethal Mobile': p.nonLethal.mobileDispersal,
    'Non-Lethal Auditory': p.nonLethal.auditoryDeterrent,
    'Non-Lethal Visual': p.nonLethal.visualDeterrent,
    'Selective Lethal Total': p.selectiveLethal.totalLethal,
    Kesimpulan: p.kesimpulan.join(' | '),
    Mitigasi: p.mitigasi.join(' | ')
  }));
  const wsPatrol = XLSX.utils.json_to_sheet(patrolData);
  XLSX.utils.book_append_sheet(wb, wsPatrol, 'Laporan Patroli');

  // Sheet 2: Occurrence
  const occData = occurrences.map((o, idx) => ({
    No: idx + 1,
    'No Dokumen': o.reportNumber,
    'Hari / Tanggal': o.hariTanggal,
    'Waktu Kejadian': o.waktuKejadian,
    Pleton: o.pleton,
    Dinas: o.dinas,
    POD: o.pod,
    'Koordinat Grid Map CGK': o.gridLocation || '-',
    Lokasi: o.lokasi,
    'Runway / Taxiway / Area': o.runwayTaxiwayArea,
    'Jenis Occurrence': o.jenisOccurrence,
    'Jenis Satwa': o.jenisSatwa,
    'Jumlah (Ekor)': o.jumlahSatwa,
    'Kondisi Satwa': o.kondisiSatwa,
    'Aktivitas / Pergerakan': o.aktivitasPergerakan,
    Cuaca: o.cuaca,
    Suhu: o.suhu,
    Visibility: o.visibility,
    'Kondisi RWY/TWY': o.kondisiRunwayTaxiway,
    'Pergerakan Pesawat': o.aktivitasPergerakanPesawat,
    'Potensi Hazard': o.jenisPotensiHazard,
    'Dampak Operasi': o.potensiDampakOperasi,
    'Hasil Penanganan': o.hasilPenanganan,
    Status: o.status,
    'Rekomendasi / Mitigasi': o.rekomendasiMitigasi.join(' | '),
    Dokumentasi: o.fotoVideoAda ? 'Ada' : 'Tidak Ada'
  }));
  const wsOcc = XLSX.utils.json_to_sheet(occData);
  XLSX.utils.book_append_sheet(wb, wsOcc, 'Laporan Occurrence');

  // Sheet 3: Strike
  const strikeData = strikes.map((s, idx) => ({
    No: idx + 1,
    'No Dokumen': s.reportNumber,
    'Hari / Tanggal': s.hariTanggal,
    'Waktu Kejadian': s.waktuKejadian,
    Pleton: s.pleton,
    Dinas: s.dinas,
    POD: s.pod,
    'Koordinat Grid Map CGK': s.gridLocation || '-',
    Lokasi: s.lokasi,
    'Runway / Taxiway': s.runwayTaxiway,
    'Sumber Info': s.sumberInformasi,
    Maskapai: s.operatorAirline,
    'Flight No': s.flightNumber,
    'Aircraft Type': s.aircraftType,
    Registrasi: s.registration,
    'Origin - Destination': `${s.origin} - ${s.destination}`,
    'Posisi Pesawat': s.posisiPesawat,
    'Jenis Wildlife': s.jenisWildlife,
    Jumlah: s.jumlahWildlife,
    Identifikasi: s.identifikasi,
    Kondisi: s.kondisiWildlife,
    'Fase Penerbangan': s.fasePenerbangan,
    'Bagian Pesawat Terdampak': s.bagianPesawatTerdampak,
    'Indikasi Kerusakan': s.indikasiKerusakan,
    'Bagian Kerusakan': s.bagianKerusakan,
    'Dampak Penerbangan': s.dampakPenerbangan,
    'Spesies Investigasi': s.investigasiAwal.spesies,
    Hotspot: s.investigasiAwal.lokasiHotspot,
    Status: s.statusLaporan,
    'Tindak Lanjut': s.tindakLanjut ? 'Ya' : 'Tidak'
  }));
  const wsStrike = XLSX.utils.json_to_sheet(strikeData);
  XLSX.utils.book_append_sheet(wb, wsStrike, 'Laporan Wildlife Strike');

  // Summary sheet
  const summary = [
    { Parameter: 'Nama Unit', Nilai: 'Unit Wildlife Hazard PT Angkasa Pura Indonesia' },
    { Parameter: 'Total Laporan Patroli Tercatat', Nilai: patrols.length },
    { Parameter: 'Total Laporan Occurrence', Nilai: occurrences.length },
    { Parameter: 'Total Insiden Wildlife Strike', Nilai: strikes.length },
    { Parameter: 'Total Populasi Satwa Teramati (Patroli)', Nilai: patrols.reduce((acc, p) => acc + p.totalPopulasiTeramati, 0) },
    { Parameter: 'Insiden Strike Ada Kerusakan', Nilai: strikes.filter(s => s.indikasiKerusakan === 'Ada').length },
    { Parameter: 'Tanggal Export Data', Nilai: new Date().toLocaleString('id-ID') }
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summary);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Eksekutif');

  XLSX.writeFile(wb, `Rekapitulasi_Laporan_Wildlife_Hazard_AP_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportSinglePatrolToExcel = (report: PatrolReport) => {
  const wb = XLSX.utils.book_new();
  const detail = [
    { Section: 'INFORMASI UMUM', Field: 'No Dokumen', Value: report.reportNumber },
    { Section: 'INFORMASI UMUM', Field: 'Hari / Tanggal', Value: report.hariTanggal },
    { Section: 'INFORMASI UMUM', Field: 'Pleton / Dinas', Value: `${report.pleton} / ${report.dinas}` },
    { Section: 'INFORMASI UMUM', Field: 'Petugas POD', Value: report.pod.join(', ') },
    { Section: 'INFORMASI UMUM', Field: 'Waktu Patroli & Durasi', Value: `${report.waktuPatroli} (${report.durasi})` },
    { Section: 'INFORMASI UMUM', Field: 'Cuaca & Suhu', Value: `${report.cuaca}, ${report.suhu}` },
    { Section: 'INFORMASI UMUM', Field: 'Situasi Operasional', Value: report.situasiOperasional },
    { Section: 'RUTE', Field: 'Rute Patroli', Value: report.rutePatroli },
    { Section: 'HABITAT', Field: 'Kondisi Vegetasi', Value: report.kondisiVegetasi },
    { Section: 'HABITAT', Field: 'Kondisi Drainase', Value: report.kondisiDrainase },
    { Section: 'HABITAT', Field: 'Potensi Attractant', Value: report.potensiAttractant },
    { Section: 'HABITAT', Field: 'Habitat Management', Value: report.habitatManagement },
    { Section: 'HABITAT', Field: 'Area Perhatian', Value: report.areaPerhatian },
    { Section: 'PENGENDALIAN', Field: 'Mobile Dispersal', Value: report.nonLethal.mobileDispersal },
    { Section: 'PENGENDALIAN', Field: 'Auditory Deterrent', Value: report.nonLethal.auditoryDeterrent },
    { Section: 'PENGENDALIAN', Field: 'Visual Deterrent', Value: report.nonLethal.visualDeterrent },
    { Section: 'PENGENDALIAN', Field: 'Flyway Monitoring', Value: report.nonLethal.monitoringFlyway },
    { Section: 'PENGENDALIAN', Field: 'Selective Lethal Total', Value: `${report.selectiveLethal.totalLethal} ekor` },
    { Section: 'KESIMPULAN', Field: 'Kesimpulan', Value: report.kesimpulan.join('; ') },
    { Section: 'MITIGASI', Field: 'Rekomendasi Mitigasi', Value: report.mitigasi.join('; ') }
  ];
  const wsDetail = XLSX.utils.json_to_sheet(detail);
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Detail Patroli');

  const satwa = report.temuanSatwa.map((s, idx) => ({
    No: idx + 1,
    Spesies: s.spesies,
    'Jumlah (Ekor)': s.jumlah,
    Keterangan: s.keterangan || '-'
  }));
  const wsSatwa = XLSX.utils.json_to_sheet(satwa);
  XLSX.utils.book_append_sheet(wb, wsSatwa, 'Temuan Satwa');

  XLSX.writeFile(wb, `${report.reportNumber.replace(/\//g, '_')}.xlsx`);
};

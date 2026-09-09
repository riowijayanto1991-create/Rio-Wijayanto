import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PatrolReport, OccurrenceReport, WildlifeStrikeReport } from '../types';

export const exportPatrolPDF = (report: PatrolReport) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header Kop Surat PT Angkasa Pura Indonesia
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('PT ANGKASA PURA INDONESIA', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('AIRSIDE OPERATION & SAFETY - UNIT WILDLIFE HAZARD', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`No. Dokumen: ${report.reportNumber} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, pageWidth / 2, y, { align: 'center' });
  y += 4;

  // Horizontal divider
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.8);
  doc.line(15, y, pageWidth - 15, y);
  y += 6;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('1. LAPORAN PATROLI / INSPEKSI', 15, y);
  y += 7;

  // I. DATA KEGIATAN
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text('I. DATA KEGIATAN', 15, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const kegiatanData = [
    ['Hari / Tanggal', `: ${report.hariTanggal}`, 'Waktu Patroli', `: ${report.waktuPatroli}`],
    ['Pleton', `: ${report.pleton}`, 'Durasi', `: ${report.durasi}`],
    ['Dinas', `: ${report.dinas}`, 'Cuaca / Suhu', `: ${report.cuaca} / ${report.suhu}`],
    ['Situasi Operasional', `: ${report.situasiOperasional}`, '', ''],
    ['Person on Duty (POD)', `: ${report.pod.join(', ')}`, '', '']
  ];

  autoTable(doc, {
    startY: y,
    theme: 'plain',
    body: kegiatanData,
    styles: { fontSize: 8.5, cellPadding: 1.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 38 },
      1: { cellWidth: 55 },
      2: { fontStyle: 'bold', cellWidth: 28 },
      3: { cellWidth: 60 }
    },
    margin: { left: 15, right: 15 }
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  y = doc.lastAutoTable.finalY + 5;

  // II. RUTE PATROLI
  doc.setFont('helvetica', 'bold');
  doc.text('II. RUTE PATROLI', 15, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  const splitRoute = doc.splitTextToSize(report.rutePatroli || '-', pageWidth - 30);
  doc.text(splitRoute, 15, y);
  y += splitRoute.length * 4 + 4;

  // III. TEMUAN SATWA LIAR
  doc.setFont('helvetica', 'bold');
  doc.text('III. TEMUAN SATWA LIAR', 15, y);
  y += 4;

  const satwaRows = report.temuanSatwa.map((item, idx) => [
    `${idx + 1}.`,
    item.spesies,
    `${item.jumlah} ekor`,
    item.keterangan || '-'
  ]);

  if (satwaRows.length === 0) {
    satwaRows.push(['-', 'Tidak ada satwa teramati di area runway / perimeter', '0 ekor', 'Nihil']);
  }

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [['No.', 'Jenis / Nama Satwa', 'Jumlah', 'Keterangan / Lokasi']],
    body: satwaRows,
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 75 }
    },
    margin: { left: 15, right: 15 }
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 3;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Populasi Teramati : ${report.totalPopulasiTeramati} ekor`, 15, y);
  y += 7;

  // IV. MONITORING HABITAT DAN VEGETASI
  doc.setFont('helvetica', 'bold');
  doc.text('IV. MONITORING HABITAT DAN VEGETASI', 15, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  const habitatData = [
    `1. Kondisi Vegetasi / Rumput : ${report.kondisiVegetasi}`,
    `2. Kondisi Drainase / Genangan Air : ${report.kondisiDrainase}`,
    `3. Potensi Wildlife Attractant : ${report.potensiAttractant}`,
    `4. Habitat Management : ${report.habitatManagement}`,
    `5. Area Perhatian : ${report.areaPerhatian}`
  ];
  habitatData.forEach(text => {
    const split = doc.splitTextToSize(text, pageWidth - 30);
    doc.text(split, 15, y);
    y += split.length * 4 + 1.5;
  });
  y += 3;

  // Check page height, add page if needed
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  // V. TINDAKAN PENGENDALIAN
  doc.setFont('helvetica', 'bold');
  doc.text('V. TINDAKAN PENGENDALIAN', 15, y);
  y += 4.5;
  doc.text('5.1 Non-Lethal Control', 15, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  const nonLethalData = [
    `- Mobile dispersal : ${report.nonLethal.mobileDispersal || '-'}`,
    `- Auditory deterrent : ${report.nonLethal.auditoryDeterrent || '-'}`,
    `- Visual deterrent : ${report.nonLethal.visualDeterrent || '-'}`,
    `- Monitoring flyway movement : ${report.nonLethal.monitoringFlyway || '-'}`
  ];
  nonLethalData.forEach(text => {
    const split = doc.splitTextToSize(text, pageWidth - 30);
    doc.text(split, 15, y);
    y += split.length * 4 + 1;
  });

  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.text('5.2 Selective Lethal Control', 15, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  if (report.selectiveLethal.items.length > 0) {
    report.selectiveLethal.items.forEach(item => {
      doc.text(`- ${item.spesies} : ${item.jumlah} ekor`, 15, y);
      y += 4;
    });
  } else {
    doc.text('- Nihil / Tidak ada selective lethal control', 15, y);
    y += 4;
  }
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Selective Lethal : ${report.selectiveLethal.totalLethal} ekor`, 15, y);
  y += 6;

  // Check page height
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  // VI. KESIMPULAN
  doc.setFont('helvetica', 'bold');
  doc.text('VI. KESIMPULAN', 15, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  report.kesimpulan.forEach((k, idx) => {
    const split = doc.splitTextToSize(`${idx + 1}. ${k}`, pageWidth - 30);
    doc.text(split, 15, y);
    y += split.length * 4 + 1;
  });
  y += 3;

  // VII. MITIGASI
  doc.setFont('helvetica', 'bold');
  doc.text('VII. MITIGASI', 15, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  report.mitigasi.forEach((m, idx) => {
    const split = doc.splitTextToSize(`${idx + 1}. ${m}`, pageWidth - 30);
    doc.text(split, 15, y);
    y += split.length * 4 + 1;
  });

  // Signatures
  y += 8;
  if (y > 240) {
    doc.addPage();
    y = 25;
  }

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui / Diverifikasi:', 15, y);
  doc.text('Dibuat oleh:', pageWidth - 70, y);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Safety, Security & Quality (CASO)', 15, y);
  doc.text('Person on Duty (POD) Unit WHU', pageWidth - 70, y);
  y += 18;
  doc.text('( __________________________ )', 15, y);
  doc.text(`( ${report.pod[0] || 'Petugas WHU'} )`, pageWidth - 70, y);

  doc.save(`${report.reportNumber.replace(/\//g, '_')}_Patroli.pdf`);
};

export const exportOccurrencePDF = (report: OccurrenceReport) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('PT ANGKASA PURA INDONESIA', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('AIRSIDE OPERATION - UNIT WILDLIFE HAZARD', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`No. Dokumen: ${report.reportNumber} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, pageWidth / 2, y, { align: 'center' });
  y += 4;

  doc.setDrawColor(225, 29, 72);
  doc.setLineWidth(1);
  doc.line(15, y, pageWidth - 15, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('2. LAPORAN OCCURRENCE WILDLIFE HAZARD', 15, y);
  y += 7;

  // I. DATA OCCURRENCE
  doc.setFontSize(10.5);
  doc.text('I. DATA OCCURRENCE', 15, y);
  y += 5;

  const dataOcc = [
    ['Hari / Tanggal', `: ${report.hariTanggal}`, 'Waktu Kejadian', `: ${report.waktuKejadian}`],
    ['Pleton', `: ${report.pleton}`, 'Dinas', `: ${report.dinas}`],
    ['POD', `: ${report.pod}`, 'Lokasi', `: ${report.lokasi}${report.gridLocation ? ` (${report.gridLocation})` : ''}`],
    ['Runway / Taxiway / Area', `: ${report.runwayTaxiwayArea}`, 'Jenis Occurrence', `: ${report.jenisOccurrence}`]
  ];

  autoTable(doc, {
    startY: y,
    theme: 'plain',
    body: dataOcc,
    styles: { fontSize: 8.5, cellPadding: 1.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 55 },
      2: { fontStyle: 'bold', cellWidth: 35 },
      3: { cellWidth: 50 }
    },
    margin: { left: 15, right: 15 }
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 5;

  // II. KRONOLOGI KEJADIAN
  doc.setFont('helvetica', 'bold');
  doc.text('II. KRONOLOGI KEJADIAN', 15, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  const splitKron = doc.splitTextToSize(report.kronologi || '-', pageWidth - 30);
  doc.text(splitKron, 15, y);
  y += splitKron.length * 4 + 4;

  // III. IDENTIFIKASI SATWA
  doc.setFont('helvetica', 'bold');
  doc.text('III. IDENTIFIKASI SATWA', 15, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Jenis : ${report.jenisSatwa}`, 15, y);
  y += 4;
  doc.text(`Jumlah : ${report.jumlahSatwa} ekor`, 15, y);
  y += 4;
  doc.text(`Kondisi : [ ${report.kondisiSatwa === 'Hidup' ? '■' : '□'} Hidup ]   [ ${report.kondisiSatwa === 'Mati' ? '■' : '□'} Mati ]   [ ${report.kondisiSatwa === 'Terluka' ? '■' : '□'} Terluka ]   [ ${report.kondisiSatwa === 'Tidak teridentifikasi' ? '■' : '□'} Tidak teridentifikasi ]`, 15, y);
  y += 4;
  doc.text(`Aktivitas / Pergerakan : ${report.aktivitasPergerakan}`, 15, y);
  y += 6;

  // IV. KONDISI OPERASIONAL
  doc.setFont('helvetica', 'bold');
  doc.text('IV. KONDISI OPERASIONAL', 15, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Cuaca : ${report.cuaca}     Suhu : ${report.suhu}     Visibility : ${report.visibility}`, 15, y);
  y += 4;
  doc.text(`Kondisi Runway / Taxiway : ${report.kondisiRunwayTaxiway}`, 15, y);
  y += 4;
  doc.text(`Aktivitas Pergerakan Pesawat : ${report.aktivitasPergerakanPesawat}`, 15, y);
  y += 6;

  // V. POTENSI HAZARD
  doc.setFont('helvetica', 'bold');
  doc.text('V. POTENSI HAZARD', 15, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Jenis Potensi Hazard : ${report.jenisPotensiHazard}`, 15, y);
  y += 4;
  doc.text(`Potensi Dampak Operasi : ${report.potensiDampakOperasi}`, 15, y);
  y += 6;

  // VI. TINDAKAN YANG DILAKUKAN
  doc.setFont('helvetica', 'bold');
  doc.text('VI. TINDAKAN YANG DILAKUKAN', 15, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  const tindakanList = [
    `1. Deteksi / monitoring : ${report.tindakan.deteksiMonitoring || '-'}`,
    `2. Mobile dispersal : ${report.tindakan.mobileDispersal || '-'}`,
    `3. Auditory / visual deterrent : ${report.tindakan.auditoryVisualDeterrent || '-'}`,
    `4. Koordinasi : ${report.tindakan.koordinasi || '-'}`,
    `5. Tindakan lainnya : ${report.tindakan.tindakanLainnya || '-'}`
  ];
  tindakanList.forEach(t => {
    const split = doc.splitTextToSize(t, pageWidth - 30);
    doc.text(split, 15, y);
    y += split.length * 4 + 1;
  });
  y += 3;

  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  // VII. HASIL PENANGANAN
  doc.setFont('helvetica', 'bold');
  doc.text('VII. HASIL PENANGANAN', 15, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  const splitHasil = doc.splitTextToSize(report.hasilPenanganan || '-', pageWidth - 30);
  doc.text(splitHasil, 15, y);
  y += splitHasil.length * 4 + 2;
  doc.setFont('helvetica', 'bold');
  doc.text(`Status : [ ${report.status === 'Selesai' ? '■' : '□'} Selesai ]   [ ${report.status === 'Dalam Monitoring' ? '■' : '□'} Dalam Monitoring ]   [ ${report.status === 'Perlu Tindak Lanjut' ? '■' : '□'} Perlu Tindak Lanjut ]`, 15, y);
  y += 6;

  // VIII. REKOMENDASI / MITIGASI
  doc.setFont('helvetica', 'bold');
  doc.text('VIII. REKOMENDASI / MITIGASI', 15, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  report.rekomendasiMitigasi.forEach((rm, idx) => {
    const split = doc.splitTextToSize(`${idx + 1}. ${rm}`, pageWidth - 30);
    doc.text(split, 15, y);
    y += split.length * 4 + 1;
  });
  y += 3;

  // IX. DOKUMENTASI
  doc.setFont('helvetica', 'bold');
  doc.text('IX. DOKUMENTASI', 15, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Foto / Video : [ ${report.fotoVideoAda ? '■' : '□'} Ada ]   [ ${!report.fotoVideoAda ? '■' : '□'} Tidak Ada ]`, 15, y);
  y += 4;
  doc.text(`Keterangan : ${report.keteranganDokumentasi || '-'}`, 15, y);
  y += 12;

  // Signatures
  doc.setFontSize(8.5);
  doc.text('Diverifikasi oleh (AOCC / CASO):', 15, y);
  doc.text('Pelapor POD Unit WHU:', pageWidth - 70, y);
  y += 18;
  doc.text('( __________________________ )', 15, y);
  doc.text(`( ${report.pod} )`, pageWidth - 70, y);

  doc.save(`${report.reportNumber.replace(/\//g, '_')}_Occurrence.pdf`);
};

export const exportStrikePDF = (report: WildlifeStrikeReport) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('PT ANGKASA PURA INDONESIA', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(11);
  doc.setTextColor(185, 28, 28);
  doc.text('LAPORAN WILDLIFE STRIKE (ICAO DOC 9388)', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`No. Registrasi: ${report.reportNumber} | Status: ${report.statusLaporan}`, pageWidth / 2, y, { align: 'center' });
  y += 4;

  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(1.2);
  doc.line(15, y, pageWidth - 15, y);
  y += 6;

  // I. DATA KEJADIAN
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('I. DATA KEJADIAN', 15, y);
  y += 4.5;

  const dataKejadian = [
    ['Hari / Tanggal', `: ${report.hariTanggal}`, 'Waktu Kejadian', `: ${report.waktuKejadian}`],
    ['Pleton / Dinas', `: ${report.pleton} / ${report.dinas}`, 'POD', `: ${report.pod}`],
    ['Lokasi', `: ${report.lokasi}${report.gridLocation ? ` (${report.gridLocation})` : ''}`, 'Runway / Taxiway', `: ${report.runwayTaxiway}`],
    ['Sumber Informasi', `: [ ${report.sumberInformasi} ]`, '', '']
  ];

  autoTable(doc, {
    startY: y,
    theme: 'plain',
    body: dataKejadian,
    styles: { fontSize: 8.5, cellPadding: 1.2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { cellWidth: 60 },
      2: { fontStyle: 'bold', cellWidth: 35 },
      3: { cellWidth: 50 }
    },
    margin: { left: 15, right: 15 }
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 4;

  // II. DATA PESAWAT
  doc.setFont('helvetica', 'bold');
  doc.text('II. DATA PESAWAT', 15, y);
  y += 4;

  const dataPesawat = [
    ['Operator / Airline', `: ${report.operatorAirline}`, 'Flight Number', `: ${report.flightNumber}`],
    ['Aircraft Type', `: ${report.aircraftType}`, 'Registration', `: ${report.registration}`],
    ['Origin / Destination', `: ${report.origin} / ${report.destination}`, 'Posisi Pesawat', `: ${report.posisiPesawat}`]
  ];

  autoTable(doc, {
    startY: y,
    theme: 'plain',
    body: dataPesawat,
    styles: { fontSize: 8.5, cellPadding: 1.2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { cellWidth: 60 },
      2: { fontStyle: 'bold', cellWidth: 35 },
      3: { cellWidth: 50 }
    },
    margin: { left: 15, right: 15 }
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 4;

  // III. DATA WILDLIFE
  doc.setFont('helvetica', 'bold');
  doc.text('III. DATA WILDLIFE', 15, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(`Jenis : ${report.jenisWildlife}     Jumlah : ${report.jumlahWildlife} ekor`, 15, y);
  y += 4;
  doc.text(`Identifikasi : [ ${report.identifikasi === 'Teridentifikasi' ? '■' : '□'} Teridentifikasi ]   [ ${report.identifikasi === 'Belum teridentifikasi' ? '■' : '□'} Belum teridentifikasi ]`, 15, y);
  y += 4;
  doc.text(`Kondisi : [ ${report.kondisiWildlife === 'Hidup' ? '■' : '□'} Hidup ]  [ ${report.kondisiWildlife === 'Mati' ? '■' : '□'} Mati ]  [ ${report.kondisiWildlife === 'Terluka' ? '■' : '□'} Terluka ]  [ ${report.kondisiWildlife === 'Carcass/Sisa' ? '■' : '□'} Carcass/Sisa ]  [ ${report.kondisiWildlife === 'Tidak ditemukan' ? '■' : '□'} Tidak ditemukan ]`, 15, y);
  y += 6;

  // IV. KRONOLOGI WILDLIFE STRIKE
  doc.setFont('helvetica', 'bold');
  doc.text('IV. KRONOLOGI WILDLIFE STRIKE', 15, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  const splitStrike = doc.splitTextToSize(report.kronologiStrike || '-', pageWidth - 30);
  doc.text(splitStrike, 15, y);
  y += splitStrike.length * 4 + 3;

  doc.setFont('helvetica', 'bold');
  doc.text('FASE PENERBANGAN :', 15, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  const fp = report.fasePenerbangan;
  doc.text(`[ ${fp === 'Take-off roll' ? '■' : '□'} Take-off roll ]  [ ${fp === 'Initial climb' ? '■' : '□'} Initial climb ]  [ ${fp === 'Approach' ? '■' : '□'} Approach ]  [ ${fp === 'Landing roll' ? '■' : '□'} Landing roll ]  [ ${fp === 'Taxi' ? '■' : '□'} Taxi ]  [ ${fp === 'Lainnya' ? '■' : '□'} Lainnya ]`, 15, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('BAGIAN PESAWAT YANG TERDAMPAK :', 15, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(report.bagianPesawatTerdampak || '-', 15, y);
  y += 6;

  // V. DAMPAK TERHADAP PESAWAT
  doc.setFont('helvetica', 'bold');
  doc.text('V. DAMPAK TERHADAP PESAWAT', 15, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  const ik = report.indikasiKerusakan;
  doc.text(`Indikasi Kerusakan : [ ${ik === 'Tidak ada' ? '■' : '□'} Tidak ada ]   [ ${ik === 'Ada' ? '■' : '□'} Ada ]   [ ${ik === 'Belum diketahui' ? '■' : '□'} Belum diketahui ]`, 15, y);
  y += 4;
  doc.text(`Bagian Kerusakan : ${report.bagianKerusakan || '-'}`, 15, y);
  y += 4;
  doc.text(`Dampak Penerbangan : ${report.dampakPenerbangan || '-'}`, 15, y);
  y += 4;
  doc.text(`Keterangan : ${report.keteranganDampak || '-'}`, 15, y);
  y += 6;

  // Check page
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  // VI. TINDAKAN WILDLIFE HAZARD UNIT
  doc.setFont('helvetica', 'bold');
  doc.text('VI. TINDAKAN WILDLIFE HAZARD UNIT', 15, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  const tindakanUnit = [
    `1. Penerimaan informasi : ${report.tindakanUnit.penerimaanInformasi || '-'}`,
    `2. Verifikasi lokasi : ${report.tindakanUnit.verifikasiLokasi || '-'}`,
    `3. Pengumpulan evidence : ${report.tindakanUnit.pengumpulanEvidence || '-'}`,
    `4. Pengamanan / pembersihan : ${report.tindakanUnit.pengamananPembersihan || '-'}`,
    `5. Dispersal / pengendalian : ${report.tindakanUnit.dispersalPengendalian || '-'}`,
    `6. Koordinasi : ${report.tindakanUnit.koordinasi || '-'}`,
    `7. Dokumentasi : ${report.tindakanUnit.dokumentasi || '-'}`
  ];
  tindakanUnit.forEach(tu => {
    const split = doc.splitTextToSize(tu, pageWidth - 30);
    doc.text(split, 15, y);
    y += split.length * 4 + 1;
  });
  y += 4;

  // VII. HASIL INVESTIGASI AWAL
  doc.setFont('helvetica', 'bold');
  doc.text('VII. HASIL INVESTIGASI AWAL', 15, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Spesies : ${report.investigasiAwal.spesies || '-'}`, 15, y);
  y += 4;
  doc.text(`Lokasi / Hotspot : ${report.investigasiAwal.lokasiHotspot || '-'}`, 15, y);
  y += 4;
  doc.text(`Kondisi Habitat : ${report.investigasiAwal.kondisiHabitat || '-'}`, 15, y);
  y += 4;
  doc.text(`Potensi Attractant : ${report.investigasiAwal.potensiAttractant || '-'}`, 15, y);
  y += 4;
  doc.text(`Pola Flyway : ${report.investigasiAwal.polaFlyway || '-'}`, 15, y);
  y += 4;
  doc.text(`Indikasi Penyebab : ${report.investigasiAwal.indikasiPenyebab || '-'}`, 15, y);
  y += 6;

  // VIII. MITIGASI DAN TINDAK LANJUT
  doc.setFont('helvetica', 'bold');
  doc.text('VIII. MITIGASI DAN TINDAK LANJUT', 15, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  report.mitigasi.forEach((m, idx) => {
    const split = doc.splitTextToSize(`${idx + 1}. ${m}`, pageWidth - 30);
    doc.text(split, 15, y);
    y += split.length * 4 + 1;
  });
  y += 1;
  doc.text(`Rekomendasi : ${report.rekomendasi || '-'}`, 15, y);
  y += 6;

  // IX. DOKUMENTASI / EVIDENCE
  doc.setFont('helvetica', 'bold');
  doc.text('IX. DOKUMENTASI / EVIDENCE', 15, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  const ev = report.evidence;
  doc.text(`Foto Satwa/Carcass: [ ${ev.fotoSatwaCarcass ? '■ Ada' : '□ Tidak Ada'} ]   Foto Lokasi: [ ${ev.fotoLokasi ? '■ Ada' : '□ Tidak Ada'} ]   Foto Kerusakan: [ ${ev.fotoKerusakan ? '■ Ada' : '□ Tidak Ada'} ]`, 15, y);
  y += 4;
  doc.text(`Video: [ ${ev.video ? '■ Ada' : '□ Tidak Ada'} ]   Evidence lain: ${ev.evidenceLain || '-'}`, 15, y);
  y += 6;

  // X. STATUS LAPORAN
  doc.setFont('helvetica', 'bold');
  doc.text('X. STATUS LAPORAN', 15, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.text(`[ ${report.statusLaporan === 'Initial Report' ? '■' : '□'} Initial Report ]   [ ${report.statusLaporan === 'Preliminary Report' ? '■' : '□'} Preliminary Report ]   [ ${report.statusLaporan === 'Final Report' ? '■' : '□'} Final Report ]`, 15, y);
  y += 4;
  doc.text(`Tindak Lanjut : [ ${report.tindakLanjut ? '■ Ya' : '□ Tidak'} ]     Keterangan : ${report.keteranganStatus || '-'}`, 15, y);
  y += 12;

  // Signature
  doc.setFontSize(8.5);
  doc.text('Head of Safety & Quality (CASO):', 15, y);
  doc.text('Lead Investigator / Duty Officer WHU:', pageWidth - 70, y);
  y += 18;
  doc.text('( __________________________ )', 15, y);
  doc.text(`( ${report.pod} )`, pageWidth - 70, y);

  doc.save(`${report.reportNumber.replace(/\//g, '_')}_Wildlife_Strike.pdf`);
};

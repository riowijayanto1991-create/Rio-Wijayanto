import { PatrolReport, OccurrenceReport, WildlifeStrikeReport, ManagementRecipient, NotificationLog } from '../types';

export const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Play an aviation alert double-chime (Frequency: 880Hz -> 1046Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.15); // C6
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.55);
  } catch (err) {
    console.warn('Audio notification chime not allowed by browser yet:', err);
  }
};

export const generateWhatsAppMessage = (
  type: 'PATROL' | 'OCCURRENCE' | 'STRIKE',
  report: PatrolReport | OccurrenceReport | WildlifeStrikeReport
): string => {
  if (type === 'STRIKE') {
    const s = report as WildlifeStrikeReport;
    return `🚨 *[FLASH REPORT - WILDLIFE STRIKE INCIDENT]*
*SOEKARNO-HATTA AIRPORT (CGK/WIII) - WILDLIFE HAZARD UNIT*
----------------------------------------
*No. Laporan:* ${s.reportNumber}
*Waktu Kejadian:* ${s.hariTanggal}, Pukul ${s.waktuKejadian}
*Lokasi:* ${s.lokasi} (${s.runwayTaxiway})${s.gridLocation ? ` [CGK ${s.gridLocation}]` : ''}
*Sumber Informasi:* ${s.sumberInformasi}

✈️ *DATA PESAWAT*
• Maskapai: *${s.operatorAirline}* (${s.flightNumber})
• Tipe Pesawat: ${s.aircraftType} (Reg: ${s.registration})
• Rute: ${s.origin} ➔ ${s.destination}
• Fase Penerbangan: *${s.fasePenerbangan}*
• Bagian Terdampak: ${s.bagianPesawatTerdampak}

🦅 *IDENTIFIKASI SATWA*
• Satwa: ${s.jenisWildlife} (${s.jumlahWildlife} ekor)
• Kondisi: ${s.kondisiWildlife} (${s.identifikasi})

⚠️ *DAMPAK OPERASIONAL*
• Indikasi Kerusakan: *${s.indikasiKerusakan.toUpperCase()}*
• Kerusakan: ${s.bagianKerusakan || '-'}
• Dampak Penerbangan: ${s.dampakPenerbangan}

🛠️ *TINDAKAN WHU & RUNWAY STATUS*
• Runway Sweeping / Clear: *SELESAI DILAKUKAN*
• Status Landasan: *CLEAR & OPERASIONAL NORMAL*
• Status Laporan: *${s.statusLaporan}*
• Petugas POD: ${s.pod}

_Laporan resmi digital telah diinput ke Sistem Wildlife Hazard Management AP._`;
  }

  if (type === 'OCCURRENCE') {
    const o = report as OccurrenceReport;
    return `⚠️ *[OCCURRENCE REPORT - WILDLIFE HAZARD]*
*SOEKARNO-HATTA AIRPORT (CGK/WIII) - WILDLIFE HAZARD UNIT*
----------------------------------------
*No. Laporan:* ${o.reportNumber}
*Waktu Kejadian:* ${o.hariTanggal}, Pukul ${o.waktuKejadian}
*Lokasi:* ${o.lokasi} (${o.runwayTaxiwayArea})${o.gridLocation ? ` [CGK ${o.gridLocation}]` : ''}
*Jenis Kejadian:* ${o.jenisOccurrence}

🦅 *IDENTIFIKASI SATWA*
• Spesies: ${o.jenisSatwa} (${o.jumlahSatwa} ekor)
• Kondisi: ${o.kondisiSatwa}
• Aktivitas: ${o.aktivitasPergerakan}

🛡️ *TINDAKAN & HASIL PENANGANAN*
• Dispersal / Deterrent: ${o.tindakan.mobileDispersal || o.tindakan.auditoryVisualDeterrent || 'Patroli WHU'}
• Koordinasi: ${o.tindakan.koordinasi}
• Hasil: ${o.hasilPenanganan}
• Status: *${o.status.toUpperCase()}*
• Petugas POD: ${o.pod}

_Laporan tersimpan pada sistem monitoring airside Angkasa Pura._`;
  }

  // PATROL
  const p = report as PatrolReport;
  return `📋 *[LAPORAN PATROLI / INSPEKSI HARIAN WHU]*
*PT ANGKASA PURA INDONESIA - UNIT WILDLIFE HAZARD*
----------------------------------------
*No. Laporan:* ${p.reportNumber}
*Hari / Tanggal:* ${p.hariTanggal}
*Pleton / Dinas:* ${p.pleton} - ${p.dinas}
*Waktu Patroli:* ${p.waktuPatroli} (${p.durasi})
*Person on Duty:* ${p.pod.join(', ')}

🔎 *RINGKASAN TEMUAN*
• Total Populasi Satwa: *${p.totalPopulasiTeramati} ekor*
• Rute: ${p.rutePatroli}
• Kondisi Vegetasi & Drainase: ${p.kondisiVegetasi}
• Tindakan Dispersal: ${p.nonLethal.mobileDispersal}
• Selective Lethal: ${p.selectiveLethal.totalLethal} ekor

Status Landasan Pacu & Perimeter: *TERKENDALI & AMAN*`;
};

export const createNotificationLogsForRecipients = (
  type: 'PATROL' | 'OCCURRENCE' | 'STRIKE',
  report: PatrolReport | OccurrenceReport | WildlifeStrikeReport,
  recipients: ManagementRecipient[]
): NotificationLog[] => {
  const messageSummary = generateWhatsAppMessage(type, report);
  const titleMap = {
    STRIKE: `URGENT STRIKE ALERT: ${report.reportNumber} - ${(report as WildlifeStrikeReport).flightNumber}`,
    OCCURRENCE: `OCCURRENCE ALERT: ${report.reportNumber} - ${(report as OccurrenceReport).jenisSatwa}`,
    PATROL: `DAILY PATROL SUMMARY: ${report.reportNumber} - ${(report as PatrolReport).pleton}`
  };

  const relevantRecipients = recipients.filter(r => {
    if (type === 'STRIKE') return r.notifyOnStrike;
    if (type === 'OCCURRENCE') return r.notifyOnOccurrence;
    return r.notifyOnPatrol;
  });

  return relevantRecipients.map((r, idx) => ({
    id: `notif-${Date.now()}-${idx}`,
    timestamp: new Date().toISOString(),
    reportType: type,
    reportNumber: report.reportNumber,
    title: titleMap[type],
    recipientName: r.name,
    recipientRole: `${r.role} (${r.department})`,
    channel: 'WHATSAPP',
    status: 'TERKIRIM',
    messageSummary: messageSummary.slice(0, 140) + '...'
  }));
};

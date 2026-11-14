import { PatrolReport, OccurrenceReport, WildlifeStrikeReport, VehicleCheckReport, ManagementRecipient, NotificationLog } from '../types';

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

/**
 * Generates exact, full detailed WhatsApp messages matching the official paper/PDF report layout
 */
export const generateDetailedPatrolWhatsApp = (p: PatrolReport): string => {
  const satwaList = p.temuanSatwa && p.temuanSatwa.length > 0
    ? p.temuanSatwa.map((s, idx) => `  ${idx + 1}. *${s.spesies}* : ${s.jumlah} ekor${s.keterangan ? ` _(${s.keterangan})_` : ''}`).join('\n')
    : '  - Nihil temuan populasi satwa liar';

  const lethalItems = p.selectiveLethal?.items && p.selectiveLethal.items.length > 0
    ? p.selectiveLethal.items.map(item => `  - ${item.spesies}: ${item.jumlah} ekor`).join('\n')
    : '  - Nihil tindakan lethal';

  const kesimpulanList = p.kesimpulan && p.kesimpulan.length > 0
    ? p.kesimpulan.map((k, idx) => `  ${idx + 1}. ${k}`).join('\n')
    : '  1. Situasi pergerakan satwa di landasan pacu dan perimeter terpantau aman terkendali.';

  const mitigasiList = p.mitigasi && p.mitigasi.length > 0
    ? p.mitigasi.map((m, idx) => `  ${idx + 1}. ${m}`).join('\n')
    : '  1. Melanjutkan patroli rutin dan monitoring berkala pada titik rawan.';

  const coordsInfo = p.coordinates 
    ? `• Koordinat GPS : Lat ${p.coordinates.latitude.toFixed(5)}, Long ${p.coordinates.longitude.toFixed(5)} (${p.coordinates.distanceFromArpKm.toFixed(2)} km dari ARP WIII)\n• Status Radius : ${p.coordinates.isWithinOperationalRadius ? '✓ Dalam Radius Operasional (' + p.coordinates.maxRadiusAllowedKm + ' km)' : '⚠️ Di Luar Radius Operasional'}${p.coordinates.confirmedOutsideReason ? `\n• Justifikasi Luar Perimeter : ${p.coordinates.confirmedOutsideReason}` : ''}`
    : '';

  return `*PT ANGKASA PURA INDONESIA*
*ARFF DIVISION & SAFETY - WILDLIFE HAZARD MANAGEMENT UNIT*
*BANDAR UDARA INTERNASIONAL SOEKARNO-HATTA (CGK/WIII)*
━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *WOR — WILDLIFE OBSERVATION REPORT*
_Observasi dan pengumpulan data satwa liar_
*No. Registrasi:* ${p.reportNumber}
*Tanggal Laporan:* ${p.hariTanggal}
━━━━━━━━━━━━━━━━━━━━━━━━━━

*I. DATA KEGIATAN*
• Hari / Tanggal : ${p.hariTanggal}
• Waktu Patroli : ${p.waktuPatroli} (Durasi: ${p.durasi})
• Pleton / Dinas : ${p.pleton} - ${p.dinas}
• Cuaca / Suhu : ${p.cuaca}, ${p.suhu}
• Situasi Operasional : ${p.situasiOperasional || 'Normal Runway Traffic'}
• Person on Duty (POD) : ${Array.isArray(p.pod) ? p.pod.join(', ') : p.pod}

*II. RUTE PATROLI & GEOSPASIAL*
• Rute Patroli : ${p.rutePatroli}
• Sektor Grid Peta : ${p.gridLocation ? `[CGK ${p.gridLocation}]` : '-'}
${coordsInfo ? coordsInfo + '\n' : ''}
*III. TEMUAN SATWA LIAR*
${satwaList}
• *Total Populasi Teramati : ${p.totalPopulasiTeramati} ekor*

*IV. MONITORING HABITAT DAN VEGETASI*
1. Kondisi Vegetasi / Rumput : ${p.kondisiVegetasi || 'Normal terpotong rapi'}
2. Kondisi Drainase / Genangan : ${p.kondisiDrainase || 'Kering / Lancar'}
3. Potensi Wildlife Attractant : ${p.potensiAttractant || 'Nihil'}
4. Habitat Management : ${p.habitatManagement || 'Pemotongan rumput berkala'}
5. Area Perhatian : ${p.areaPerhatian || 'Sepanjang Shoulder & Perimeter'}

*V. TINDAKAN PENGENDALIAN*
*5.1 Non-Lethal Control:*
- Mobile dispersal : ${p.nonLethal?.mobileDispersal || 'Patroli mobile rutin'}
- Auditory deterrent : ${p.nonLethal?.auditoryDeterrent || 'Sirene armada & Megaphone Bird Scarer'}
- Visual deterrent : ${p.nonLethal?.visualDeterrent || 'Rotary strobo & Green Laser'}
- Monitoring flyway movement : ${p.nonLethal?.monitoringFlyway || 'Terpantau normal'}

*5.2 Selective Lethal Control:*
${lethalItems}
- *Total Selective Lethal : ${p.selectiveLethal?.totalLethal || 0} ekor*

*VI. KESIMPULAN*
${kesimpulanList}

*VII. MITIGASI DAN TINDAK LANJUT*
${mitigasiList}

*VIII. DOKUMENTASI & STATUS OPERASIONAL*
• Bukti Foto Lapangan : ${p.fotos && p.fotos.length > 0 ? `✓ ${p.fotos.length} Foto Terlampir` : 'Nihil'}
${p.keteranganDokumentasi ? `• Catatan Dokumentasi : ${p.keteranganDokumentasi}\n` : ''}• Status Landasan Pacu & Perimeter : *TERKENDALI & AMAN*
━━━━━━━━━━━━━━━━━━━━━━━━━━
_Dokumen resmi tervalidasi Standar Keselamatan Operasi Bandara KP 326 & ICAO Doc 9137 Wildlife Control and Reduction._`;
};

export const generateDetailedOccurrenceWhatsApp = (o: OccurrenceReport): string => {
  const mitigasiList = o.rekomendasiMitigasi && o.rekomendasiMitigasi.length > 0
    ? o.rekomendasiMitigasi.map((rm, idx) => `  ${idx + 1}. ${rm}`).join('\n')
    : '  1. Peningkatan intensitas patroli mobile di sektor kejadian.';

  return `*PT ANGKASA PURA INDONESIA*
*ARFF DIVISION & SAFETY - WILDLIFE HAZARD MANAGEMENT UNIT*
*BANDAR UDARA INTERNASIONAL SOEKARNO-HATTA (CGK/WIII)*
━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ *WHR — WILDLIFE HAZARD REPORT*
_Identifikasi bahaya, evaluasi risiko, dan mitigasi_
*No. Dokumen:* ${o.reportNumber}
*Tanggal Laporan:* ${o.hariTanggal}
━━━━━━━━━━━━━━━━━━━━━━━━━━

*I. DATA OCCURRENCE*
• Hari / Tanggal : ${o.hariTanggal}
• Waktu Kejadian : Pukul ${o.waktuKejadian} WIB
• Pleton / Dinas : ${o.pleton} / ${o.dinas}
• Person on Duty (POD) : ${o.pod}
• Lokasi Kejadian : ${o.lokasi} ${o.gridLocation ? `[CGK ${o.gridLocation}]` : ''}
• Runway / Area : ${o.runwayTaxiwayArea}
• Jenis Occurrence : *${o.jenisOccurrence}*

*II. KRONOLOGI KEJADIAN*
${o.kronologi}

*III. IDENTIFIKASI SATWA*
• Jenis / Spesies Satwa : *${o.jenisSatwa}*
• Jumlah Satwa : *${o.jumlahSatwa} ekor*
• Kondisi Satwa : *${o.kondisiSatwa}*
• Aktivitas / Pergerakan : ${o.aktivitasPergerakan}

*IV. KONDISI OPERASIONAL*
• Cuaca / Suhu : ${o.cuaca} (${o.suhu})
• Jarak Pandang (Visibility) : ${o.visibility}
• Kondisi Runway / Taxiway : ${o.kondisiRunwayTaxiway}
• Aktivitas Pergerakan Pesawat : ${o.aktivitasPergerakanPesawat}

*V. POTENSI HAZARD*
• Jenis Potensi Hazard : ${o.jenisPotensiHazard}
• Potensi Dampak Operasi : ${o.potensiDampakOperasi}

*VI. TINDAKAN YANG DILAKUKAN*
1. Deteksi / monitoring : ${o.tindakan?.deteksiMonitoring || '-'}
2. Mobile dispersal : ${o.tindakan?.mobileDispersal || '-'}
3. Auditory / visual deterrent : ${o.tindakan?.auditoryVisualDeterrent || '-'}
4. Koordinasi (ATC/AMC) : ${o.tindakan?.koordinasi || '-'}
5. Tindakan lainnya : ${o.tindakan?.tindakanLainnya || '-'}

*VII. HASIL PENANGANAN*
• Hasil Penanganan : ${o.hasilPenanganan}
• Status Operasional : *${o.status.toUpperCase()}*

*VIII. REKOMENDASI / MITIGASI*
${mitigasiList}

*IX. DOKUMENTASI & EVIDENCE*
• Status Bukti Fisik : ${o.fotoVideoAda || (o.fotos && o.fotos.length > 0) ? `Ada (${o.fotos?.length || 1} file terlampir)` : 'Tidak Ada'}
${o.keteranganDokumentasi ? `• Catatan Dokumentasi : ${o.keteranganDokumentasi}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━
_Laporan resmi tersimpan pada Sistem Monitoring Airside & Wildlife Hazard Management PT Angkasa Pura Indonesia._`;
};

export const generateDetailedStrikeWhatsApp = (s: WildlifeStrikeReport): string => {
  const mitigasiList = s.mitigasi && s.mitigasi.length > 0
    ? s.mitigasi.map((m, idx) => `  ${idx + 1}. ${m}`).join('\n')
    : '  1. Peningkatan sweeping landasan pacu pasca pergerakan pesawat.';

  return `*PT ANGKASA PURA INDONESIA*
*ARFF DIVISION & SAFETY - WILDLIFE HAZARD MANAGEMENT UNIT*
*BANDAR UDARA INTERNASIONAL SOEKARNO-HATTA (CGK/WIII)*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 *WSR — WILDLIFE STRIKE REPORT (ICAO DOC 9388)*
_Pencatatan dugaan atau kejadian wildlife strike, bukti, dampak, dan status verifikasi_
*No. Dokumen:* ${s.reportNumber}
*Tanggal Laporan:* ${s.hariTanggal}
━━━━━━━━━━━━━━━━━━━━━━━━━━

*I. DATA KEJADIAN*
• Hari / Tanggal : ${s.hariTanggal}
• Waktu Kejadian : Pukul ${s.waktuKejadian} WIB
• Pleton / Dinas : ${s.pleton} / ${s.dinas}
• Person on Duty (POD) : ${s.pod}
• Lokasi Kejadian : ${s.lokasi} (${s.runwayTaxiway}) ${s.gridLocation ? `[CGK ${s.gridLocation}]` : ''}
• Sumber Informasi : *${s.sumberInformasi}${s.sumberInformasiLainnya ? ` (${s.sumberInformasiLainnya})` : ''}*

*II. DATA PESAWAT*
• Operator / Maskapai : *${s.operatorAirline}*
• Nomor Penerbangan : *${s.flightNumber}*
• Tipe Pesawat : *${s.aircraftType}* (Registrasi: *${s.registration}*)
• Rute Penerbangan : *${s.origin} ➔ ${s.destination}*
• Posisi Pesawat : ${s.posisiPesawat || '-'}

*III. DATA WILDLIFE*
• Jenis / Spesies Satwa : *${s.jenisWildlife}*
• Jumlah Satwa : *${s.jumlahWildlife} ekor*
• Status Identifikasi : *${s.identifikasi}*
• Kondisi Satwa : *${s.kondisiWildlife}*

*IV. KRONOLOGI WILDLIFE STRIKE*
${s.kronologiStrike}
• *Fase Penerbangan :* *${s.fasePenerbangan}${s.fasePenerbanganLainnya ? ` (${s.fasePenerbanganLainnya})` : ''}*
• *Bagian Pesawat yang Terdampak :* *${s.bagianPesawatTerdampak}*

*V. DAMPAK TERHADAP PESAWAT*
• Indikasi Kerusakan : *${s.indikasiKerusakan.toUpperCase()}*
• Bagian Kerusakan : ${s.bagianKerusakan || '-'}
• Dampak Penerbangan : ${s.dampakPenerbangan}
• Keterangan Dampak : ${s.keteranganDampak || '-'}

*VI. TINDAKAN WILDLIFE HAZARD UNIT*
1. Penerimaan informasi : ${s.tindakanUnit?.penerimaanInformasi || '-'}
2. Verifikasi lokasi : ${s.tindakanUnit?.verifikasiLokasi || '-'}
3. Pengumpulan evidence : ${s.tindakanUnit?.pengumpulanEvidence || '-'}
4. Pengamanan / pembersihan : ${s.tindakanUnit?.pengamananPembersihan || '-'}
5. Dispersal / pengendalian : ${s.tindakanUnit?.dispersalPengendalian || '-'}
6. Koordinasi (ATC/AMC/Airlines) : ${s.tindakanUnit?.koordinasi || '-'}
7. Dokumentasi : ${s.tindakanUnit?.dokumentasi || '-'}

*VII. HASIL INVESTIGASI AWAL*
• Spesies : ${s.investigasiAwal?.spesies || s.jenisWildlife}
• Lokasi / Hotspot : ${s.investigasiAwal?.lokasiHotspot || s.lokasi}
• Kondisi Habitat : ${s.investigasiAwal?.kondisiHabitat || '-'}
• Potensi Attractant : ${s.investigasiAwal?.potensiAttractant || '-'}
• Pola Flyway : ${s.investigasiAwal?.polaFlyway || '-'}
• Indikasi Penyebab : ${s.investigasiAwal?.indikasiPenyebab || '-'}

*VIII. MITIGASI DAN TINDAK LANJUT*
${mitigasiList}
• *Rekomendasi :* ${s.rekomendasi || '-'}

*IX. DOKUMENTASI / EVIDENCE*
• Foto Satwa/Carcass : ${s.evidence?.fotoSatwaCarcass || (s.fotos && s.fotos.length > 0) ? 'Ada' : 'Tidak Ada'}
• Foto Lokasi Kejadian : ${s.evidence?.fotoLokasi ? 'Ada' : 'Tidak Ada'}
• Foto Kerusakan Pesawat : ${s.evidence?.fotoKerusakan ? 'Ada' : 'Tidak Ada'}
• Rekaman Video : ${s.evidence?.video ? 'Ada' : 'Tidak Ada'}
• Evidence Lainnya : ${s.evidence?.evidenceLain || '-'}
${s.keteranganDokumentasi ? `• Catatan Dokumentasi : ${s.keteranganDokumentasi}\n` : ''}
*X. STATUS LAPORAN & RUNWAY STATUS*
• Status Laporan : *${s.statusLaporan.toUpperCase()}*
• Tindak Lanjut Diperlukan : ${s.tindakLanjut ? 'Ya' : 'Tidak'}
• Keterangan Status : ${s.keteranganStatus || '-'}
• Status Landasan Pacu : *CLEAR & OPERASIONAL NORMAL*
━━━━━━━━━━━━━━━━━━━━━━━━━━
_Laporan resmi digital telah diinput ke ICAO IBIS Database & Sistem WHMS PT Angkasa Pura Indonesia._`;
};

export const generateDetailedVehicleWhatsApp = (v: VehicleCheckReport): string => {
  const kmStr = typeof v.odometerKM === 'number' ? v.odometerKM.toLocaleString('id-ID') : (v.odometerKM || '0');
  const amunisiStr = typeof v.amunisiFlareButir === 'number' ? `${v.amunisiFlareButir} Butir` : (v.amunisiFlareButir ? `${v.amunisiFlareButir} Butir` : '0 Butir');

  return `*PT ANGKASA PURA INDONESIA*
*ARFF DIVISION & SAFETY - WILDLIFE HAZARD MANAGEMENT UNIT*
*BANDAR UDARA INTERNASIONAL SOEKARNO-HATTA (CGK/WIII)*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🚙 *BERITA ACARA & PENGECEKAN KENDARAAN OPERASIONAL AIRSIDE*
*No. Dokumen:* ${v.reportNumber}
*Hari / Tanggal:* ${v.hariTanggal}
*Waktu Pengecekan:* Pukul ${v.waktuPengecekan || '-'} WIB
*Dinas / Pleton:* ${v.dinas} (${v.pleton})
*STATUS KELAYAKAN:* *${(v.statusKelayakan || 'SIAP OPERASI (SERVICEABLE)').toUpperCase()}*
━━━━━━━━━━━━━━━━━━━━━━━━━━

*I. DATA IDENTITAS ARMADA*
• Nomor Lambung : *${v.nomorLambung}*
• Plat Nomor Polisi : *${v.platNomor}*
• Merk / Tipe Kendaraan : ${v.merkModel}
• Odometer Tercatat : *${kmStr} KM*
• Level BBM Tangki : *${v.levelBBM}*

*II.A PEMERIKSAAN KELAYAKAN MEKANIKAL, FISIK & KELISTRIKAN AIRSIDE*
1. Oli Mesin & Coolant Radiator : ${v.oliMesinCoolant || 'Normal / Cukup'}
2. Sistem Rem Kaki & Handbrake : ${v.sistemRemTangan || 'Berfungsi Baik'}
3. Kondisi Ban (4 Roda + Serep) : ${v.kondisiBanTekanan || 'Tekanan Baik & Tebal'}
4. Lampu Utama (Jauh / Dekat) & Fog : ${v.lampuUtamaJauhDekat || 'Menyala Terang'}
5. Lampu Rotary Strobo Amber (Airside) : *${v.lampuRotaryStroboAirside || 'Menyala Normal'}*
6. Lampu Sein, Hazard & Rem : ${v.lampuSeinHazardRem || 'Berfungsi Normal'}
7. Wiper & Air Pembersih Kaca : ${v.wiperAirPembersih || 'Normal & Bersih'}
8. Klakson & Sirine Suara Airside : ${v.klaksonSirineAirside || 'Berfungsi Keras'}
9. AC Kabin & Kelistrikan 12V : ${v.acKabinKelistrikan || 'Dingin & Normal'}
10. Kebersihan Fisik Kendaraan : ${v.kebersihanKendaraan || 'Bersih Siap Operasi'}

*II.B INVENTARIS PERALATAN HALAU SATWA & SAFETY AIRSIDE*
1. Radio Airside HT (VHF Bandara) : *${v.radioAirsideHT || 'Ada & Standby VHF 118.1'}*
2. Bird Scarer Megaphone Sound System : ${v.birdScarerSoundMegaphone || 'Siap Digunakan'}
3. Laser Pengusir Satwa (Bird Laser) : ${v.laserBirdDisperser || 'Baterai Penuh & Normal'}
4. Pistol Suar (Flare Gun) : ${v.pyroFlareGun || 'Lengkap & Siap Operasi'}
5. Sisa Amunisi Flare Gun : *${amunisiStr}*
6. Teropong / Binokular 10x50 : ${v.binokularTeropong || 'Lensa Bersih'}
7. Senter Taktis High-Beam Searchlight : ${v.senterTaktisSearchlight || 'Baterai Penuh'}
8. Jaring Tangkap & Handling Gloves : ${v.jaringNetGunHandling || 'Tersedia di Armada'}
9. APAR Kendaraan (Pemadam Api) : ${v.aparKendaraan || 'Tekanan Hijau / Standby'}
10. Kotak P3K Airside First Aid : ${v.kotakP3K || 'Lengkap Segel'}
11. Tool Kit, Kunci Roda & Dongkrak : ${v.toolKitDongkrak || 'Lengkap di Bagasi'}

*III. BERITA ACARA SERAH TERIMA TUGAS*
• Petugas Menyerahkan (Dinas Sebelumnya) : *${v.petugasMenyerahkan}*
• Petugas Menerima (Dinas Aktif) : *${v.petugasMenerima}*
• Mengetahui (Supervisor / Duty Lead) : *${v.supervisorLead}*
• Catatan Kerusakan / Kendala Fisik : ${v.catatanKerusakanKendala || 'Tidak ada catatan kerusakan teknis.'}
• Catatan Khusus Serah Terima : ${v.catatanSerahTerima || 'Armada dan seluruh kelengkapan checklist diserahterimakan dalam kondisi lengkap dan prima.'}
━━━━━━━━━━━━━━━━━━━━━━━━━━
📎 *BUKTI PDF RESMI:* Telah diekspor dan dilampirkan bersama pesan ini untuk verifikasi pimpinan.
_Dokumen resmi tervalidasi standar keselamatan ICAO Doc 9137 & ARFF Division PT Angkasa Pura Indonesia._`;
};

/**
 * Main WhatsApp message generator supporting both DETAILED (default) and CONCISE formats.
 */
export const generateWhatsAppMessage = (
  type: 'PATROL' | 'OCCURRENCE' | 'STRIKE' | 'VEHICLE',
  report: PatrolReport | OccurrenceReport | WildlifeStrikeReport | VehicleCheckReport,
  mode: 'DETAILED' | 'CONCISE' = 'DETAILED'
): string => {
  if (mode === 'DETAILED') {
    if (type === 'VEHICLE') return generateDetailedVehicleWhatsApp(report as VehicleCheckReport);
    if (type === 'STRIKE') return generateDetailedStrikeWhatsApp(report as WildlifeStrikeReport);
    if (type === 'OCCURRENCE') return generateDetailedOccurrenceWhatsApp(report as OccurrenceReport);
    return generateDetailedPatrolWhatsApp(report as PatrolReport);
  }

  // CONCISE format
  if (type === 'VEHICLE') {
    const v = report as VehicleCheckReport;
    const kmStr = typeof v.odometerKM === 'number' ? v.odometerKM.toLocaleString('id-ID') : (v.odometerKM || '0');
    return `📋 *[LAPORAN PENGECEKAN KENDARAAN WHU]*
*PT ANGKASA PURA INDONESIA - CGK*
----------------------------------------
*No. Dokumen:* ${v.reportNumber}
*Tanggal / Waktu:* ${v.hariTanggal} | Pukul ${v.waktuPengecekan || '-'}
*Armada:* ${v.nomorLambung} (${v.platNomor}) - ${v.merkModel}
*Odometer / BBM:* ${kmStr} KM | BBM: ${v.levelBBM}
*Status Kelayakan:* *${(v.statusKelayakan || 'SIAP OPERASI').toUpperCase()}*
*Serah Terima:* ${v.petugasMenyerahkan} ➔ ${v.petugasMenerima}
*Mengetahui:* ${v.supervisorLead}`;
  }

  if (type === 'STRIKE') {
    const s = report as WildlifeStrikeReport;
    return `🚨 *[FLASH REPORT - WILDLIFE STRIKE]*
*SOEKARNO-HATTA AIRPORT (CGK/WIII)*
----------------------------------------
*No. Laporan:* ${s.reportNumber}
*Waktu Kejadian:* ${s.hariTanggal}, Pukul ${s.waktuKejadian}
*Lokasi:* ${s.lokasi} (${s.runwayTaxiway})
*Pesawat:* ${s.operatorAirline} (${s.flightNumber}) - ${s.aircraftType}
*Satwa:* ${s.jenisWildlife} (${s.jumlahWildlife} ekor) - ${s.kondisiWildlife}
*Fase / Dampak:* ${s.fasePenerbangan} | Kerusakan: ${s.indikasiKerusakan}
*Status Landasan:* *CLEAR & OPERASIONAL NORMAL*`;
  }

  if (type === 'OCCURRENCE') {
    const o = report as OccurrenceReport;
    return `⚠️ *[OCCURRENCE REPORT - WILDLIFE]*
*SOEKARNO-HATTA AIRPORT (CGK/WIII)*
----------------------------------------
*No. Laporan:* ${o.reportNumber}
*Waktu Kejadian:* ${o.hariTanggal}, Pukul ${o.waktuKejadian}
*Lokasi:* ${o.lokasi} (${o.runwayTaxiwayArea})
*Satwa:* ${o.jenisSatwa} (${o.jumlahSatwa} ekor) - ${o.kondisiSatwa}
*Tindakan:* ${o.tindakan?.mobileDispersal || 'Patroli WHU'}
*Hasil / Status:* ${o.hasilPenanganan} (${o.status.toUpperCase()})`;
  }

  // PATROL
  const p = report as PatrolReport;
  return `📋 *[LAPORAN PATROLI / INSPEKSI WHU]*
*PT ANGKASA PURA INDONESIA - CGK*
----------------------------------------
*No. Laporan:* ${p.reportNumber}
*Hari / Tanggal:* ${p.hariTanggal} (${p.waktuPatroli})
*Pleton / Dinas:* ${p.pleton} - ${p.dinas}
*POD:* ${Array.isArray(p.pod) ? p.pod.join(', ') : p.pod}
*Populasi Satwa Teramati:* ${p.totalPopulasiTeramati} ekor
*Dispersal:* ${p.nonLethal?.mobileDispersal || '-'} | Selective Lethal: ${p.selectiveLethal?.totalLethal || 0} ekor
*Status Landasan & Perimeter:* *TERKENDALI & AMAN*`;
};

export const createNotificationLogsForRecipients = (
  type: 'PATROL' | 'OCCURRENCE' | 'STRIKE' | 'VEHICLE',
  report: PatrolReport | OccurrenceReport | WildlifeStrikeReport | VehicleCheckReport,
  recipients: ManagementRecipient[]
): NotificationLog[] => {
  const messageSummary = generateWhatsAppMessage(type, report, 'CONCISE');
  const titleMap = {
    STRIKE: `URGENT STRIKE ALERT: ${report.reportNumber} - ${(report as WildlifeStrikeReport).flightNumber}`,
    OCCURRENCE: `OCCURRENCE ALERT: ${report.reportNumber} - ${(report as OccurrenceReport).jenisSatwa}`,
    PATROL: `DAILY PATROL SUMMARY: ${report.reportNumber} - ${(report as PatrolReport).pleton}`,
    VEHICLE: `LAPORAN KENDARAAN & SERAH TERIMA: ${report.reportNumber} - ${(report as VehicleCheckReport).nomorLambung}`
  };

  const relevantRecipients = recipients.filter(r => {
    if (type === 'STRIKE') return r.notifyOnStrike;
    if (type === 'OCCURRENCE') return r.notifyOnOccurrence;
    if (type === 'VEHICLE') return true;
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

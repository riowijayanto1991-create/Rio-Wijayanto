import { PatrolReport, OccurrenceReport, WildlifeStrikeReport, ManagementRecipient, NotificationLog } from '../types';

export const INITIAL_PATROL_REPORTS: PatrolReport[] = [
  {
    id: 'patrol-001',
    reportNumber: 'WHU/PATROL/2026/09/0082',
    createdAt: '2026-09-09T07:30:00.000Z',
    hariTanggal: 'Rabu, 09 September 2026',
    pleton: 'Pleton 1',
    dinas: 'Dinas Pagi (06:00 - 14:00)',
    pod: ['Achmad Fauzi (Lead)', 'Budi Santoso', 'Rian Hidayat'],
    waktuPatroli: '06:00 - 08:30 WIB',
    durasi: '150 Menit',
    cuaca: 'Cerah',
    suhu: '27°C',
    situasiOperasional: 'Pergerakan penerbangan pagi sangat padat (Peak Hour), runway 07R/25L dan 07L/25R aktif digunakan.',
    rutePatroli: 'Perimeter Selatan, Perimeter Utara, Runway Infield 07R-25L, Taxiway Alpha s/d Echo, Kolam Retensi Barat.',
    gridLocation: 'Grid E7',
    temuanSatwa: [
      { id: 't-1', spesies: 'Burung Kuntul Kerbau (Bubulcus ibis)', jumlah: 24, keterangan: 'Berkumpul di rumput runway shoulder 25L' },
      { id: 't-2', spesies: 'Blekok Sawah (Ardeola speciosa)', jumlah: 8, keterangan: 'Dekat parit drainase Taxiway Delta' },
      { id: 't-3', spesies: 'Layang-layang Api (Hirundo rustica)', jumlah: 35, keterangan: 'Terbang rendah melintas centerline 07R' },
      { id: 't-4', spesies: 'Biawak Air (Varanus salvator)', jumlah: 1, keterangan: 'Merayap di dekat box drainase perimeter barat' }
    ],
    totalPopulasiTeramati: 68,
    kondisiVegetasi: 'Ketinggian rumput terpantau 10 - 14 cm. Jadwal pemotongan rumput strip runway berjalan terjadwal oleh unit Landscape.',
    kondisiDrainase: 'Aliran air box culvert lancar, tidak ada genangan air sisa hujan semalam.',
    potensiAttractant: 'Populasi belalang kembara dan cacing tanah meningkat pasca pemotongan rumput area infield.',
    habitatManagement: 'Pembersihan genangan mikro, penutupan sarang serangga, koordinasi pemotongan rumput tidak menyisakan sisa cacahan di dekat runway.',
    areaPerhatian: 'Infield antara Runway 07R dan Taxiway Alpha (titik favorit burung kuntul mencari makan cacing/serangga).',
    nonLethal: {
      mobileDispersal: 'Patroli kendaraan WHU-01 menggunakan sirine dan klakson interval tinggi di sepanjang shoulder runway.',
      auditoryDeterrent: 'Penembakan bird banger (pyrotechnics) 6 kali letusan pada koordinat shoulder RWY 25L.',
      visualDeterrent: 'Pemasangan reflective ribbon dan laser gun hijau pada kawanan burung kuntul.',
      monitoringFlyway: 'Jalur lintas burung dari rawa perimeter utara menuju persawahan luar perimeter selatan dipantau intensif.'
    },
    selectiveLethal: {
      items: [
        { id: 'sl-1', spesies: 'Burung Gereja Erasia (spesies berisiko tinggi)', jumlah: 2 }
      ],
      totalLethal: 2
    },
    kesimpulan: [
      'Aktivitas satwa liar pada shift pagi didominasi burung air (Kuntul dan Blekok) yang tertarik serangga di rerumputan.',
      'Tindakan dispersal non-lethal berhasil mengusir kawanan dari runway safety area (RSA) tanpa mengganggu operasional penerbangan.',
      'Kondisi airside secara umum terkendali dan aman untuk pendaratan serta lepas landas pesawat.'
    ],
    mitigasi: [
      'Tingkatkan intensitas mobile dispersal 15 menit sebelum peak arrival penerbangan internasional.',
      'Koordinasi dengan Unit Apron & Runway Maintenance untuk pembersihan sampah organik di sekitar drainase perimeter.',
      'Pemeriksaan rutin fungsi gas cannon / acoustic deterrent di perimeter timur.',
      'Briefing kewaspadaan flyway pagi bersama tower ATC.'
    ]
  },
  {
    id: 'patrol-002',
    reportNumber: 'WHU/PATROL/2026/09/0081',
    createdAt: '2026-09-08T16:00:00.000Z',
    hariTanggal: 'Selasa, 08 September 2026',
    pleton: 'Pleton 3',
    dinas: 'Dinas Siang (14:00 - 22:00)',
    pod: ['Dwi Wicaksono', 'Hendro Purnomo'],
    waktuPatroli: '14:30 - 17:00 WIB',
    durasi: '150 Menit',
    cuaca: 'Berawan',
    suhu: '31°C',
    situasiOperasional: 'Lalu lintas udara lancar, angin bertiup 8 knots dari barat daya.',
    rutePatroli: 'Runway 07L/25R, Taxiway November & Papa, Kolam Retensi Timur.',
    temuanSatwa: [
      { id: 't-11', spesies: 'Elang Tikus (Elanus caeruleus)', jumlah: 2, keterangan: 'Hovering di atas grassy area RWY 07L' },
      { id: 't-12', spesies: 'Burung Gereja (Passer montanus)', jumlah: 18, keterangan: 'Dekat bangunan sub-stasiun listrik' }
    ],
    totalPopulasiTeramati: 20,
    kondisiVegetasi: 'Rumput kering di beberapa titik infield, tinggi rumput stabil di bawah 12 cm.',
    kondisiDrainase: 'Kering dan bersih dari sampah kantong plastik.',
    potensiAttractant: 'Keberadaan tikus tanah (rodentia) di area vegetasi memancing predator elang.',
    habitatManagement: 'Pemasangan perangkap rodentia mekanis di perimeter pagar pembatas.',
    areaPerhatian: 'Approach 07L sekitar threshold.',
    nonLethal: {
      mobileDispersal: 'Patroli roda empat keliling infield memecah konsentrasi burung.',
      auditoryDeterrent: 'Sirene kendaraan WHU diaktifkan saat mendekati runway strip.',
      visualDeterrent: 'Pengarahan lampu sorot strobe kendaraan patroli.',
      monitoringFlyway: 'Pantauan radar visual tidak menunjukkan formasi flocking besar.'
    },
    selectiveLethal: {
      items: [],
      totalLethal: 0
    },
    kesimpulan: [
      'Populasi burung pada sore hari menurun dibandingkan pagi hari.',
      'Predator elang tikus berpindah ke luar perimeter bandara setelah dilakukan pengusiran kendaraan patroli.'
    ],
    mitigasi: [
      'Lanjutkan pemberantasan rodentia sebagai sumber mangsa elang.',
      'Laporkan ke Tower jika elang kembali terlihat dalam jarak 1 km dari approach path.'
    ]
  }
];

export const INITIAL_OCCURRENCE_REPORTS: OccurrenceReport[] = [
  {
    id: 'occ-001',
    reportNumber: 'WHU/OCC/2026/09/0014',
    createdAt: '2026-09-09T08:15:00.000Z',
    hariTanggal: 'Rabu, 09 September 2026',
    waktuKejadian: '07:45 WIB',
    pleton: 'Pleton 1',
    dinas: 'Dinas Pagi (06:00 - 14:00)',
    pod: 'Achmad Fauzi (Lead WHU)',
    lokasi: 'Threshold Runway 25L',
    gridLocation: 'Grid G12',
    runwayTaxiwayArea: 'Runway 25L - Stopway & PAPI Light Area',
    jenisOccurrence: 'Kawanan Burung Kuntul (Flock) melintas rendah di jalur glide path saat pesawat bersiap touchdown',
    kronologi: 'Pukul 07:43 WIB ATC TWR menginformasikan pilot GA-152 melihat kawanan burung sekitar 100 kaki di depan threshold 25L. Petugas WHU yang sedang siaga di Holding Bay segera merespon ke lokasi runway shoulder, mengamati sekelompok 15 ekor burung kuntul terbang melingkar. Petugas segera menembakkan bird banger 2 butir dan menyalakan sirine. Kawanan burung langsung bubar ke arah luar perimeter selatan (rawa-rawa) pada pukul 07:47 WIB.',
    jenisSatwa: 'Burung Kuntul Kerbau (Bubulcus ibis)',
    jumlahSatwa: 15,
    kondisiSatwa: 'Hidup',
    aktivitasPergerakan: 'Terbang melingkar pada ketinggian 15-25 meter di atas threshold',
    cuaca: 'Cerah',
    suhu: '28°C',
    visibility: '> 10 km',
    kondisiRunwayTaxiway: 'Kering, bersih',
    aktivitasPergerakanPesawat: 'Sangat Padat (Pesawat B737-800 GA-152 posisi final 4 NM)',
    jenisPotensiHazard: 'Potensi bird strike terhadap kaca kokpit atau mesin pesawat saat flare landing.',
    potensiDampakOperasi: 'Risiko Go-Around (missed approach) atau insiden tabrakan burung berkecepatan tinggi.',
    tindakan: {
      deteksiMonitoring: 'Observasi visual menggunakan binokular dari pos holding WHU.',
      mobileDispersal: 'Kendaraan patroli meluncur ke runway strip mengarahkan arah pengusiran menjauhi runway centerline.',
      auditoryVisualDeterrent: 'Penembakan 2 round pyrotechnic acoustic banger.',
      koordinasi: 'Koordinasi real-time via radio komunikasi aeronautika VHF dengan TWR Controller (Frekuensi 118.1 MHz).',
      tindakanLainnya: 'Konfirmasi visual ke pilot GA-152 melalui TWR bahwa runway telah clear.'
    },
    hasilPenanganan: 'Kawanan burung berhasil dibubarkan ke luar bandara dalam waktu kurang dari 2 menit. Pesawat GA-152 mendarat selamat pukul 07:49 WIB tanpa kendala.',
    status: 'Selesai',
    rekomendasiMitigasi: [
      'Tingkatkan siaga visual di threshold 25L selama sisa dinas pagi.',
      'Cek area genangan parit pembuangan air di luar perimeter selatan yang menjadi tempat berkumpul burung.'
    ],
    fotoVideoAda: true,
    keteranganDokumentasi: 'Foto dokumentasi kawanan burung dan bekas selongsong pyrotechnic terarsip di unit WHU.'
  }
];

export const INITIAL_STRIKE_REPORTS: WildlifeStrikeReport[] = [
  {
    id: 'strike-001',
    reportNumber: 'WHU/STRIKE/2026/09/0006',
    createdAt: '2026-09-07T11:20:00.000Z',
    hariTanggal: 'Senin, 07 September 2026',
    waktuKejadian: '10:40 WIB',
    pleton: 'Pleton 2',
    dinas: 'Dinas Pagi (06:00 - 14:00)',
    pod: 'Surya Dharmawan & M. Yusuf',
    lokasi: 'Runway 25R Touchdown Zone (Intersection Taxiway C3)',
    gridLocation: 'Grid C8',
    runwayTaxiway: 'Runway 25R',
    sumberInformasi: 'Pilot/Crew',
    operatorAirline: 'Garuda Indonesia',
    flightNumber: 'GA-320',
    aircraftType: 'Boeing 737-800 NG',
    registration: 'PK-GMF',
    origin: 'SUB (Surabaya)',
    destination: 'CGK (Jakarta)',
    posisiPesawat: 'Touchdown & Roll Out Runway 25R',
    jenisWildlife: 'Burung Layang-layang Api (Hirundo rustica)',
    jumlahWildlife: 1,
    identifikasi: 'Teridentifikasi',
    kondisiWildlife: 'Carcass/Sisa',
    kronologiStrike: 'Pukul 10:40 WIB, Pilot in Command GA-320 melaporkan via ground control bahwa saat menyentuh landasan (touchdown) pada kecepatan sekitar 130 knots, teramati burung kecil menabrak bagian sayap kiri depan. Pesawat berhasil keluar runway di Taxiway Charlie dengan selamat menuju gate 24 Terminal 3. Unit WHU dan AMC segera diinstruksikan melakukan runway inspection.',
    fasePenerbangan: 'Landing roll',
    bagianPesawatTerdampak: 'Leading Edge Sayap Kiri (Port Wing) & Pitot Tube Area',
    indikasiKerusakan: 'Tidak ada',
    bagianKerusakan: 'Tidak ditemukan penyok (dent) atau retak pada wing skin. Terdapat bercak darah dan sisa bulu halus pada leading edge slat #2.',
    dampakPenerbangan: 'Normal, pesawat parkir on-block di apron tanpa pembatalan jadwal selanjutnya setelah inspeksi teknisi maskapai (Release to Service).',
    keteranganDampak: 'Teknisi maskapai melakukan swab tes DNA carcass dan pembersihan residu darah.',
    tindakanUnit: {
      penerimaanInformasi: 'Laporan diterima dari AMC Officer melalui HT Channel 2 pukul 10:42 WIB.',
      verifikasiLokasi: 'Petugas WHU meluncur bersama Runway Sweeper ke RWY 25R pukul 10:45 WIB.',
      pengumpulanEvidence: 'Ditemukan sisa bangkai burung (kepala dan sayap) di centerline RWY 25R jarak 1.200 meter dari threshold.',
      pengamananPembersihan: 'Runway sweeping dilakukan oleh mobil penyapu, landasan dinyatakan aman kembali pukul 10:52 WIB.',
      dispersalPengendalian: 'Pengusiran preventif terhadap burung lain yang terbang di sekitarnya.',
      koordinasi: 'Lapor ke Safety Manager (CASO), AMC, Tower ATC, dan Chief of Airport Operation Center.',
      dokumentasi: 'Pengambilan foto bangkai, tagging GPS koordinat, dan pengisian form ICAO Bird Strike Doc 9388.'
    },
    investigasiAwal: {
      spesies: 'Hirundo rustica (Barn Swallow)',
      lokasiHotspot: 'Runway 25R Tengah / Intersection C3',
      kondisiHabitat: 'Kering, cuaca panas terik menghasilkan thermal updraft yang disukai burung layang-layang untuk berburu laron/serangga.',
      potensiAttractant: 'Flock serangga terbang di atas pantulan panas aspal landasan pacu.',
      polaFlyway: 'Melintas diagonal timur ke barat.',
      indikasiPenyebab: 'Pergerakan burung soliter yang terbang meluncur menyeberang tepat saat pesawat touchdown roll.'
    },
    mitigasi: [
      'Peningkatan frekuensi sweeping termal pada siang hari saat aktivitas serangga aspal meningkat.',
      'Optimalisasi penggunaan sound cannon di titik C3 saat periode migrasi burung swallow (September - November).',
      'Pengambilan sampel bulu dikirim ke Laboratorium Forensik Zoologi untuk verifikasi subspesies.'
    ],
    rekomendasi: 'Diusulkan pemasangan unit repellent ultra-sonik pada tiang lampu Taxiway C3 guna mencegah serangga berkumpul.',
    evidence: {
      fotoSatwaCarcass: true,
      fotoLokasi: true,
      fotoKerusakan: false,
      video: false,
      evidenceLain: 'Sampel bulu dan tagging GPS: Lat -6.1254°, Long 106.6578°'
    },
    statusLaporan: 'Final Report',
    tindakLanjut: false,
    keteranganStatus: 'Investigasi telah ditutup, laporan resmi ICAO IBIS diteruskan ke Otoritas Bandara Wilayah I.'
  }
];

export const INITIAL_RECIPIENTS: ManagementRecipient[] = [
  {
    id: 'rec-1',
    name: 'General Manager Bandara',
    role: 'General Manager Bandara',
    phone: '+6281234567890',
    email: 'gm.soekarnohatta@angkasapura2.co.id',
    department: 'Airport Executive Management (KC BSH)',
    notifyOnStrike: true,
    notifyOnOccurrence: true,
    notifyOnPatrol: false
  },
  {
    id: 'rec-2',
    name: 'ARFF Facility & Maintenance Division Head',
    role: 'ARFF Facility & Maintenance Division Head',
    phone: '+6281311223344',
    email: 'arff.facility@angkasapura2.co.id',
    department: 'Airport Rescue & Fire Fighting (ARFF)',
    notifyOnStrike: true,
    notifyOnOccurrence: true,
    notifyOnPatrol: false
  },
  {
    id: 'rec-3',
    name: 'Wildlife Hazard Department Head',
    role: 'Wildlife Hazard Department Head',
    phone: '+6281398765432',
    email: 'wildlife.hazard@angkasapura2.co.id',
    department: 'Airside Safety & Wildlife Hazard Unit',
    notifyOnStrike: true,
    notifyOnOccurrence: true,
    notifyOnPatrol: true
  },
  {
    id: 'rec-4',
    name: 'Apron Movement Control (AMC) Department Head',
    role: 'Apron Movement Control (AMC) Department Head',
    phone: '+6285211223344',
    email: 'amc.dept@angkasapura2.co.id',
    department: 'Airside Operation Division',
    notifyOnStrike: true,
    notifyOnOccurrence: true,
    notifyOnPatrol: true
  },
  {
    id: 'rec-5',
    name: 'Duty Air Traffic Controller (ATC / AirNav Indonesia)',
    role: 'Duty Air Traffic Controller (ATC / AirNav Indonesia)',
    phone: '+628177654321',
    email: 'tower.duty.jatsc@airnavindonesia.co.id',
    department: 'AirNav Indonesia Branch JATSC',
    notifyOnStrike: true,
    notifyOnOccurrence: true,
    notifyOnPatrol: false
  },
  {
    id: 'rec-6',
    name: 'Wildlife Hazard Supervisor & Officer',
    role: 'Wildlife Hazard Supervisor & Officer',
    phone: '+6281809988776',
    email: 'whu.supervisor@angkasapura2.co.id',
    department: 'Wildlife Hazard Operational Field Team',
    notifyOnStrike: true,
    notifyOnOccurrence: true,
    notifyOnPatrol: true
  }
];

export const INITIAL_NOTIFICATIONS: NotificationLog[] = [
  {
    id: 'notif-001',
    timestamp: '2026-09-09T07:50:00.000Z',
    reportType: 'OCCURRENCE',
    reportNumber: 'WHU/OCC/2026/09/0014',
    title: 'ALERT OCCURRENCE: Kawanan Burung Kuntul di Threshold 25L',
    recipientName: 'Manager Airport Operation Center (AOCC / OCC)',
    recipientRole: 'AOCC Head',
    channel: 'WHATSAPP',
    status: 'TERKIRIM',
    messageSummary: 'Flock 15 ekor burung kuntul melintas threshold 25L, penanganan pyrotechnic selesai dalam 2 menit. Runway safe.'
  },
  {
    id: 'notif-002',
    timestamp: '2026-09-07T11:00:00.000Z',
    reportType: 'STRIKE',
    reportNumber: 'WHU/STRIKE/2026/09/0006',
    title: 'URGENT NOTIFICATION: Wildlife Strike GA-320 RWY 25R',
    recipientName: 'Ir. Hendra Gunawan, S.T., M.M.',
    recipientRole: 'General Manager Bandara',
    channel: 'WHATSAPP',
    status: 'TERKIRIM',
    messageSummary: 'Burung layang-layang mengenai sayap kiri GA-320 saat landing. Tidak ada kerusakan, landasan telah swept & clear.'
  }
];

// Export aliases
export const initialPatrolReports = INITIAL_PATROL_REPORTS;
export const initialOccurrenceReports = INITIAL_OCCURRENCE_REPORTS;
export const initialStrikeReports = INITIAL_STRIKE_REPORTS;
export const initialManagementRecipients = INITIAL_RECIPIENTS;
export const initialNotificationLogs = INITIAL_NOTIFICATIONS;

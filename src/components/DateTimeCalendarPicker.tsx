import React, { useState, useEffect } from 'react';
import { Calendar, Clock, RotateCcw } from 'lucide-react';
import { 
  formatDateToIndonesian, 
  parseIndonesianDateToYYYYMMDD, 
  getTodayDateString, 
  getCurrentTimeString,
  calculateDurationInMinutes 
} from '../utils/dateUtils';

interface DateTimeCalendarPickerProps {
  // Date props
  hariTanggal: string;
  onHariTanggalChange: (val: string) => void;

  // Time mode: 'range' for Patrol (start & end), 'single' for Occurrence & Strike
  mode: 'range' | 'single';

  // For 'single' mode
  waktu?: string;
  onWaktuChange?: (val: string) => void;

  // For 'range' mode
  waktuPatroli?: string;
  onWaktuPatroliChange?: (val: string) => void;
  durasi?: string;
  onDurasiChange?: (val: string) => void;

  // Accent theme
  accentColor?: 'sky' | 'amber' | 'red';
}

export const DateTimeCalendarPicker: React.FC<DateTimeCalendarPickerProps> = ({
  hariTanggal,
  onHariTanggalChange,
  mode,
  waktu = '',
  onWaktuChange,
  waktuPatroli = '',
  onWaktuPatroliChange,
  durasi = '',
  onDurasiChange,
  accentColor = 'sky'
}) => {
  // Internal date input state (YYYY-MM-DD)
  const [dateValue, setDateValue] = useState<string>(() => {
    return parseIndonesianDateToYYYYMMDD(hariTanggal);
  });

  // Internal time input states
  const [timeValue, setTimeValue] = useState<string>(() => {
    // Extract HH:MM from string like "07:45 WIB" or "07:45"
    const match = waktu.match(/(\d{1,2}:\d{2})/);
    return match ? match[1].padStart(5, '0') : '';
  });

  // Range time input states
  const [startTime, setStartTime] = useState<string>(() => {
    const match = waktuPatroli.match(/(\d{1,2}:\d{2})\s*[-–]/);
    return match ? match[1].padStart(5, '0') : '';
  });

  const [endTime, setEndTime] = useState<string>(() => {
    const match = waktuPatroli.match(/[-–]\s*(\d{1,2}:\d{2})/);
    return match ? match[1].padStart(5, '0') : '';
  });

  // Sync dateValue when external hariTanggal changes (e.g. loading initialData in edit mode)
  useEffect(() => {
    const parsed = parseIndonesianDateToYYYYMMDD(hariTanggal);
    if (parsed && parsed !== dateValue) {
      setDateValue(parsed);
    }
  }, [hariTanggal]);

  // Sync single timeValue when external waktu changes
  useEffect(() => {
    if (mode === 'single' && waktu) {
      const match = waktu.match(/(\d{1,2}:\d{2})/);
      if (match) {
        setTimeValue(match[1].padStart(5, '0'));
      }
    }
  }, [waktu, mode]);

  // Sync range startTime and endTime when external waktuPatroli changes
  useEffect(() => {
    if (mode === 'range' && waktuPatroli) {
      const matchStart = waktuPatroli.match(/(\d{1,2}:\d{2})\s*[-–]/);
      const matchEnd = waktuPatroli.match(/[-–]\s*(\d{1,2}:\d{2})/);
      if (matchStart) setStartTime(matchStart[1].padStart(5, '0'));
      if (matchEnd) setEndTime(matchEnd[1].padStart(5, '0'));
    }
  }, [waktuPatroli, mode]);

  // Handle Date Selection from native calendar picker
  const handleDateChange = (newIsoDate: string) => {
    setDateValue(newIsoDate);
    if (newIsoDate) {
      const formatted = formatDateToIndonesian(newIsoDate);
      onHariTanggalChange(formatted);
    } else {
      onHariTanggalChange('');
    }
  };

  // Quick action: set date to today
  const handleSetToday = () => {
    const today = getTodayDateString();
    handleDateChange(today);
  };

  // Handle single time change
  const handleSingleTimeChange = (newTime: string) => {
    setTimeValue(newTime);
    if (onWaktuChange) {
      onWaktuChange(newTime ? `${newTime} WIB` : '');
    }
  };

  // Quick action: set single time to current time
  const handleSetCurrentTime = () => {
    const current = getCurrentTimeString();
    handleSingleTimeChange(current);
  };

  // Handle range start time change
  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    updateRangeText(newStart, endTime);
  };

  // Handle range end time change
  const handleEndTimeChange = (newEnd: string) => {
    setEndTime(newEnd);
    updateRangeText(startTime, newEnd);
  };

  const updateRangeText = (start: string, end: string) => {
    let rangeText = '';
    if (start && end) {
      rangeText = `${start} - ${end} WIB`;
    } else if (start) {
      rangeText = `${start} WIB`;
    } else if (end) {
      rangeText = `s/d ${end} WIB`;
    }

    if (onWaktuPatroliChange) {
      onWaktuPatroliChange(rangeText);
    }

    if (start && end && onDurasiChange) {
      const diffMins = calculateDurationInMinutes(start, end);
      if (diffMins !== null) {
        onDurasiChange(`${diffMins} Menit`);
      }
    }
  };

  // Quick action: set start time to now
  const handleSetStartToNow = () => {
    const current = getCurrentTimeString();
    handleStartTimeChange(current);
  };

  // Color theme classes
  const ringColor = 
    accentColor === 'amber' ? 'focus:ring-amber-500' :
    accentColor === 'red' ? 'focus:ring-rose-500' : 'focus:ring-sky-500';

  const badgeBg = 
    accentColor === 'amber' ? 'bg-amber-50 text-amber-900 border-amber-200' :
    accentColor === 'red' ? 'bg-rose-50 text-rose-900 border-rose-200' : 'bg-sky-50 text-sky-900 border-sky-200';

  const btnBg = 
    accentColor === 'amber' ? 'hover:bg-amber-100 text-amber-700' :
    accentColor === 'red' ? 'hover:bg-rose-100 text-rose-700' : 'hover:bg-sky-100 text-sky-700';

  return (
    <div className="space-y-3">
      {/* 1. Pengisian Tanggal dengan Sistem Kalender */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="font-semibold text-slate-700 text-xs flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Hari / Tanggal Kegiatan:</span>
            <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={handleSetToday}
            className={`text-[11px] font-medium px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1 ${btnBg}`}
          >
            <RotateCcw className="w-3 h-3" />
            Set Hari Ini
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          {/* Native HTML5 Calendar Picker */}
          <div className="sm:col-span-5 relative">
            <input
              type="date"
              value={dateValue}
              onChange={(e) => handleDateChange(e.target.value)}
              className={`w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white shadow-2xs font-mono font-semibold cursor-pointer ${ringColor}`}
              title="Klik ikon kalender untuk memilih tanggal"
              required
            />
          </div>

          {/* Formatted Indonesian Day & Date display */}
          <div className="sm:col-span-7">
            <div className={`px-3 py-2 text-xs rounded border flex items-center justify-between min-h-[34px] ${badgeBg}`}>
              <div className="truncate">
                {hariTanggal ? (
                  <span className="font-bold">{hariTanggal}</span>
                ) : (
                  <span className="text-slate-400 italic">Pilih tanggal pada sistem kalender di samping...</span>
                )}
              </div>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/70 border border-slate-300/60 shrink-0 ml-1">
                Kalender ID
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Pengisian Waktu dengan Time Picker */}
      {mode === 'single' ? (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-semibold text-slate-700 text-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Waktu Kejadian (Pukul):</span>
              <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleSetCurrentTime}
              className={`text-[11px] font-medium px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1 ${btnBg}`}
            >
              <Clock className="w-3 h-3" />
              Waktu Sekarang
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-5">
              <input
                type="time"
                value={timeValue}
                onChange={(e) => handleSingleTimeChange(e.target.value)}
                className={`w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white font-mono font-bold cursor-pointer ${ringColor}`}
                title="Pilih jam dan menit kejadian"
                required
              />
            </div>
            <div className="sm:col-span-7">
              <input
                type="text"
                value={waktu}
                onChange={(e) => onWaktuChange && onWaktuChange(e.target.value)}
                placeholder="e.g. 07:45 WIB"
                className={`w-full px-3 py-2 text-xs border border-slate-300 rounded font-semibold bg-white ${ringColor}`}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Mode Range for Patrol */
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-semibold text-slate-700 text-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Waktu Patroli (Jam Mulai s/d Selesai) &amp; Durasi:</span>
              <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleSetStartToNow}
              className={`text-[11px] font-medium px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1 ${btnBg}`}
            >
              <Clock className="w-3 h-3" />
              Mulai Sekarang
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            {/* Start Time */}
            <div className="sm:col-span-3">
              <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Jam Mulai:</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className={`w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono font-bold cursor-pointer ${ringColor}`}
              />
            </div>

            {/* End Time */}
            <div className="sm:col-span-3">
              <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Jam Selesai:</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className={`w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono font-bold cursor-pointer ${ringColor}`}
              />
            </div>

            {/* Waktu Patroli string output */}
            <div className="sm:col-span-3">
              <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Format Laporan:</label>
              <input
                type="text"
                value={waktuPatroli}
                onChange={(e) => onWaktuPatroliChange && onWaktuPatroliChange(e.target.value)}
                placeholder="08:00 - 10:30 WIB"
                className={`w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-semibold bg-white ${ringColor}`}
              />
            </div>

            {/* Durasi */}
            <div className="sm:col-span-3">
              <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Total Durasi:</label>
              <input
                type="text"
                value={durasi}
                onChange={(e) => onDurasiChange && onDurasiChange(e.target.value)}
                placeholder="150 Menit"
                className={`w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-bold bg-white text-slate-800 ${ringColor}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

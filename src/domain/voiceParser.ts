import type { RepeatType } from './types';

export interface ParsedVoiceReminder {
  title: string;
  time: string; // HH:mm
  date: string; // YYYY-MM-DD
  repeatType: RepeatType;
  isImportant: boolean;
  detectedTimeLabel: string;
}

const IMPORTANT_KEYWORDS = [
  'tắt bếp',
  'tat bep',
  'bếp ga',
  'bep ga',
  'uống thuốc',
  'uong thuoc',
  'khóa cửa',
  'khoa cua',
  'cúp cầu dao',
  'rút điện',
  'bàn ủi',
  'bác sĩ',
  'khám bệnh',
  'đón con',
  'quan trọng',
  'medicine',
  'stove',
  'lock door',
];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function formatLocalTime(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function capitalizeFirst(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Deterministic offline parser for Vietnamese (and simple English) spoken reminders.
 * Examples:
 * - "Nhắc tôi tắt bếp lúc 7 giờ tối" -> title: "Tắt bếp", time: "19:00", isImportant: true
 * - "Nhớ uống thuốc huyết áp lúc 8h30 sáng mỗi ngày" -> title: "Uống thuốc huyết áp", time: "08:30", repeatType: "daily"
 * - "Khóa cửa sau 15 phút" -> title: "Khóa cửa", time: now + 15m
 */
export function parseVietnameseVoiceCommand(
  rawTranscript: string,
  referenceDate: Date = new Date()
): ParsedVoiceReminder {
  const original = rawTranscript.trim();
  let working = original;

  const targetDate = new Date(referenceDate.getTime());
  let hour: number | null = null;
  let minute = 0;
  let repeatType: RepeatType = 'once';
  let detectedTimeLabel = '';

  // 1. Detect repeat cues
  if (/(mỗi ngày|hằng ngày|hàng ngày|every day|daily)/i.test(working)) {
    repeatType = 'daily';
    working = working.replace(/(mỗi ngày|hằng ngày|hàng ngày|every day|daily)/gi, ' ');
  } else if (/(hằng tháng|hàng tháng|mỗi tháng|monthly)/i.test(working)) {
    repeatType = 'monthly';
    working = working.replace(/(hằng tháng|hàng tháng|mỗi tháng|monthly)/gi, ' ');
  } else if (/(các ngày trong tuần|thứ 2 đến thứ 6|weekdays)/i.test(working)) {
    repeatType = 'weekdays';
    working = working.replace(/(các ngày trong tuần|thứ 2 đến thứ 6|weekdays)/gi, ' ');
  }

  // 2. Detect "ngày mai" / "tomorrow"
  if (/(ngày mai|mai\b|tomorrow)/i.test(working)) {
    targetDate.setDate(targetDate.getDate() + 1);
    working = working.replace(/(vào\s+)?(ngày mai|tomorrow)/gi, ' ');
  }

  // 3. Relative offset: "sau 15 phút", "10 phút nữa", "sau 2 giờ"
  const relMinMatch = working.match(/(?:sau\s+)?(\d{1,3})\s*(?:phút|phut|p)(?:\s*nữa)?/i);
  const relHourMatch = working.match(/sau\s+(\d{1,2})\s*(?:giờ|gio|tiếng|tieng|h)/i);

  if (relMinMatch && /(sau\s+\d|nữa)/i.test(working)) {
    const addMins = Math.min(720, Math.max(1, parseInt(relMinMatch[1], 10)));
    targetDate.setMinutes(targetDate.getMinutes() + addMins);
    hour = targetDate.getHours();
    minute = targetDate.getMinutes();
    detectedTimeLabel = `${pad2(hour)}:${pad2(minute)}`;
    working = working.replace(relMinMatch[0], ' ');
  } else if (relHourMatch) {
    const addHours = Math.min(24, Math.max(1, parseInt(relHourMatch[1], 10)));
    targetDate.setHours(targetDate.getHours() + addHours);
    hour = targetDate.getHours();
    minute = targetDate.getMinutes();
    detectedTimeLabel = `${pad2(hour)}:${pad2(minute)}`;
    working = working.replace(relHourMatch[0], ' ');
  } else {
    // 4. Absolute time: "lúc 7 giờ 30 tối", "8h30 sáng", "19:15", "7 giờ rưỡi tối"
    const absRegex =
      /(?:vào\s+lúc|lúc|vào|at)?\s*(\d{1,2})\s*(?:giờ|gio|h|:)\s*(?:(rưỡi|ruoi)|(\d{1,2})\s*(?:phút|phut)?)?\s*(sáng|sang|trưa|trua|chiều|chieu|tối|toi|đêm|dem|am|pm)?/i;
    const match = working.match(absRegex);

    if (match) {
      let parsedHour = parseInt(match[1], 10);
      let parsedMinute = 0;
      if (match[2]) {
        parsedMinute = 30;
      } else if (match[3]) {
        parsedMinute = parseInt(match[3], 10);
      }
      const period = (match[4] || '').toLowerCase();

      if (period === 'tối' || period === 'toi' || period === 'chiều' || period === 'chieu' || period === 'pm') {
        if (parsedHour >= 1 && parsedHour <= 11) {
          parsedHour += 12;
        }
      } else if (period === 'đêm' || period === 'dem') {
        if (parsedHour === 12) {
          parsedHour = 0;
        } else if (parsedHour >= 7 && parsedHour <= 11) {
          parsedHour += 12;
        }
      } else if (period === 'trưa' || period === 'trua') {
        if (parsedHour >= 1 && parsedHour <= 3) {
          parsedHour += 12;
        }
      } else if (period === 'sáng' || period === 'sang' || period === 'am') {
        if (parsedHour === 12) {
          parsedHour = 0;
        }
      }

      if (parsedHour >= 0 && parsedHour <= 23 && parsedMinute >= 0 && parsedMinute <= 59) {
        hour = parsedHour;
        minute = parsedMinute;
        detectedTimeLabel = `${pad2(hour)}:${pad2(minute)}`;
        working = working.replace(match[0], ' ');
      }
    }
  }

  // Default fallback time: next rounded 30-minute mark (+30 mins from now)
  if (hour === null) {
    const fallback = new Date(referenceDate.getTime() + 30 * 60 * 1000);
    hour = fallback.getHours();
    minute = Math.ceil(fallback.getMinutes() / 5) * 5;
    if (minute === 60) {
      hour = (hour + 1) % 24;
      minute = 0;
    }
    detectedTimeLabel = `${pad2(hour)}:${pad2(minute)}`;
  }

  // 5. Strip natural Vietnamese lead-in phrases
  let cleanedTitle = working
    .replace(/^(hãy\s+)?(nhắc\s+(?:tôi|mình|nhớ|giúp|em|anh|chị|bà|ông)?|nhớ\s+(?:là\s+)?|đặt\s+nhắc\s+việc|tạo\s+nhắc\s+việc|remind\s+me\s+to)\s*/i, '')
    .replace(/\b(vào\s+lúc|lúc|vào|hôm\s+nay)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .replace(/^[,.\-–:\s]+|[,.\-–:\s]+$/g, '')
    .trim();

  if (!cleanedTitle) {
    cleanedTitle = original || 'Việc cần nhớ';
  }

  const lowerFull = original.toLowerCase();
  const isImportant = IMPORTANT_KEYWORDS.some((kw) => lowerFull.includes(kw));

  return {
    title: capitalizeFirst(cleanedTitle),
    time: `${pad2(hour)}:${pad2(minute)}`,
    date: formatLocalDate(targetDate),
    repeatType,
    isImportant,
    detectedTimeLabel,
  };
}

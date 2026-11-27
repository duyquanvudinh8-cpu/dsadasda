import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Mic,
  MicOff,
  Repeat,
  X,
} from 'lucide-react';
import type { Reminder, RepeatType } from '../domain/types';
import { formatLocalDate, parseVietnameseVoiceCommand } from '../domain/voiceParser';

interface AddReminderModalProps {
  isOpen: boolean;
  initialVoiceMode?: boolean;
  initialTranscript?: string;
  defaultNagInterval: number;
  defaultMaxNag: number;
  onClose: () => void;
  onSave: (reminder: Omit<Reminder, 'id' | 'status' | 'nagCount' | 'createdAt'>) => void;
}

const SAMPLE_VOICE_PHRASES = [
  'Nhắc tôi tắt bếp lúc 7 giờ tối',
  'Nhớ uống thuốc huyết áp lúc 8h30 sáng mỗi ngày',
  'Khóa cửa sau 15 phút',
  'Đóng tiền điện lúc 9 giờ sáng hằng tháng',
];

const QUICK_TIMES = [
  { label: 'Sáng 07:30', time: '07:30' },
  { label: 'Trưa 12:00', time: '12:00' },
  { label: 'Chiều 17:30', time: '17:30' },
  { label: 'Tối 19:00', time: '19:00' },
  { label: 'Trước ngủ 21:30', time: '21:30' },
];

const WEEKDAY_LABELS = [
  { day: 1, label: 'T2' },
  { day: 2, label: 'T3' },
  { day: 3, label: 'T4' },
  { day: 4, label: 'T5' },
  { day: 5, label: 'T6' },
  { day: 6, label: 'T7' },
  { day: 7, label: 'CN' },
];

export function AddReminderModal({
  isOpen,
  initialVoiceMode = false,
  initialTranscript = '',
  defaultNagInterval,
  defaultMaxNag,
  onClose,
  onSave,
}: AddReminderModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [time, setTime] = useState('19:00');
  const [date, setDate] = useState(formatLocalDate(new Date()));
  const [repeatType, setRepeatType] = useState<RepeatType>('once');
  const [repeatDays, setRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [isImportant, setIsImportant] = useState(false);
  const [nagInterval, setNagInterval] = useState(defaultNagInterval);
  const [maxNag, setMaxNag] = useState(defaultMaxNag);
  const [errorMsg, setErrorMsg] = useState('');

  // Speech recognition state
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState('');
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setErrorMsg('');
    setNagInterval(defaultNagInterval);
    setMaxNag(defaultMaxNag);

    if (initialTranscript.trim()) {
      applyVoicePhrase(initialTranscript);
    } else {
      setTitle('');
      setNote('');
      setTime('19:00');
      setDate(formatLocalDate(new Date()));
      setRepeatType('once');
      setIsImportant(false);
      setVoiceFeedback(
        initialVoiceMode ? 'Bấm nút Micro lớn bên dưới hoặc chạm vào câu mẫu để thử ngay.' : ''
      );
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, [isOpen, initialVoiceMode, initialTranscript, defaultNagInterval, defaultMaxNag]);

  if (!isOpen) return null;

  const applyVoicePhrase = (phrase: string) => {
    const parsed = parseVietnameseVoiceCommand(phrase, new Date());
    setTitle(parsed.title);
    setTime(parsed.time);
    setDate(parsed.date);
    setRepeatType(parsed.repeatType);
    setIsImportant(parsed.isImportant);
    setErrorMsg('');
    setVoiceFeedback(
      `Đã hiểu: "${parsed.title}" lúc ${parsed.time}${parsed.isImportant ? ' · Tự đánh dấu Quan trọng' : ''}`
    );
  };

  const handleToggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (!SpeechRec) {
      setVoiceFeedback(
        'Trình duyệt này chưa bật sẵn micro. Bạn có thể gõ câu tự nhiên (vd: "Nhắc tôi tắt bếp lúc 7 giờ tối") hoặc chạm câu mẫu bên dưới.'
      );
      return;
    }

    try {
      const recognition = new SpeechRec() as {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: (ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
      };
      recognition.lang = 'vi-VN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          applyVoicePhrase(transcript);
        }
      };
      recognition.onerror = () => {
        setIsListening(false);
        setVoiceFeedback('Không thu được giọng nói. Bạn hãy thử lại hoặc chạm câu mẫu bên dưới.');
      };
      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      setIsListening(true);
      setVoiceFeedback('Đang nghe tiếng Việt... Hãy nói: "Nhắc tôi tắt bếp lúc 7 giờ tối"');
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceFeedback('Không thể mở micro trên thiết bị này. Bạn hãy gõ trực tiếp hoặc chọn câu mẫu.');
    }
  };

  const handleNextFromStep1 = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setErrorMsg('Vui lòng nhập hoặc nói nội dung việc cần nhớ.');
      return;
    }
    // If the user typed a natural sentence containing a time like "tắt bếp lúc 7 giờ tối", parse it cleanly!
    if (/\d+\s*(giờ|gio|h|:)|sau\s+\d+\s*(phút|phut)/i.test(trimmed)) {
      applyVoicePhrase(trimmed);
    }
    setErrorMsg('');
    setStep(2);
  };

  const toggleWeekday = (day: number) => {
    setRepeatDays((prev) =>
      prev.includes(day)
        ? prev.length > 1
          ? prev.filter((d) => d !== day)
          : prev
        : [...prev, day].sort()
    );
  };

  const handleConfirmSave = () => {
    if (!title.trim()) {
      setStep(1);
      setErrorMsg('Vui lòng nhập nội dung việc cần nhớ.');
      return;
    }
    onSave({
      title: title.trim(),
      note: note.trim() || undefined,
      time,
      date,
      repeatType,
      repeatDays,
      isImportant,
      nagIntervalMinutes: nagInterval,
      maxNagCount: maxNag,
      snoozedUntil: null,
      completedAt: null,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Thêm nhắc việc mới"
    >
      <div className="w-full sm:max-w-xl bg-white dark:bg-[#161F21] text-[#111918] dark:text-[#EDF3F1] rounded-t-3xl sm:rounded-3xl border border-[#DCE5E2] dark:border-[#273538] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5EDEA] dark:border-[#243235]">
          <div>
            <div className="text-xs font-medium text-[#0F766E] dark:text-[#2DD4BF]">
              Bước {step}/3 · Thêm nhắc việc nhanh
            </div>
            <h2 className="text-xl font-bold mt-0.5">
              {step === 1 && '1. Bạn cần nhớ làm gì?'}
              {step === 2 && '2. Chọn giờ và lặp lại'}
              {step === 3 && '3. Kiểm tra và lưu'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại thêm nhắc việc"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-[#EFF4F2] dark:hover:bg-[#223033] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {step === 1 && (
            <>
              {/* Large Voice Input Button */}
              <button
                type="button"
                onClick={handleToggleListening}
                className={`w-full min-h-[68px] px-5 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-colors ${
                  isListening
                    ? 'bg-[#BE123C] text-white'
                    : 'bg-[#E6F4F1] dark:bg-[#133834] text-[#0F766E] dark:text-[#2DD4BF] hover:bg-[#D5ECE7] dark:hover:bg-[#194742]'
                }`}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                <span>
                  {isListening ? 'Đang nghe... Chạm để dừng' : 'Chạm để nói bằng giọng nói (Tiếng Việt)'}
                </span>
              </button>

              {voiceFeedback && (
                <p className="text-sm text-[#0F766E] dark:text-[#5EEAD4] bg-[#F0F9F7] dark:bg-[#112A28] px-4 py-3 rounded-xl">
                  {voiceFeedback}
                </p>
              )}

              <div>
                <label htmlFor="reminder-title-input" className="block text-sm font-semibold mb-2">
                  Nội dung nhắc việc
                </label>
                <input
                  id="reminder-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder='Ví dụ: Tắt bếp lúc 7 giờ tối, Uống thuốc huyết áp...'
                  className="w-full min-h-[52px] px-4 rounded-2xl border border-[#CAD7D3] dark:border-[#314346] bg-[#F8FAF9] dark:bg-[#0F1718] text-base focus:border-[#0F766E] dark:focus:border-[#2DD4BF]"
                />
                {errorMsg && (
                  <p role="alert" className="mt-2 text-sm font-medium text-[#BE123C] dark:text-[#FDA4AF]">
                    {errorMsg}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="reminder-note-input" className="block text-sm font-medium mb-1.5 text-[#475B57] dark:text-[#9BB2AD]">
                  Ghi chú thêm (không bắt buộc)
                </label>
                <input
                  id="reminder-note-input"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Uống 1 viên sau ăn sáng"
                  className="w-full min-h-[48px] px-4 rounded-2xl border border-[#DCE5E2] dark:border-[#2A393C] bg-[#F8FAF9] dark:bg-[#0F1718] text-sm"
                />
              </div>

              {/* Tap-to-try Vietnamese voice phrases */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[#526762] dark:text-[#9BB2AD]">
                  Thử nhanh câu nói mẫu tiếng Việt:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SAMPLE_VOICE_PHRASES.map((phrase) => (
                    <button
                      key={phrase}
                      type="button"
                      onClick={() => applyVoicePhrase(phrase)}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE5E2] dark:border-[#2A393C] text-left text-xs font-medium hover:bg-[#F0F7F5] dark:hover:bg-[#1E2C2F] transition-colors"
                    >
                      “{phrase}”
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reminder-time-input" className="block text-sm font-semibold mb-2">
                    Giờ nhắc
                  </label>
                  <input
                    id="reminder-time-input"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full min-h-[56px] px-4 rounded-2xl border border-[#CAD7D3] dark:border-[#314346] bg-[#F8FAF9] dark:bg-[#0F1718] font-mono-num text-2xl font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="reminder-date-input" className="block text-sm font-semibold mb-2">
                    Ngày
                  </label>
                  <input
                    id="reminder-date-input"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full min-h-[56px] px-4 rounded-2xl border border-[#CAD7D3] dark:border-[#314346] bg-[#F8FAF9] dark:bg-[#0F1718] font-mono-num text-base font-medium"
                  />
                </div>
              </div>

              {/* Quick preset times */}
              <div className="flex flex-wrap gap-2">
                {QUICK_TIMES.map((preset) => (
                  <button
                    key={preset.time}
                    type="button"
                    onClick={() => setTime(preset.time)}
                    className={`min-h-[44px] px-3.5 rounded-xl text-sm font-medium border transition-colors whitespace-nowrap ${
                      time === preset.time
                        ? 'bg-[#0F766E] text-white border-[#0F766E] dark:bg-[#2DD4BF] dark:text-[#042F2E] dark:border-[#2DD4BF]'
                        : 'border-[#DCE5E2] dark:border-[#2A393C] hover:bg-[#F0F7F5] dark:hover:bg-[#1E2C2F]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Repeat frequency */}
              <div className="space-y-2">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF]" />
                  <span>Lặp lại</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'once', label: 'Một lần' },
                      { id: 'daily', label: 'Hằng ngày' },
                      { id: 'weekdays', label: 'Chọn thứ' },
                      { id: 'monthly', label: 'Hằng tháng' },
                    ] as { id: RepeatType; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setRepeatType(opt.id)}
                      className={`min-h-[46px] px-3 rounded-xl text-sm font-semibold border transition-colors whitespace-nowrap ${
                        repeatType === opt.id
                          ? 'bg-[#0F766E] text-white border-[#0F766E] dark:bg-[#2DD4BF] dark:text-[#042F2E]'
                          : 'border-[#DCE5E2] dark:border-[#2A393C] hover:bg-[#F0F7F5] dark:hover:bg-[#1E2C2F]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {repeatType === 'weekdays' && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {WEEKDAY_LABELS.map((item) => {
                      const active = repeatDays.includes(item.day);
                      return (
                        <button
                          key={item.day}
                          type="button"
                          onClick={() => toggleWeekday(item.day)}
                          className={`min-h-[44px] min-w-[44px] rounded-xl font-semibold text-sm transition-colors ${
                            active
                              ? 'bg-[#0F766E] text-white dark:bg-[#2DD4BF] dark:text-[#042F2E]'
                              : 'bg-[#EFF4F2] dark:bg-[#223033] text-[#475B57] dark:text-[#9BB2AD]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Important toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={isImportant}
                onClick={() => setIsImportant((v) => !v)}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between gap-4 transition-colors ${
                  isImportant
                    ? 'border-[#BE123C] bg-[#FFF1F2] dark:bg-[#3B121D] dark:border-[#FB7185]'
                    : 'border-[#DCE5E2] dark:border-[#2A393C]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className={`w-5 h-5 shrink-0 mt-0.5 ${
                      isImportant ? 'text-[#BE123C] dark:text-[#FDA4AF]' : 'text-[#64748B]'
                    }`}
                  />
                  <div>
                    <div className="font-semibold text-sm">Đánh dấu là việc Quan trọng</div>
                    <div className="text-xs text-[#526762] dark:text-[#9BB2AD]">
                      Vẫn reo báo trong Giờ yên tĩnh và thông báo cho người thân nếu bỏ lỡ nhiều lần.
                    </div>
                  </div>
                </div>
                <span className="text-sm font-bold whitespace-nowrap">
                  {isImportant ? 'Đang bật' : 'Tắt'}
                </span>
              </button>
            </>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-[#F0F9F7] dark:bg-[#112A28] border border-[#CBE5DF] dark:border-[#1E4A45] space-y-3">
                <div className="flex items-center gap-2 text-sm text-[#0F766E] dark:text-[#5EEAD4] font-semibold">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono-num text-lg">{time}</span>
                  <span aria-hidden="true">·</span>
                  <span>{date}</span>
                </div>
                <h3 className="text-2xl font-bold">{title}</h3>
                {note && <p className="text-sm text-[#475B57] dark:text-[#A9BEB9]">{note}</p>}
                <div className="text-sm text-[#475B57] dark:text-[#A9BEB9] pt-1">
                  Nhắc kiên trì mỗi <strong className="font-mono-num">{nagInterval}</strong> phút (tối đa{' '}
                  <strong className="font-mono-num">{maxNag}</strong> lần) nếu chưa bấm “Đã làm xong”.
                  {isImportant && ' · Đánh dấu Quan trọng (vượt giờ yên tĩnh).'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="nag-interval-select" className="block text-xs font-semibold mb-1.5 text-[#526762] dark:text-[#9BB2AD]">
                    Khoảng cách nhắc lại
                  </label>
                  <select
                    id="nag-interval-select"
                    value={nagInterval}
                    onChange={(e) => setNagInterval(Number(e.target.value))}
                    className="w-full min-h-[48px] px-3 rounded-xl border border-[#DCE5E2] dark:border-[#2A393C] bg-[#F8FAF9] dark:bg-[#0F1718] font-semibold text-sm"
                  >
                    <option value={5}>Mỗi 5 phút</option>
                    <option value={10}>Mỗi 10 phút</option>
                    <option value={15}>Mỗi 15 phút</option>
                    <option value={30}>Mỗi 30 phút</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="nag-max-select" className="block text-xs font-semibold mb-1.5 text-[#526762] dark:text-[#9BB2AD]">
                    Số lần nhắc tối đa
                  </label>
                  <select
                    id="nag-max-select"
                    value={maxNag}
                    onChange={(e) => setMaxNag(Number(e.target.value))}
                    className="w-full min-h-[48px] px-3 rounded-xl border border-[#DCE5E2] dark:border-[#2A393C] bg-[#F8FAF9] dark:bg-[#0F1718] font-semibold text-sm"
                  >
                    <option value={3}>3 lần</option>
                    <option value={5}>5 lần</option>
                    <option value={8}>8 lần</option>
                    <option value={10}>10 lần</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-[#E5EDEA] dark:border-[#243235] flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
              className="min-h-[50px] px-5 rounded-2xl border border-[#DCE5E2] dark:border-[#2A393C] font-semibold text-sm flex items-center gap-1.5 hover:bg-[#F1F5F4] dark:hover:bg-[#1E2A2D] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="min-h-[50px] px-5 rounded-2xl border border-[#DCE5E2] dark:border-[#2A393C] font-medium text-sm hover:bg-[#F1F5F4] dark:hover:bg-[#1E2A2D] transition-colors"
            >
              Hủy
            </button>
          )}

          {step === 1 && (
            <button
              type="button"
              onClick={handleNextFromStep1}
              className="flex-1 min-h-[50px] px-6 rounded-2xl bg-[#0F766E] hover:bg-[#0D625B] dark:bg-[#2DD4BF] dark:hover:bg-[#14B8A6] text-white dark:text-[#042F2E] font-bold text-base flex items-center justify-center gap-2 transition-colors"
            >
              <span>Tiếp: Chọn giờ</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex-1 min-h-[50px] px-6 rounded-2xl bg-[#0F766E] hover:bg-[#0D625B] dark:bg-[#2DD4BF] dark:hover:bg-[#14B8A6] text-white dark:text-[#042F2E] font-bold text-base flex items-center justify-center gap-2 transition-colors"
            >
              <span>Tiếp: Xem lại</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={handleConfirmSave}
              className="flex-1 min-h-[50px] px-6 rounded-2xl bg-[#0F766E] hover:bg-[#0D625B] dark:bg-[#2DD4BF] dark:hover:bg-[#14B8A6] text-white dark:text-[#042F2E] font-bold text-base flex items-center justify-center gap-2 transition-colors"
            >
              <Check className="w-5 h-5" />
              <span>Lưu nhắc việc</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

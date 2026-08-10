import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, CalendarDays } from 'lucide-react';
import styles from './DateTimePicker.module.css';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const pad = (n) => String(n).padStart(2, '0');

const toLocalInputValue = (d) => {
  if (!d || Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const parseValue = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const isSameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

export const DateTimePicker = ({ value, onChange, minDate, light }) => {
  const initial = parseValue(value) || new Date();
  const [step, setStep] = useState('date'); // 'date' | 'time'
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [selectedDate, setSelectedDate] = useState(startOfDay(initial));
  const [selectedHour, setSelectedHour] = useState(initial.getHours() % 12 || 12);
  const [isPM, setIsPM] = useState(initial.getHours() >= 12);
  const [selectedMinute, setSelectedMinute] = useState(initial.getMinutes());

  const minDay = minDate ? startOfDay(minDate) : null;

  const calendar = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));
    return cells;
  }, [viewYear, viewMonth]);

  const goPrevMonth = () => {
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11; }
      return m - 1;
    });
  };

  const goNextMonth = () => {
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0; }
      return m + 1;
    });
  };

  const handlePickDate = (day) => {
    if (minDay && day < minDay) return;
    setSelectedDate(day);
    setStep('time');
  };

  const commit = (h, m, pm) => {
    const merged = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      ((h % 12) + (pm ? 12 : 0)),
      m
    );
    onChange(toLocalInputValue(merged));
  };

  const handleHourClick = (h) => {
    setSelectedHour(h);
    commit(h, selectedMinute, isPM);
  };

  const handleMinuteClick = (m) => {
    setSelectedMinute(m);
    commit(selectedHour, m, isPM);
  };

  const [timeInput, setTimeInput] = useState(null);

  // Build a logically valid 12h time string from raw keystrokes.
  // - non-numeric chars are stripped
  // - hour must be 1-12 (leading 0 allowed: "09")
  // - minute tens must be 0-5
  // - a colon is inserted automatically before the minutes
  const sanitizeTimeInput = (raw) => {
    const digits = String(raw || '').replace(/\D/g, '').slice(0, 4);
    if (!digits.length) return '';
    let i = 0;
    let hour = '';
    const d0 = digits[0];
    if (d0 === '0' || d0 === '1') {
      const d1 = digits[1];
      if (d1 !== undefined && Number(d0 + d1) >= 1 && Number(d0 + d1) <= 12) {
        hour = d0 + d1;
        i = 2;
      } else {
        hour = d0;
        i = 1;
      }
    } else if (d0 >= '2' && d0 <= '9') {
      hour = d0;
      i = 1;
    } else {
      return '';
    }

    let out = hour;
    const rest = digits.slice(i);
    if (!rest.length) return out;
    const tens = rest[0];
    if (tens > '5') return out; // impossible minute tens digit — drop it
    out += ':' + tens;
    const ones = rest[1];
    if (ones !== undefined) out += ones;
    return out;
  };

  const handleTimeInputChange = (e) => {
    const clean = sanitizeTimeInput(e.target.value);
    setTimeInput(clean);
    const m = /^(\d{1,2}):(\d{2})$/.exec(clean);
    if (m) {
      const hour = Number(m[1]);
      const minute = Number(m[2]);
      if (hour >= 1 && hour <= 12 && minute >= 0 && minute <= 59) {
        setSelectedHour(hour);
        setSelectedMinute(minute);
        commit(hour, minute, isPM);
      }
    }
  };

  const handleTimeInputBlur = () => {
    setTimeInput(null);
  };

  return (
    <div className={`${styles.picker} ${light ? styles.light : ''}`}>
      <div className={styles.pickerHeader}>
        {step === 'time' ? (
          <>
            <button className={styles.backBtn} onClick={() => setStep('date')}>
              <ChevronLeft size={16} />
            </button>
            <span className={styles.headerTitle}>
              <Clock size={15} />
              {MONTHS[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}
            </span>
            <button className={styles.headerIcon} onClick={() => setStep('date')}>
              <CalendarDays size={16} />
            </button>
          </>
        ) : (
          <>
            <span className={styles.headerTitle}>
              <CalendarDays size={15} />
              Choose Date
            </span>
            <span className={styles.headerIcon} onClick={() => setStep('time')}>
              <Clock size={16} />
            </span>
          </>
        )}
      </div>

      {step === 'date' ? (
        <div className={styles.calendar}>
          <div className={styles.calNav}>
            <button className={styles.navBtn} onClick={goPrevMonth}>
              <ChevronLeft size={16} />
            </button>
            <span className={styles.calMonth}>{MONTHS[viewMonth]} {viewYear}</span>
            <button className={styles.navBtn} onClick={goNextMonth}>
              <ChevronRight size={16} />
            </button>
          </div>
          <div className={styles.weekRow}>
            {WEEKDAYS.map((w) => (
              <span key={w} className={styles.weekDay}>{w}</span>
            ))}
          </div>
          <div className={styles.daysGrid}>
            {calendar.map((day, idx) => {
              if (!day) return <span key={`e${idx}`} className={styles.emptyDay} />;
              const isDisabled = minDay && day < minDay;
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);
              return (
                <button
                  key={day.toISOString()}
                  className={`${styles.day} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''} ${isDisabled ? styles.disabled : ''}`}
                  onClick={() => handlePickDate(day)}
                  disabled={!!isDisabled}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={styles.clockSection}>
          <div className={styles.clockFace}>
            {HOURS.map((h) => {
              const ang = (h % 12) * 30;
              const isActive = h === selectedHour;
              return (
                <button
                  key={`h${h}`}
                  className={`${styles.clockMark} ${isActive ? styles.active : ''}`}
                  style={{ transform: `rotate(${ang}deg) translateY(var(--clock-hr-r, -78px))` }}
                  onClick={() => handleHourClick(h)}
                >
                  <span style={{ transform: `rotate(${-ang}deg)` }}>{h}</span>
                </button>
              );
            })}
            {MINUTES.map((m) => {
              const ang = m * 6;
              const isActive = m === selectedMinute;
              return (
                <button
                  key={`m${m}`}
                  className={`${styles.minuteMark} ${isActive ? styles.active : ''}`}
                  style={{ transform: `rotate(${ang}deg) translateY(var(--clock-min-r, -48px))` }}
                  onClick={() => handleMinuteClick(m)}
                >
                  <span style={{ transform: `rotate(${-ang}deg)` }}>{m}</span>
                </button>
              );
            })}
            <div className={styles.clockCenter}>
              <input
                className={styles.clockDigitsInput}
                value={timeInput !== null ? timeInput : `${pad((selectedHour % 12) || 12)}:${pad(selectedMinute)}`}
                onChange={handleTimeInputChange}
                onBlur={handleTimeInputBlur}
                inputMode="numeric"
                aria-label="Time"
              />
              <div className={styles.ampm}>
                <button className={`${styles.ampmBtn} ${!isPM ? styles.ampmActive : ''}`} onClick={() => { setIsPM(false); commit(selectedHour, selectedMinute, false); }}>AM</button>
                <button className={`${styles.ampmBtn} ${isPM ? styles.ampmActive : ''}`} onClick={() => { setIsPM(true); commit(selectedHour, selectedMinute, true); }}>PM</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

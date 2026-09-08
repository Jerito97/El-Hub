"use client";

const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);
const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

export function DateSelect({
  day,
  month,
  year,
  onDay,
  onMonth,
  onYear,
}: {
  day: string;
  month: string;
  year: string;
  onDay: (v: string) => void;
  onMonth: (v: string) => void;
  onYear: (v: string) => void;
}) {
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 70 }, (_, i) => currentYear - i);
  return (
    <div className="date-grid">
      <select className="input" value={day} onChange={(e) => onDay(e.target.value)}>
        <option value="">Día</option>
        {dayOptions.map((d) => (
          <option key={d} value={d}>
            {String(d).padStart(2, "0")}
          </option>
        ))}
      </select>
      <select className="input" value={month} onChange={(e) => onMonth(e.target.value)}>
        <option value="">Mes</option>
        {monthOptions.map((m) => (
          <option key={m} value={m}>
            {String(m).padStart(2, "0")}
          </option>
        ))}
      </select>
      <select className="input" value={year} onChange={(e) => onYear(e.target.value)}>
        <option value="">Año</option>
        {yearOptions.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

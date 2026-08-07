"use client";

import { Select } from "./Select";

const T = (en: string, ar: string, isAr: boolean) => (isAr ? ar : en);

// Value is an 8-digit string "YYYYMMDD" (Hijri), matching DriverProfile.hijriBirthDate.
export const HIJRI_MONTHS = [
  { n: 1, ar: "محرم", en: "Muharram" },
  { n: 2, ar: "صفر", en: "Safar" },
  { n: 3, ar: "ربيع الأول", en: "Rabi' al-awwal" },
  { n: 4, ar: "ربيع الآخر", en: "Rabi' al-thani" },
  { n: 5, ar: "جمادى الأولى", en: "Jumada al-awwal" },
  { n: 6, ar: "جمادى الآخرة", en: "Jumada al-thani" },
  { n: 7, ar: "رجب", en: "Rajab" },
  { n: 8, ar: "شعبان", en: "Sha'ban" },
  { n: 9, ar: "رمضان", en: "Ramadan" },
  { n: 10, ar: "شوال", en: "Shawwal" },
  { n: 11, ar: "ذو القعدة", en: "Dhu al-Qi'dah" },
  { n: 12, ar: "ذو الحجة", en: "Dhu al-Hijjah" },
];
export const HIJRI_YEAR_MIN = 1350;
export const HIJRI_YEAR_MAX = 1447;

export function HijriDatePicker({ value, onChange, ar }: { value: string; onChange: (v: string) => void; ar: boolean }) {
  const y = value.length === 8 ? parseInt(value.slice(0, 4), 10) : undefined;
  const m = value.length === 8 ? parseInt(value.slice(4, 6), 10) : undefined;
  const d = value.length === 8 ? parseInt(value.slice(6, 8), 10) : undefined;

  const compose = (ny?: number, nm?: number, nd?: number) => {
    if (!ny || !nm || !nd) {
      onChange("");
      return;
    }
    onChange(`${ny}${String(nm).padStart(2, "0")}${String(nd).padStart(2, "0")}`);
  };

  return (
    <div className="flex gap-2">
      <Select value={d ?? ""} onChange={(e) => compose(y, m, Number(e.target.value))} className="flex-1">
        <option value="" disabled>{T("Day", "يوم", ar)}</option>
        {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
          <option key={day} value={day}>{day}</option>
        ))}
      </Select>
      <Select value={m ?? ""} onChange={(e) => compose(y, Number(e.target.value), d)} className="flex-1">
        <option value="" disabled>{T("Month", "شهر", ar)}</option>
        {HIJRI_MONTHS.map((month) => (
          <option key={month.n} value={month.n}>{ar ? month.ar : month.en}</option>
        ))}
      </Select>
      <Select value={y ?? ""} onChange={(e) => compose(Number(e.target.value), m, d)} className="flex-1">
        <option value="" disabled>{T("Year", "سنة", ar)}</option>
        {Array.from({ length: HIJRI_YEAR_MAX - HIJRI_YEAR_MIN + 1 }, (_, i) => HIJRI_YEAR_MAX - i).map((year) => (
          <option key={year} value={year}>{year}</option>
        ))}
      </Select>
    </div>
  );
}

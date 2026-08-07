"use client";

import { useState, useRef } from "react";
import {
  Search, LayoutGrid, List as ListIcon, Plus, ChevronLeft, ChevronRight,
  ArrowLeft, ArrowRight, Car, Gauge, Settings2, X, Check, ShieldCheck, MapPin,
  ChevronDown, Coins, Camera, Upload, AlertCircle, CheckCircle2,
  ClockAlert, FileText, Zap, Info,
} from "lucide-react";
import { Badge, Toggle, RiyalSymbol, Input, Select, Button, Chip, IconButton, Tabs } from "@/components/ui";
import { CARS, CAR_IMAGES } from "@/lib/data";
import { SketchComponent } from "@/components/employee/SketchComponent";
import type { Car as CarType } from "@/lib/data";
import type { SketchItem } from "@/lib/tajeer";
import { TAJEER_LOOKUPS } from "@/lib/tajeer";
import { useAdmin } from "@/contexts/AdminContext";
import { MapModal } from "@/components/employee/MapModal";
import { getAvailabilityText } from "@/lib/maps";

const T = (en: string, ar: string, isAr: boolean) => isAr ? ar : en;

/* ── Status config ─────────────────────────────────────────────── */
const STATUS_MAP: Record<string, { variant: "success" | "warning" | "danger" | "neutral" | "info"; en: string; ar: string }> = {
  available: { variant: "success", en: "Available", ar: "متاحة" },
  rented: { variant: "info", en: "Rented", ar: "مؤجرة" },
  overdue: { variant: "danger", en: "Overdue", ar: "متأخرة" },
  maintenance: { variant: "warning", en: "Maintenance", ar: "صيانة" },
  reserved: { variant: "warning", en: "Reserved", ar: "محجوزة" },
  inactive: { variant: "neutral", en: "Inactive", ar: "غير نشطة" },
  draft: { variant: "neutral", en: "Draft", ar: "مسودة" },
};

const CAT_AR: Record<string, string> = {
  Sedan: "سيدان", SUV: "دفع رباعي", Luxury: "فاخرة", Economy: "اقتصادية",
};

/* ── Form type ─────────────────────────────────────────────────── */
type VehicleForm = {
  make: string; model: string; year: string; color: string;
  plateNumber: string; plateChar1: string; plateChar2: string; plateChar3: string; plateType: string;
  chassisNumber: string;
  bodyType: string; maxLoad: string; seats: string;
  fuelTypeCode: string; octane: string; transmission: string; category: string;
  istamaraNumber: string; istamaraExpiry: string;
  periodicInspectionExpiry: string; customsNumber: string;
  operationCardNumber: string; operationCardExpiryDate: string; otherNotes: string;
  insuranceCompany: string; insurancePolicyNumber: string;
  insuranceExpiry: string; insuranceType: string; insuranceAmount: string;
  odometerReading: string; availableFuel: string;
  ac: string; radioStereo: string; screen: string; speedometer: string;
  keys: string; carSeats: string; tires: string; spareTire: string;
  safetyTriangle: string; fireExtinguisher: string; firstAidKit: string; spareTireTools: string;
  enduranceAmount: string; oilChangeKmDistance: string; oilChangeDate: string; oilType: string;
  dailyRate: string; extraKmCost: string; fullFuelCost: string; lateFeePerHour: string; kmCap: string; unlimitedKm: boolean;
  branch: string; status: string;
  gpsEnabled: boolean; dashcamEnabled: boolean; insuranceAddOn: boolean;
  childSeatAvail: boolean; listingActive: boolean;
};

type FieldMeta = { key: keyof VehicleForm; labelEn: string; labelAr: string; section: string };

const REQUIRED_FIELDS: FieldMeta[] = [
  { key: "plateNumber", labelEn: "Plate number", labelAr: "أرقام اللوحة", section: "plate" },
  { key: "plateChar1", labelEn: "Plate 1st char", labelAr: "الحرف الأول", section: "plate" },
  { key: "plateChar2", labelEn: "Plate 2nd char", labelAr: "الحرف الثاني", section: "plate" },
  { key: "plateChar3", labelEn: "Plate 3rd char", labelAr: "الحرف الثالث", section: "plate" },
  { key: "model", labelEn: "Model", labelAr: "الطراز", section: "basic" },
  { key: "year", labelEn: "Year", labelAr: "سنة الصنع", section: "basic" },
  { key: "color", labelEn: "Color", labelAr: "اللون", section: "basic" },
  { key: "chassisNumber", labelEn: "Chassis / VIN", labelAr: "رقم الشاسيه", section: "basic" },
  { key: "seats", labelEn: "Seats", labelAr: "عدد المقاعد", section: "basic" },
  { key: "insuranceCompany", labelEn: "Insurance company", labelAr: "شركة التأمين", section: "insurance" },
  { key: "insurancePolicyNumber", labelEn: "Policy number", labelAr: "رقم وثيقة التأمين", section: "insurance" },
  { key: "insuranceExpiry", labelEn: "Insurance expiry", labelAr: "انتهاء التأمين", section: "insurance" },
  { key: "insuranceType", labelEn: "Insurance type", labelAr: "نوع التأمين", section: "insurance" },
  { key: "insuranceAmount", labelEn: "Insurance amount", labelAr: "مبلغ التأمين", section: "insurance" },
  { key: "odometerReading", labelEn: "Odometer reading", labelAr: "قراءة العداد", section: "status" },
  { key: "availableFuel", labelEn: "Fuel level", labelAr: "مستوى الوقود", section: "status" },
  { key: "enduranceAmount", labelEn: "Deductible amount", labelAr: "مبلغ التحمل", section: "pricing" },
  { key: "oilChangeDate", labelEn: "Next oil change due", labelAr: "موعد استدعاء الزيت القادم", section: "status" },
  { key: "oilChangeKmDistance", labelEn: "Oil change KM", labelAr: "مسافة تغيير الزيت", section: "status" },
  { key: "oilType", labelEn: "Oil type", labelAr: "نوع الزيت", section: "status" },
  { key: "ac", labelEn: "A/C", labelAr: "حالة التكييف", section: "status" },
  { key: "radioStereo", labelEn: "Radio", labelAr: "حالة الراديو/المسجل", section: "status" },
  { key: "screen", labelEn: "Screen", labelAr: "حالة الشاشة الداخلية", section: "status" },
  { key: "speedometer", labelEn: "Speedometer", labelAr: "حالة عداد السرعة", section: "status" },
  { key: "keys", labelEn: "Keys", labelAr: "حالة المفتاح", section: "status" },
  { key: "carSeats", labelEn: "Seats", labelAr: "المقاعد", section: "status" },
  { key: "tires", labelEn: "Tires", labelAr: "حالة العجلات", section: "status" },
  { key: "spareTire", labelEn: "Spare Tire", labelAr: "حالة العجلة الاحتياطية", section: "status" },
  { key: "safetyTriangle", labelEn: "Safety triangle", labelAr: "توفر المثلث العاكس", section: "status" },
  { key: "fireExtinguisher", labelEn: "Fire extinguisher", labelAr: "توفر طفاية الحريق", section: "status" },
  { key: "firstAidKit", labelEn: "First aid kit", labelAr: "حالة حقيبة الاسعافات الأولية", section: "status" },
  { key: "spareTireTools", labelEn: "Spare tire tools", labelAr: "معدات الكفر الاحتياطية", section: "status" },
  { key: "dailyRate", labelEn: "Daily rate", labelAr: "السعر اليومي", section: "pricing" },
  { key: "extraKmCost", labelEn: "Extra KM cost", labelAr: "تكلفة الكيلومتر الزائد", section: "pricing" },
  { key: "fullFuelCost", labelEn: "Full fuel cost", labelAr: "تكلفة الوقود الكامل", section: "pricing" },
  { key: "lateFeePerHour", labelEn: "Late fee per hour", labelAr: "سعر ساعة التأخير", section: "pricing" },
];

function calcCompletion(form: VehicleForm, photos: string[]) {
  // Extra-km cost is meaningless (and left unfilled) once the vehicle has unlimited km.
  const applicableFields = form.unlimitedKm ? REQUIRED_FIELDS.filter(f => f.key !== "extraKmCost") : REQUIRED_FIELDS;
  const missing = applicableFields.filter(f => {
    const v = form[f.key];
    return typeof v !== "boolean" && (!v || String(v).trim() === "");
  });
  const photosDone = photos.filter(p => p !== "").length >= 4;
  const total = applicableFields.length + 1;
  const done = (applicableFields.length - missing.length) + (photosDone ? 1 : 0);
  return { pct: Math.round((done / total) * 100), missing };
}

/* ── Shared primitives ─────────────────────────────────────────── */
function FL({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="mk-overline text-mk-ink-500 uppercase flex items-center gap-1 tracking-wider">
        {label}{required && <span className="text-mk-danger mk-overline">*</span>}
      </label>
      {children}
    </div>
  );
}

const focusFn = (e: React.FocusEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-mk-blue-500)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-focus)"; };
const blurFn = (e: React.FocusEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.borderColor = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; };

function FI({ value, onChange, placeholder, type = "text", required, disabled }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean; disabled?: boolean;
}) {
  return (
    <Input type={type} value={value} placeholder={placeholder} required={required} disabled={disabled}
      className="disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-mk-ink-50"
      onChange={e => onChange(e.target.value)} />
  );
}

function FS({ value, onChange, children, required }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode; required?: boolean;
}) {
  return (
    <Select value={value} onChange={e => onChange(e.target.value)} required={required}>
      {children}
    </Select>
  );
}

/* ── Photo Manager ─────────────────────────────────────────────── */
const ANGLES = [
  { en: "Front", ar: "أمامي" }, { en: "Rear", ar: "خلفي" },
  { en: "Driver Side", ar: "جهة السائق" }, { en: "Passenger Side", ar: "جهة الراكب" },
  { en: "Interior", ar: "الداخلية" }, { en: "Dashboard", ar: "لوحة القيادة" },
];

function PhotoManager({ photos, onChange, ar }: { photos: string[]; onChange: (p: string[]) => void; ar: boolean }) {
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);

  const handleFile = (idx: number, file: File) => {
    setLoadingIdx(idx);
    const reader = new FileReader();
    reader.onload = e => {
      const updated = [...photos];
      updated[idx] = e.target?.result as string;
      onChange(updated);
      setLoadingIdx(null);
    };
    reader.readAsDataURL(file);
  };

  const remove = (idx: number) => {
    const u = [...photos]; u[idx] = ""; onChange(u);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {ANGLES.map((angle, i) => {
        const src = photos[i]; const has = src && src !== ""; const loading = loadingIdx === i;
        const flip = src?.endsWith("#flipped"); const clean = flip ? src.replace("#flipped", "") : src;
        return (
          <div key={i} className="relative group aspect-[4/3]">
            <label className="block w-full h-full cursor-pointer">
              <input type="file" accept="image/*" className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFile(i, e.target.files[0]); }} />
              <div className="w-full h-full rounded-md overflow-hidden flex flex-col items-center justify-center transition-all"
                style={{
                  background: has ? "transparent" : "var(--color-mk-ink-50)",
                  border: has ? "none" : "1.5px dashed var(--color-mk-ink-200)",
                }}>
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-mk-blue-500 border-t-transparent animate-spin" />
                ) : has ? (
                  <img src={clean} alt={angle.en} className="w-full h-full object-cover"
                    style={{ transform: flip ? "scaleX(-1)" : "none" }} />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-mk-ink-300 group-hover:text-mk-blue-500 transition-colors">
                    <Camera size={18} />
                    <span className="mk-overline text-center px-1">{ar ? angle.ar : angle.en}</span>
                  </div>
                )}
              </div>
            </label>
            {has && !loading && (
              <>
                <button onClick={() => remove(i)}
                  className="absolute top-1 end-1 w-5 h-5 rounded-full bg-mk-danger text-white border-none cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <X size={9} />
                </button>
                <label className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-all cursor-pointer rounded-md z-10">
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleFile(i, e.target.files[0]); }} />
                  <Upload size={14} className="opacity-0 group-hover:opacity-100 text-white transition-opacity" />
                </label>
              </>
            )}
            <div className="absolute bottom-0 inset-x-0 text-center">
              <span className="mk-overline text-mk-ink-400">{ar ? angle.ar : angle.en}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Completion bar ─────────────────────────────────────────────── */
function CompletionBar({ pct, missing, ar }: { pct: number; missing: FieldMeta[]; ar: boolean }) {
  const [open, setOpen] = useState(false);
  const col = pct === 100 ? "var(--color-mk-mint-600)" : pct >= 70 ? "var(--color-mk-blue-500)" : pct >= 40 ? "var(--color-mk-warning)" : "var(--color-mk-danger)";
  return (
    <div className="rounded-md p-3 mk-surface mk-shadow-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="mk-caption text-mk-ink-900">{T("Profile Completion", "اكتمال ملف المركبة", ar)}</span>
            <span className="mk-caption" style={{ color: col }}>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-mk-ink-100 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: col }} />
          </div>
        </div>
        {pct === 100
          ? <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-mk-mint-100"><CheckCircle2 size={14} className="text-mk-mint-600" /></div>
          : <button onClick={() => setOpen(o => !o)} className="w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer shrink-0 transition-colors bg-mk-danger-100"><AlertCircle size={14} className="text-mk-danger" /></button>
        }
      </div>
      {pct < 100 && <p className="mk-overline text-mk-ink-400 cursor-pointer" onClick={() => setOpen(o => !o)}>{missing.length} {T("required fields missing", "حقول مطلوبة ناقصة", ar)} — {open ? T("hide", "إخفاء", ar) : T("show", "عرض", ar)}</p>}
      {open && missing.length > 0 && (
        <div className="mt-2 pt-2 border-t border-mk-ink-100 grid grid-cols-1 sm:grid-cols-2 gap-1">
          {missing.map(f => (
            <div key={String(f.key)} className="flex items-center gap-1 mk-overline text-mk-danger">
              <div className="w-1 h-1 rounded-full bg-mk-danger shrink-0" />
              {ar ? f.labelAr : f.labelEn}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Carousel (fleet list) ─────────────────────────────────────── */
function CarCarousel({ images, height = 180 }: { images: string[]; height?: number }) {
  const [idx, setIdx] = useState(0);
  const [sx, setSx] = useState<number | null>(null);
  const [drag, setDrag] = useState(false);
  const go = (d: 1 | -1) => setIdx(p => (p + d + images.length) % images.length);
  if (!images.length) return <div style={{ height }} className="flex items-center justify-center mk-car-thumb-bg"><Car size={28} className="opacity-20 text-mk-ink-400" /></div>;
  return (
    <div style={{ height }} className="relative overflow-hidden cursor-grab select-none"
      onMouseDown={e => { setSx(e.clientX); setDrag(true); }}
      onMouseMove={e => { if (drag && sx !== null) { const d = sx - e.clientX; if (d > 40) { go(1); setDrag(false); } else if (d < -40) { go(-1); setDrag(false); } } }}
      onMouseUp={() => { setDrag(false); setSx(null); }} onMouseLeave={() => { setDrag(false); setSx(null); }}
    >
      {images.map((src, i) => { const f = src.endsWith("#flipped"); const c = f ? src.replace("#flipped", "") : src; return <img key={i} src={c} alt="" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none" style={{ opacity: i === idx ? 1 : 0, zIndex: i === idx ? 10 : 0, transform: f ? "scaleX(-1)" : "none" }} />; })}
      {images.length > 1 && <><button onClick={e => { e.stopPropagation(); go(-1); }} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center border-none cursor-pointer hover:bg-black/60 transition-colors"><ChevronLeft size={13} /></button><button onClick={e => { e.stopPropagation(); go(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center border-none cursor-pointer hover:bg-black/60 transition-colors"><ChevronRight size={13} /></button><div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">{images.map((_, i) => <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }} className="rounded-full border-none cursor-pointer p-0 transition-all" style={{ width: i === idx ? 14 : 5, height: 5, background: i === idx ? "white" : "rgba(255,255,255,0.5)" }} />)}</div></>}
    </div>
  );
}

/* ── Grid Card ─────────────────────────────────────────────────── */
function GridCard({ car, ar, onClick, onMapClick }: { car: CarType; ar: boolean; onClick: () => void; onMapClick: () => void }) {
  const sm = STATUS_MAP[car.status] ?? { variant: "neutral" as const, en: car.status, ar: car.status };
  return (
    <div onClick={onClick} className="rounded-lg overflow-hidden mk-surface cursor-pointer transition-colors duration-200 hover:bg-mk-ink-50 mk-shadow-10">
      <div className="mk-car-thumb-bg">
        <CarCarousel images={CAR_IMAGES[car.model] || []} height={170} />
      </div>
      <div className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="mk-body text-mk-ink-900 truncate">{car.make} {car.model}</div>
            <div className="mk-overline text-mk-ink-500 mt-1">{car.plate} · {T(car.type, CAT_AR[car.type] ?? car.type, ar)} · {car.year}</div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant={sm.variant} dot>{T(sm.en, sm.ar, ar)}</Badge>
            {(car.status === "rented" || car.status === "overdue") && (
              <span className="mk-overline mt-1 text-mk-ink-500 shrink-0">
                {getAvailabilityText(car.status, car.id, ar)}
              </span>
            )}
            {car.id === 4 && (
              <Badge variant="warning" className="mk-overline py-1 px-2 leading-none shrink-0">
                {T("License Renewal", "تجديد الاستمارة", ar)}
              </Badge>
            )}
            {car.id === 6 && (
              <Badge variant="danger" className="mk-overline py-1 px-2 leading-none shrink-0">
                {T("Inspection Expired", "الفحص منتهي", ar)}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-mk-ink-100">
          <div className="flex items-center gap-1"><RiyalSymbol size={16} className="text-mk-ink-900" /><span className="mk-body text-mk-ink-900">{car.dailyRate}</span><span className="mk-caption text-mk-ink-400">{T("/d", "/يوم", ar)}</span></div>
          <div className="w-px h-3 bg-mk-ink-200" />
          <div className="flex items-center gap-1 mk-caption text-mk-ink-500"><Gauge size={11} className="text-mk-violet-500" /><span>{car.utilization}%</span></div>
        </div>
      </div>
    </div>
  );
}

/* ── List Row ──────────────────────────────────────────────────── */
function ListRow({ car, ar, onClick, onMapClick }: { car: CarType; ar: boolean; onClick: () => void; onMapClick: () => void }) {
  const sm = STATUS_MAP[car.status] ?? { variant: "neutral" as const, en: car.status, ar: car.status };
  const imgs = CAR_IMAGES[car.model] || []; const thumb = imgs[0]; const flip = thumb?.endsWith("#flipped");
  return (
    <div onClick={onClick} className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-mk-ink-50 border-b border-mk-border">
      <div className="w-16 h-12 rounded-sm overflow-hidden shrink-0 flex items-center justify-center mk-car-thumb-bg-sm">
        {thumb ? <img src={flip ? thumb.replace("#flipped", "") : thumb} alt="" className="w-full h-full object-cover" style={{ transform: flip ? "scaleX(-1)" : "none" }} /> : <Car size={20} className="text-mk-ink-300" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="mk-body text-mk-ink-900">{car.make} {car.model}</div>
        <div className="mk-overline text-mk-ink-500">{car.plate} · {T(car.type, CAT_AR[car.type] ?? car.type, ar)} · {car.year}</div>
      </div>
      <div className="hidden sm:flex flex-col items-end shrink-0 w-20">
        <div className="flex items-center gap-1">
          <RiyalSymbol size={16} className="text-mk-ink-900" />
          <span className="mk-body text-mk-ink-900">{car.dailyRate}</span>
        </div>
        <span className="mk-overline text-mk-ink-400">{T("/day", "/يوم", ar)}</span>
      </div>
      <div className="hidden lg:flex flex-col items-center shrink-0 w-16"><span className="mk-caption text-mk-ink-900">{car.utilization}%</span><div className="w-12 h-1 rounded-full bg-mk-ink-100 mt-1 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${car.utilization}%`, background: car.utilization > 80 ? "var(--color-mk-mint-600)" : "var(--color-mk-blue-500)" }} /></div></div>
      
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onMapClick();
        }}
        className="hidden md:flex items-center gap-1 px-3 py-2 rounded-full border border-mk-ink-200 bg-white hover:bg-mk-ink-50 transition-colors mk-caption text-mk-ink-700 cursor-pointer"
      >
        <MapPin size={12} className="text-mk-blue-500" />
        {T("Show on map", "عرض على الخريطة", ar)}
      </button>

      <div className="shrink-0 flex flex-col items-end gap-1">
        <Badge variant={sm.variant} dot>{T(sm.en, sm.ar, ar)}</Badge>
        {(car.status === "rented" || car.status === "overdue") && (
          <span className="mk-overline mt-1 text-mk-ink-500 shrink-0">
            {getAvailabilityText(car.status, car.id, ar)}
          </span>
        )}
        {car.id === 4 && (
          <Badge variant="warning" className="mk-overline py-1 px-2 leading-none shrink-0">
            {T("License Renewal", "تجديد الاستمارة", ar)}
          </Badge>
        )}
        {car.id === 6 && (
          <Badge variant="danger" className="mk-overline py-1 px-2 leading-none shrink-0">
            {T("Inspection Expired", "الفحص منتهي", ar)}
          </Badge>
        )}
      </div>
      <ChevronRight size={13} className="text-mk-ink-300 shrink-0" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CAR SETTINGS PAGE — 2-column equal layout + pill tabs
   ═══════════════════════════════════════════════════════════════ */

type PanelId = "basic" | "insurance" | "status";

// Maps every editable field to the panel that owns it, so a single generic
// `set()` call can flag the right panel dirty without threading a
// panel-specific setter through every field in the JSX below.
const FIELD_PANEL_MAP: Partial<Record<keyof VehicleForm, PanelId>> = {
  make: "basic", model: "basic", year: "basic", color: "basic",
  plateNumber: "basic", plateChar1: "basic", plateChar2: "basic", plateChar3: "basic", plateType: "basic",
  chassisNumber: "basic", bodyType: "basic", maxLoad: "basic", seats: "basic",
  fuelTypeCode: "basic", octane: "basic", transmission: "basic", category: "basic",
  istamaraNumber: "basic", istamaraExpiry: "basic", periodicInspectionExpiry: "basic", customsNumber: "basic",
  operationCardNumber: "basic", operationCardExpiryDate: "basic", otherNotes: "basic",
  insuranceCompany: "insurance", insurancePolicyNumber: "insurance", insuranceExpiry: "insurance",
  insuranceType: "insurance", insuranceAmount: "insurance",
  dailyRate: "insurance", extraKmCost: "insurance", fullFuelCost: "insurance", lateFeePerHour: "insurance", enduranceAmount: "insurance",
  kmCap: "insurance", unlimitedKm: "insurance", branch: "insurance",
  status: "status", ac: "status", radioStereo: "status", screen: "status", speedometer: "status",
  keys: "status", carSeats: "status", tires: "status", spareTire: "status",
  safetyTriangle: "status", fireExtinguisher: "status", firstAidKit: "status", spareTireTools: "status",
  oilType: "status", oilChangeKmDistance: "status", oilChangeDate: "status",
  odometerReading: "status", availableFuel: "status",
};

/* ── Collapsible form panel — replaces the old pill-tab switcher; all
   sections stack in the same column so nothing is hidden behind a tab.
   Shows its own Save/Cancel footer once a field inside it has been edited. */
function Panel({ icon: Icon, title, count, open, onToggle, dirty, saved, onSave, onCancel, ar, children }: {
  icon: React.ElementType; title: string; count: number; open: boolean; onToggle: () => void;
  dirty: boolean; saved: boolean; onSave: () => void; onCancel: () => void; ar: boolean; children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg mk-surface mk-shadow-10 overflow-hidden">
      <div className="w-full flex items-center gap-2 px-5 py-4">
        <button type="button" onClick={onToggle}
          className="flex items-center gap-2 flex-1 min-w-0 p-0 border-0 bg-transparent cursor-pointer text-start">
          <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-mk-blue-50">
            <Icon size={16} className="text-mk-blue-500" />
          </div>
          <div className="mk-h4 text-mk-ink-900 flex-1 truncate">{title}</div>
          {count > 0 && (
            <span className="w-5 h-5 rounded-full flex items-center justify-center mk-overline text-white bg-mk-danger shrink-0">
              {count}
            </span>
          )}
        </button>
        {/* Save/Cancel live in the header, on the left, so they're reachable without expanding the panel */}
        <div className="flex items-center gap-2 shrink-0">
          {saved ? (
            <span className="flex items-center gap-1.5 mk-caption text-mk-success">
              <Check size={13} />{T("Saved!", "تم الحفظ!", ar)}
            </span>
          ) : dirty ? (
            <>
              {count > 0 && (
                <span className="mk-overline text-mk-danger hidden sm:inline">
                  {T("Required fields missing", "حقول مطلوبة ناقصة", ar)}
                </span>
              )}
              <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                {T("Cancel", "إلغاء", ar)}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onSave}
                disabled={count > 0}
                title={count > 0 ? T("Fill in the required fields first", "أكمل الحقول المطلوبة أولاً", ar) : undefined}
              >
                {T("Save", "حفظ", ar)}
              </Button>
            </>
          ) : null}
          <button type="button" onClick={onToggle}
            className="p-0 border-0 bg-transparent cursor-pointer flex items-center justify-center shrink-0">
            <ChevronDown size={14} className={`text-mk-ink-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>
      {open && <div className="px-5 pb-5 pt-5 border-t border-mk-ink-100">{children}</div>}
    </div>
  );
}

/* Small pill label marking the start of a sub-section within a panel body. */
function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block mk-overline uppercase tracking-wider text-mk-blue-600 bg-mk-blue-50 px-2.5 py-1 rounded-full mb-3">
      {children}
    </span>
  );
}

function buildForm(car: CarType): VehicleForm {
  return {
    make: car.make, model: car.model, year: String(car.year), color: car.color,
    plateNumber: String(car.plateNumber),
    plateChar1: car.plateChar1, plateChar2: car.plateChar2, plateChar3: car.plateChar3, plateType: String(car.registrationTypeCode ?? 1),
    chassisNumber: car.chassisNumber,
    bodyType: car.bodyType,
    maxLoad: "500", seats: String(car.seats),
    fuelTypeCode: String(car.fuelTypeCode), octane: "92", transmission: car.transmission, category: car.type,
    istamaraNumber: car.istamaraNumber, istamaraExpiry: car.istamaraExpiry, periodicInspectionExpiry: car.periodicInspectionExpiry, customsNumber: "",
    operationCardNumber: car.operationCardNumber ?? "", operationCardExpiryDate: car.operationCardExpiryDate ?? "", otherNotes: car.otherNotes ?? "",
    insuranceCompany: car.insuranceCompany, insurancePolicyNumber: car.insurancePolicyNumber, insuranceExpiry: car.insuranceExpiry, insuranceType: car.insuranceType, insuranceAmount: String(car.insuranceAmount ?? ""),
    odometerReading: "", availableFuel: "2",
    ac: "1", radioStereo: "5", screen: "5", speedometer: "5",
    keys: "5", carSeats: "6", tires: "1", spareTire: "8",
    safetyTriangle: "8", fireExtinguisher: "8", firstAidKit: "8", spareTireTools: "8",
    enduranceAmount: String(car.enduranceAmount), oilChangeKmDistance: "5000", oilChangeDate: car.oilChangeDate ?? "", oilType: "5W-30",
    dailyRate: String(car.dailyRate), extraKmCost: String(car.extraKmCost), fullFuelCost: String(car.fullFuelCost),
    lateFeePerHour: String(car.lateFeePerHour),
    kmCap: String(car.kmCap), unlimitedKm: car.kmCap === "Unlimited",
    branch: "Riyadh — Olaya", status: car.status,
    gpsEnabled: true, dashcamEnabled: false, insuranceAddOn: true, childSeatAvail: true,
    listingActive: car.status === "available",
  };
}

function CarSettingsPage({ car, ar, onBack, onMapClick }: { car: CarType; ar: boolean; onBack: () => void; onMapClick: () => void }) {
  const sm = STATUS_MAP[car.status] ?? { variant: "neutral" as const, en: car.status, ar: car.status };
  const [openPanels, setOpenPanels] = useState<Record<PanelId, boolean>>({ basic: true, insurance: true, status: true });
  const togglePanel = (id: PanelId) => setOpenPanels(p => ({ ...p, [id]: !p[id] }));
  const [diagramView, setDiagramView] = useState<"photos" | "diagram">("photos");
  const [sketchItems, setSketchItems] = useState<SketchItem[]>([]);
  const [saved, setSaved] = useState(false);

  const [photos, setPhotos] = useState<string[]>(() => {
    const base = [...(CAR_IMAGES[car.model] || [])];
    while (base.length < 6) base.push("");
    return base.slice(0, 6);
  });

  // Kept separate from `form` so a per-panel Cancel can revert exactly that
  // panel's fields without losing edits made in the other panels.
  const initialFormRef = useRef<VehicleForm>(buildForm(car));
  const [form, setForm] = useState<VehicleForm>(() => buildForm(car));
  const [dirtyPanels, setDirtyPanels] = useState<Record<PanelId, boolean>>({ basic: false, insurance: false, status: false });
  const [savedPanels, setSavedPanels] = useState<Record<PanelId, boolean>>({ basic: false, insurance: false, status: false });

  const set = (k: keyof VehicleForm) => (v: string | boolean) => {
    setForm(f => ({ ...f, [k]: v }));
    const panel = FIELD_PANEL_MAP[k];
    if (panel) setDirtyPanels(d => (d[panel] ? d : { ...d, [panel]: true }));
  };

  const { pct, missing } = calcCompletion(form, photos);

  // Count missing per panel — merged mapping
  const sectionToPanel: Record<string, PanelId> = {
    plate: "basic", docs: "basic", basic: "basic", tajeer: "basic",
    insurance: "insurance", pricing: "insurance",
    status: "status",
  };
  const missingByPanel = (panelId: PanelId) => missing.filter(f => sectionToPanel[f.section] === panelId).length;

  // Required fields must actually block saving — a red asterisk with no
  // enforcement behind it (e.g. Istamara expiry saving empty) isn't required.
  const savePanel = (id: PanelId) => {
    if (missingByPanel(id) > 0) return;
    setDirtyPanels(d => ({ ...d, [id]: false }));
    setSavedPanels(s => ({ ...s, [id]: true }));
    setTimeout(() => setSavedPanels(s => ({ ...s, [id]: false })), 2000);
  };

  const cancelPanel = (id: PanelId) => {
    setForm(f => {
      const reverted = { ...f };
      (Object.keys(FIELD_PANEL_MAP) as (keyof VehicleForm)[]).forEach(k => {
        if (FIELD_PANEL_MAP[k] === id) (reverted as any)[k] = initialFormRef.current[k];
      });
      return reverted;
    });
    setDirtyPanels(d => ({ ...d, [id]: false }));
  };

  // Tajeer V9.3: plate chars must use "ا" (not "أ") and "ى" (not "ي")
  const AR_CHARS = ["ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش", "ص", "ض", "ط", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "ه", "و", "ى"];
  const cOpts = (arr: readonly { code: number; ar: string; en: string }[]) => arr.map(o => <option key={o.code} value={String(o.code)}>{ar ? o.ar : o.en}</option>);

  return (
    <div>
      {/* ── Header + Actions (top) ── */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center border border-mk-ink-200 bg-white cursor-pointer text-mk-ink-600 hover:bg-mk-ink-50 transition-colors shrink-0">
          {ar ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="mk-h4 text-mk-ink-900">{car.make} {car.model} · {car.year}</h2>
            <Badge variant={sm.variant} dot>{T(sm.en, sm.ar, ar)}</Badge>
          </div>
          <p className="mk-caption text-mk-ink-500">{car.plate} · {T(car.type, CAT_AR[car.type] ?? car.type, ar)}</p>
        </div>
        {/* Save / Cancel — on top */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onMapClick}
            className="flex items-center gap-2 px-4 py-3 rounded-full mk-label text-mk-blue-500 bg-mk-blue-50 hover:bg-mk-blue-100/50 border border-mk-blue-500/20 cursor-pointer transition-colors"
          >
            <MapPin size={14} />{T("Show on map", "عرض على الخريطة", ar)}
          </button>
          <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2200); }}
            className="flex items-center gap-2 px-4 py-3 rounded-full mk-label text-white border-0 cursor-pointer transition-all"
            style={{
              background: saved ? "var(--color-mk-mint-600)" : "var(--color-mk-blue-500)",
              boxShadow: saved ? "var(--shadow-glow-mint)" : "var(--shadow-glow-blue)",
            }}>
            {saved ? <><Check size={14} />{T("Saved!", "تم الحفظ!", ar)}</> : <><ShieldCheck size={14} />{T("Save", "حفظ", ar)}</>}
          </button>
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-3 rounded-full mk-label text-mk-ink-700 bg-mk-ink-100 border-0 cursor-pointer hover:bg-mk-ink-200 transition-colors">
            <X size={14} />{T("Cancel", "إلغاء", ar)}
          </button>
        </div>
      </div>

      {/* ── Completion bar ── */}
      <div className="mb-4">
        <CompletionBar pct={pct} missing={missing} ar={ar} />
      </div>


      {/* ── Responsive grid: 1 col on mobile/tablet, 2 cols on large screens ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ══ LEFT (right column in RTL): stacked info panels ═════ */}
        <div className="flex flex-col gap-4">

          {/* Panel 1 — معلومات المركبة الأساسية (plate + docs + vehicle info) */}
          <Panel icon={Car} title={T("Basic Vehicle Information", "معلومات المركبة الأساسية", ar)}
            count={missingByPanel("basic")} open={openPanels.basic} onToggle={() => togglePanel("basic")}
            dirty={dirtyPanels.basic} saved={savedPanels.basic} onSave={() => savePanel("basic")} onCancel={() => cancelPanel("basic")} ar={ar}>
            <div className="flex flex-col gap-5">
              {/* Plate */}
              <div>
                <SectionBadge>{T("License Plate", "اللوحة", ar)}</SectionBadge>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FL label={T("Registration Type", "نوع التسجيل", ar)} required><FS value={form.plateType} onChange={set("plateType")} required><option value="1">{T("Private (1)", "خاصة (١)", ar)}</option><option value="3">{T("Transport (3)", "نقل خاص (٣)", ar)}</option></FS></FL>
                  <FL label={T("Plate Digits", "أرقام اللوحة", ar)} required><FI value={form.plateNumber} onChange={set("plateNumber")} placeholder="1234" required /></FL>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <FL label={T("1st Char", "الحرف الأول", ar)} required><FS value={form.plateChar1} onChange={set("plateChar1")} required>{AR_CHARS.map(c => <option key={c}>{c}</option>)}</FS></FL>
                  <FL label={T("2nd Char", "الحرف الثاني", ar)} required><FS value={form.plateChar2} onChange={set("plateChar2")} required>{AR_CHARS.map(c => <option key={c}>{c}</option>)}</FS></FL>
                  <FL label={T("3rd Char", "الحرف الثالث", ar)} required><FS value={form.plateChar3} onChange={set("plateChar3")} required>{AR_CHARS.map(c => <option key={c}>{c}</option>)}</FS></FL>
                </div>
              </div>
              {/* Docs */}
              <div className="pt-4 border-t border-mk-ink-100">
                <SectionBadge>{T("Registration Documents", "وثائق التسجيل", ar)}</SectionBadge>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="col-span-2"><FL label={T("Istamara Number", "رقم الاستمارة", ar)}><FI value={form.istamaraNumber} onChange={set("istamaraNumber")} placeholder="XXXXXXXXXX" /></FL></div>
                  <FL label={T("Istamara Expiry", "انتهاء الاستمارة", ar)}><FI value={form.istamaraExpiry} onChange={set("istamaraExpiry")} type="date" /></FL>
                  <FL label={T("Inspection Expiry", "انتهاء الفحص الدوري", ar)}><FI value={form.periodicInspectionExpiry} onChange={set("periodicInspectionExpiry")} type="date" /></FL>
                  <FL label={T("Operation Card Number", "رقم بطاقة التشغيل", ar)}><FI value={form.operationCardNumber} onChange={set("operationCardNumber")} placeholder="OPC-XXXXXX" /></FL>
                  <FL label={T("Operation Card Expiry", "تاريخ انتهاء بطاقة التشغيل", ar)}><FI value={form.operationCardExpiryDate} onChange={set("operationCardExpiryDate")} type="date" /></FL>
                  <div className="col-span-2"><FL label={T("Customs Number (optional)", "رقم الجمارك (اختياري)", ar)}><FI value={form.customsNumber} onChange={set("customsNumber")} placeholder="—" /></FL></div>
                  <div className="col-span-2">
                    <FL label={T("Other", "أخرى", ar)}>
                      <textarea value={form.otherNotes} onChange={e => set("otherNotes")(e.target.value)} rows={2}
                        className="w-full px-3 py-3 rounded-md mk-body-sm text-mk-ink-900 bg-white border border-mk-ink-100 outline-none resize-none transition-all placeholder:text-mk-ink-300 [font-family:inherit]"
                        onFocus={focusFn} onBlur={blurFn} />
                    </FL>
                  </div>
                </div>
              </div>
              {/* Vehicle details */}
              <div className="pt-4 border-t border-mk-ink-100">
                <SectionBadge>{T("Vehicle Details", "بيانات المركبة", ar)}</SectionBadge>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FL label={T("Model", "الطراز", ar)} required><FI value={form.model} onChange={set("model")} placeholder="Camry" required /></FL>
                  <FL label={T("Year", "السنة", ar)} required><FI value={form.year} onChange={set("year")} placeholder="2024" type="number" required /></FL>
                  <FL label={T("Color", "اللون", ar)} required><FI value={form.color} onChange={set("color")} placeholder={T("White", "أبيض", ar)} required /></FL>
                  <FL label={T("Category", "الفئة", ar)}><FS value={form.category} onChange={set("category")}>{["Sedan", "SUV", "Luxury", "Economy"].map(t => <option key={t} value={t}>{T(t, CAT_AR[t] ?? t, ar)}</option>)}</FS></FL>
                  <div className="col-span-2"><FL label={T("Chassis / VIN", "رقم الشاسيه (VIN)", ar)} required><FI value={form.chassisNumber} onChange={set("chassisNumber")} placeholder="1HGBH41JXMN109186" required /></FL></div>
                  <FL label={T("Seats", "المقاعد", ar)} required><FS value={form.seats} onChange={set("seats")} required>{["2", "4", "5", "7", "8"].map(n => <option key={n} value={n}>{n}</option>)}</FS></FL>
                  <FL label={T("Fuel Type", "نوع الوقود", ar)}>
                    <FS
                      value={form.fuelTypeCode === "1" ? `1-${form.octane}` : form.fuelTypeCode}
                      onChange={(v) => {
                        if (v.startsWith("1-")) {
                          set("fuelTypeCode")("1");
                          set("octane")(v.split("-")[1]);
                        } else {
                          set("fuelTypeCode")(v);
                        }
                      }}
                    >
                      <option value="1-90">{T("Petrol 90", "بنزين ٩٠", ar)}</option>
                      <option value="1-92">{T("Petrol 92", "بنزين ٩٢", ar)}</option>
                      <option value="1-95">{T("Petrol 95", "بنزين ٩٥", ar)}</option>
                      {TAJEER_LOOKUPS.fuelTypes.filter(f => f.code !== 1).map(f => (
                        <option key={f.code} value={String(f.code)}>{ar ? f.ar : f.en}</option>
                      ))}
                    </FS>
                  </FL>
                  <FL label={T("Transmission", "ناقل الحركة", ar)}><FS value={form.transmission} onChange={set("transmission")}><option value="Automatic">{T("Automatic", "أوتوماتيك", ar)}</option><option value="Manual">{T("Manual", "يدوي", ar)}</option></FS></FL>
                  <FL label={T("Max Load (kg)", "الحمولة (كغ)", ar)}><FI value={form.maxLoad} onChange={set("maxLoad")} placeholder="500" type="number" /></FL>
                </div>
              </div>
            </div>
          </Panel>

          {/* Panel 2 — التأمين والتسعير */}
          <Panel icon={ShieldCheck} title={T("Insurance & Pricing", "التأمين والتسعير", ar)}
            count={missingByPanel("insurance")} open={openPanels.insurance} onToggle={() => togglePanel("insurance")}
            dirty={dirtyPanels.insurance} saved={savedPanels.insurance} onSave={() => savePanel("insurance")} onCancel={() => cancelPanel("insurance")} ar={ar}>
            <div className="flex flex-col gap-5">
              {/* Insurance */}
              <div>
                <SectionBadge>{T("Insurance", "التأمين", ar)}</SectionBadge>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <FL label={T("Insurance Company", "شركة التأمين", ar)} required>
                      <FS value={form.insuranceCompany} onChange={set("insuranceCompany")} required>
                        <option value="">{T("Select…", "اختر…", ar)}</option>
                        {["الراجحي تكافل", "ولاء", "تشير", "بوبا العربية", "مدى للتأمين", "الاتحاد التجاري", "ميدغلف", "ساب تكافل", "GIG", "Allianz"].map(c => <option key={c}>{c}</option>)}
                      </FS>
                    </FL>
                  </div>
                  <div className="col-span-2"><FL label={T("Policy Number", "رقم الوثيقة", ar)} required><FI value={form.insurancePolicyNumber} onChange={set("insurancePolicyNumber")} placeholder="POL-XXXXXXXX" required /></FL></div>
                  <FL label={T("Expiry Date", "تاريخ الانتهاء", ar)} required><FI value={form.insuranceExpiry} onChange={set("insuranceExpiry")} type="date" required /></FL>
                  <FL label={T("Type", "نوع التأمين", ar)} required><FS value={form.insuranceType} onChange={set("insuranceType")} required><option value="شامل">{T("Comprehensive", "شامل", ar)}</option><option value="ضد الغير">{T("Third Party", "ضد الغير", ar)}</option></FS></FL>
                  <FL label={T("Insurance Amount (SAR)", "مبلغ التأمين (ريال)", ar)} required><FI value={form.insuranceAmount} onChange={set("insuranceAmount")} placeholder="100000" type="number" required /></FL>
                </div>
              </div>
              {/* Pricing */}
              <div className="pt-4 border-t border-mk-ink-100">
                <SectionBadge>{T("Pricing & Limits", "التسعير والحدود", ar)}</SectionBadge>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FL label={T("Daily Rate (SAR)", "السعر اليومي (ريال)", ar)} required><FI value={form.dailyRate} onChange={set("dailyRate")} placeholder="360" type="number" required /></FL>
                  <FL label={T("Late fee / hour (SAR)", "سعر ساعة التأخير (ريال)", ar)} required><FI value={form.lateFeePerHour} onChange={set("lateFeePerHour")} placeholder="35" type="number" required /></FL>
                  <FL label={T("KM Cap / day", "حد الكيلومتر / يوم", ar)}>
                    <FI value={form.kmCap} onChange={set("kmCap")} placeholder="250" type="number" disabled={form.unlimitedKm} />
                  </FL>
                  <FL label={T("Extra KM (SAR)", "كيلومتر زائد (ريال)", ar)} required={!form.unlimitedKm}>
                    <FI value={form.extraKmCost} onChange={set("extraKmCost")} placeholder="2" type="number" required={!form.unlimitedKm} />
                    {form.unlimitedKm && (
                      <p className="flex items-center gap-1 mk-caption text-mk-ink-400 mt-1">
                        <Info size={12} className="shrink-0" />
                        {T("Not applied with unlimited km", "لا يُطبَّق مع الكيلومتر المفتوح", ar)}
                      </p>
                    )}
                  </FL>
                  <FL label={T("Full Fuel (SAR)", "وقود كامل (ريال)", ar)} required><FI value={form.fullFuelCost} onChange={set("fullFuelCost")} placeholder="250" type="number" required /></FL>
                  <FL label={T("Deductible (SAR)", "مبلغ التحمل (ريال)", ar)} required><FI value={form.enduranceAmount} onChange={set("enduranceAmount")} placeholder="1500" type="number" required /></FL>
                  <FL label={T("Branch", "الفرع", ar)}><FS value={form.branch} onChange={set("branch")}>{["Riyadh — Olaya", "Riyadh — Airport", "Jeddah — Corniche", "Dammam — Khobar"].map(b => <option key={b}>{b}</option>)}</FS></FL>
                </div>
              </div>
            </div>
          </Panel>

          {/* Panel 3 — الحالة */}
          <Panel icon={ClockAlert} title={T("Status", "الحالة", ar)}
            count={missingByPanel("status")} open={openPanels.status} onToggle={() => togglePanel("status")}
            dirty={dirtyPanels.status} saved={savedPanels.status} onSave={() => savePanel("status")} onCancel={() => cancelPanel("status")} ar={ar}>
            <div className="flex flex-col gap-5">
              {/* Fleet Status */}
              <div>
                <FL label={T("Fleet Status", "حالة الأسطول", ar)}>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(STATUS_MAP).map(([k, v]) => {
                      const isActive = form.status === k;
                      const activeClasses: Record<string, string> = {
                        success: "bg-mk-success-100 text-mk-success-700",
                        info: "bg-mk-blue-50 text-mk-blue-700",
                        warning: "bg-mk-warning-100 text-mk-warning-700",
                        danger: "bg-mk-danger-100 text-mk-danger-700",
                        neutral: "bg-mk-ink-100 text-mk-ink-700",
                      };
                      return (
                        <button key={k} type="button" onClick={() => set("status")(k)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-full mk-caption border cursor-pointer transition-all duration-150 ${isActive ?`${activeClasses[v.variant]} border-transparent` : "bg-transparent text-mk-ink-400 border-mk-ink-100"
                            }`}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: isActive ? "currentColor" : "var(--color-mk-ink-300)" }} />
                          {T(v.en, v.ar, ar)}
                        </button>
                      );
                    })}
                  </div>
                </FL>
              </div>
              {/* Maintenance */}
              <div className="pt-4 border-t border-mk-ink-100">
                <SectionBadge>{T("Maintenance", "الصيانة", ar)}</SectionBadge>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FL label={T("Odometer (km)", "قراءة العداد (كم)", ar)} required><FI value={form.odometerReading} onChange={set("odometerReading")} placeholder="47820" type="number" required /></FL>
                  <FL label={T("Fuel Level", "مستوى الوقود", ar)} required><FS value={form.availableFuel} onChange={set("availableFuel")} required>{cOpts(TAJEER_LOOKUPS.availableFuelOptions)}</FS></FL>
                  <FL label={T("Oil Type", "نوع الزيت", ar)} required><FI value={form.oilType} onChange={set("oilType")} placeholder="5W-30" required /></FL>
                  <FL label={T("Oil Change KM", "مسافة تغيير الزيت", ar)} required><FI value={form.oilChangeKmDistance} onChange={set("oilChangeKmDistance")} placeholder="5000" type="number" required /></FL>
                  <FL label={T("Next Oil Change Due", "موعد استدعاء الزيت القادم", ar)} required><FI value={form.oilChangeDate} onChange={set("oilChangeDate")} type="date" required /></FL>
                </div>
              </div>
              {/* Condition checklist */}
              <div className="pt-4 border-t border-mk-ink-100">
                <SectionBadge>{T("Vehicle Condition", "فحص حالة المركبة", ar)}</SectionBadge>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: "ac", lbl: T("A/C", "حالة التكييف", ar), opts: TAJEER_LOOKUPS.acOptions },
                    { key: "radioStereo", lbl: T("Radio", "حالة الراديو/المسجل", ar), opts: TAJEER_LOOKUPS.workingOptions },
                    { key: "screen", lbl: T("Screen", "حالة الشاشة الداخلية", ar), opts: TAJEER_LOOKUPS.workingOptions },
                    { key: "speedometer", lbl: T("Speedometer", "حالة عداد السرعة", ar), opts: TAJEER_LOOKUPS.workingOptions },
                    { key: "keys", lbl: T("Keys", "حالة المفتاح", ar), opts: TAJEER_LOOKUPS.workingOptions },
                    { key: "carSeats", lbl: T("Seats", "المقاعد", ar), opts: TAJEER_LOOKUPS.seatsOptions },
                    { key: "tires", lbl: T("Tires", "حالة العجلات", ar), opts: TAJEER_LOOKUPS.tiresOptions },
                    { key: "spareTire", lbl: T("Spare Tire", "حالة العجلة الاحتياطية", ar), opts: TAJEER_LOOKUPS.availableOptions },
                    { key: "safetyTriangle", lbl: T("Safety △", "توفر المثلث العاكس", ar), opts: TAJEER_LOOKUPS.availableOptions },
                    { key: "fireExtinguisher", lbl: T("Fire Ext.", "توفر طفاية الحريق", ar), opts: TAJEER_LOOKUPS.availableOptions },
                    { key: "firstAidKit", lbl: T("First Aid", "حالة حقيبة الاسعافات الأولية", ar), opts: TAJEER_LOOKUPS.availableOptions },
                    { key: "spareTireTools", lbl: T("Tire Tools", "معدات الكفر الاحتياطية", ar), opts: TAJEER_LOOKUPS.availableOptions },
                  ].map(({ key, lbl, opts }) => (
                    <FL key={key} label={lbl} required><FS value={form[key as keyof VehicleForm] as string} onChange={set(key as keyof VehicleForm)} required>{cOpts(opts as typeof TAJEER_LOOKUPS.acOptions)}</FS></FL>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>

        {/* ══ RIGHT: media + listing ═════════════════════════════ */}
        <div className="flex flex-col gap-4">

          {/* Photos / Diagram card */}
          <div className="rounded-lg p-4 mk-surface mk-shadow-10">
            <div className="flex items-center gap-2 mb-4">
              <Tabs
                variant="tonal"
                size="xs"
                value={diagramView}
                onChange={(v) => setDiagramView(v as "photos" | "diagram")}
                items={[
                  { value: "photos", label: T("Photos", "الصور", ar), icon: <Camera size={12} /> },
                  { value: "diagram", label: T("Diagram", "المخطط", ar), icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg> },
                ]}
              />
              {diagramView === "photos" && (
                <span className="mk-overline ms-auto" style={{ color: photos.filter(p => p && p !== "").length >= 4 ? "var(--color-mk-mint-600)" : "var(--color-mk-warning)" }}>
                  {photos.filter(p => p && p !== "").length}/6 {T("photos", "صور", ar)}
                </span>
              )}
              {diagramView === "diagram" && sketchItems.length > 0 && (
                <button onClick={() => setSketchItems([])} className="ms-auto mk-overline text-mk-danger border-none bg-transparent cursor-pointer">
                  {T("Clear all", "مسح الكل", ar)}
                </button>
              )}
            </div>

            {diagramView === "photos"
              ? <PhotoManager photos={photos} onChange={setPhotos} ar={ar} />
              : (
                <div>
                  <p className="mk-overline text-mk-ink-400 mb-2">{T("Click on car to add damage point", "اضغط على السيارة لإضافة نقطة ضرر", ar)}</p>
                  <div className="rounded-md">
                    <SketchComponent value={sketchItems} onChange={setSketchItems} ar={ar} />
                  </div>
                  {sketchItems.length > 0 && <p className="mt-1 mk-overline text-mk-ink-500">{sketchItems.length} {T("point(s) recorded", "نقطة مسجلة", ar)}</p>}
                </div>
              )
            }
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { icon: RiyalSymbol, label: T("Daily", "يومي", ar), value: form.dailyRate, color: "var(--color-mk-blue-500)", bg: "var(--color-mk-blue-50)" },
              { icon: Gauge, label: T("Utiliz.", "الاستخدام", ar), value: `${car.utilization}%`, color: "var(--color-mk-violet-500)", bg: "var(--color-mk-violet-100)" },
              { icon: MapPin, label: T("Branch", "الفرع", ar), value: T("Riyadh", "الرياض", ar), color: "var(--color-mk-mint-600)", bg: "var(--color-mk-mint-100)" },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="flex flex-col items-center gap-1 p-4 rounded-md" style={{ background: bg }}>
                <Icon size={18} style={{ color }} />
                <span className="mk-h4 text-mk-ink-900 mt-1">{value}</span>
                <span className="mk-overline text-mk-ink-500 text-center">{label}</span>
              </div>
            ))}
          </div>

          {/* Listing & Features */}
          <div className="rounded-lg p-4 mk-surface mk-shadow-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-mk-blue-50"><Zap size={16} className="text-mk-blue-500" /></div>
              <div className="mk-h4 text-mk-ink-900">{T("Listing & Features", "الإدراج والمميزات", ar)}</div>
            </div>
            <div className="flex flex-col gap-0">
              {([
                { key: "listingActive", en: "Listing active", ar2: "الإدراج نشط" },
                { key: "gpsEnabled", en: "GPS tracking", ar2: "تتبع GPS" },
                { key: "dashcamEnabled", en: "Dashcam installed", ar2: "كاميرا لوحة القيادة" },
                { key: "insuranceAddOn", en: "Insurance add-on", ar2: "تأمين إضافي" },
                { key: "childSeatAvail", en: "Child seat available", ar2: "مقعد أطفال متاح" },
                { key: "unlimitedKm", en: "Unlimited KM", ar2: "كيلومتر غير محدود" },
              ] as { key: keyof VehicleForm; en: string; ar2: string }[]).map(({ key, en, ar2 }) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-mk-ink-50 last:border-0">
                  <span className="mk-caption text-mk-ink-700">{ar ? ar2 : en}</span>
                  <Toggle checked={form[key] as boolean} onChange={v => set(key)(v)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN FLEET LIST PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function CarStatusPage() {
  const { dir } = useAdmin();
  const ar = dir === "rtl";
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedCar, setSelectedCar] = useState<CarType | null>(null);
  const [selectedCarForMap, setSelectedCarForMap] = useState<CarType | null>(null);
  const [showAllGarageMap, setShowAllGarageMap] = useState(false);

  const filtered = CARS.filter(c => {
    const q = search.toLowerCase();
    return (
      (!q || c.make.toLowerCase().includes(q) || c.model.toLowerCase().includes(q) || c.plate.toLowerCase().includes(q)) &&
      (filterStatus === "all" || c.status === filterStatus)
    );
  });

  if (selectedCar) return <CarSettingsPage car={selectedCar} ar={ar} onBack={() => setSelectedCar(null)} onMapClick={() => setSelectedCarForMap(selectedCar)} />;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex-1 min-w-[200px]">
          <Input variant="search" icon={<Search size={14} />}
            placeholder={T("Search make, model, plate…", "بحث عن ماركة، طراز، لوحة…", ar)}
            value={search} onChange={e => setSearch(e.target.value)}
            suffix={search && <IconButton size="sm" variant="ghost" onClick={() => setSearch("")}><X size={13} /></IconButton>} />
        </div>
        <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-full w-auto">
          <option value="all">{T("All status", "كل الحالات", ar)}</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{T(v.en, v.ar, ar)}</option>)}
        </Select>
        <Tabs
          variant="default"
          value={view}
          onChange={(v) => setView(v as typeof view)}
          items={[
            { value: "grid", icon: <LayoutGrid size={15} />, "aria-label": "Grid view" },
            { value: "list", icon: <ListIcon size={15} />, "aria-label": "List view" },
          ]}
        />
        <Button variant="outline" onClick={() => setShowAllGarageMap(true)}>
          <Car size={15} className="text-mk-blue-500" />
          {T("View garage map", "عرض خريطة الكراج", ar)}
        </Button>
        <Button variant="primary" className="shadow-[0_4px_14px_-4px_rgba(65,113,226,0.4)]">
          <Plus size={15} />{T("Add vehicle", "إضافة مركبة", ar)}
        </Button>
      </div>

      {/* Fleet Alert Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-3 p-3 rounded-md border border-mk-warning/20 bg-mk-warning/5 mk-caption text-mk-warning">
          <AlertCircle size={14} className="shrink-0 text-mk-warning" />
          <div className="flex-1">
            <b>{T("Istamara expiring soon", "تجديد الاستمارة مطلوب", ar)}:</b>{" "}
            {T("Nissan Patrol (JKL 3456) in 5 days.", "نيسان باترول (JKL 3456) خلال ٥ أيام.", ar)}
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-md border border-mk-danger/20 bg-mk-danger/5 mk-caption text-mk-danger">
          <AlertCircle size={14} className="shrink-0 text-mk-danger" />
          <div className="flex-1">
            <b>{T("Periodic inspection expired", "الفحص الدوري منتهي", ar)}:</b>{" "}
            {T("Hyundai Elantra (PQR 1357) is overdue.", "هيونداي إلنترا (PQR 1357) متأخر.", ar)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="mk-label text-mk-ink-500">{filtered.length} {T("vehicle", "مركبة", ar)}{filtered.length !== 1 && !ar ? "s" : ""}</span>
      </div>

      {view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(car => <GridCard key={car.id} car={car} ar={ar} onClick={() => setSelectedCar(car)} onMapClick={() => setSelectedCarForMap(car)} />)}
        </div>
      )}
      {view === "list" && (
        <div className="rounded-xl overflow-hidden mk-surface mk-shadow-12">
          <div className="hidden lg:grid items-center px-5 py-3 border-b border-mk-ink-100 bg-mk-ink-50 grid-cols-[72px_1fr_100px_120px_110px_20px]">
            {[T("Photo", "صورة", ar), T("Vehicle", "المركبة", ar), T("Daily Rate", "السعر اليومي", ar), T("Utilization", "الاستخدام", ar), T("Status", "الحالة", ar), ""].map((h, i) => (
              <span key={i} className="mk-overline uppercase text-mk-ink-400 tracking-wider">{h}</span>
            ))}
          </div>
          {filtered.map(car => <ListRow key={car.id} car={car} ar={ar} onClick={() => setSelectedCar(car)} onMapClick={() => setSelectedCarForMap(car)} />)}
          {filtered.length === 0 && (
            <div className="py-16 text-center text-mk-ink-400">
              <Car size={32} className="mx-auto mb-3 opacity-30" />
              <p className="mk-body-sm">{T("No vehicles found", "لا توجد مركبات", ar)}</p>
            </div>
          )}
        </div>
      )}
      {selectedCarForMap && (
        <MapModal
          ar={ar}
          car={selectedCarForMap}
          onClose={() => setSelectedCarForMap(null)}
        />
      )}
      {showAllGarageMap && (
        <MapModal
          ar={ar}
          showAll={true}
          onClose={() => setShowAllGarageMap(false)}
        />
      )}
    </div>
  );
}

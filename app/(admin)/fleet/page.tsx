"use client";

import { useState, useEffect } from "react";
import { CARS, Car, CarStatus, CAR_STATUS_LABEL, CAR_IMAGES } from "@/lib/data";
import { Search, Plus, Wrench, MapPin, Loader2 } from "lucide-react";
import { Badge, Button, RiyalSymbol, Tabs, Input } from "@/components/ui";
import { useAdmin } from "@/contexts/AdminContext";
import { VehicleTypeIcon } from "@/components/employee/VehicleTypeIcon";
import { vehicleService } from "@/lib/api-services";

const T = (en: string, ar: string, isAr: boolean) => (isAr ? ar : en);

const STATUS_BADGE_VARIANT: Record<CarStatus, "success" | "info" | "danger" | "warning" | "violet" | "neutral"> = {
  available: "success",
  rented: "info",
  overdue: "danger",
  maintenance: "warning",
  reserved: "violet",
  inactive: "neutral",
  draft: "neutral",
};

const TYPE_ICON: Record<string, string> = {
  "سيدان": "🚗",
  "SUV": "🚙",
  "MPV": "🚐",
};

export default function FleetPage() {
  const { dir } = useAdmin();
  const ar = dir === "rtl";

  const [tab, setTab] = useState<"all" | CarStatus>("all");
  const [search, setSearch] = useState("");
  const [vehicles, setVehicles] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  // Load vehicles from API
  useEffect(() => {
    loadVehicles();
  }, [tab, search]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const searchRequest: any = {
        pageNumber: 1,
        pageSize: 100,
      };
      if (search) {
        searchRequest.search = search;
      }
      if (tab !== "all") {
        // Map tab status to backend status enum if needed
        const statusMap: Record<CarStatus, number> = {
          available: 1,
          rented: 2,
          overdue: 3,
          maintenance: 4,
          reserved: 5,
          inactive: 6,
          draft: 7,
        };
        searchRequest.status = statusMap[tab];
      }
      const response = await vehicleService.search(searchRequest);
      console.log('Vehicles API response:', response);
      // Transform API response to match Car interface
      // This is a placeholder - actual transformation depends on API response structure
      const transformedVehicles = (response.items || response.data || []).map((item: any) => ({
        id: item.id,
        name: `${item.makeName || ''} ${item.modelName || ''} ${item.year || ''}`.trim(),
        plate: item.plateNumber || '',
        make: item.makeName || '',
        model: item.modelName || '',
        type: item.bodyType || 'Sedan',
        color: item.color || '',
        year: item.year || 2024,
        status: mapStatusFromBackend(item.status),
        customer: item.customerName,
        returnTime: item.returnTime,
        speed: item.speed,
        location: item.location,
        mapX: item.mapX,
        mapY: item.mapY,
        dailyRate: item.dailyRate || 0,
        kmCap: item.kmCap,
        utilization: item.utilization || 0,
        plateNumber: item.plateNumber,
        plateChar1: item.plateChar1,
        plateChar2: item.plateChar2,
        plateChar3: item.plateChar3,
        chassisNumber: item.chassisNumber,
        fuelTypeCode: item.fuelTypeCode,
        extraKmCost: item.extraKmCost,
        fullFuelCost: item.fullFuelCost,
        lateFeePerHour: item.lateFeePerHour,
        enduranceAmount: item.enduranceAmount,
        bodyType: item.bodyType,
        seats: item.seats,
        transmission: item.transmission,
        istamaraNumber: item.istamaraNumber,
        istamaraExpiry: item.istamaraExpiry,
        periodicInspectionExpiry: item.periodicInspectionExpiry,
        insuranceCompany: item.insuranceCompany,
        insurancePolicyNumber: item.insurancePolicyNumber,
        insuranceExpiry: item.insuranceExpiry,
        insuranceType: item.insuranceType,
        registrationTypeCode: item.registrationTypeCode,
        operationCardNumber: item.operationCardNumber,
        operationCardExpiryDate: item.operationCardExpiryDate,
        oilChangeDate: item.oilChangeDate,
        insuranceAmount: item.insuranceAmount,
        otherNotes: item.otherNotes,
      }));
      setVehicles(transformedVehicles);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      // Fallback to mock data on error
      setVehicles(CARS);
    } finally {
      setLoading(false);
    }
  };

  const mapStatusFromBackend = (status: number): CarStatus => {
    const statusMap: Record<number, CarStatus> = {
      1: 'available',
      2: 'rented',
      3: 'overdue',
      4: 'maintenance',
      5: 'reserved',
      6: 'inactive',
      7: 'draft',
    };
    return statusMap[status] || 'available';
  };

  const STATUS_TABS: { key: "all" | CarStatus; labelEn: string; labelAr: string }[] = [
    { key: "all", labelEn: "All", labelAr: "الكل" },
    { key: "available", labelEn: "Available", labelAr: "متاحة" },
    { key: "rented", labelEn: "Rented", labelAr: "مؤجرة" },
    { key: "overdue", labelEn: "Overdue", labelAr: "متأخر" },
    { key: "maintenance", labelEn: "Maintenance", labelAr: "صيانة" },
    { key: "reserved", labelEn: "Reserved", labelAr: "محجوزة" },
  ];

  const STATS = [
    { labelEn: "Available", labelAr: "متاحة", key: "available", cls: "text-mk-mint-600" },
    { labelEn: "Rented", labelAr: "مؤجرة", key: "rented", cls: "text-mk-blue-500" },
    { labelEn: "Overdue", labelAr: "متأخر", key: "overdue", cls: "text-mk-danger" },
    { labelEn: "Maintenance", labelAr: "صيانة", key: "maintenance", cls: "text-mk-warning" },
    { labelEn: "Reserved", labelAr: "محجوزة", key: "reserved", cls: "text-mk-blue-600" },
    { labelEn: "Inactive", labelAr: "معطلة", key: "inactive", cls: "text-mk-ink-400" },
  ];

  const visible = vehicles.filter((c) => {
    const matchTab = tab === "all" || c.status === tab;
    const matchSearch = !search ||
      c.name.includes(search) ||
      c.plate.includes(search) ||
      (c.customer?.includes(search) ?? false);
    return matchTab && matchSearch;
  });

  const counts: Record<string, number> = {
    total: vehicles.length,
    available: vehicles.filter((c) => c.status === "available").length,
    rented: vehicles.filter((c) => c.status === "rented").length,
    overdue: vehicles.filter((c) => c.status === "overdue").length,
    maintenance: vehicles.filter((c) => c.status === "maintenance").length,
    reserved: vehicles.filter((c) => c.status === "reserved").length,
    inactive: vehicles.filter((c) => c.status === "inactive").length,
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATS.map(({ labelEn, labelAr, key, cls }) => (
          <div key={key} className="rounded-md border border-mk-ink-100 p-4 flex flex-col gap-1 mk-surface">
            <span className={`mk-h2 leading-none ${cls}`}>{counts[key]}</span>
            <span className="mk-caption normal-case tracking-normal text-mk-ink-500">{ar ? labelAr : labelEn}</span>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-md border border-mk-ink-100 flex flex-col overflow-hidden mk-surface">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-mk-ink-100 gap-4">
          {/* Status tabs */}
          <Tabs
            variant="default"
            rounded="full"
            className="normal-case tracking-normal"
            value={tab}
            onChange={(v) => setTab(v as typeof tab)}
            items={STATUS_TABS.map((t) => ({
              value: t.key,
              label: (
                <>
                  {ar ? t.labelAr : t.labelEn}
                  {t.key !== "all" && (
                    <span className="ms-1 mk-overline normal-case tracking-normal opacity-80">({counts[t.key] ?? 0})</span>
                  )}
                </>
              ),
            }))}
          />

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="min-w-48">
              <Input
                variant="search"
                icon={<Search size={14} />}
                className="!rounded-sm !bg-mk-ink-50 !border-mk-ink-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={T("Search by name or plate…", "بحث بالاسم أو اللوحة...", ar)}
              />
            </div>
            {/* Add car */}
            <Button variant="primary" size="sm" className="rounded-sm shadow-[var(--shadow-glow-blue)] normal-case tracking-normal">
              <Plus size={14} />
              {T("Add car", "إضافة سيارة", ar)}
            </Button>
          </div>
        </div>

        {/* Grid */}
        <div className="p-4 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12 rounded-xl mk-surface">
              <Loader2 className="animate-spin text-mk-blue-500" size={32} />
            </div>
          ) : visible.length === 0 ? (
            <div className="col-span-full text-center py-12 mk-label text-mk-ink-400">
              {T("No matching cars", "لا توجد سيارات مطابقة", ar)}
            </div>
          ) : (
            visible.map((car) => (
              <CarCard key={car.id} car={car} />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-mk-ink-100 mk-caption text-mk-ink-500">
          <span>
            {T(`Showing ${visible.length} of ${vehicles.length} cars`, `عرض ${visible.length} من ${vehicles.length} سيارة`, ar)}
          </span>
        </div>
      </div>
    </div>
  );
}

function CarCard({ car }: { car: Car }) {
  const { dir } = useAdmin();
  const ar = dir === "rtl";

  const typeIcon = TYPE_ICON[car.type] ?? "🚗";

  const images = CAR_IMAGES[car.model] || [];
  const [index, setIndex] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);
  const [isDragging, setDragging] = useState(false);

  const handleStart = (x: number) => { setStartX(x); setDragging(true); };
  const handleMove = (x: number) => {
    if (!isDragging || startX === null || images.length <= 1) return;
    const diff = startX - x;
    if (diff > 45) { setIndex((p) => (p + 1) % images.length); setDragging(false); setStartX(null); }
    else if (diff < -45) { setIndex((p) => (p - 1 + images.length) % images.length); setDragging(false); setStartX(null); }
  };
  const handleEnd = () => { setDragging(false); setStartX(null); };

  const speedColor = car.speed != null
    ? car.speed > 120 ? "var(--color-mk-danger)"
      : car.speed > 80 ? "var(--color-mk-warning)"
        : "var(--color-mk-mint-600)"
    : undefined;

  return (
    <div className="rounded-md border border-mk-ink-100 flex flex-col overflow-hidden transition-shadow hover:shadow-md bg-white">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-mk-ink-100">
        <div className="flex items-center gap-2">
          <VehicleTypeIcon type={car.type} size={18} className="w-9 h-9" />
          <div>
            <div className="mk-label text-mk-ink-900">{car.name}</div>
            <div className="font-mono mk-overline text-mk-ink-400">{car.plate}</div>
          </div>
        </div>
        <Badge variant={STATUS_BADGE_VARIANT[car.status]} dot>
          {CAR_STATUS_LABEL[car.status]}
        </Badge>
      </div>

      {/* Swipeable carousel */}
      <div
        className="relative w-full overflow-hidden select-none group cursor-grab active:cursor-grabbing"
        style={{
          height: 192,
          background: "linear-gradient(135deg, color-mix(in srgb, var(--color-mk-blue-500) 6%, transparent), color-mix(in srgb, var(--color-mk-violet-500) 6%, transparent)), var(--color-mk-ink-50)",
        }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => { if (isDragging) { e.preventDefault(); handleMove(e.clientX); } }}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
      >
        {images.length > 0 ? (
          images.map((imgUrl, i) => {
            const isFlipped = imgUrl.endsWith("#flipped");
            const src = isFlipped ? imgUrl.replace("#flipped", "") : imgUrl;
            return (
              <img
                key={i}
                src={src}
                alt="Car"
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none"
                style={{ opacity: i === index ? 1 : 0, transform: isFlipped ? "scaleX(-1)" : "none", zIndex: i === index ? 10 : 0 }}
              />
            );
          })
        ) : (
          <div className="w-full h-full flex items-center justify-center mk-overline text-mk-ink-400">
            No Photo
          </div>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full ${idx === index ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        )}

        {images.length > 0 && (
          <span className="absolute bottom-2 start-2 mk-overline px-2 py-1 rounded-xs text-white bg-black/60 z-10">
            {[T("Front", "أمامي", ar), T("Right Side", "جانبي يمين", ar), T("Left Side", "جانبي يسار", ar), T("Back", "خلفي", ar)][index]}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="px-4 py-3 flex flex-col gap-2 flex-1 mk-caption">
        <div className="flex justify-between">
          <span className="text-mk-ink-400">{T("Type", "النوع", ar)}</span>
          <span className="text-mk-ink-700">{typeIcon} {car.type} · {car.year}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-mk-ink-400">{T("Color", "اللون", ar)}</span>
          <span className="text-mk-ink-700">{car.color}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-mk-ink-400">{T("Daily rate", "السعر اليومي", ar)}</span>
          <span className="mk-label text-mk-ink-900 flex items-center gap-1">
            <RiyalSymbol size={12} className="text-mk-ink-900" />
            <span>{car.dailyRate}</span>
          </span>
        </div>
        {car.customer && (
          <div className="flex justify-between">
            <span className="text-mk-ink-400">{T("Customer", "العميل", ar)}</span>
            <span className="mk-label text-mk-ink-900">{car.customer}</span>
          </div>
        )}
        {car.returnTime && (
          <div className="flex justify-between">
            <span className="text-mk-ink-400">{T("Return", "الإرجاع", ar)}</span>
            <span className={`mk-label ${car.status === "overdue" ? "text-mk-danger" : "text-mk-ink-900"}`}>
              ⏰ {car.returnTime}
            </span>
          </div>
        )}
        {car.speed != null && (
          <div className="flex items-center justify-between">
            <span className="text-mk-ink-400">{T("Speed", "السرعة", ar)}</span>
            <div className="flex items-center gap-2">
              <div className="w-13 h-1 rounded-full overflow-hidden bg-mk-ink-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(Math.round((car.speed / 140) * 100), 100)}%`,
                    background: speedColor,
                  }}
                />
              </div>
              <span className="text-mk-ink-700">{car.speed} {T("km/h", "كم/س", ar)}</span>
            </div>
          </div>
        )}
        {car.location && (
          <div className="flex items-center justify-between">
            <span className="text-mk-ink-400">{T("Location", "الموقع", ar)}</span>
            <span className="flex items-center gap-1 text-mk-ink-700">
              <MapPin size={11} />
              {car.location}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 py-3 border-t border-mk-ink-100">
        {car.status === "available" ? (
          <Button variant="primary" size="sm" className="flex-1 justify-center">
            {T("Quick book", "حجز سريع", ar)}
          </Button>
        ) : car.status === "overdue" ? (
          <Button variant="danger" size="sm" className="flex-1 justify-center">
            {T("Notify customer", "إشعار عميل", ar)}
          </Button>
        ) : car.status === "maintenance" ? (
          <Button variant="outline" size="sm" className="flex-1 justify-center text-mk-warning border-mk-warning/30 hover:bg-mk-warning/8">
            {T("Update status", "تحديث الحالة", ar)}
          </Button>
        ) : (
          <Button variant="secondary" size="sm" className="flex-1 justify-center">
            {T("View details", "عرض التفاصيل", ar)}
          </Button>
        )}
        <Button variant="outline" size="sm" title={T("Maintenance", "صيانة", ar)}>
          <Wrench size={13} className="text-mk-ink-400" />
        </Button>
      </div>
    </div>
  );
}

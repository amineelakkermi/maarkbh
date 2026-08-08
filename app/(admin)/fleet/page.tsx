"use client";

import { useState, useEffect } from "react";
import { CARS, Car, CarStatus, CAR_STATUS_LABEL, CAR_IMAGES } from "@/lib/data";
import { Search, Plus, Wrench, MapPin, Loader2, Edit, Trash2 } from "lucide-react";
import { Badge, Button, RiyalSymbol, Tabs, Input, Select, Drawer, DrawerHeader, DrawerFooter, useToast } from "@/components/ui";
import { useAdmin } from "@/contexts/AdminContext";
import { VehicleTypeIcon } from "@/components/employee/VehicleTypeIcon";
import * as Types from "@/lib/api-types";
import {
  vehicleService,
  vehicleMakeService,
  vehicleModelService,
  branchService,
  plateTypeService,
  insuranceCompanyService,
  insuranceTypeService,
} from "@/lib/api-services";

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

function emptyVehicleForm() {
  return {
    plateTypeId: '', plateNumber: '', plateFirstLetter: '', plateSecondLetter: '', plateThirdLetter: '',
    registrationNumber: '', registrationExpiryDate: '', inspectionExpiryDate: '', serialNumber: '',
    makeId: '', modelId: '', year: '', color: '', vin: '', engineNumber: '',
    bodyType: '', category: '', seats: '', cylinders: '', fuelType: '', transmissionType: '',
    branchId: '', insuranceCompanyId: '', insuranceTypeId: '', insurancePolicyNumber: '', insuranceExpiryDate: '',
    insuranceAmount: '', dailyRate: '', extraKilometerRate: '', fullFuelRate: '', lateHourRate: '',
    isKilometerLimitEnabled: false, dailyKilometerLimit: '',
  };
}

export default function FleetPage() {
  const { dir } = useAdmin();
  const ar = dir === "rtl";

  const [tab, setTab] = useState<"all" | CarStatus>("all");
  const [search, setSearch] = useState("");
  const [vehicles, setVehicles] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Lookups for the vehicle form
  const [makes, setMakes] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [plateTypes, setPlateTypes] = useState<any[]>([]);
  const [insuranceCompanies, setInsuranceCompanies] = useState<any[]>([]);
  const [insuranceTypes, setInsuranceTypes] = useState<any[]>([]);

  // Vehicle form drawer
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(emptyVehicleForm());

  // Load vehicles from API
  useEffect(() => {
    loadVehicles();
  }, [tab, search]);

  useEffect(() => {
    loadLookups();
  }, []);

  const loadLookups = async () => {
    try {
      const [makesRes, branchesRes, plateTypesRes, insuranceCompaniesRes, insuranceTypesRes] = await Promise.all([
        vehicleMakeService.search({ pageNumber: 1, pageSize: 100 }),
        branchService.search({ pageNumber: 1, pageSize: 100 }),
        plateTypeService.search({ pageNumber: 1, pageSize: 100 }),
        insuranceCompanyService.search({ pageNumber: 1, pageSize: 100 }),
        insuranceTypeService.search({ pageNumber: 1, pageSize: 100 }),
      ]);
      setMakes(makesRes.items || makesRes.data || []);
      setBranches(branchesRes.items || branchesRes.data || []);
      setPlateTypes(plateTypesRes.items || plateTypesRes.data || []);
      setInsuranceCompanies(insuranceCompaniesRes.items || insuranceCompaniesRes.data || []);
      setInsuranceTypes(insuranceTypesRes.items || insuranceTypesRes.data || []);
    } catch (error) {
      console.error('Error loading vehicle lookups:', error);
    }
  };

  // Load models whenever the selected make changes
  useEffect(() => {
    if (!form.makeId) {
      setModels([]);
      return;
    }
    vehicleModelService.search({ parentId: Number(form.makeId), pageNumber: 1, pageSize: 100 } as any)
      .then((res: any) => setModels(res.items || res.data || []))
      .catch((error: any) => console.error('Error loading vehicle models:', error));
  }, [form.makeId]);

  const resetForm = () => setForm(emptyVehicleForm());

  const handleAddVehicle = () => {
    setEditingVehicleId(null);
    resetForm();
    setDrawerOpen(true);
  };

  const handleEditVehicle = async (car: Car) => {
    setEditingVehicleId(car.id);
    setDrawerOpen(true);
    try {
      const v = await vehicleService.getById(car.id);
      setForm({
        plateTypeId: v.plate?.plateTypeId ?? '',
        plateNumber: v.plate?.plateNumber ?? '',
        plateFirstLetter: v.plate?.plateFirstLetter ?? '',
        plateSecondLetter: v.plate?.plateSecondLetter ?? '',
        plateThirdLetter: v.plate?.plateThirdLetter ?? '',
        registrationNumber: v.plate?.registrationNumber ?? '',
        registrationExpiryDate: v.plate?.registrationExpiryDate?.slice(0, 10) ?? '',
        inspectionExpiryDate: v.plate?.inspectionExpiryDate?.slice(0, 10) ?? '',
        serialNumber: v.plate?.serialNumber ?? '',
        makeId: v.info?.makeId ?? '',
        modelId: v.info?.modelId ?? '',
        year: v.info?.year ?? '',
        color: v.info?.color ?? '',
        vin: v.info?.vin ?? '',
        engineNumber: v.info?.engineNumber ?? '',
        bodyType: v.info?.bodyType ?? '',
        category: v.info?.category ?? '',
        seats: v.info?.seats ?? '',
        cylinders: v.info?.cylinders ?? '',
        fuelType: v.info?.fuelType ?? '',
        transmissionType: v.info?.transmissionType ?? '',
        branchId: v.insurancePricing?.branchId ?? '',
        insuranceCompanyId: v.insurancePricing?.insuranceCompanyId ?? '',
        insuranceTypeId: v.insurancePricing?.insuranceTypeId ?? '',
        insurancePolicyNumber: v.insurancePricing?.insurancePolicyNumber ?? '',
        insuranceExpiryDate: v.insurancePricing?.insuranceExpiryDate?.slice(0, 10) ?? '',
        insuranceAmount: v.insurancePricing?.insuranceAmount ?? '',
        dailyRate: v.insurancePricing?.dailyRate ?? '',
        extraKilometerRate: v.insurancePricing?.extraKilometerRate ?? '',
        fullFuelRate: v.insurancePricing?.fullFuelRate ?? '',
        lateHourRate: v.insurancePricing?.lateHourRate ?? '',
        isKilometerLimitEnabled: v.insurancePricing?.isKilometerLimitEnabled ?? false,
        dailyKilometerLimit: v.insurancePricing?.dailyKilometerLimit ?? '',
      });
    } catch (error) {
      console.error('Error loading vehicle details:', error);
      showToast(T('Failed to load vehicle details', 'فشل تحميل تفاصيل السيارة', ar));
    }
  };

  const buildVehiclePayload = () => ({
    plate: {
      plateTypeId: form.plateTypeId ? Number(form.plateTypeId) : undefined,
      plateNumber: form.plateNumber || undefined,
      plateFirstLetter: form.plateFirstLetter || '',
      plateSecondLetter: form.plateSecondLetter || '',
      plateThirdLetter: form.plateThirdLetter || '',
      registrationNumber: form.registrationNumber || undefined,
      registrationExpiryDate: form.registrationExpiryDate || undefined,
      inspectionExpiryDate: form.inspectionExpiryDate || undefined,
      serialNumber: form.serialNumber || undefined,
    },
    info: {
      makeId: Number(form.makeId),
      modelId: Number(form.modelId),
      year: Number(form.year),
      color: form.color || undefined,
      vin: form.vin || undefined,
      engineNumber: form.engineNumber || undefined,
      bodyType: form.bodyType ? Number(form.bodyType) : undefined,
      category: form.category ? Number(form.category) : undefined,
      seats: form.seats ? Number(form.seats) : undefined,
      cylinders: form.cylinders ? Number(form.cylinders) : undefined,
      fuelType: form.fuelType ? Number(form.fuelType) : undefined,
      transmissionType: form.transmissionType ? Number(form.transmissionType) : undefined,
    },
    insurancePricing: {
      branchId: form.branchId ? Number(form.branchId) : undefined,
      insuranceCompanyId: form.insuranceCompanyId ? Number(form.insuranceCompanyId) : undefined,
      insuranceTypeId: form.insuranceTypeId ? Number(form.insuranceTypeId) : undefined,
      insurancePolicyNumber: form.insurancePolicyNumber || undefined,
      insuranceExpiryDate: form.insuranceExpiryDate || undefined,
      insuranceAmount: form.insuranceAmount ? Number(form.insuranceAmount) : undefined,
      dailyRate: form.dailyRate ? Number(form.dailyRate) : undefined,
      extraKilometerRate: form.extraKilometerRate ? Number(form.extraKilometerRate) : undefined,
      fullFuelRate: form.fullFuelRate ? Number(form.fullFuelRate) : undefined,
      lateHourRate: form.lateHourRate ? Number(form.lateHourRate) : undefined,
      isKilometerLimitEnabled: !!form.isKilometerLimitEnabled,
      dailyKilometerLimit: form.dailyKilometerLimit ? Number(form.dailyKilometerLimit) : undefined,
    },
    // Backend requires these fields to be present (non-nullable collections/object)
    tajeerStatus: {
      status: Types.VehicleFleetStatus.Available,
      notes: '',
      isListingActive: true,
      odometerReading: 0,
      fuelLevel: Types.FuelLevel.Full,
      enduranceAmount: 0,
      oilType: Types.VehicleOilType.Synthetic,
      lastOilChangeDate: new Date().toISOString(),
      oilChangeDistance: 0,
      airConditionGrade: Types.ConditionGrade.Good,
      radioStatus: Types.WorkingStatus.Working,
      screenStatus: Types.WorkingStatus.Working,
      odometerStatus: Types.WorkingStatus.Working,
      seatCleanliness: Types.CleanlinessStatus.Clean,
      keyStatus: Types.WorkingStatus.Working,
      tireCondition: Types.TireCondition.Good,
      spareTireStatus: Types.PresenceStatus.Available,
      fireExtinguisherStatus: Types.PresenceStatus.Available,
      firstAidKitStatus: Types.PresenceStatus.Available,
      safetyTriangleStatus: Types.PresenceStatus.Available,
      tireToolsStatus: Types.PresenceStatus.Available,
    },
    featureTypeIds: [] as number[],
    images: [] as any[],
    damagePoints: [] as any[],
  });

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.makeId || !form.modelId || !form.year) {
      showToast(T('Please fill make, model and year', 'الرجاء تعبئة الصانع والموديل والسنة', ar));
      return;
    }

    setSaving(true);
    try {
      const payload = buildVehiclePayload();
      if (editingVehicleId) {
        await vehicleService.update(editingVehicleId, payload);
        showToast(T('🟢 Vehicle updated successfully!', '🟢 تم تحديث السيارة بنجاح!', ar));
      } else {
        await vehicleService.create(payload);
        showToast(T('🟢 Vehicle created successfully!', '🟢 تم إضافة السيارة بنجاح!', ar));
      }
      setDrawerOpen(false);
      setEditingVehicleId(null);
      resetForm();
      await loadVehicles();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      showToast(T('Failed to save vehicle', 'فشل حفظ السيارة', ar));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVehicle = async (car: Car) => {
    try {
      await vehicleService.delete(car.id);
      showToast(T('🗑️ Vehicle deleted', '🗑️ تم حذف السيارة', ar));
      await loadVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showToast(T('Failed to delete vehicle', 'فشل حذف السيارة', ar));
    }
  };

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
            <Button variant="primary" size="sm" className="rounded-sm shadow-[var(--shadow-glow-blue)] normal-case tracking-normal" onClick={handleAddVehicle}>
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
              <CarCard key={car.id} car={car} onEdit={handleEditVehicle} onDelete={handleDeleteVehicle} />
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

      {/* Vehicle Create/Edit Drawer */}
      <Drawer open={isDrawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className="flex flex-col gap-5 justify-between h-full max-w-[560px]">
          <div className="overflow-y-auto">
            <DrawerHeader
              title={editingVehicleId ? T("Edit Vehicle", "تعديل السيارة", ar) : T("Add Vehicle", "إضافة سيارة", ar)}
              onClose={() => setDrawerOpen(false)}
              className="mb-0 pb-4 border-b border-mk-ink-100"
            />

            <form onSubmit={handleSaveVehicle} className="flex flex-col gap-4 mt-5">
              <div className="mk-body-sm text-mk-fg-1">{T("Vehicle Info", "معلومات السيارة", ar)}</div>
              <div className="grid grid-cols-2 gap-3">
                <Select label={T("Make *", "الصانع *", ar)} value={form.makeId} onChange={(e) => setForm((f: any) => ({ ...f, makeId: e.target.value, modelId: '' }))}>
                  <option value="">{T("Select make", "اختر الصانع", ar)}</option>
                  {makes.map((m) => (
                    <option key={m.id} value={m.id}>{ar ? (m.nameAr || m.name) : (m.nameEn || m.name)}</option>
                  ))}
                </Select>
                <Select label={T("Model *", "الموديل *", ar)} value={form.modelId} onChange={(e) => setForm((f: any) => ({ ...f, modelId: e.target.value }))} disabled={!form.makeId}>
                  <option value="">{T("Select model", "اختر الموديل", ar)}</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>{ar ? (m.nameAr || m.name) : (m.nameEn || m.name)}</option>
                  ))}
                </Select>
                <Input label={T("Year *", "سنة الصنع *", ar)} type="number" value={form.year} onChange={(e) => setForm((f: any) => ({ ...f, year: e.target.value }))} />
                <Input label={T("Color", "اللون", ar)} value={form.color} onChange={(e) => setForm((f: any) => ({ ...f, color: e.target.value }))} />
                <Input label={T("VIN", "رقم الهيكل", ar)} value={form.vin} onChange={(e) => setForm((f: any) => ({ ...f, vin: e.target.value }))} />
                <Input label={T("Engine number", "رقم المحرك", ar)} value={form.engineNumber} onChange={(e) => setForm((f: any) => ({ ...f, engineNumber: e.target.value }))} />
                <Input label={T("Seats", "عدد المقاعد", ar)} type="number" value={form.seats} onChange={(e) => setForm((f: any) => ({ ...f, seats: e.target.value }))} />
                <Input label={T("Cylinders", "عدد السلندرات", ar)} type="number" value={form.cylinders} onChange={(e) => setForm((f: any) => ({ ...f, cylinders: e.target.value }))} />
              </div>

              <div className="mk-body-sm text-mk-fg-1 mt-2">{T("Plate & Documents", "اللوحة والوثائق", ar)}</div>
              <div className="grid grid-cols-2 gap-3">
                <Select label={T("Plate type", "نوع اللوحة", ar)} value={form.plateTypeId} onChange={(e) => setForm((f: any) => ({ ...f, plateTypeId: e.target.value }))}>
                  <option value="">{T("Select plate type", "اختر نوع اللوحة", ar)}</option>
                  {plateTypes.map((p) => (
                    <option key={p.id} value={p.id}>{ar ? (p.nameAr || p.name) : (p.nameEn || p.name)}</option>
                  ))}
                </Select>
                <Input label={T("Plate number", "رقم اللوحة", ar)} value={form.plateNumber} onChange={(e) => setForm((f: any) => ({ ...f, plateNumber: e.target.value }))} />
                <Input label={T("Plate letters", "حروف اللوحة", ar)} placeholder="A B J" value={[form.plateFirstLetter, form.plateSecondLetter, form.plateThirdLetter].filter(Boolean).join(' ')}
                  onChange={(e) => {
                    const [a1, a2, a3] = e.target.value.trim().split(/\s+/);
                    setForm((f: any) => ({ ...f, plateFirstLetter: a1 || '', plateSecondLetter: a2 || '', plateThirdLetter: a3 || '' }));
                  }}
                />
                <Input label={T("Registration number", "رقم الاستمارة", ar)} value={form.registrationNumber} onChange={(e) => setForm((f: any) => ({ ...f, registrationNumber: e.target.value }))} />
                <Input label={T("Registration expiry", "انتهاء الاستمارة", ar)} type="date" value={form.registrationExpiryDate} onChange={(e) => setForm((f: any) => ({ ...f, registrationExpiryDate: e.target.value }))} />
                <Input label={T("Inspection expiry", "انتهاء الفحص", ar)} type="date" value={form.inspectionExpiryDate} onChange={(e) => setForm((f: any) => ({ ...f, inspectionExpiryDate: e.target.value }))} />
              </div>

              <div className="mk-body-sm text-mk-fg-1 mt-2">{T("Insurance & Pricing", "التأمين والتسعير", ar)}</div>
              <div className="grid grid-cols-2 gap-3">
                <Select label={T("Branch", "الفرع", ar)} value={form.branchId} onChange={(e) => setForm((f: any) => ({ ...f, branchId: e.target.value }))}>
                  <option value="">{T("Select branch", "اختر الفرع", ar)}</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{ar ? (b.nameAr || b.name) : (b.nameEn || b.name)}</option>
                  ))}
                </Select>
                <Select label={T("Insurance company", "شركة التأمين", ar)} value={form.insuranceCompanyId} onChange={(e) => setForm((f: any) => ({ ...f, insuranceCompanyId: e.target.value }))}>
                  <option value="">{T("Select company", "اختر الشركة", ar)}</option>
                  {insuranceCompanies.map((c) => (
                    <option key={c.id} value={c.id}>{ar ? (c.nameAr || c.name) : (c.nameEn || c.name)}</option>
                  ))}
                </Select>
                <Select label={T("Insurance type", "نوع التأمين", ar)} value={form.insuranceTypeId} onChange={(e) => setForm((f: any) => ({ ...f, insuranceTypeId: e.target.value }))}>
                  <option value="">{T("Select type", "اختر النوع", ar)}</option>
                  {insuranceTypes.map((t) => (
                    <option key={t.id} value={t.id}>{ar ? (t.nameAr || t.name) : (t.nameEn || t.name)}</option>
                  ))}
                </Select>
                <Input label={T("Policy number", "رقم الوثيقة", ar)} value={form.insurancePolicyNumber} onChange={(e) => setForm((f: any) => ({ ...f, insurancePolicyNumber: e.target.value }))} />
                <Input label={T("Insurance expiry", "انتهاء التأمين", ar)} type="date" value={form.insuranceExpiryDate} onChange={(e) => setForm((f: any) => ({ ...f, insuranceExpiryDate: e.target.value }))} />
                <Input label={T("Insurance amount", "قيمة التأمين", ar)} type="number" value={form.insuranceAmount} onChange={(e) => setForm((f: any) => ({ ...f, insuranceAmount: e.target.value }))} />
                <Input label={T("Daily rate *", "السعر اليومي *", ar)} type="number" value={form.dailyRate} onChange={(e) => setForm((f: any) => ({ ...f, dailyRate: e.target.value }))} />
                <Input label={T("Extra km rate", "سعر الكيلومتر الإضافي", ar)} type="number" value={form.extraKilometerRate} onChange={(e) => setForm((f: any) => ({ ...f, extraKilometerRate: e.target.value }))} />
                <Input label={T("Full fuel rate", "سعر تعبئة الوقود", ar)} type="number" value={form.fullFuelRate} onChange={(e) => setForm((f: any) => ({ ...f, fullFuelRate: e.target.value }))} />
                <Input label={T("Late hour rate", "سعر ساعة التأخير", ar)} type="number" value={form.lateHourRate} onChange={(e) => setForm((f: any) => ({ ...f, lateHourRate: e.target.value }))} />
              </div>
            </form>
          </div>

          <DrawerFooter className="mt-0 pt-4 border-t border-mk-ink-100 justify-stretch">
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>
              {T("Cancel", "إلغاء", ar)}
            </Button>
            <Button variant="primary" onClick={handleSaveVehicle} disabled={saving} className="flex-1 shadow-[var(--shadow-glow-blue)]">
              {saving ? <Loader2 className="animate-spin" size={14} /> : (editingVehicleId ? T("✓ Update", "✓ تحديث", ar) : T("✓ Add", "✓ إضافة", ar))}
            </Button>
          </DrawerFooter>
        </div>
      </Drawer>
    </div>
  );
}

function CarCard({ car, onEdit, onDelete }: { car: Car; onEdit: (car: Car) => void; onDelete: (car: Car) => void }) {
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
        <Button variant="outline" size="sm" title={T("Edit", "تعديل", ar)} onClick={() => onEdit(car)}>
          <Edit size={13} className="text-mk-ink-400" />
        </Button>
        <Button variant="outline" size="sm" title={T("Delete", "حذف", ar)} onClick={() => onDelete(car)}>
          <Trash2 size={13} className="text-mk-danger" />
        </Button>
      </div>
    </div>
  );
}

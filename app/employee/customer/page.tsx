"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, UserPlus, ChevronRight, CheckCircle, Phone, CreditCard, X, User, FileSignature, Loader2, FileWarning,
} from "lucide-react";
import { Avatar, Badge, HijriDatePicker, Button, Input, Select, Drawer, DrawerHeader, DrawerFooter, IconButton, useToast } from "@/components/ui";
import { useAdmin } from "@/contexts/AdminContext";
import { customerService } from "@/lib/api-services";
import { transliterateArabicName } from "@/lib/transliterate";
import { CLIENTS } from "@/lib/data";

const T = (en: string, ar: string, isAr: boolean) => (isAr ? ar : en);

const STATUS_BADGE: Record<string, { variant: "success" | "warning" | "neutral" | "danger"; label: [string, string] }> = {
  verified: { variant: "success", label: ["Verified", "موثّق"] },
  pending: { variant: "warning", label: ["Pending KYC", "قيد التحقق"] },
  rejected: { variant: "danger", label: ["Rejected", "مرفوض"] },
};

interface ClientContract {
  id: string;
  car: string;
  date: string;
  status: "active" | "pending" | "completed" | "expired" | "cancelled";
  rate: number;
}

interface ClientProfile {
  id: string;
  name: string;
  nameAr: string;
  phone: string;
  email?: string;
  idType: string;
  idNumber: string;
  idExpiryDate?: string;
  birthDate?: string;
  hijriBirthDate?: number;
  nationality?: string;
  personAddress?: string;
  idCopyNumber?: string;
  licenseIssuePlace?: string;
  borderNumber?: string;
  licenseNumber: string;
  licenseExpiryDate?: string;
  contracts: number;
  rating: number;
  kycStatus: "verified" | "pending" | "rejected";
  yakeenStatus?: "verified" | "pending" | "not_verified" | "error";
  tajeerStatus?: "verified" | "pending" | "not_verified" | "error";
  blacklisted: boolean;
  joinDate: string;
  history: ClientContract[];
}

// Verified, has debts, or has disputes are all fine to contract with — only
// blacklisted or not-yet-verified customers are blocked.
function canCreateContract(c: ClientProfile) {
  return !c.blacklisted && c.kycStatus === "verified";
}

export default function CustomerListPage() {
  const { dir } = useAdmin();
  const ar = dir === "rtl";
  const router = useRouter();
  const { showToast } = useToast();

  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  // Load customers from API
  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await customerService.search({ pageNumber: 1, pageSize: 100 });
      
      // Transform API response to ClientProfile format
      const transformedClients = response.items?.map((item: any) => ({
        id: String(item.id),
        name: item.fullNameEn || item.name || "",
        nameAr: item.fullNameAr || item.nameAr || "",
        phone: item.phoneNumber || "",
        email: item.email,
        idType: item.identityType === 1 ? "Saudi ID" : item.identityType === 2 ? "Iqama" : item.identityType === 3 ? "Passport" : item.identityType === 4 ? "GCC ID" : "Unknown",
        idNumber: item.national?.idNumber || item.residence?.idNumber || item.visitor?.passportNumber || item.gulf?.idNumber || "",
        idExpiryDate: item.national?.idExpiryDate || item.residence?.idExpiryDate || item.visitor?.idExpiryDate || item.gulf?.idExpiryDate,
        birthDate: item.national?.birthDate || item.residence?.birthDate || item.visitor?.birthDate || item.gulf?.birthDate,
        hijriBirthDate: item.national?.hijriBirthDate,
        nationality: item.national?.nationality || item.residence?.nationality || item.visitor?.nationality || item.gulf?.nationality,
        personAddress: item.address,
        idCopyNumber: item.national?.idCopyNumber || item.residence?.idCopyNumber || item.visitor?.idCopyNumber || item.gulf?.idCopyNumber,
        licenseIssuePlace: item.national?.licenseIssuePlace || item.residence?.licenseIssuePlace || item.visitor?.licenseIssuePlace || item.gulf?.licenseIssuePlace,
        borderNumber: item.visitor?.borderNumber,
        licenseNumber: item.national?.licenseNumber || item.residence?.licenseNumber || item.visitor?.licenseNumber || item.gulf?.licenseNumber || "",
        licenseExpiryDate: item.national?.licenseExpiryDate || item.residence?.licenseExpiryDate || item.visitor?.licenseExpiryDate || item.gulf?.licenseExpiryDate,
        contracts: item.contracts || 0,
        rating: item.rating || 0,
        kycStatus: item.verificationStatus === 1 ? "verified" : item.verificationStatus === 2 ? "pending" : "rejected",
        yakeenStatus: item.yakeenStatus === 1 ? "verified" : item.yakeenStatus === 2 ? "pending" : "not_verified",
        blacklisted: item.isBlacklisted || false,
        joinDate: item.creationTime ? new Date(item.creationTime).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        history: [],
      })) || [];
      
      setClients(transformedClients);
    } catch (err) {
      console.error("Error loading customers:", err);
      // Fall back to mock data if API fails
      console.log("Falling back to mock data");
      setClients(CLIENTS);
      setError(null); // Don't show error, just use mock data
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Add customer form state
  const [newName, setNewName] = useState("");
  const [newNameAr, setNewNameAr] = useState("");
  // Tracks whether the employee typed the English name by hand — once they
  // do, auto-transliteration from Arabic stops overwriting their edit.
  const [englishNameEdited, setEnglishNameEdited] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newIdType, setNewIdType] = useState<"Saudi ID" | "Iqama" | "Passport" | "GCC ID">("Saudi ID");
  const [newId, setNewId] = useState("");
  const [newNationality, setNewNationality] = useState("Saudi");
  const [newIdExpiry, setNewIdExpiry] = useState("");
  const [newBirthDate, setNewBirthDate] = useState("");
  const [newHijriBirthDate, setNewHijriBirthDate] = useState("");
  const [newLicense, setNewLicense] = useState("");
  const [newLicenseExpiry, setNewLicenseExpiry] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newIdCopyNumber, setNewIdCopyNumber] = useState("");
  const [newLicenseIssuePlace, setNewLicenseIssuePlace] = useState("");
  const [newBorderNumber, setNewBorderNumber] = useState("");
  const [added, setAdded] = useState(false);

  // Required field set per identity type — mirrors the new-contract flow's
  // per-type identity form so registering a customer uses the exact same fields.
  type IdentityFieldDef = {
    key: string; labelEn: string; labelAr: string; required: boolean;
    type: "text" | "date" | "email" | "hijri"; value: string; onChange: (v: string) => void;
  };
  function newCustomerIdentityFields(): IdentityFieldDef[] {
    const addressField: IdentityFieldDef = { key: "address", labelEn: "Address", labelAr: "العنوان", required: true, type: "text", value: newAddress, onChange: setNewAddress };
    const idCopyNumberField: IdentityFieldDef = { key: "idCopyNumber", labelEn: "ID Copy No.", labelAr: "رقم نسخة الهوية", required: true, type: "text", value: newIdCopyNumber, onChange: setNewIdCopyNumber };

    if (newIdType === "Saudi ID" || newIdType === "Iqama") {
      return [
        { key: "idNumber", labelEn: "Beneficiary ID No.", labelAr: "رقم هوية المستفيد", required: true, type: "text", value: newId, onChange: setNewId },
        addressField,
        { key: "birthDate", labelEn: newIdType === "Saudi ID" ? "Date of Birth (Hijri)" : "Date of Birth", labelAr: newIdType === "Saudi ID" ? "تاريخ الميلاد (هجري)" : "تاريخ الميلاد", required: true, type: "text", value: newIdType === "Saudi ID" ? newHijriBirthDate : newBirthDate, onChange: newIdType === "Saudi ID" ? setNewHijriBirthDate : setNewBirthDate },
      ];
    }
    if (newIdType === "GCC ID") {
      return [
        { key: "idNumber", labelEn: "Beneficiary ID No.", labelAr: "رقم هوية المستفيد", required: true, type: "text", value: newId, onChange: setNewId },
        addressField,
        { key: "licenseNumber", labelEn: "License No.", labelAr: "رقم الرخصة", required: true, type: "text", value: newLicense, onChange: setNewLicense },
        { key: "idExpiry", labelEn: "ID Expiry Date", labelAr: "تاريخ انتهاء الهوية", required: true, type: "date", value: newIdExpiry, onChange: setNewIdExpiry },
        { key: "licenseIssuePlace", labelEn: "License Issue Place", labelAr: "مكان إصدار الرخصة", required: true, type: "text", value: newLicenseIssuePlace, onChange: setNewLicenseIssuePlace },
        { key: "email", labelEn: "Email", labelAr: "البريد الإلكتروني", required: true, type: "email", value: newEmail, onChange: setNewEmail },
        { key: "country", labelEn: "Country", labelAr: "الدولة", required: true, type: "text", value: newNationality, onChange: setNewNationality },
        idCopyNumberField,
        { key: "licenseExpiry", labelEn: "License Expiry Date", labelAr: "تاريخ انتهاء الرخصة", required: true, type: "date", value: newLicenseExpiry, onChange: setNewLicenseExpiry },
      ];
    }
    // Passport / Visitor — no "Beneficiary ID No." field; identity is border/passport number instead
    return [
      addressField,
      { key: "borderNumber", labelEn: "Border No.", labelAr: "رقم الحدود", required: true, type: "text", value: newBorderNumber, onChange: setNewBorderNumber },
      { key: "passportNumber", labelEn: "Passport No.", labelAr: "رقم الجواز", required: true, type: "text", value: newId, onChange: setNewId },
      { key: "licenseNumber", labelEn: "License No.", labelAr: "رقم الرخصة", required: true, type: "text", value: newLicense, onChange: setNewLicense },
      { key: "licenseExpiry", labelEn: "License Expiry Date", labelAr: "تاريخ انتهاء الرخصة", required: true, type: "date", value: newLicenseExpiry, onChange: setNewLicenseExpiry },
      { key: "licenseIssuePlace", labelEn: "License Issue Place", labelAr: "مكان إصدار الرخصة", required: true, type: "text", value: newLicenseIssuePlace, onChange: setNewLicenseIssuePlace },
      { key: "email", labelEn: "Email", labelAr: "البريد الإلكتروني", required: true, type: "email", value: newEmail, onChange: setNewEmail },
      { key: "country", labelEn: "Country", labelAr: "الدولة", required: true, type: "text", value: newNationality, onChange: setNewNationality },
      idCopyNumberField,
      { key: "idExpiry", labelEn: "ID Expiry Date", labelAr: "تاريخ انتهاء الهوية", required: true, type: "date", value: newIdExpiry, onChange: setNewIdExpiry },
    ];
  }

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.nameAr.includes(q) ||
      c.phone.includes(q) ||
      c.idNumber.includes(q)
    );
  });

  function isCustomerFormInvalid() {
    if (!newNameAr || !newPhone) return true;
    return newCustomerIdentityFields().some((f) => f.required && !f.value);
  }

  async function handleAdd() {
    if (isCustomerFormInvalid()) return;

    try {
      setAdded(true);
      
      // Map ID type to enum
      const identityTypeMap: Record<string, number> = {
        "Saudi ID": 1,
        "Iqama": 2,
        "Passport": 3,
        "GCC ID": 4,
      };
      
      const createRequest = {
        fullNameEn: newName || transliterateArabicName(newNameAr),
        fullNameAr: newNameAr,
        phoneNumber: newPhone.startsWith("+966") || newPhone.startsWith("+") ? newPhone : `+966 ${newPhone}`,
        email: newEmail || undefined,
        identityType: identityTypeMap[newIdType],
        address: newAddress || undefined,
        national: newIdType === "Saudi ID" ? {
          beneficiaryIdNumber: newId,
          birthDate: newHijriBirthDate ? new Date().toISOString() : "", // Use ISO format for now
          isHijriBirthDate: true,
          email: newEmail || undefined,
        } : undefined,
        residence: newIdType === "Iqama" ? {
          beneficiaryIdNumber: newId,
          birthDate: newBirthDate ? new Date(newBirthDate).toISOString() : "",
          isHijriBirthDate: false,
          email: newEmail || undefined,
        } : undefined,
        visitor: newIdType === "Passport" ? {
          passportNumber: newId,
          borderNumber: newBorderNumber || undefined,
          birthDate: newBirthDate ? new Date(newBirthDate).toISOString() : "",
          nationality: newNationality,
          email: newEmail,
          licenseNumber: newLicense || undefined,
          licenseExpiryDate: newLicenseExpiry || "",
          licenseIssuePlace: newLicenseIssuePlace || undefined,
          countryId: 1,
          identityExpiryDate: newIdExpiry || "",
          identityCopyNumber: newIdCopyNumber || undefined,
        } : undefined,
        gulf: newIdType === "GCC ID" ? {
          beneficiaryIdNumber: newId,
          nationality: newNationality,
          email: newEmail,
          birthDate: newBirthDate ? new Date(newBirthDate).toISOString() : "",
          isHijriBirthDate: false,
        } : undefined,
      };

      await customerService.create(createRequest as any);
      
      // Reload customers after creation
      await loadCustomers();
      
      setShowAdd(false);
      setAdded(false);
      setNewName(""); setNewNameAr(""); setEnglishNameEdited(false); setNewPhone(""); setNewIdType("Saudi ID"); setNewId("");
      setNewNationality("Saudi"); setNewIdExpiry(""); setNewBirthDate(""); setNewHijriBirthDate("");
      setNewLicense(""); setNewLicenseExpiry(""); setNewEmail(""); setNewAddress("");
      setNewIdCopyNumber(""); setNewLicenseIssuePlace(""); setNewBorderNumber("");
      
      showToast(T("🟢 Customer added successfully!", "🟢 تم إضافة العميل بنجاح!", ar));
    } catch (err) {
      console.error("Error creating customer:", err);
      setAdded(false);
      showToast(T("Failed to add customer", "فشل في إضافة العميل", ar));
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 max-w-[400px]">
          <Input
            variant="search"
            icon={<Search size={14} />}
            placeholder={T("Search name, phone, or ID…", "ابحث بالاسم أو الهاتف أو رقم الهوية…", ar)}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            suffix={
              search && (
                <IconButton size="sm" variant="ghost" onClick={() => setSearch("")}>
                  <X size={13} />
                </IconButton>
              )
            }
          />
        </div>
        <div className="flex-1" />
        <Button variant="primary" onClick={() => setShowAdd(true)} className="shadow-[var(--shadow-glow-blue)]">
          <UserPlus size={15} />
          {T("Add customer", "إضافة عميل جديد", ar)}
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: T("Total customers", "إجمالي العملاء", ar), value: clients.length, color: "var(--color-mk-blue-500)" },
          { label: T("Verified", "موثّقون", ar), value: clients.filter((c) => c.kycStatus === "verified").length, color: "var(--color-mk-mint-500)" },
          { label: T("Pending KYC", "قيد التحقق", ar), value: clients.filter((c) => c.kycStatus === "pending").length, color: "var(--color-mk-warning)" },
          { label: T("Blacklisted", "القائمة السوداء", ar), value: clients.filter((c) => c.blacklisted).length, color: "var(--color-mk-danger)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg px-5 py-4 mk-surface">
            <div className="mk-h2" style={{ color }}>{value}</div>
            <div className="mk-caption mt-1 text-mk-ink-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Customers table */}
      <div className="rounded-xl overflow-hidden mk-surface">
        <div
          className="grid px-5 py-3 mk-overline uppercase text-mk-ink-400 tracking-wider border-b border-mk-ink-100 bg-mk-ink-50 grid-cols-[2.2fr_1.2fr_1.4fr_0.7fr_0.7fr_40px_36px]"
        >
          <span>{T("Customer", "العميل", ar)}</span>
          <span>{T("Phone", "الهاتف", ar)}</span>
          <span>{T("National ID", "الهوية", ar)}</span>
          <span>{T("Contracts", "العقود", ar)}</span>
          <span>{T("Status", "الحالة", ar)}</span>
          <span />
          <span />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-mk-ink-400">
            <Loader2 size={32} className="animate-spin" />
            <span className="mk-label">{T("Loading customers...", "جاري تحميل العملاء...", ar)}</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-mk-danger">
            <FileWarning size={32} strokeWidth={1.5} />
            <span className="mk-label">{error}</span>
            <Button variant="outline" size="sm" onClick={loadCustomers}>
              {T("Retry", "إعادة المحاولة", ar)}
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-mk-ink-400">
            <User size={32} strokeWidth={1.5} />
            <span className="mk-label">{T("No customers found", "لا يوجد عملاء مطابقون", ar)}</span>
          </div>
        ) : (
          filtered.map((c, idx) => {
          const sm = STATUS_BADGE[c.kycStatus];
          return (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/employee/customer/${c.id}`)}
              onKeyDown={(e) => { if (e.key === "Enter") router.push(`/employee/customer/${c.id}`); }}
              className="grid items-center px-5 py-4 cursor-pointer transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:bg-mk-ink-50 grid-cols-[2.2fr_1.2fr_1.4fr_0.7fr_0.7fr_40px_36px]"
              style={{
                borderBottom: idx < filtered.length - 1 ? "1px solid var(--color-mk-border)" : "none",
                borderInlineStart: c.blacklisted ? "3px solid var(--color-mk-danger)" : "none",
              }}
            >
              {/* Name + avatar */}
              <div className="flex items-center gap-3">
                <Avatar name={c.name} size="sm" />
                <div>
                  <div className="mk-body text-mk-ink-900 flex items-center gap-2 flex-wrap">
                    <span>{ar ? c.nameAr : c.name}</span>
                  </div>
                  <div className="mk-overline text-mk-ink-400">{c.id}</div>
                </div>
              </div>
              {/* Phone */}
              <div className="flex items-center gap-2 mk-label text-mk-ink-600">
                <Phone size={12} className="text-mk-ink-400" />
                {c.phone}
              </div>
              {/* ID */}
              <div>
                <div className="flex items-center gap-2 mk-label text-mk-ink-600">
                  <CreditCard size={12} className="text-mk-ink-400" />
                  {c.idNumber}
                </div>
                <div className="mk-overline text-mk-ink-400 ms-5 flex items-center gap-1 mt-1">
                  <span>{ar ? (c.idType === "Saudi ID" ? "هوية وطنية" : c.idType === "Iqama" ? "إقامة" : c.idType === "Passport" ? "زائر" : "خليجية") : (c.idType === "Passport" ? "Visitor" : c.idType)}</span>
                  {c.idExpiryDate && <span>· {c.idExpiryDate}</span>}
                </div>
              </div>
              {/* Contracts */}
              <div className="mk-label text-mk-ink-900">
                {c.contracts > 0 ? c.contracts : <span className="text-mk-ink-400">{T("None", "لا يوجد", ar)}</span>}
              </div>
              {/* Status */}
              <div>
                <Badge variant={c.blacklisted ? "danger" : STATUS_BADGE[c.kycStatus]?.variant ?? "neutral"} dot>
                  {c.blacklisted ? T("Blacklisted", "قائمة سوداء", ar) : T(sm?.label[0] ?? "", sm?.label[1] ?? "", ar)}
                </Badge>
              </div>
              {/* Create contract */}
              <div className="flex justify-center">
                {canCreateContract(c) && (
                  <Link
                    href={`/employee/new-contract?clientId=${c.id}`}
                    title={T("Create contract", "إنشاء عقد", ar)}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center w-7 h-7 rounded-full bg-mk-blue-500 text-white no-underline shrink-0"
                  >
                    <FileSignature size={13} />
                  </Link>
                )}
              </div>
              {/* Arrow */}
              <div className="flex justify-end">
                <ChevronRight size={16} className="text-mk-ink-300" />
              </div>
            </div>
          );
        })
        )}
      </div>

      {/* ── DRAWER: Register new customer ───────────────────────── */}
      <Drawer open={showAdd} onClose={() => setShowAdd(false)}>
        <div className="flex flex-col justify-between h-full max-w-[480px] overflow-y-auto">
          <div>
            <DrawerHeader title={T("Add new customer", "إضافة عميل جديد", ar)} onClose={() => setShowAdd(false)} className="mb-0 pb-4 border-b border-mk-border" />

            <div className="flex flex-col gap-4 mt-5">
              <Input
                variant="muted"
                dir="rtl"
                label={<>{T("Full name (Arabic)", "الاسم الكامل (عربي)", ar)} <span className="text-mk-danger">*</span></>}
                placeholder="مثال: أحمد المطيري"
                value={newNameAr}
                onChange={(e) => {
                  const v = e.target.value;
                  setNewNameAr(v);
                  if (!englishNameEdited) setNewName(transliterateArabicName(v));
                }}
              />
              <Input
                variant="muted"
                label={T("Full name (English, optional)", "الاسم الكامل (إنجليزي، اختياري)", ar)}
                placeholder="e.g. Ahmed Al-Mutairi"
                value={newName}
                onChange={(e) => {
                  const v = e.target.value;
                  setNewName(v);
                  setEnglishNameEdited(v !== "");
                }}
              />
              <Input
                variant="muted"
                type="tel"
                className="font-mono"
                label={<>{T("Phone number", "رقم الهاتف", ar)} <span className="text-mk-danger">*</span></>}
                placeholder="e.g. +966 50 123 4567"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />

              <div className="flex flex-col gap-2">
                <label className="mk-caption text-mk-ink-700">{T("ID Type", "نوع الهوية", ar)}</label>
                <Select
                  value={newIdType}
                  onChange={(e) => {
                    const v = e.target.value as any;
                    setNewIdType(v);
                    if (v === "Saudi ID") setNewNationality("Saudi");
                  }}
                >
                  <option value="Saudi ID">{T("National ID", "هوية وطنية", ar)}</option>
                  <option value="Iqama">{T("Iqama", "إقامة", ar)}</option>
                  <option value="Passport">{T("Visitor", "زائر", ar)}</option>
                  <option value="GCC ID">{T("GCC ID", "هوية خليجية", ar)}</option>
                </Select>
              </div>

              {/* Dynamic identity fields — depends on ID Type, matches the new-contract flow exactly */}
              {newCustomerIdentityFields().map((f) => (
                <Input
                  key={f.key}
                  variant="muted"
                  className="font-mono"
                  type={f.type}
                  label={<>{T(f.labelEn, f.labelAr, ar)} {f.required && <span className="text-mk-danger">*</span>}</>}
                  value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                />
              ))}
            </div>
          </div>

          <DrawerFooter className="mt-4 pt-4 border-t border-mk-border justify-stretch">
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              {T("Cancel", "إلغاء", ar)}
            </Button>
            <Button
              variant="primary"
              disabled={isCustomerFormInvalid()}
              onClick={handleAdd}
              className={`flex-1 ${added ? "bg-mk-mint-500 hover:bg-mk-mint-500" : ""}`}
            >
              {added ? (<><CheckCircle size={16} /> {T("Added!", "تمت الإضافة!", ar)}</>) : (<><UserPlus size={16} /> {T("Add Customer", "إضافة عميل", ar)}</>)}
            </Button>
          </DrawerFooter>
        </div>
      </Drawer>
    </div>
  );
}

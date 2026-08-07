"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search, UserPlus, Ban, Star,
  Phone, CreditCard, FileText, Loader2
} from "lucide-react";
import { Avatar, Badge, Input, Select, Button, Tabs, Drawer, DrawerHeader, DrawerFooter, useToast } from "@/components/ui";
import { useAdmin } from "@/contexts/AdminContext";
import { customerService } from "@/lib/api-services";

const T = (en: string, ar: string, isAr: boolean) => (isAr ? ar : en);

interface Client {
  id: number;
  name: string;
  nameAr: string;
  phone: string;
  idType: string;
  idNumber: string;
  licenseNumber: string;
  contracts: number;
  rating: number;
  kycStatus: "verified" | "pending" | "rejected";
  blacklisted: boolean;
  joinDate: string;
}


export default function ClientsPage() {
  const { dir } = useAdmin();
  const ar = dir === "rtl";

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKyc, setFilterKyc] = useState<"all" | "verified" | "pending" | "blacklisted">("all");
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { showToast } = useToast();

  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [phone, setPhone] = useState("");
  const [idType, setIdType] = useState("Saudi ID");
  const [idNumber, setIdNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  const triggerToast = (msg: string) => showToast(msg);

  // Load customers on mount and when search/filter changes
  useEffect(() => {
    loadCustomers();
  }, [searchQuery, filterKyc]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      
      // Build search request with filters
      const searchRequest: any = {
        search: searchQuery || undefined,
      };
      
      // Apply KYC filter
      if (filterKyc === "verified") {
        searchRequest.verificationStatus = "Verified";
      } else if (filterKyc === "pending") {
        searchRequest.verificationStatus = "Pending";
      } else if (filterKyc === "blacklisted") {
        searchRequest.isBlacklisted = true;
      }
      
      const response = await customerService.search(searchRequest);
      
      // Transform API response to match Client interface
      const transformedClients = (response.items || response.data || []).map((item: any) => ({
        id: item.id,
        name: item.name || item.nameEn || '',
        nameAr: item.nameAr || '',
        phone: item.phone || '',
        idType: item.idType || '',
        idNumber: item.idNumber || '',
        licenseNumber: item.licenseNumber || '',
        contracts: item.contracts || 0,
        rating: item.rating || 0,
        kycStatus: item.verificationStatus || 'pending',
        blacklisted: item.isBlacklisted || false,
        joinDate: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : '',
      }));
      
      setClients(transformedClients);
    } catch (error) {
      console.error('Error loading customers:', error);
      triggerToast(T('Failed to load customers', 'فشل تحميل العملاء', ar));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr || !nameEn || !phone || !idNumber) {
      triggerToast(T("Please fill all mandatory fields", "الرجاء تعبئة الحقول الإلزامية", ar));
      return;
    }
    
    try {
      const newClient = await customerService.create({
        fullNameEn: nameEn,
        fullNameAr: nameAr,
        phoneNumber: phone.startsWith("+966") ? phone : `+966 ${phone}`,
        identityType: idType as any,
      });
      
      // Reload customers list
      await loadCustomers();
      setDrawerOpen(false);
      setNameAr(""); setNameEn(""); setPhone(""); setIdType("Saudi ID"); setIdNumber(""); setLicenseNumber("");
      triggerToast(T("🟢 Client created successfully!", "🟢 تم إضافة العميل الجديد بنجاح!", ar));
    } catch (error) {
      console.error('Error creating client:', error);
      triggerToast(T('Failed to create client', 'فشل إنشاء العميل', ar));
    }
  };

  const toggleBlacklist = async (id: number) => {
    const client = clients.find(c => c.id === id);
    if (!client) return;
    
    try {
      if (client.blacklisted) {
        await customerService.removeFromBlacklist(id);
        triggerToast(T("✅ Client removed from blacklist.", "✅ تم إزالة العميل من القائمة السوداء.", ar));
      } else {
        await customerService.addToBlacklist(id, { reason: 'Admin action' });
        triggerToast(T("🚫 Client blacklisted!", "🚫 تم إدراج العميل في القائمة السوداء!", ar));
      }
      // Reload to get updated status
      await loadCustomers();
    } catch (error) {
      console.error('Error toggling blacklist:', error);
      triggerToast(T('Failed to update blacklist status', 'فشل تحديث حالة القائمة السوداء', ar));
    }
  };

  const handleVerifyKyc = async (id: number) => {
    try {
      await customerService.verify(id);
      triggerToast(T("✓ KYC verified for client", "✓ تم توثيق هوية العميل بنجاح", ar));
      // Reload to get updated status
      await loadCustomers();
    } catch (error) {
      console.error('Error verifying KYC:', error);
      triggerToast(T('Failed to verify KYC', 'فشل توثيق الهوية', ar));
    }
  };

  const filteredClients = clients;

  return (
    <div className="relative">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        <div className="w-full md:max-w-md">
          <Input
            variant="search"
            icon={<Search size={16} />}
            placeholder={T("Search client by name, phone, or ID…", "ابحث عن عميل بالاسم، الجوال، أو الهوية…", ar)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="primary" onClick={() => setDrawerOpen(true)} className="shadow-[var(--shadow-glow-blue)]">
          <UserPlus size={16} />
          {T("Add New Client", "إضافة عميل جديد", ar)}
        </Button>
      </div>

      {/* Filter Tabs */}
      <Tabs
        variant="default"
        rounded="full"
        className="mb-6 w-fit"
        value={filterKyc}
        onChange={(v) => setFilterKyc(v as typeof filterKyc)}
        items={[
          { value: "all", label: "All Clients", labelAr: "جميع العملاء" },
          { value: "verified", label: "KYC Verified", labelAr: "الهويات الموثّقة" },
          { value: "pending", label: "KYC Pending", labelAr: "الهويات المعلقة" },
          { value: "blacklisted", label: "Blacklisted", labelAr: "القائمة السوداء" },
        ].map((tab) => ({ value: tab.value, label: ar ? tab.labelAr : tab.label }))}
      />

      {/* Clients */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex items-center justify-center py-12 rounded-xl mk-surface">
            <Loader2 className="animate-spin text-mk-blue-500" size={32} />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12 rounded-xl mk-surface">
            <span className="mk-display opacity-25">👥</span>
            <div className="mk-body-sm mt-3 text-mk-ink-500">
              {T("No clients found matching criteria", "لا يوجد عملاء مطابقتهم لشروط البحث", ar)}
            </div>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl mk-surface cursor-pointer transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:bg-mk-ink-50"
              style={{ borderInlineStart: client.blacklisted ? "4px solid var(--color-mk-danger)" : undefined }}
            >
              {/* Profile details */}
              <div className="flex items-center gap-4 min-w-0">
                <Avatar
                  name={ar ? client.nameAr : client.name}
                  size="lg"
                  className={client.blacklisted ? "grayscale opacity-50" : ""}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="mk-body text-mk-ink-900">
                      {ar ? client.nameAr : client.name}
                    </div>
                    <span className="font-mono mk-overline px-2 py-1 rounded bg-mk-ink-50 text-mk-ink-500">
                      {client.id}
                    </span>
                    {client.blacklisted ? (
                      <Badge variant="danger" dot>{T("Blacklisted", "قائمة سوداء", ar)}</Badge>
                    ) : client.kycStatus === "verified" ? (
                      <Badge variant="success" dot>{T("KYC Verified", "موثّق", ar)}</Badge>
                    ) : (
                      <Badge variant="warning" dot>{T("KYC Pending", "تحقق معلق", ar)}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mk-caption mt-2 flex-wrap text-mk-ink-500">
                    <span className="flex items-center gap-1"><Phone size={12} /> {client.phone}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><CreditCard size={12} /> {client.idType} : {client.idNumber}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><FileText size={12} /> {T(`Lic: ${client.licenseNumber}`, `رخصة: ${client.licenseNumber}`, ar)}</span>
                  </div>
                  <div className="flex items-center gap-4 mk-caption mt-2 text-mk-ink-400">
                    <span>{T(`Joined: ${client.joinDate}`, `تاريخ الانضمام: ${client.joinDate}`, ar)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 mk-label text-mk-ink-900">
                      {T(`${client.contracts} contracts`, `${client.contracts} عقود سابقة`, ar)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 mk-label text-mk-warning">
                      <Star size={12} className="fill-current" /> {client.rating}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 justify-end border-t md:border-t-0 pt-3 md:pt-0 border-mk-ink-100">
                {client.kycStatus === "pending" && !client.blacklisted && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerifyKyc(client.id)}
                    className="border-mk-mint-600/20 bg-mk-mint-600/10 text-mk-mint-600 hover:border-mk-mint-600/40"
                  >
                    {T("Verify KYC", "توثيق الهوية", ar)}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleBlacklist(client.id)}
                  className={client.blacklisted
                    ? "border-mk-mint-600/20 bg-mk-mint-600/10 text-mk-mint-600"
                    : "border-mk-danger/20 bg-mk-danger/8 text-mk-danger"}
                >
                  {client.blacklisted ? T("Remove restriction", "إلغاء الحظر", ar) : T("Blacklist", "إدراج بالحظر", ar)}
                </Button>
                <Link href={`/employee/customer/${client.id}`}>
                  <Button variant="outline" size="sm">{T("View Profile", "عرض الملف", ar)}</Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Drawer */}
      <Drawer open={isDrawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className="flex flex-col gap-5 justify-between h-full max-w-[480px]">
          <div>
            <DrawerHeader title={T("Add New Client Profile", "إضافة ملف عميل جديد", ar)} onClose={() => setDrawerOpen(false)} className="mb-0 pb-4 border-b border-mk-ink-100" />

              <form onSubmit={handleCreateClient} className="flex flex-col gap-4 mt-5">
                <Input
                  label={T("Arabic Full Name *", "الاسم الكامل بالعربية *", ar)}
                  placeholder={T("e.g. خالد المطيري", "مثال: خالد المطيري", ar)}
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                />
                <Input
                  label={T("English Full Name *", "الاسم الكامل بالإنجليزية *", ar)}
                  placeholder="e.g. Khaled Al-Mutairi"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                />
                <Input
                  variant="muted"
                  type="tel"
                  className="font-mono"
                  label={<>{T("Mobile Number", "رقم الجوال", ar)} <span className="text-mk-danger">*</span></>}
                  placeholder="e.g. +966 50 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label={T("ID Type", "نوع الهوية", ar)}
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                  >
                    <option value="Saudi ID">{T("National ID", "هوية وطنية", ar)}</option>
                    <option value="Iqama">{T("Iqama", "إقامة", ar)}</option>
                    <option value="Passport">{T("Passport", "جواز سفر", ar)}</option>
                  </Select>
                  <Input
                    label={T("ID Number *", "رقم الهوية *", ar)}
                    placeholder="1077654321"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                  />
                </div>
                <Input
                  label={T("Driver's License Number", "رقم رخصة القيادة", ar)}
                  placeholder="LIC-99824"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                />
              </form>
            </div>

            <DrawerFooter className="mt-0 pt-4 border-t border-mk-ink-100 justify-stretch">
              <Button variant="outline" onClick={() => setDrawerOpen(false)}>
                {T("Cancel", "إلغاء", ar)}
              </Button>
              <Button variant="primary" onClick={handleCreateClient} className="flex-1 shadow-[var(--shadow-glow-blue)]">
                {T("✓ Create Client", "✓ حفظ العميل", ar)}
              </Button>
            </DrawerFooter>
          </div>
      </Drawer>
    </div>
  );
}


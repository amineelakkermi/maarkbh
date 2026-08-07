"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, MapPin, Phone, Mail, Edit, Trash2, Building } from "lucide-react";
import { Avatar, Badge, Button, Table, Th, Td, type BadgeVariant, Input, Drawer, DrawerHeader, DrawerFooter, useToast } from "@/components/ui";
import { useAdmin } from "@/contexts/AdminContext";
import { branchService } from "@/lib/api-services";

const T = (en: string, ar: string, isAr: boolean) => (isAr ? ar : en);

const STATUS_BADGE: Record<string, BadgeVariant> = {
  "Active": "success",
  "Inactive": "neutral",
  "Pending": "warning",
};

const STATUS_AR: Record<string, string> = {
  "Active": "نشط",
  "Inactive": "غير نشط",
  "Pending": "قيد الانتظار",
};

export default function BranchesPage() {
  const { dir } = useAdmin();
  const ar = dir === "rtl";

  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const { showToast } = useToast();

  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Mock data - TODO: Replace with API when backend is ready
  const MOCK_BRANCHES = [
    {
      id: 1,
      name: "Riyadh Branch",
      nameAr: "فرع الرياض",
      address: "Olaya Street, Riyadh",
      phone: "+966 50 123 4567",
      email: "riyadh@maarkbh.com",
      status: "Active",
      manager: "Abdullah Al-Otaibi",
    },
    {
      id: 2,
      name: "Jeddah Branch",
      nameAr: "فرع جدة",
      address: "Prince Sultan Street, Jeddah",
      phone: "+966 50 234 5678",
      email: "jeddah@maarkbh.com",
      status: "Active",
      manager: "Mohammed Al-Qahtani",
    },
    {
      id: 3,
      name: "Dammam Branch",
      nameAr: "فرع الدمام",
      address: "King Fahd Road, Dammam",
      phone: "+966 50 345 6789",
      email: "dammam@maarkbh.com",
      status: "Pending",
      manager: "Not assigned",
    },
  ];

  // Load branches from API
  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const response = await branchService.search({});
      const transformedBranches = (response.items || response.data || []).map((item: any) => ({
        id: item.id,
        name: item.nameEn || item.name || '',
        nameAr: item.nameAr || '',
        address: item.address || '',
        phone: item.phone || '',
        email: item.email || '',
        status: item.isActive ? 'Active' : 'Inactive',
        manager: item.manager || 'Not assigned',
      }));
      setBranches(transformedBranches);
    } catch (error) {
      console.error('Error loading branches:', error);
      // Fallback to mock data on error
      setBranches(MOCK_BRANCHES);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(ar ? 'هل أنت متأكد من حذف هذا الفرع؟' : 'Are you sure you want to delete this branch?')) {
      return;
    }

    try {
      await branchService.delete(id);
      loadBranches();
      showToast(T("Branch deleted successfully", "تم حذف الفرع بنجاح", ar));
    } catch (error) {
      console.error('Error deleting branch:', error);
      alert(ar ? 'فشل حذف الفرع' : 'Failed to delete branch');
    }
  };

  const handleEditBranch = (branch: any) => {
    setEditingBranch(branch);
    setNameAr(branch.nameAr || "");
    setNameEn(branch.name || "");
    setIsActive(branch.status === "Active");
    setLatitude("");
    setLongitude("");
    setEditDrawerOpen(true);
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr || !nameEn) {
      showToast(T("Please fill all mandatory fields", "الرجاء تعبئة الحقول الإلزامية", ar));
      return;
    }

    try {
      // TODO: Uncomment when backend is ready
      // await branchService.update(editingBranch.id, {
      //   nameAr,
      //   nameEn,
      //   isActive,
      //   latitude: latitude ? parseFloat(latitude) : undefined,
      //   longitude: longitude ? parseFloat(longitude) : undefined,
      // });

      // Using mock data for now - update local state
      setBranches(branches.map(b =>
        b.id === editingBranch.id
          ? {
              ...b,
              name: nameEn,
              nameAr: nameAr,
              status: isActive ? "Active" : "Inactive",
            }
          : b
      ));

      setEditDrawerOpen(false);
      setEditingBranch(null);
      setNameAr("");
      setNameEn("");
      setIsActive(true);
      setLatitude("");
      setLongitude("");
      showToast(T("🟢 Branch updated successfully!", "🟢 تم تحديث الفرع بنجاح!", ar));
    } catch (error) {
      console.error('Error updating branch:', error);
      showToast(T('Failed to update branch', 'فشل تحديث الفرع', ar));
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr || !nameEn) {
      showToast(T("Please fill all mandatory fields", "الرجاء تعبئة الحقول الإلزامية", ar));
      return;
    }

    try {
      await branchService.create({
        nameAr,
        nameEn,
        isActive,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
      });

      // Reload branches list
      await loadBranches();
      setDrawerOpen(false);
      setNameAr("");
      setNameEn("");
      setIsActive(true);
      setLatitude("");
      setLongitude("");
      showToast(T("🟢 Branch created successfully!", "🟢 تم إضافة الفرع الجديد بنجاح!", ar));
    } catch (error) {
      console.error('Error creating branch:', error);
      showToast(T('Failed to create branch', 'فشل إنشاء الفرع', ar));
    }
  };

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center gap-3 mb-5">
        <div className="mk-h4 flex-1 text-mk-ink-900">
          {T("Branches", "الفروع", ar)}
        </div>
        <Button 
          variant="primary" 
          className="shadow-[var(--shadow-glow-blue)]"
          onClick={() => setDrawerOpen(true)}
        >
          <Plus size={14} />
          {T("Add branch", "إضافة فرع", ar)}
        </Button>
      </div>

      {/* Branches table */}
      <div className="rounded-xl overflow-hidden mk-surface">
        <Table>
          <thead>
            <tr>
              {[
                T("Branch name", "اسم الفرع", ar),
                T("Address", "العنوان", ar),
                T("Contact", "الاتصال", ar),
                T("Manager", "المدير", ar),
                T("Status", "الحالة", ar),
                "",
              ].map((h, i) => <Th key={i}>{h}</Th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Loader2 className="animate-spin text-mk-blue-500 mx-auto" size={32} />
                </td>
              </tr>
            ) : branches.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 mk-label text-mk-ink-400">
                  {T("No branches found", "لم يتم العثور على فروع", ar)}
                </td>
              </tr>
            ) : (
              branches.map((branch) => (
                <tr key={branch.id} className="cursor-pointer transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:bg-mk-ink-50">
                  <Td>
                    <div className="mk-body text-mk-ink-900">
                      {ar ? (branch.nameAr || branch.name) : branch.name}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2 mk-label text-mk-ink-700">
                      <MapPin size={14} />
                      {branch.address}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-col gap-1">
                      {branch.phone && (
                        <div className="flex items-center gap-2 mk-caption text-mk-ink-600">
                          <Phone size={12} />
                          {branch.phone}
                        </div>
                      )}
                      {branch.email && (
                        <div className="flex items-center gap-2 mk-caption text-mk-ink-600">
                          <Mail size={12} />
                          {branch.email}
                        </div>
                      )}
                    </div>
                  </Td>
                  <Td className="mk-label text-mk-ink-700">{branch.manager}</Td>
                  <Td>
                    <Badge variant={STATUS_BADGE[branch.status] ?? "neutral"}>
                      {ar ? (STATUS_AR[branch.status] ?? branch.status) : branch.status}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditBranch(branch)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(branch.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Drawer */}
      <Drawer open={isDrawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className="flex flex-col gap-5 justify-between h-full max-w-[480px]">
          <div>
            <DrawerHeader title={T("Add New Branch", "إضافة فرع جديد", ar)} onClose={() => setDrawerOpen(false)} className="mb-0 pb-4 border-b border-mk-ink-100" />

            <form onSubmit={handleCreateBranch} className="flex flex-col gap-4 mt-5">
              <Input
                label={T("Arabic Branch Name *", "اسم الفرع بالعربية *", ar)}
                placeholder={T("e.g. فرع الرياض", "مثال: فرع الرياض", ar)}
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
              />
              <Input
                label={T("English Branch Name *", "اسم الفرع بالإنجليزية *", ar)}
                placeholder="e.g. Riyadh Branch"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={T("Latitude", "خط العرض", ar)}
                  placeholder="e.g. 24.7136"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
                <Input
                  label={T("Longitude", "خط الطول", ar)}
                  placeholder="e.g. 46.6753"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-mk-ink-50">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="mk-body text-mk-ink-900">
                  {T("Active Branch", "فرع نشط", ar)}
                </label>
              </div>
            </form>
          </div>

          <DrawerFooter className="mt-0 pt-4 border-t border-mk-ink-100 justify-stretch">
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>
              {T("Cancel", "إلغاء", ar)}
            </Button>
            <Button variant="primary" onClick={handleCreateBranch} className="flex-1 shadow-[var(--shadow-glow-blue)]">
              {T("✓ Create Branch", "✓ حفظ الفرع", ar)}
            </Button>
          </DrawerFooter>
        </div>
      </Drawer>

      {/* Edit Drawer */}
      <Drawer open={isEditDrawerOpen} onClose={() => setEditDrawerOpen(false)}>
        <div className="flex flex-col gap-5 justify-between h-full max-w-[480px]">
          <div>
            <DrawerHeader title={T("Edit Branch", "تعديل الفرع", ar)} onClose={() => setEditDrawerOpen(false)} className="mb-0 pb-4 border-b border-mk-ink-100" />

            <form onSubmit={handleUpdateBranch} className="flex flex-col gap-4 mt-5">
              <Input
                label={T("Arabic Branch Name *", "اسم الفرع بالعربية *", ar)}
                placeholder={T("e.g. فرع الرياض", "مثال: فرع الرياض", ar)}
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
              />
              <Input
                label={T("English Branch Name *", "اسم الفرع بالإنجليزية *", ar)}
                placeholder="e.g. Riyadh Branch"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={T("Latitude", "خط العرض", ar)}
                  placeholder="e.g. 24.7136"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
                <Input
                  label={T("Longitude", "خط الطول", ar)}
                  placeholder="e.g. 46.6753"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-mk-ink-50">
                <input
                  type="checkbox"
                  id="isActiveEdit"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="isActiveEdit" className="mk-body text-mk-ink-900">
                  {T("Active Branch", "فرع نشط", ar)}
                </label>
              </div>
            </form>
          </div>

          <DrawerFooter className="mt-0 pt-4 border-t border-mk-ink-100 justify-stretch">
            <Button variant="outline" onClick={() => setEditDrawerOpen(false)}>
              {T("Cancel", "إلغاء", ar)}
            </Button>
            <Button variant="primary" onClick={handleUpdateBranch} className="flex-1 shadow-[var(--shadow-glow-blue)]">
              {T("✓ Update Branch", "✓ تحديث الفرع", ar)}
            </Button>
          </DrawerFooter>
        </div>
      </Drawer>
    </div>
  );
}

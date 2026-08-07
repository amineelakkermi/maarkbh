"use client";

import { useState } from "react";
import { KYC_ENTRIES, KycEntry, KycStatus } from "@/lib/data";
import { Clock, FileText, AlertTriangle } from "lucide-react";
import { Badge, Tabs, Avatar, Select } from "@/components/ui";
import { useAdmin } from "@/contexts/AdminContext";

const T = (en: string, ar: string, isAr: boolean) => (isAr ? ar : en);

const STATUS_VARIANT: Record<KycStatus, "warning" | "success" | "danger"> = {
  pending:  "warning",
  verified: "success",
  rejected: "danger",
};

const REJECT_REASONS_EN = ["Image not clear", "Document expired", "Name mismatch", "Incomplete data"];
const REJECT_REASONS_AR = ["الصورة غير واضحة", "الوثيقة منتهية", "عدم التطابق", "بيانات ناقصة"];

export default function KycQueuePage() {
  const { dir } = useAdmin();
  const ar = dir === "rtl";

  const REJECT_REASONS = ar ? REJECT_REASONS_AR : REJECT_REASONS_EN;

  const [entries, setEntries]   = useState<KycEntry[]>(KYC_ENTRIES);
  const [selected, setSelected] = useState<KycEntry | null>(null);
  const [filter, setFilter]     = useState<"all" | KycStatus>("all");
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);

  const visible = filter === "all" ? entries : entries.filter((e) => e.status === filter);
  const pending = entries.filter((e) => e.status === "pending").length;

  const STATUS_LABEL: Record<KycStatus, string> = {
    pending:  T("Pending",  "معلق",   ar),
    verified: T("Verified", "موثق",   ar),
    rejected: T("Rejected", "مرفوض",  ar),
  };

  const FILTER_LABELS: Record<string, string> = {
    all:      T("All",      "الكل",   ar),
    pending:  T("Pending",  "معلق",   ar),
    verified: T("Verified", "موثق",   ar),
    rejected: T("Rejected", "مرفوض",  ar),
  };

  function confirm() {
    if (!selected || !decision) return;
    const next: KycStatus = decision === "approve" ? "verified" : "rejected";
    setEntries((prev) => prev.map((e) => e.id === selected.id ? { ...e, status: next } : e));
    setSelected((prev) => prev ? { ...prev, status: next } : null);
    setDecision(null);
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[600px] lg:h-full overflow-hidden rounded-md">
      {/* Queue list */}
      <div className="w-full lg:w-[290px] flex-shrink-0 flex flex-col border-b lg:border-b-0 lg:border-e border-mk-ink-100 overflow-hidden mk-surface">
        {/* Header */}
        <div className="px-4 py-3 border-b border-mk-ink-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="mk-label text-mk-ink-900">
              {T("Queue", "الطابور", ar)}
            </div>
            {pending > 0 && (
              <span className="mk-overline normal-case tracking-normal px-2 py-px rounded-full bg-mk-warning/12 text-mk-warning">
                {pending} {T("pending", "معلق", ar)}
              </span>
            )}
          </div>
          <Tabs
            variant="default"
            rounded="full"
            value={filter}
            onChange={(v) => setFilter(v as typeof filter)}
            items={(["all", "pending", "verified", "rejected"] as const).map((f) => ({
              value: f,
              label: FILTER_LABELS[f],
            }))}
          />
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto max-h-[300px] lg:max-h-none">
          {visible.map((entry) => {
            const isSelected = selected?.id === entry.id;
            return (
              <div
                key={entry.id}
                onClick={() => { setSelected(entry); setDecision(null); }}
                className={`relative flex items-center gap-3 px-4 py-3 border-b border-b-mk-ink-100 cursor-pointer transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${
                  isSelected ? "bg-mk-blue-500/5" : "hover:bg-mk-ink-50"
                }`}
              >
                {/* Selected indicator – absolute so it never affects layout */}
                {isSelected && (
                  <span
                    className="absolute top-0 bottom-0 end-0 w-1 bg-mk-blue-500 rounded-s-sm"
                  />
                )}
                <Avatar name={entry.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="mk-label truncate text-mk-ink-900">{entry.name}</span>
                    {entry.sla && (
                      <Badge variant="danger" className="mk-overline px-2 py-px shrink-0">SLA!</Badge>
                    )}
                  </div>
                  <div className="mk-overline normal-case tracking-normal text-mk-ink-400">{entry.since}</div>
                </div>
                <Badge variant={STATUS_VARIANT[entry.status]} dot className="shrink-0">
                  {STATUS_LABEL[entry.status]}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 overflow-y-auto p-5 bg-mk-ink-50">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-mk-ink-400">
            <span className="mk-display opacity-25">🛡️</span>
            <div className="mk-label">{T("Select a customer to review", "اختر عميلاً للمراجعة", ar)}</div>
          </div>
        ) : (
          <div className="max-w-[500px] flex flex-col gap-4">
            {/* Customer card */}
            <div className="rounded-md border border-mk-ink-100 p-4 mk-surface">
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={selected.name} size="lg" />
                <div className="flex-1">
                  <div className="mk-body text-mk-ink-900">{selected.name}</div>
                  <div className="mk-caption normal-case tracking-normal text-mk-ink-400">{selected.phone}</div>
                  <div className="flex items-center gap-1 mk-overline normal-case tracking-normal mt-1 text-mk-ink-400">
                    <Clock size={11} /> {selected.since}
                  </div>
                </div>
                {selected.sla && (
                  <div className="flex items-center gap-1 px-3 py-2 rounded-sm mk-overline normal-case tracking-normal bg-mk-danger/10 text-mk-danger">
                    <AlertTriangle size={12} />
                    {T("SLA exceeded (2h)", "تجاوز SLA (2 ساعة)", ar)}
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="flex gap-3">
                {selected.docs.map((doc) => (
                  <div
                    key={doc}
                    className="flex-1 border-[1.5px] border-dashed border-mk-ink-200 rounded-md p-4 text-center cursor-pointer transition-colors hover:border-mk-blue-500"
                  >
                    <FileText size={24} className="mx-auto mb-2 text-mk-ink-400" />
                    <div className="mk-caption normal-case tracking-normal text-mk-ink-900">{doc}</div>
                    <div className="mk-overline normal-case tracking-normal mt-1 text-mk-blue-500">{T("View full ↗", "عرض كامل ↗", ar)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Decision */}
            {selected.status === "pending" ? (
              <div className="rounded-md border border-mk-ink-100 p-4 flex flex-col gap-3 mk-surface">
                <div className="mk-label text-mk-ink-900">{T("Decision", "القرار", ar)}</div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDecision("approve")}
                    className={`py-4 rounded-sm border-2 mk-label transition-all cursor-pointer ${
 decision === "approve"
 ? "border-mk-mint-600 bg-mk-mint-600/8 text-mk-mint-600"
 : "border-mk-ink-200 bg-transparent text-mk-ink-400"
 }`}
                  >
                    {T("✅ Verified", "موثق ✅", ar)}
                  </button>
                  <button
                    onClick={() => setDecision("reject")}
                    className={`py-4 rounded-sm border-2 mk-label transition-all cursor-pointer ${
 decision === "reject"
 ? "border-mk-danger bg-mk-danger/8 text-mk-danger"
 : "border-mk-ink-200 bg-transparent text-mk-ink-400"
 }`}
                  >
                    {T("❌ Rejected", "مرفوض ❌", ar)}
                  </button>
                </div>

                {decision === "reject" && (
                  <Select value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}>
                    {REJECT_REASONS.map((r) => <option key={r}>{r}</option>)}
                  </Select>
                )}

                <button
                  onClick={confirm}
                  disabled={!decision}
                  className={`w-full py-3 rounded-sm mk-label transition-colors border-0 ${
 !decision
 ? "bg-mk-ink-100 text-mk-ink-400 cursor-not-allowed"
 : decision === "approve"
 ? "bg-mk-mint-600 text-white cursor-pointer"
 : "bg-mk-danger text-white cursor-pointer"
 }`}
                >
                  {!decision
                    ? T("Choose a decision", "اختر القرار", ar)
                    : decision === "approve"
                      ? T("✅ Confirm approval", "✅ تأكيد الموافقة", ar)
                      : T("❌ Confirm rejection", "❌ تأكيد الرفض", ar)
                  }
                </button>
              </div>
            ) : (
              <div
                className={`rounded-md border px-4 py-3 flex items-center gap-3 ${
                  selected.status === "verified"
                    ? "bg-mk-mint-600/8 border-mk-mint-600/25"
                    : "bg-mk-danger/8 border-mk-danger/25"
                }`}
              >
                <span className="text-lg">{selected.status === "verified" ? "✅" : "❌"}</span>
                <Badge variant={STATUS_VARIANT[selected.status]} dot>
                  {STATUS_LABEL[selected.status]}
                </Badge>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

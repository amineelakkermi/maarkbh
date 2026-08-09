"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useUser, AdminRole } from "@/contexts/UserContext";
import { accountService } from "@/lib/api-services";
import {
  Palette,
  LayoutDashboard,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2
} from "lucide-react";

export default function RootPortalPage() {
  const router = useRouter();
  const { login, isLoggedIn, logout, isLoading, authError } = useAuth();
  const { role, setRole } = useUser();

  // Navigation / Login states
  const [step, setStep] = useState<"login" | "portal">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Change password modal states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // If already logged in, show the portal switcher directly
  useEffect(() => {
    if (isLoggedIn) {
      setStep("portal");
    }
  }, [isLoggedIn]);

  // Handle login submission
  const handleLogin = async (e: React.FormEvent, selectedRole: AdminRole) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("الرجاء إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    try {
      await login(username, password);
      // Only proceed to portal if login succeeded
      setRole(selectedRole);
      setStep("portal");
    } catch (err) {
      // Translate technical errors to user-friendly Arabic messages
      let errorMessage = "فشل تسجيل الدخول";
      if (err instanceof Error) {
        const errorMsg = err.message;
        if (errorMsg.includes("InvalidCredentials")) {
          errorMessage = "اسم المستخدم أو كلمة المرور غير صحيحة";
        } else if (errorMsg.includes("AccountLocked")) {
          errorMessage = "تم قفل الحساب بسبب محاولات تسجيل دخول متعددة فاشلة. يرجى المحاولة لاحقاً أو الاتصال بالدعم الفني";
        } else if (errorMsg.includes("AccountDisabled")) {
          errorMessage = "الحساب معطل. يرجى الاتصال بالدعم الفني";
        } else {
          errorMessage = errorMsg;
        }
      }
      setError(errorMessage);
      // Do NOT proceed to portal - stay on login screen
    }
  };

  // Launch flow with role authentication
  const handleRoleSelect = (role: AdminRole) => {
    if (role === "owner") {
      router.push("/dashboard");
    } else {
      router.push("/employee/today");
    }
  };

  const handleLogout = () => {
    logout();
    setStep("login");
    setUsername("");
    setPassword("");
    setError(null);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("الرجاء ملء جميع الحقول");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("كلمة المرور الجديدة غير متطابقة");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    try {
      setIsChangingPassword(true);
      await accountService.changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "فشل تغيير كلمة المرور");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between relative overflow-hidden"
      style={{ background: "radial-gradient(circle at top left, var(--color-mk-navy) 0%, var(--color-mk-midnight) 50%, #0c0628 100%)" }}
    >
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-100px] left-[-100px] w-[350px] h-[350px] rounded-full bg-mk-blue-600/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] rounded-full bg-mk-mint-500/10 blur-[70px] pointer-events-none" />

      {/* Top Bar */}
      <header className="px-6 md:px-12 py-5 flex items-center justify-between border-b border-white/5 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md flex items-center justify-center bg-white/5 border border-white/10 p-2 shrink-0 shadow-lg">
            <Image src="/assets/logo-symbol-white-v2.png" alt="Maarkbh Logo" width={22} height={22} className="object-contain" />
          </div>
          <div>
            <div className="text-white mk-body tracking-tight">مركبة · Maarkbh</div>
            <div className="text-white/40 mk-overline tracking-wider uppercase font-mono">Rental Hub Portal</div>
          </div>
        </div>

        <Link
          href="/design-system"
          className="text-white/60 hover:text-white mk-caption flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/5 transition-all hover:bg-white/10"
        >
          <Palette size={13} />
          <span>نظام التصميم (v1.0)</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        {step !== "portal" ? (
          <div className="w-full max-w-[420px] transition-all duration-300">
            <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl rounded-xl p-8 md:p-10 shadow-2xl relative">
              <div className="flex items-center gap-4 mb-8 pb-5 border-b border-white/5">
                <div className="w-11 h-11 rounded-md flex items-center justify-center bg-white/5 border border-white/10 p-2 shrink-0 shadow-lg">
                  <Image src="/assets/logo-symbol-white-v2.png" alt="Maarkbh Logo" width={26} height={26} className="object-contain" />
                </div>
                <div>
                  <h2 className="text-white mk-h4">مركبة · Maarkbh</h2>
                  <p className="text-white/50 mk-caption mt-1">Rental Hub Portal</p>
                </div>
              </div>

              <form onSubmit={(e) => handleLogin(e, "owner")} className="flex flex-col gap-5">
                <div>
                  <h1 className="mk-h3 text-white mb-1">مرحباً بك 👋</h1>
                  <p className="text-white/60 mk-label leading-relaxed">
                    سجل الدخول للوصول إلى لوحة الإدارة ومكاتب الفروع.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="mk-overline text-white/50 uppercase tracking-wider">
                    اسم المستخدم
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError(null);
                    }}
                    placeholder="أدخل اسم المستخدم"
                    className="w-full px-4 py-4 rounded-md bg-white/[0.04] border border-white/15 focus:border-mk-blue-500 focus:bg-white/[0.08] !text-mk-white mk-body outline-none transition-all focus:shadow-[0_0_0_3px_rgba(65,113,226,0.18)] placeholder:text-mk-white/60"
                    autoFocus
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="mk-overline text-white/50 uppercase tracking-wider">
                    كلمة المرور
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="أدخل كلمة المرور"
                    className="w-full px-4 py-4 rounded-md bg-white/[0.04] border border-white/15 focus:border-mk-blue-500 focus:bg-white/[0.08] !text-mk-white mk-body outline-none transition-all focus:shadow-[0_0_0_3px_rgba(65,113,226,0.18)] placeholder:text-mk-white/60"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-mk-danger/10 border border-mk-danger/25 text-mk-danger mk-caption">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex flex-col gap-3 mt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 rounded-full bg-mk-blue-500 hover:bg-mk-blue-600 text-white mk-body-sm shadow-lg shadow-mk-blue-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>جاري تسجيل الدخول...</span>
                      </span>
                    ) : (
                      "دخول كـ مدير (Owner)"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleLogin(e, "frontdesk")}
                    disabled={isLoading}
                    className="w-full py-4 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white mk-label border border-white/5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>جاري تسجيل الدخول...</span>
                      </span>
                    ) : (
                      "دخول كـ موظف (Employee)"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-[580px] mx-auto animate-[fi_0.25s_ease-out]">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mk-success/10 border border-mk-success/20 text-mk-success mk-caption mb-3">
                <CheckCircle2 size={13} />
                <span>تم التحقق بـ رمز جوال آمن</span>
              </span>
              <h1 className="mk-h1 text-white mb-1 tracking-tight">مرحباً بك، عبدالله رضي 👋</h1>
              <p className="text-white/50 mk-body-sm">اختر البوابة أو الدور الذي ترغب في تجربته للبدء في المنصة</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* ADMIN CARD */}
              <div
                onClick={() => handleRoleSelect("owner")}
                className="group bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] hover:border-mk-blue-500/40 rounded-xl p-6 md:p-8 cursor-pointer transition-all duration-[220ms] flex flex-col justify-between min-h-[280px] shadow-lg hover:-translate-y-1 hover:shadow-mk-blue-500/10"
              >
                <div>
                  <div className="w-12 h-12 rounded-md bg-mk-blue-500/10 text-mk-blue-500 border border-mk-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <LayoutDashboard size={22} />
                  </div>
                  <div className="mk-h4 text-white mb-2">لوحة الإدارة الرئيسية</div>
                  <p className="text-white/45 mk-caption leading-relaxed">
                    لوحة تحكم مالك المنصة ومدير الفروع (Super Admin / Office Manager). تحتوي على التقارير المالية الذكية، إدارة الأسطول، وتتبع السيارات عبر الـ GPS المدمج.
                  </p>
                </div>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                  <span className="mk-overline tracking-wider text-mk-blue-500 uppercase">دخول كـ مدير ←</span>
                  <span className="mk-overline text-white/30 font-mono">SA-02 Dashboard</span>
                </div>
              </div>

              {/* EMPLOYEE CARD */}
              <div
                onClick={() => handleRoleSelect("frontdesk")}
                className="group bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] hover:border-mk-mint-500/40 rounded-xl p-6 md:p-8 cursor-pointer transition-all duration-[220ms] flex flex-col justify-between min-h-[280px] shadow-lg hover:-translate-y-1 hover:shadow-mk-mint-500/10"
              >
                <div>
                  <div className="w-12 h-12 rounded-md bg-mk-mint-500/10 text-mk-mint-500 border border-mk-mint-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <UserCheck size={22} />
                  </div>
                  <div className="mk-h4 text-white mb-2">مكتب موظف الاستقبال</div>
                  <p className="text-white/45 mk-caption leading-relaxed">
                    بوابة عمليات موظفي الفروع (Front Desk Employee). مخصصة لتسجيل العقود اليدوية بـ 6 خطوات، فحص وتدقيق الهويات الوطنية والرخص (KYC)، وإجراء عمليات الاستلام والتسليم.
                  </p>
                </div>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                  <span className="mk-overline tracking-wider text-mk-mint-500 uppercase">دخول كـ موظف ←</span>
                  <span className="mk-overline text-white/30 font-mono">SA-02-EMP Desk</span>
                </div>
              </div>
            </div>

            <div className="text-center mt-10">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="text-white/40 hover:text-white/70 mk-label bg-white/5 border border-white/5 hover:bg-white/10 px-5 py-3 rounded-full transition-all cursor-pointer"
                >
                  🔐 تغيير كلمة المرور
                </button>
                <button
                  onClick={handleLogout}
                  className="text-white/40 hover:text-white/70 mk-label bg-white/5 border border-white/5 hover:bg-white/10 px-5 py-3 rounded-full transition-all cursor-pointer"
                >
                  🔓 تسجيل خروج
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-white/5 backdrop-blur-sm z-10 text-center flex flex-col md:flex-row justify-between items-center gap-3">
        <p className="text-white/40 mk-caption">
          مركبة · Maarkbh © {new Date().getFullYear()} — منصة تأجير السيارات الموحدة
        </p>
        <div className="flex items-center gap-4 mk-caption text-white/40">
          <span>نطاق العرض: مسودة أولى MVP v1.0</span>
          <span className="text-white/20">|</span>
          <span>UX Lead: عبدالله رضي</span>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fi {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="mk-h3 text-mk-ink-900">تغيير كلمة المرور</h3>
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordError(null);
                  setPasswordSuccess(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="text-mk-ink-400 hover:text-mk-ink-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="mk-overline text-mk-ink-500 uppercase tracking-wider">
                  كلمة المرور الحالية
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  placeholder="أدخل كلمة المرور الحالية"
                  className="w-full px-4 py-3 rounded-md bg-mk-ink-50 border border-mk-ink-200 focus:border-mk-blue-500 focus:bg-white text-mk-ink-900 mk-body outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="mk-overline text-mk-ink-500 uppercase tracking-wider">
                  كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  placeholder="أدخل كلمة المرور الجديدة"
                  className="w-full px-4 py-3 rounded-md bg-mk-ink-50 border border-mk-ink-200 focus:border-mk-blue-500 focus:bg-white text-mk-ink-900 mk-body outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="mk-overline text-mk-ink-500 uppercase tracking-wider">
                  تأكيد كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  placeholder="أعد إدخال كلمة المرور الجديدة"
                  className="w-full px-4 py-3 rounded-md bg-mk-ink-50 border border-mk-ink-200 focus:border-mk-blue-500 focus:bg-white text-mk-ink-900 mk-body outline-none transition-all"
                />
              </div>

              {passwordError && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-mk-danger/10 border border-mk-danger/25 text-mk-danger mk-caption">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-mk-success/10 border border-mk-success/25 text-mk-success mk-caption">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>تم تغيير كلمة المرور بنجاح</span>
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordError(null);
                    setPasswordSuccess(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  disabled={isChangingPassword}
                  className="flex-1 py-3 rounded-md bg-mk-ink-100 hover:bg-mk-ink-200 text-mk-ink-700 mk-body-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 py-3 rounded-md bg-mk-blue-500 hover:bg-mk-blue-600 text-white mk-body-sm shadow-lg shadow-mk-blue-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>جاري التغيير...</span>
                    </>
                  ) : (
                    "تغيير"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

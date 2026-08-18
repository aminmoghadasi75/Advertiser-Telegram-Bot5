import React, { useState } from 'react';
import { UserPlus, Phone, Key, Lock, CheckCircle, AlertCircle, X, HelpCircle, Sparkles } from 'lucide-react';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultApiId?: string;
  defaultApiHash?: string;
  onAccountAdded: () => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  defaultApiId = '22239448',
  defaultApiHash = '18f904bed04337c78b82e6faf8575259',
  onAccountAdded,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [apiId, setApiId] = useState(defaultApiId);
  const [apiHash, setApiHash] = useState(defaultApiHash);
  const [sessionId, setSessionId] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [twoFaPassword, setTwoFaPassword] = useState('');

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setErrorMessage('لطفاً شماره تلفن اکانت تلگرام جدید را وارد نمایید.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/accounts/add-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          apiId: apiId.trim() || defaultApiId,
          apiHash: apiHash.trim() || defaultApiHash,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در ارسال کد تایید به شماره وارد شده');
      }

      setSessionId(data.sessionId);
      setStep('code');
      setSuccessMessage('کد تایید ۵ رقمی تلگرام به شماره شما ارسال گردید.');
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ارتباط با سرور تلگرام');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneCode.trim()) {
      setErrorMessage('لطفاً کد تایید ارسالی را وارد فرمایید.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/accounts/add-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          phoneCode: phoneCode.trim(),
          password: twoFaPassword.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.requiresPassword) {
          throw new Error('حساب شما دارای رمز تایید دو مرحله‌ای (2FA) است. لطفاً رمز را وارد کنید.');
        }
        throw new Error(data.error || 'کد ورود نادرست است یا منقضی شده است.');
      }

      setSuccessMessage('اکانت جدید با موفقیت اضافه و به چرخش ارسال متصل شد.');
      setTimeout(() => {
        onAccountAdded();
        onClose();
        // Reset form
        setStep('phone');
        setPhoneNumber('');
        setPhoneCode('');
        setTwoFaPassword('');
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در تایید کد ورود');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md text-slate-100 shadow-2xl overflow-hidden relative">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">افزودن اکانت جدید تلگرام</h2>
              <p className="text-[11px] text-slate-400">اتصال شماره جدید جهت مشارکت در چرخش خودکار (Rotation)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4">

          {errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendCode} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-400" />
                  شماره تلفن اکانت جدید (با کد کشور):
                </label>
                <input
                  type="text"
                  placeholder="مثال: +989123456789"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors dir-ltr text-left"
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'در حال ارسال کد...' : 'دریافت کد تایید تلگرام'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-3.5">
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-xs text-indigo-300">
                کد تایید ۵ رقمی به تلگرام شماره <span className="font-bold dir-ltr inline-block">{phoneNumber}</span> ارسال شد.
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                  کد تایید ۵ رقمی تلگرام:
                </label>
                <input
                  type="text"
                  placeholder="12345"
                  maxLength={6}
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-center text-lg tracking-[0.4em] font-bold text-indigo-400 focus:outline-none transition-colors dir-ltr font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">
                  رمز عبور تایید دو مرحله‌ای 2FA (اختیاری):
                </label>
                <input
                  type="password"
                  placeholder="در صورت داشتن ۲FA وارد کنید"
                  value={twoFaPassword}
                  onChange={(e) => setTwoFaPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  تغییر شماره
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'در حال تایید...' : 'تایید و افزودن اکانت'}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

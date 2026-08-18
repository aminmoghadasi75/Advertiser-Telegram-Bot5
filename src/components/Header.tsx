import React, { useState, useRef } from 'react';
import { Send, Power, RefreshCw, ShieldCheck, AlertTriangle, Radio, LogOut, Save, Check, HardDrive, Download, Upload } from 'lucide-react';
import { TelegramCredentials, SchedulerConfig } from '../types';

interface HeaderProps {
  credentials: TelegramCredentials;
  scheduler: SchedulerConfig;
  onToggleAutoRun: (active: boolean) => void;
  onOpenAuth: () => void;
  onSendNow: () => void;
  onLogout: () => Promise<void>;
  isSendingNow: boolean;
  onSaveAll?: () => Promise<void>;
  isSavingAll?: boolean;
  lastSavedTime?: string | null;
  onRestoreState?: (newState: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  credentials,
  scheduler,
  onToggleAutoRun,
  onOpenAuth,
  onSendNow,
  onLogout,
  isSendingNow,
  onSaveAll,
  isSavingAll,
  lastSavedTime,
  onRestoreState,
}) => {
  const [internalSaving, setInternalSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManualSave = async () => {
    if (internalSaving || isSavingAll) return;
    setInternalSaving(true);
    try {
      if (onSaveAll) {
        await onSaveAll();
      } else {
        await fetch('/api/save-all', { method: 'POST' });
      }
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    } catch (e) {
      console.error(e);
      alert('خطا در ذخیره‌سازی اطلاعات. لطفاً اتصال سرور را بررسی کنید.');
    } finally {
      setInternalSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    window.location.href = '/api/download-backup';
  };

  const handleFileRestoreUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch('/api/restore-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.state && onRestoreState) {
          onRestoreState(data.state);
        }
        alert('✅ تمام اطلاعات، تنظیمات، گروه‌ها و کمپین‌ها با موفقیت از فایل پشتیبان بازیابی و فریز شدند!');
        window.location.reload();
      } else {
        const errData = await res.json();
        alert('خطا در بازیابی پشتیبان: ' + (errData.error || 'خطای ناشناخته'));
      }
    } catch (err: any) {
      console.error('Restore error:', err);
      alert('فایل پشتیبان نامعتبر است یا ساختار JSON صحیح نیست.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const isSaving = isSavingAll || internalSaving;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Logo and Brand */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-snug flex items-center gap-2">
                ربات تبلیغات تلگرام
                <span className="text-[11px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full font-medium">
                  UserBot v2.4
                </span>
              </h1>
              <p className="text-xs text-slate-400">ارسال خودکار محصولات و خدمات به گروه‌های هدف</p>
            </div>
          </div>

          {/* Account Status Badge (Mobile view) */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Mobile Save All Button */}
            <button
              onClick={handleManualSave}
              disabled={isSaving}
              className={`p-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${
                justSaved
                  ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                  : 'bg-indigo-600/30 border-indigo-500 text-indigo-200 hover:bg-indigo-600/50'
              }`}
              title="ذخیره ۱۰۰٪ کل اطلاعات"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-300" />
              ) : justSaved ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Save className="w-4 h-4 text-indigo-400" />
              )}
            </button>

            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
              style={{
                backgroundColor: credentials.isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderColor: credentials.isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                color: credentials.isConnected ? '#34d399' : '#f87171',
              }}
            >
              {credentials.isConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>متصل</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>تنظیمات حساب</span>
                </>
              )}
            </button>

            {(credentials.isConnected || credentials.apiId) && (
              <button
                onClick={onLogout}
                className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-1"
                title="خروج و بازنشانی نشست حساب"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Controls and Status Bar */}
        <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto justify-end">
          
          {/* 100% PERSISTENT SAVE ALL BUTTON */}
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 border ${
              justSaved
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400/50 shadow-emerald-950/50 ring-2 ring-emerald-500/40'
                : isSaving
                ? 'bg-indigo-900/80 text-indigo-200 border-indigo-700/60 shadow-indigo-950/50'
                : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-violet-500 text-white border-indigo-400/30 shadow-indigo-950/60 hover:shadow-indigo-900/80 hover:ring-1 hover:ring-indigo-400/40'
            }`}
            title="ذخیره قطعی و ۱۰۰٪ کل اطلاعات، دستورالعمل‌ها، ربات‌های چت ناشناس، کمپین‌ها و تنظیمات در دیسک سرور"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-200" />
                <span>در حال ذخیره‌سازی سرور...</span>
              </>
            ) : justSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-200 animate-bounce" />
                <span className="text-emerald-100">کل اطلاعات ذخیره شد ✓</span>
              </>
            ) : (
              <>
                <HardDrive className="w-3.5 h-3.5 text-indigo-200" />
                <span>ذخیره ۱۰۰٪ کل اطلاعات و تنظیمات</span>
              </>
            )}
          </button>

          {/* Download JSON Backup */}
          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm"
            title="دانلود فایل پشتیبان کامل JSON روی لپ‌تاپ برای حفظ صددرصدی داده‌ها"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">دانلود پشتیبان</span>
          </button>

          {/* Restore JSON Backup File Input */}
          <label
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm cursor-pointer"
            title="بارگذاری و بازیابی ۱۰۰٪ اطلاعات از فایل پشتیبان JSON ذخیره شده روی لپ‌تاپ"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">بازیابی پشتیبان</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileRestoreUpload}
            />
          </label>

          {/* Account Connection Status (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all hover:bg-slate-800"
              style={{
                backgroundColor: credentials.isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderColor: credentials.isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                color: credentials.isConnected ? '#34d399' : '#f87171',
              }}
            >
              {credentials.isConnected ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <div className="text-right">
                    <div className="font-bold flex items-center gap-1">
                      متصل به تلگرام
                      {credentials.userProfile?.username && (
                        <span className="text-[10px] text-emerald-300">(@{credentials.userProfile.username})</span>
                      )}
                      {credentials.botToken && (
                        <span className="text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.2 rounded font-mono">
                          + Bot API
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      API ID: {credentials.apiId || '---'}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <div className="text-right">
                    <div className="font-bold">تنظیمات اتصال / ورود به حساب</div>
                    <div className="text-[10px] text-slate-400">کلیک کنید تا کلیدها وارد شوند</div>
                  </div>
                </>
              )}
            </button>

            {(credentials.isConnected || credentials.apiId) && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium transition-all"
                title="خروج کامل و بازنشانی نشست تلگرام"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج از حساب</span>
              </button>
            )}
          </div>

          {/* Send Immediate Test Post */}
          <button
            onClick={onSendNow}
            disabled={isSendingNow}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-xs font-semibold transition-all disabled:opacity-50 active:scale-95"
            title="ارسال دستی و آنی تبلیغ به همه گروه‌های فعال"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSendingNow ? 'animate-spin text-sky-400' : ''}`} />
            <span>{isSendingNow ? 'در حال ارسال...' : 'ارسال آنی همین حالا'}</span>
          </button>

          {/* Master Auto-Post Switch */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-300 font-medium px-2 flex items-center gap-1.5">
              <Radio className={`w-3.5 h-3.5 ${scheduler.isAutoRunActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              ارسال خودکار:
            </span>

            <button
              onClick={() => onToggleAutoRun(!scheduler.isAutoRunActive)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
                scheduler.isAutoRunActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{scheduler.isAutoRunActive ? 'روشن (فعال)' : 'خاموش'}</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};

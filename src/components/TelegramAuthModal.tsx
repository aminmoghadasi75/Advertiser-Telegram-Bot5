import React, { useState } from 'react';
import { Key, Phone, Shield, ExternalLink, CheckCircle, AlertCircle, X, Lock, Sparkles, HelpCircle, LogOut, RefreshCw } from 'lucide-react';
import { TelegramCredentials } from '../types';

interface TelegramAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: TelegramCredentials;
  onSaveCredentials: (apiId: string, apiHash: string, phoneNumber: string, botToken?: string) => Promise<void>;
  onSendCode: (phoneNumber: string) => Promise<void>;
  onVerifyCode: (phoneCode: string, password?: string) => Promise<void>;
  onLogout: () => Promise<void>;
}

export const TelegramAuthModal: React.FC<TelegramAuthModalProps> = ({
  isOpen,
  onClose,
  credentials,
  onSaveCredentials,
  onSendCode,
  onVerifyCode,
  onLogout,
}) => {
  const [apiId, setApiId] = useState(credentials.apiId || '');
  const [apiHash, setApiHash] = useState(credentials.apiHash || '');
  const [phoneNumber, setPhoneNumber] = useState(credentials.phoneNumber || '');
  const [botToken, setBotToken] = useState(credentials.botToken || '');
  const [phoneCode, setPhoneCode] = useState('');
  const [twoFaPassword, setTwoFaPassword] = useState('');
  
  const [step, setStep] = useState<'credentials' | 'code' | 'connected'>(
    credentials.isConnected ? 'connected' : (credentials.phoneCodeHash ? 'code' : 'credentials')
  );

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [botTestTarget, setBotTestTarget] = useState('');
  const [botTesting, setBotTesting] = useState(false);

  // Synchronize state when credentials prop updates
  React.useEffect(() => {
    if (credentials.botToken) setBotToken(credentials.botToken);
    if (credentials.apiId) setApiId(credentials.apiId);
    if (credentials.apiHash) setApiHash(credentials.apiHash);
    if (credentials.phoneNumber) setPhoneNumber(credentials.phoneNumber);
  }, [credentials]);

  if (!isOpen) return null;

  const normalizeClientToken = (val: string) => {
    let clean = val.trim();
    if (/^[a-zA-Z0-9_-]+:\d+$/.test(clean)) {
      const parts = clean.split(':');
      clean = `${parts[1]}:${parts[0]}`;
    }
    return clean;
  };

  const handleSaveAndSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiId.trim() || !apiHash.trim()) {
      setErrorMessage('لطفاً API ID و API Hash را به طور کامل وارد کنید.');
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMessage('لطفاً شماره تلفن همراه اکانت تلگرام خود را وارد کنید.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await onSaveCredentials(apiId, apiHash, phoneNumber, normalizeClientToken(botToken));
      await onSendCode(phoneNumber);
      setStep('code');
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ثبت و ارسال کد تایید');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBotTokenOnly = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    const cleanTok = normalizeClientToken(botToken);
    setBotToken(cleanTok);

    try {
      await onSaveCredentials(apiId || credentials.apiId, apiHash || credentials.apiHash, phoneNumber || credentials.phoneNumber, cleanTok);
      setSuccessMessage('توکن ربات واسط (Bot API) با موفقیت در سیستم ذخیره گردید.');
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ذخیره توکن ربات');
    } finally {
      setLoading(false);
    }
  };

  const handleTestBotApi = async () => {
    const cleanTok = normalizeClientToken(botToken);
    if (!cleanTok) {
      setErrorMessage('لطفاً ابتدا توکن ربات واسط را وارد کنید.');
      return;
    }
    if (!botTestTarget.trim()) {
      setErrorMessage('لطفاً آیدی گروه/چت هدف جهت تست ارسال ربات را وارد کنید.');
      return;
    }

    setBotTesting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/send-direct-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          target: botTestTarget.trim(),
          botToken: cleanTok,
          useBotOnly: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`✅ ${data.message || 'پیام تست با موفقیت توسط ربات واسط ارسال گردید.'}`);
      } else {
        setErrorMessage(data.error || 'خطا در ارسال تست با ربات واسط');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'خطا در شبکه هنگام تست ربات واسط');
    } finally {
      setBotTesting(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneCode.trim()) {
      setErrorMessage('لطفاً کد تایید ۵ رقمی تلگرام را وارد کنید.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await onVerifyCode(phoneCode, twoFaPassword);
      setStep('connected');
    } catch (err: any) {
      setErrorMessage(err.message || 'کد تایید اشتباه است یا منقضی شده است.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl text-slate-100 shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">تنظیمات کلیدهای API و اتصال تلگرام</h2>
              <p className="text-xs text-slate-400">ورود به حساب تلگرام با API ID و API Hash اختصاصی</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Status Banner */}
          {credentials.isConnected ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between gap-3 text-emerald-400">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <div>
                  <div className="font-bold text-sm">حساب تلگرام شما با موفقیت متصل است</div>
                  <div className="text-xs text-emerald-300/80">
                    {credentials.userProfile?.firstName} {credentials.userProfile?.username ? `(@${credentials.userProfile.username})` : ''} ({credentials.phoneNumber})
                  </div>
                </div>
              </div>
              <button
                onClick={async () => {
                  setLoading(true);
                  await onLogout();
                  setLoading(false);
                  setStep('credentials');
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors"
              >
                خروج از حساب
              </button>
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-start gap-3 text-amber-300 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
              <div>
                برای اجرای ربات کاربر (UserBot) جهت ارسال پیام به گروه‌ها، نیاز به <span className="font-bold">api_id</span> و <span className="font-bold">api_hash</span> رسمی اکانت تلگرام خود دارید.
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* STEP 1: Enter API ID & API Hash & Phone Number */}
          {step === 'credentials' && !credentials.isConnected && (
            <form onSubmit={handleSaveAndSendCode} className="space-y-4">
              
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-sky-400" />
                  کلید API ID (شناسه عددی):
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  راهنمای دریافت api_id
                </button>
              </div>

              <input
                type="text"
                placeholder="مثال: 12345678"
                value={apiId}
                onChange={(e) => setApiId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors dir-ltr text-left"
              />

              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <Lock className="w-3.5 h-3.5 text-sky-400" />
                  کلید API Hash (کد ۳۲ کاراکتری):
                </label>
                <input
                  type="text"
                  placeholder="مثال: a1b2c3d4e5f67890123456789abcdef0"
                  value={apiHash}
                  onChange={(e) => setApiHash(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors dir-ltr text-left font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <Phone className="w-3.5 h-3.5 text-sky-400" />
                  شماره تلفن اکانت تلگرام (همراه با کد کشور):
                </label>
                <input
                  type="text"
                  placeholder="مثال: +989123456789"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors dir-ltr text-left"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'در حال ارتباط با سرور تلگرام...' : 'ذخیره کلیدها و دریافت کد تایید تلگرام'}
              </button>
            </form>
          )}

          {/* STEP 2: Enter Telegram OTP Code */}
          {step === 'code' && !credentials.isConnected && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3.5 text-xs text-sky-300">
                کد تایید ۵ رقمی به تلگرام شماره <span className="font-bold dir-ltr inline-block">{phoneNumber}</span> ارسال شد. لطفاً پیام‌های تلگرام خود را چک کرده و کد را وارد کنید.
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
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-center text-xl tracking-[0.5em] font-bold text-sky-400 focus:outline-none transition-colors dir-ltr"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">
                  رمز تایید دو مرحله‌ای ۲FA (در صورت وجود):
                </label>
                <input
                  type="password"
                  placeholder="رمز دو مرحله‌ای تلگرام (اختیاری)"
                  value={twoFaPassword}
                  onChange={(e) => setTwoFaPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2 text-xs text-white focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  ویرایش شماره و API
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'در حال برقراری اتصال...' : 'تایید کد و ورود به تلگرام'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Connected Summary & Re-configuration */}
          {credentials.isConnected && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">شناسه API ID:</span>
                  <span className="font-mono text-sky-400">{credentials.apiId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">شناسه API Hash:</span>
                  <span className="font-mono text-slate-300">
                    {credentials.apiHash ? credentials.apiHash.slice(0, 8) + '••••••••' : '---'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">شماره حساب:</span>
                  <span className="dir-ltr text-slate-200">{credentials.phoneNumber || '---'}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
              >
                بازگشت به داشبورد تبلیغات
              </button>
            </div>
          )}

          {/* BOT API HELPER SECTION (راهکار فوری برای گذر از اسپم‌بلاک و ۵۰۳) */}
          <div className="bg-slate-950/80 rounded-xl p-4 border border-sky-500/20 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-xs text-white">ربات واسط رسمی تلگرام (Bot API Helper)</span>
              </div>
              <span className="text-[10px] bg-sky-500/10 text-sky-300 border border-sky-500/20 px-2 py-0.5 rounded-full font-mono">
                راهکار ضد محدودیت اکانت
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              💡 <strong className="text-sky-300">چرا ربات واسط؟</strong> هنگامی که اکانت شخصی تلگرام شما دچار اسپم‌بلاک یا محدودیت (<span className="text-amber-400 font-mono">CHAT_WRITE_FORBIDDEN</span>) می‌شود، با فعال بودن این ربات، ارسال تبلیغات به گروه‌ها به صورت <strong className="text-emerald-400">۱۰۰٪ اتوماتیک از طریق ربات واسط</strong> ادامه می‌یابد!
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>توکن ربات تلگرام (Bot API Token):</span>
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  ساخت ربات در BotFather@
                </a>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  dir="ltr"
                  placeholder="مثال: 712345678:AAFg9xXyz..."
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'plaintext' }}
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={handleSaveBotTokenOnly}
                  disabled={loading}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1 flex-shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  ذخیره توکن
                </button>
              </div>
            </div>

            {/* Test Sending via Bot API */}
            {botToken && (
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <label className="text-[11px] font-medium text-slate-300 block">
                  تست فوری ارسال پیام کمپین با ربات واسط:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="آیدی گروه/کانال یا آیدی شخصی (مثال: @amin_moghadasi)"
                    value={botTestTarget}
                    onChange={(e) => setBotTestTarget(e.target.value)}
                    style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'plaintext' }}
                    className="flex-1 bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestBotApi}
                    disabled={botTesting}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1 flex-shrink-0"
                  >
                    {botTesting ? 'در حال تست...' : 'تست ارسال'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP-BY-STEP HELP GUIDE FOR API ID & API HASH */}
          {(showHelp || !credentials.isConnected) && (
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-xs text-sky-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  چگونه API ID و API Hash تلگرام دریافت کنیم؟
                </span>
                <a
                  href="https://my.telegram.org"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-sky-500/30 transition-colors"
                >
                  ورود به سایت my.telegram.org
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300 leading-relaxed">
                <li>به وب‌سایت رسمی تلگرام <strong className="text-sky-300">my.telegram.org</strong> مراجعه کنید.</li>
                <li>شماره تلفن همراه اکانت تلگرام خود را وارد کرده و کد تایید ارسالی به تلگرام را بزنید.</li>
                <li>پس از ورود، روی گزینه <strong className="text-sky-300">API development tools</strong> کلیک کنید.</li>
                <li>فرم ساخت اپلیکیشن (App Title و Short Name) را با دو کلمه دلخواه انگلیسی پر کنید.</li>
                <li>کد <strong className="text-emerald-400">App api_id</strong> (عددی) و <strong className="text-emerald-400">App api_hash</strong> (حروفی) را کپی کرده و در کادرهای بالا وارد کنید.</li>
              </ol>
            </div>
          )}

          {/* RESET / LOGOUT ACTION BOX (ALWAYS ACCESSIBLE) */}
          {(credentials.isConnected || credentials.sessionString || credentials.apiId) && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-400">نیاز به تعویض حساب یا پاکسازی نشست دارید؟</span>
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  await onLogout();
                  setLoading(false);
                  setStep('credentials');
                  setErrorMessage('');
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 font-semibold transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج و بازنشانی نشست</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

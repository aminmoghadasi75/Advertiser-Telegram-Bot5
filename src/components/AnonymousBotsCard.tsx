import React, { useState } from 'react';
import {
  AnonymousChatAutomatorConfig,
  AnonymousBotProfile,
  AnonymousChatInstructions,
  AnonymousChatSession,
  TelegramAccount,
  TelegramCredentials,
} from '../types';
import { AnonymousBotsListTab } from './anonymous/AnonymousBotsListTab';
import { AnonymousAiInstructionsTab } from './anonymous/AnonymousAiInstructionsTab';
import { AnonymousSimulatorTab } from './anonymous/AnonymousSimulatorTab';
import { AnonymousLiveMonitorTab } from './anonymous/AnonymousLiveMonitorTab';
import {
  Bot,
  Sparkles,
  Play,
  Square,
  Zap,
  MessageCircle,
  Repeat,
  Layers,
  Settings2,
  UserCheck,
  PlusCircle,
  CheckCircle2,
  Phone,
  ChevronDown,
  Download,
  FileText,
} from 'lucide-react';

interface AnonymousBotsCardProps {
  config?: AnonymousChatAutomatorConfig;
  activeSession?: AnonymousChatSession;
  history?: AnonymousChatSession[];
  isConnected: boolean;
  credentials?: TelegramCredentials;
  accounts?: TelegramAccount[];
  activeAccountId?: string;
  onSelectActiveAccount?: (accountId: string) => Promise<void>;
  onOpenAddAccountModal?: () => void;
  onOpenAuthModal?: () => void;
  onUpdateConfig: (config: Partial<AnonymousChatAutomatorConfig>) => Promise<void>;
  onSaveBot: (bot: AnonymousBotProfile) => Promise<void>;
  onDeleteBot: (botId: string) => Promise<void>;
  onStartAutomator: (botId?: string) => Promise<void>;
  onStopAutomator: () => Promise<void>;
  onNextStranger: () => Promise<void>;
  onSendManualMessage: (text: string) => Promise<void>;
  onClearHistory?: () => Promise<void>;
}

export const AnonymousBotsCard: React.FC<AnonymousBotsCardProps> = ({
  config,
  activeSession,
  history = [],
  isConnected,
  credentials,
  accounts = [],
  activeAccountId,
  onSelectActiveAccount,
  onOpenAddAccountModal,
  onOpenAuthModal,
  onUpdateConfig,
  onSaveBot,
  onDeleteBot,
  onStartAutomator,
  onStopAutomator,
  onNextStranger,
  onSendManualMessage,
  onClearHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'bots' | 'instructions' | 'simulator' | 'live_chat'>('bots');
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleQuickDownload = async () => {
    setIsDownloading(true);
    try {
      const url = `/api/anonymous/export-history`;
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `chat_conversations_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Quick download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const rawInstructions = config?.instructions;
  const instructions: AnonymousChatInstructions = {
    systemPrompt: `شما یک دختر ۲۰ ساله ایرانی به نام سارا، اهل تهران هستید که در یک بات چت ناشناس تلگرام در حال صحبت با یک فرد ناشناس هستید.

دستورالعمل‌ها:
۱. پاسخ‌های شما حتماً بسیار کوتاه، سریع و حداکثر ۱ الی ۲ جمله عامیانه تلگرامی باشد (مثل چت واقعی با کیبورد گوشی).
۲. لحن کاملاً خودمانی، صمیمی و طبیعی باشد (کلمات کتابی و رسمی مثل «درود» یا «امیدوارم» اکیداً ممنوع است).
۳. ابتدا سلام و احوال‌پرسی کن، بعد اگر اصل خواست بگو سارا ۲۰ تهران تو چند سالته؟
۴. هرگز نگو ربات هستی یا هوش مصنوعی؛ مثل یک آدم واقعی و پرانرژی صحبت کن.
۵. پیشوند «سارا:» یا علامت نقل‌قول در پاسخ نگذار و فقط خود پیام را ارسال کن.`,
    maxMessagesPerChat: 4,
    initiateGreetingOnConnect: true,
    initialGreetingText: 'سلام خوبی؟ 🌸',
    initialGreetings: ['سلام خوبی؟ 🌸', 'سلام چطوری؟', 'سلام روزت بخیر 🌸', 'سلام، خوبی؟ چه خبر؟'],
    greetingMode: 'single',
    greetingDelaySeconds: 0.8,
    enablePreExitFarewell: true,
    preExitFarewellText: 'عزیزم من دیگه باید برم، مراقب خودت باش 🌸👋',
    preExitFarewells: ['عزیزم من دیگه باید برم، مراقب خودت باش 🌸👋', 'فعلا من میرم، خوشحال شدم از آشناییت 👋🌸'],
    farewellMode: 'single',
    farewellDelaySeconds: 1.0,
    sendPromoBeforeExitAlways: true,
    replyDelaySeconds: 1.5,
    messageAggregationDelaySeconds: 1.5,
    silenceTimeoutSeconds: 30,
    enableSilenceNudge: true,
    silenceNudgeText: 'هستی؟ 🌸',
    inappropriateKeywords: ['بلاک', 'اسپم', 'کس نگو', 'فحش', 'گمشو', 'کص', 'کیر', 'جنده', 'سکس', 'سیکتیر'],
    customIgnoredSystemPhrases: [],
    ...(rawInstructions || {}),
    productPromotion: {
      enabled: true,
      productName: '',
      productDescription: '',
      imageUrl: '',
      contactHandleOrLink: '',
      sendMode: 'send_photo_with_caption_before_exit',
      sendAtMessageNumber: 3,
      ...(rawInstructions?.productPromotion || {}),
    },
  };

  const handleAccountChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const accId = e.target.value;
    if (!accId || !onSelectActiveAccount) return;
    setIsSwitchingAccount(true);
    try {
      await onSelectActiveAccount(accId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSwitchingAccount(false);
    }
  };

  const currentAccountName =
    credentials?.userProfile?.firstName ||
    accounts.find((a) => a.id === activeAccountId)?.userProfile?.firstName ||
    credentials?.phoneNumber ||
    'اکانت نامشخص';

  return (
    <div
      id="anonymous-bots-card"
      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-4"
      dir="rtl"
    >
      {/* 1. Header Banner & Master Run Button */}
      <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-violet-950/50 via-slate-900 to-fuchsia-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 text-violet-400 flex items-center justify-center shadow-lg shadow-violet-950/50 flex-shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-base text-white">اتوماسیون چت در ربات‌های ناشناس تلگرام</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                ترتیب کلیک‌ها + هوش مصنوعی Gemini
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              اجرای گام‌به‌گام دکمه‌های ورود ➔ تشخیص اتصال با جمله کلیدی ➔ مکالمه با هوش مصنوعی ➔ خروج با ترتیب کلیک‌ها و تکرار خودکار
            </p>
          </div>
        </div>

        {/* Master Start / Stop Button */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          {config?.isActive ? (
            <button
              id="stop-anon-automator-btn"
              onClick={onStopAutomator}
              className="px-5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-950/40 transition-all"
            >
              <Square className="w-4 h-4 text-red-400 fill-current" />
              <span>توقف اتوماسیون چت</span>
            </button>
          ) : (
            <button
              id="start-anon-automator-btn"
              onClick={() => onStartAutomator(config?.selectedBotId)}
              disabled={!isConnected}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
                isConnected
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/50 ring-1 ring-emerald-400/40'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>شروع چت با ناشناس‌ها</span>
            </button>
          )}
        </div>
      </div>

      {/* Account Selector Bar (1-Click Account Switcher for Anonymous Chat) */}
      <div className="mx-5 bg-slate-950/80 p-3.5 rounded-xl border border-violet-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">حساب تلگرام فعال جهت اجرای چت ناشناس:</div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>{currentAccountName}</span>
              {isConnected ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  متصل
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  قطع اتصال
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {accounts.length > 1 && (
            <div className="relative">
              <select
                aria-label="انتخاب اکانت فعال تلگرام"
                value={activeAccountId || accounts[0]?.id || ''}
                onChange={handleAccountChange}
                disabled={isSwitchingAccount}
                className="bg-slate-900 border border-slate-700 hover:border-violet-500 text-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none transition-colors cursor-pointer pl-8"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.userProfile?.firstName || 'اکانت'} ({acc.phoneNumber})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenAddAccountModal || onOpenAuthModal}
            className="px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>افزودن / مدیریت اکانت‌ها</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 px-5">
        <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800 text-center">
          <div className="text-[11px] text-slate-400">وضعیت اتوماسیون</div>
          <div className="text-xs font-bold mt-1 flex items-center justify-center gap-1.5">
            {config?.isActive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-emerald-400">در حال چت مداوم</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span className="text-slate-400">آماده به کار (متوقف)</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800 text-center flex flex-col justify-between">
          <div>
            <div className="text-[11px] text-slate-400">کل مکالمات ضبط‌شده</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {history.length || config?.stats?.totalChatsInitiated || 0} <span className="text-[10px] text-slate-400 font-normal">جلسه</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickDownload}
            disabled={isDownloading}
            className="mt-1.5 py-1 px-2 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
            title="دانلود فایل JSON شامل ساختار دستورالعمل‌ها و مکالمات"
          >
            <Download className="w-3 h-3" />
            <span>دانلود JSON مکالمات</span>
          </button>
        </div>

        <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800 text-center flex flex-col justify-center">
          <div>
            <div className="text-[11px] text-slate-400">پاسخ‌های دریافتی از ناشناس</div>
            <div className="text-sm font-bold text-violet-400 mt-0.5">
              {config?.stats?.totalRepliesFromStrangers || 0} <span className="text-[10px] text-slate-400 font-normal">پیام</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Tabs Navigation */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 pt-2 gap-2 overflow-x-auto no-scrollbar">
        <button
          id="tab-bots-btn"
          onClick={() => setActiveTab('bots')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'bots'
              ? 'border-violet-500 text-violet-300 bg-slate-900 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>۱. کلیک‌های ورود و خروج ربات ({config?.bots?.length || 0})</span>
        </button>

        <button
          id="tab-instructions-btn"
          onClick={() => setActiveTab('instructions')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'instructions'
              ? 'border-fuchsia-500 text-fuchsia-300 bg-slate-900 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>۲. دستورالعمل هوش مصنوعی چت</span>
        </button>

        <button
          id="tab-simulator-btn"
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'simulator'
              ? 'border-sky-500 text-sky-300 bg-slate-900 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>۳. تست و شبیه‌ساز چت</span>
        </button>

        <button
          id="tab-livechat-btn"
          onClick={() => setActiveTab('live_chat')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all flex items-center gap-2 whitespace-nowrap relative ${
            activeTab === 'live_chat'
              ? 'border-emerald-500 text-emerald-300 bg-slate-900 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>۴. مانیتور زنده و آرشیو ({history.length})</span>
          {activeSession && activeSession.status === 'chatting' && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 right-2" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-1">
        {activeTab === 'bots' && (
          <AnonymousBotsListTab
            config={config}
            onUpdateConfig={onUpdateConfig}
            onSaveBot={onSaveBot}
            onDeleteBot={onDeleteBot}
          />
        )}

        {activeTab === 'instructions' && (
          <AnonymousAiInstructionsTab
            instructions={instructions}
            onSaveInstructions={async (newInstructions) => {
              await onUpdateConfig({ instructions: newInstructions });
            }}
          />
        )}

        {activeTab === 'simulator' && <AnonymousSimulatorTab instructions={instructions} />}

        {activeTab === 'live_chat' && (
          <AnonymousLiveMonitorTab
            activeSession={activeSession}
            config={config}
            history={history}
            onNextStranger={onNextStranger}
            onSendManualMessage={onSendManualMessage}
            onClearHistory={onClearHistory}
          />
        )}
      </div>
    </div>
  );
};

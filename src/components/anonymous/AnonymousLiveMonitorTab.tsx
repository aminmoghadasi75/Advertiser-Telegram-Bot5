import React, { useState } from 'react';
import { AnonymousChatSession, AnonymousChatAutomatorConfig } from '../../types';
import {
  Zap,
  User,
  Bot,
  Send,
  SkipForward,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageCircle,
  LogOut,
  Sparkles,
  Download,
  FileText,
  FileCode,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
  History,
  Info,
} from 'lucide-react';

interface AnonymousLiveMonitorTabProps {
  activeSession?: AnonymousChatSession;
  config?: AnonymousChatAutomatorConfig;
  history?: AnonymousChatSession[];
  onNextStranger: () => Promise<void>;
  onSendManualMessage: (text: string) => Promise<void>;
  onClearHistory?: () => Promise<void>;
}

export const AnonymousLiveMonitorTab: React.FC<AnonymousLiveMonitorTabProps> = ({
  activeSession,
  config,
  history = [],
  onNextStranger,
  onSendManualMessage,
  onClearHistory,
}) => {
  const [manualText, setManualText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleSendManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim() || isSending) return;
    setIsSending(true);
    try {
      await onSendManualMessage(manualText.trim());
      setManualText('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'chatting':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>در حال گفتگو با کاربر ناشناس</span>
          </span>
        );
      case 'waiting_for_stranger':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-700/80 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>در انتظار اتصال به ناشناس...</span>
          </span>
        );
      case 'navigating_buttons':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-violet-950/80 text-violet-300 border border-violet-700/80 flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5" />
            <span>اجرای ترتیب کلیک‌های ورود به چت...</span>
          </span>
        );
      case 'exiting_chat':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-700/80 flex items-center gap-1.5">
            <LogOut className="w-3.5 h-3.5" />
            <span>اجرای کلیک‌های خروج از چت...</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
            آماده به کار (متوقف)
          </span>
        );
    }
  };

  // Combine active session and history sessions for inspection
  const allRecordedSessions: AnonymousChatSession[] = [];
  if (activeSession && activeSession.transcript && activeSession.transcript.length > 0) {
    allRecordedSessions.push(activeSession);
  }
  history.forEach((h) => {
    if (!allRecordedSessions.some((s) => s.id === h.id)) {
      allRecordedSessions.push(h);
    }
  });

  const handleDownloadReport = async (format: 'txt' | 'json') => {
    setIsDownloading(true);
    try {
      const url = `/api/anonymous/export-history?format=${format}`;
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `anonymous_chat_analysis_${new Date().toISOString().slice(0, 10)}.${format}`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyAllAnalysis = async () => {
    try {
      const res = await fetch('/api/anonymous/export-history?format=txt');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    } catch (err) {
      console.error('Copy error:', err);
    }
  };

  const handleCopySingleSession = async (session: AnonymousChatSession) => {
    const lines = [
      `=== مکالمه #${session.sessionIndex || 1} ===`,
      `زمان: ${session.startedAt ? new Date(session.startedAt).toLocaleTimeString('fa-IR') : ''}`,
      session.partnerProfileSnippet ? `مشخصات هم‌صحبت: ${session.partnerProfileSnippet}` : '',
      session.partnerTag ? `تگ کاربر: ${session.partnerTag}` : '',
      `تعداد پیام‌ها: ${session.aiMessagesCount || 0} پیام بات | ${session.strangerMessagesCount || 0} پیام مخاطب`,
      '--------------------------------',
    ].filter(Boolean);

    session.transcript?.forEach((m) => {
      let label = 'مخاطب';
      if (m.sender === 'me_melody') label = 'بات (هوش مصنوعی)';
      if (m.sender === 'operator_manual') label = 'اپراتور دستی';
      if (m.sender === 'bot_system') label = 'سیستم';
      lines.push(`[${label}]: ${m.text}`);
    });

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedSessionId(session.id);
      setTimeout(() => setCopiedSessionId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAllHistory = async () => {
    if (!confirm('آیا از پاکسازی تمامی تاریخچه مکالمات ضبط‌شده اطمینان دارید؟')) return;
    setIsClearing(true);
    try {
      if (onClearHistory) {
        await onClearHistory();
      } else {
        await fetch('/api/anonymous/clear-history', { method: 'POST' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsClearing(false);
    }
  };

  const maxMessages = config?.instructions?.maxMessagesPerChat || 4;
  const currentMessages = activeSession?.aiMessagesCount || 0;

  return (
    <div className="p-4 sm:p-5 space-y-5" dir="rtl">
      {/* ========================================================================= */}
      {/* 1. SESSION STATE HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shadow-inner">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-white">مانیتورینگ زنده مکالمه با مخاطب ناشناس</h3>
              {getStatusBadge(activeSession?.status)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              ربات: <strong className="text-violet-300">{activeSession?.botName || 'هایپرگپ'}</strong>
              {activeSession?.startedAt && ` • شروع: ${new Date(activeSession.startedAt).toLocaleTimeString('fa-IR')}`}
              {activeSession?.sessionIndex && ` • جلسه #${activeSession.sessionIndex}`}
              {activeSession?.status === 'chatting' && (
                <span className="text-emerald-400 font-bold mr-2">
                  (پیام {currentMessages} از {maxMessages})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={onNextStranger}
            className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow"
          >
            <SkipForward className="w-4 h-4" />
            <span>خروج و اتصال به نفر بعدی</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DEDICATED CONVERSATION ANALYSIS & DOWNLOAD TOOLBAR */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-violet-950/40 via-slate-900 to-indigo-950/40 p-4 rounded-2xl border border-violet-500/30 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center font-bold border border-violet-500/30">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xs sm:text-sm text-white">
                  دانلود و تحلیل مکالمات ضبط‌شده (Prompt Performance Analysis)
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {allRecordedSessions.length} مکالمه ثبت‌شده
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                دانلود تمام رفت‌وبرگشت‌ها، دستورالعمل فعال و عملکرد هوش مصنوعی از زمان زدن دکمه شروع تا توقف
              </p>
            </div>
          </div>

          {/* Download Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Download Clean Text Report (.TXT) */}
            <button
              id="download-anon-analysis-txt-btn"
              type="button"
              onClick={() => handleDownloadReport('txt')}
              disabled={isDownloading || allRecordedSessions.length === 0}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 disabled:opacity-40 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow"
              title="دانلود فایل متنی گزارش تحلیلی شامل پرامپت‌ها و ریز پیام‌ها"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>دانلود گزارش تحلیلی (.TXT)</span>
            </button>

            {/* Download Raw JSON Data (.JSON) */}
            <button
              id="download-anon-analysis-json-btn"
              type="button"
              onClick={() => handleDownloadReport('json')}
              disabled={isDownloading || allRecordedSessions.length === 0}
              className="px-3.5 py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 disabled:opacity-40 text-sky-300 border border-sky-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow"
              title="دانلود دیتای ساختاریافته JSON شامل تمامی آبجکت‌ها و تایم‌استمپ‌ها"
            >
              <FileCode className="w-3.5 h-3.5 text-sky-400" />
              <span>داده‌های خام (.JSON)</span>
            </button>

            {/* Quick Copy to Clipboard for immediate ChatGPT / Gemini evaluation */}
            <button
              type="button"
              onClick={handleCopyAllAnalysis}
              disabled={allRecordedSessions.length === 0}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
              title="کپی متن کامل گزارش در کلیپ‌بورد جهت الصاق در هوش مصنوعی یا تلگرام"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>کپی سریع متن آنالیز</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. LIVE CHAT WINDOW */}
      {/* ========================================================================= */}
      <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 h-[380px] overflow-y-auto space-y-3 flex flex-col justify-between shadow-inner">
        {activeSession && activeSession.transcript && activeSession.transcript.length > 0 ? (
          <div className="space-y-3 overflow-y-auto pr-1">
            {activeSession.transcript.map((msg, idx) => {
              const isMe = msg.sender === 'me_melody' || msg.sender === 'operator_manual';
              const isSystem = msg.sender === 'bot_system';

              if (isSystem) {
                return (
                  <div key={idx} className="flex justify-center my-2">
                    <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
                      <Bot className="w-3 h-3 text-violet-400" />
                      <span>{msg.text}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 ${isMe ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isMe
                        ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40 shadow'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {isMe ? <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" /> : <User className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed space-y-1 ${
                      isMe
                        ? msg.text.startsWith('[🖼')
                          ? 'bg-gradient-to-br from-fuchsia-950/80 to-slate-900 text-white border border-fuchsia-800/40 rounded-tl-none shadow-md'
                          : 'bg-slate-900 text-white border border-slate-800 rounded-tl-none'
                        : 'bg-slate-800 text-slate-100 rounded-tr-none'
                    }`}
                  >
                    {msg.text.startsWith('[🖼') && (
                      <div className="flex items-center gap-1 text-[10px] text-fuchsia-300 font-bold mb-1">
                        <span>📸 ارسال عکس و بنر تبلیغاتی محصول چت ناشناس</span>
                      </div>
                    )}
                    <div className="font-semibold whitespace-pre-wrap">{msg.text}</div>
                    <div className="text-[9px] text-slate-500 text-left pt-0.5">
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('fa-IR') : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-2">
            <MessageCircle className="w-10 h-10 opacity-40 text-slate-600" />
            <p className="text-xs">هنوز هیچ مکالمه فعالی شروع نشده است.</p>
            <p className="text-[11px] text-slate-600">
              دکمه «شروع چت با ناشناس‌ها» را از بالای صفحه بزنید تا ربات طبق ترتیب کلیک‌ها وارد چت شود.
            </p>
          </div>
        )}
      </div>

      {/* Manual Message Input */}
      <form onSubmit={handleSendManual} className="flex items-center gap-2">
        <input
          type="text"
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          placeholder="ارسال پیام دستی توسط اپراتور در این چت زنده..."
          disabled={!activeSession || activeSession.status !== 'chatting'}
          className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 disabled:opacity-50 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!manualText.trim() || isSending || !activeSession || activeSession.status !== 'chatting'}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-950/40"
        >
          <Send className="w-3.5 h-3.5" />
          <span>ارسال دستی</span>
        </button>
      </form>

      {/* ========================================================================= */}
      {/* 4. RECORDED SESSION HISTORY & IN-DEPTH TRANSCRIPT VIEWER */}
      {/* ========================================================================= */}
      <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-white">
                🗂 آرشیو و مشروح مکالمات انجام‌شده ({allRecordedSessions.length} جلسه)
              </h4>
              <p className="text-[11px] text-slate-400">
                مشاهده مستقیم متن صحبت‌ها، بررسی عملکرد پرامپت و کپی یا دانلود دیالوگ‌های هر مکالمه
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {allRecordedSessions.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllHistory}
                disabled={isClearing}
                className="px-3 py-1.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border border-rose-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="پاک کردن تمامی تاریخچه مکالمات ذخیره شده"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>پاکسازی آرشیو</span>
              </button>
            )}
          </div>
        </div>

        {allRecordedSessions.length === 0 ? (
          <div className="p-6 text-center text-slate-500 space-y-1 bg-slate-900/40 rounded-xl border border-slate-800/60">
            <Info className="w-6 h-6 mx-auto opacity-40 mb-2 text-slate-400" />
            <div className="text-xs text-slate-300 font-medium">هیچ تاریخچه‌ای هنوز ضبط نشده است.</div>
            <div className="text-[11px] text-slate-500">
              با شروع اتوماسیون، دیالوگ‌های رد و بدل شده با هر هم‌صحبت در اینجا ثبت و ذخیره می‌شوند.
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {allRecordedSessions.map((session, idx) => {
              const isExpanded = expandedSessionId === session.id;
              const isCopied = copiedSessionId === session.id;
              const sessionIndexNum = session.sessionIndex || allRecordedSessions.length - idx;
              const isActiveNow = activeSession?.id === session.id && activeSession?.status === 'chatting';

              return (
                <div
                  key={session.id || idx}
                  className={`rounded-xl border transition-all ${
                    isActiveNow
                      ? 'bg-slate-900/90 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                      : isExpanded
                      ? 'bg-slate-900/90 border-violet-500/40'
                      : 'bg-slate-900/50 hover:bg-slate-900/80 border-slate-800/80'
                  }`}
                >
                  {/* Session Summary Header */}
                  <div
                    onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-violet-600/30 text-violet-300 border border-violet-500/30 font-mono">
                        #{sessionIndexNum}
                      </span>

                      {isActiveNow && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          مکالمه جاری
                        </span>
                      )}

                      <span className="text-xs font-bold text-white">
                        {session.partnerProfileSnippet || 'کاربر ناشناس'}
                      </span>

                      {session.partnerTag && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          {session.partnerTag}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <span>
                        💬{' '}
                        <strong className="text-violet-300 font-mono">
                          {session.aiMessagesCount || 0}
                        </strong>{' '}
                        پاسخ بات |{' '}
                        <strong className="text-sky-300 font-mono">
                          {session.strangerMessagesCount || 0}
                        </strong>{' '}
                        پیام مخاطب
                      </span>

                      <span>
                        ⏰{' '}
                        {session.startedAt
                          ? new Date(session.startedAt).toLocaleTimeString('fa-IR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-violet-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Detailed Transcript */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-800/80 space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>
                            علت خروج:{' '}
                            <strong className="text-slate-200">
                              {session.exitReason === 'max_messages_reached'
                                ? 'اتمام سقف پیام‌ها'
                                : session.exitReason === 'stranger_silence'
                                ? 'سکوت مخاطب'
                                : session.exitReason === 'stranger_disconnected'
                                ? 'قطع اتصال توسط مخاطب'
                                : session.exitReason === 'manual_operator_skip'
                                ? 'رد کردن دستی'
                                : 'خاتمه عادی'}
                            </strong>
                          </span>
                          {session.promoSent && (
                            <span className="text-fuchsia-300 bg-fuchsia-950/50 border border-fuchsia-800/40 px-1.5 py-0.5 rounded text-[10px]">
                              🖼 تبلیغ ارسال شد
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopySingleSession(session);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 font-medium transition-colors"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">کپی شد</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-400" />
                              <span>کپی دیالوگ‌های این جلسه</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Message Bubbles */}
                      <div className="space-y-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 max-h-60 overflow-y-auto">
                        {!session.transcript || session.transcript.length === 0 ? (
                          <div className="text-xs text-slate-500 text-center py-2">
                            پیامی در این نشست تبادل نشد.
                          </div>
                        ) : (
                          session.transcript.map((m, mIdx) => {
                            const isMe = m.sender === 'me_melody' || m.sender === 'operator_manual';
                            const isSys = m.sender === 'bot_system';

                            if (isSys) {
                              return (
                                <div key={mIdx} className="text-center my-1">
                                  <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                    {m.text}
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={mIdx}
                                className={`flex items-start gap-2 ${
                                  isMe ? 'flex-row' : 'flex-row-reverse'
                                }`}
                              >
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold mt-0.5 ${
                                    isMe
                                      ? 'bg-violet-600/30 text-violet-300'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}
                                >
                                  {isMe ? 'بات' : 'مخاطب'}
                                </span>
                                <div
                                  className={`p-2 rounded-xl text-xs max-w-[80%] whitespace-pre-wrap ${
                                    isMe
                                      ? 'bg-slate-900 text-white border border-slate-800'
                                      : 'bg-slate-800 text-slate-200'
                                  }`}
                                >
                                  {m.text}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};


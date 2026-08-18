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
} from 'lucide-react';

interface AnonymousLiveMonitorTabProps {
  activeSession?: AnonymousChatSession;
  config?: AnonymousChatAutomatorConfig;
  onNextStranger: () => Promise<void>;
  onSendManualMessage: (text: string) => Promise<void>;
}

export const AnonymousLiveMonitorTab: React.FC<AnonymousLiveMonitorTabProps> = ({
  activeSession,
  config,
  onNextStranger,
  onSendManualMessage,
}) => {
  const [manualText, setManualText] = useState('');
  const [isSending, setIsSending] = useState(false);

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

  const maxMessages = config?.instructions?.maxMessagesPerChat || 4;
  const currentMessages = activeSession?.aiMessagesCount || 0;

  return (
    <div className="p-5 space-y-5" dir="rtl">
      {/* Session State Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
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
            className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/40 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <SkipForward className="w-4 h-4" />
            <span>خروج و اتصال به نفر بعدی</span>
          </button>
        </div>
      </div>

      {/* Live Chat Window */}
      <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 h-[400px] overflow-y-auto space-y-3 flex flex-col justify-between">
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
                        ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40'
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
    </div>
  );
};

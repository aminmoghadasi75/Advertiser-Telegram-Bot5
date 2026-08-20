import React, { useState } from 'react';
import { AnonymousChatInstructions } from '../../types';
import {
  MessageCircle,
  Sparkles,
  Send,
  RotateCcw,
  User,
  Zap,
  ShoppingBag,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';

interface AnonymousSimulatorTabProps {
  instructions: AnonymousChatInstructions;
}

export const AnonymousSimulatorTab: React.FC<AnonymousSimulatorTabProps> = ({
  instructions,
}) => {
  const [messages, setMessages] = useState<
    Array<{
      sender: 'stranger' | 'ai';
      text: string;
      imageUrl?: string;
      isPromo?: boolean;
      time: string;
    }>
  >([{ sender: 'ai', text: 'سلام چطوری؟ خوبی؟ 🌸', time: 'هم‌اکنون' }]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickPrompts = [
    'سلام اصل میدی؟',
    'سلام چطوری؟ خوبی؟',
    'اینستاگرامم اصلاً وصل نمیشه، تو فیلترشکن خوب سراغ داری؟',
    'چیکارا میکنی الان؟ مشغولی؟',
    'دختری یا پسر؟ کجایی هستی؟',
    'عکس میدی ببینمت؟',
    'آیدی یا کانال تلگرام داری؟',
    'رباتی یا آدم واقعی؟',
    'حالم اصلا خوب نیست دلم گرفته',
  ];

  const handleSendConsecutiveTest = async () => {
    if (isTyping) return;
    const batch = ['سلام چطوری؟', 'اصل میدی آشنا شیم؟', 'چیکارا میکنی الان؟'];
    const unifiedText = batch.join('\n');
    handleSend(unifiedText);
  };

  const handleSend = async (customText?: string) => {
    const userMsg = (customText || input).trim();
    if (!userMsg || isTyping) return;

    const newHistory = [
      ...messages,
      { sender: 'stranger' as const, text: userMsg, time: 'هم‌اکنون' },
    ];
    setMessages(newHistory);
    setInput('');
    setIsTyping(true);

    const currentAiCount = messages.filter((m) => m.sender === 'ai').length;
    const maxMsgs = instructions.maxMessagesPerChat || 4;
    const promo = instructions.productPromotion;

    const isFixedPromoStep =
      promo?.enabled &&
      ((promo.sendMode === 'send_photo_with_caption_before_exit' && currentAiCount >= maxMsgs - 1) ||
        (promo.sendMode === 'send_custom_card_at_step' && currentAiCount === (promo.sendAtMessageNumber || 2) - 1));

    try {
      if (isFixedPromoStep && promo) {
        if (instructions.enablePreExitFarewell !== false) {
          let farewellText = instructions.preExitFarewellText || 'خب عزیزم من کار برام پیش اومد باید برم، مراقب خودت باش 🌸';
          if (instructions.farewellMode === 'random_list' && instructions.preExitFarewells?.length) {
            farewellText = instructions.preExitFarewells[Math.floor(Math.random() * instructions.preExitFarewells.length)];
          }
          setMessages((prev) => [
            ...prev,
            {
              sender: 'ai' as const,
              text: farewellText,
              time: 'هم‌اکنون',
            },
          ]);
          await new Promise((r) => setTimeout(r, (instructions.farewellDelaySeconds || 1.2) * 1000));
        }

        let promoText = promo.productDescription || 'راستی این آفر ویژه رو ببین 🌸';
        if (promo.contactHandleOrLink && !promoText.includes(promo.contactHandleOrLink)) {
          promoText += `\n💬 ارتباط / کانال: ${promo.contactHandleOrLink}`;
        }
        await new Promise((r) => setTimeout(r, (instructions.replyDelaySeconds || 1) * 1000));
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai' as const,
            text: promoText,
            imageUrl: promo.imageUrl,
            isPromo: true,
            time: 'هم‌اکنون',
          },
        ]);
      } else {
        const res = await fetch('/api/anonymous/test-ai-simulation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            history: newHistory.map((m) => ({
              sender: m.sender === 'stranger' ? 'stranger' : 'me_melody',
              text: m.text,
            })),
            instructions,
          }),
        });

        const data = await res.json();
        const replyText = data.reply || 'مرسی منم خوبم، چیکارا میکنی؟';

        if (
          promo?.enabled &&
          promo.sendMode === 'ai_natural_mention' &&
          (data.shouldSendPromoCard || (data.promoMentioned && promo.aiSendBannerWithPitch !== false && promo.imageUrl))
        ) {
          // AI dynamically triggered promo in this turn
          let finalPromoText = replyText;
          if (promo.contactHandleOrLink && !finalPromoText.includes(promo.contactHandleOrLink)) {
            finalPromoText += `\n💬 آیدی: ${promo.contactHandleOrLink}`;
          }
          setMessages((prev) => [
            ...prev,
            {
              sender: 'ai' as const,
              text: finalPromoText,
              imageUrl: promo.imageUrl,
              isPromo: true,
              time: 'هم‌اکنون (معرفی هوشمند AI 🧠)',
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              sender: 'ai' as const,
              text: replyText,
              isPromo: Boolean(data.promoMentioned),
              time: data.promoMentioned ? 'هم‌اکنون (معرفی در متن 💬)' : 'هم‌اکنون',
            },
          ]);
        }
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai' as const,
          text: 'سلام عزیزم، منم خوبم تو چطوری؟',
          time: 'هم‌اکنون',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleReset = () => {
    setMessages([
      { sender: 'ai', text: 'سلام چطوری؟ خوبی؟ 🌸', time: 'هم‌اکنون' },
    ]);
    setInput('');
  };

  return (
    <div className="p-5 space-y-5" dir="rtl">
      {/* Overview */}
      <div className="bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">محیط شبیه‌ساز چت و تست زنده سناریو</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              در این بخش می‌توانید به عنوان یک کاربر ناشناس پیام بفرستید تا پاسخ‌های هوش مصنوعی و ارسال عکس محصول را آزمایش کنید.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          title="شروع مجدد شبیه‌ساز"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>شروع مجدد</span>
        </button>
      </div>

      {/* Quick Test Prompt Chips & Advanced Tests */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap pl-1">
          تست سریع پیام‌ها:
        </span>
        <button
          type="button"
          onClick={handleSendConsecutiveTest}
          disabled={isTyping}
          className="px-2.5 py-1 rounded-xl bg-indigo-950/60 border border-indigo-700/50 hover:bg-indigo-900/80 text-indigo-200 transition-all whitespace-nowrap text-[11px] font-semibold"
        >
          ⚡ تست تجمیع ۳ پیام متوالی
        </button>
        {quickPrompts.map((prompt, pIdx) => (
          <button
            key={pIdx}
            type="button"
            onClick={() => handleSend(prompt)}
            disabled={isTyping}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-sky-950/60 border border-slate-800 hover:border-sky-500/50 text-slate-300 hover:text-sky-200 transition-all whitespace-nowrap text-[11px]"
          >
            {prompt.includes('\n') ? 'چند خطی' : prompt}
          </button>
        ))}
      </div>

      {/* Chat Transcript Stage */}
      <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 h-[420px] overflow-y-auto space-y-3 flex flex-col justify-between">
        <div className="space-y-3 overflow-y-auto">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${
                m.sender === 'stranger' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  m.sender === 'stranger'
                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                    : m.isPromo
                    ? 'bg-fuchsia-500/30 text-fuchsia-200 border border-fuchsia-500/50'
                    : 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                }`}
              >
                {m.sender === 'stranger' ? <User className="w-3.5 h-3.5" /> : m.isPromo ? '🛍' : '🌸'}
              </div>

              <div
                className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed space-y-2 ${
                  m.sender === 'stranger'
                    ? 'bg-slate-800 text-white rounded-tr-none'
                    : m.isPromo
                    ? 'bg-gradient-to-br from-fuchsia-950/80 via-slate-900 to-violet-950/70 text-slate-100 border border-fuchsia-700/50 rounded-tl-none shadow-lg'
                    : 'bg-gradient-to-br from-violet-950/80 to-slate-900 text-slate-100 border border-violet-800/40 rounded-tl-none'
                }`}
              >
                {/* Promo Image if present */}
                {m.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950/60 p-1">
                    <img
                      src={m.imageUrl}
                      alt="محصول تبلیغاتی"
                      referrerPolicy="no-referrer"
                      className="max-h-48 w-full object-contain rounded-lg"
                    />
                  </div>
                )}

                <div className="font-semibold whitespace-pre-wrap">{m.text}</div>

                {m.sender === 'ai' && (
                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
                    <span className="flex items-center gap-1 text-fuchsia-300 font-medium">
                      <Sparkles className="w-3 h-3" />
                      {m.isPromo ? 'ارسال عکس و محصول تبلیغاتی چت ناشناس' : 'پاسخ هوش مصنوعی Gemini'}
                    </span>
                    <span className="text-slate-500">{m.time}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-fuchsia-400 p-2">
              <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-ping" />
              <span>هوش مصنوعی در حال بررسی و تولید پاسخ...</span>
            </div>
          )}
        </div>
      </div>

      {/* Input Box */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="پیام خود را به عنوان مخاطب ناشناس بنویسید و ارسال کنید..."
          disabled={isTyping}
          className="flex-1 bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-all shadow-inner"
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!input.trim() || isTyping}
          className="px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-sky-950/50 flex-shrink-0"
        >
          <Send className="w-4 h-4 rotate-180" />
          <span>ارسال تست</span>
        </button>
      </div>
    </div>
  );
};

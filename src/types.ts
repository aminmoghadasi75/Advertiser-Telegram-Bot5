export interface TelegramCredentials {
  apiId: string;
  apiHash: string;
  phoneNumber: string;
  botToken?: string;
  sessionString?: string;
  isConnected: boolean;
  phoneCodeHash?: string;
  userProfile?: {
    id: string;
    firstName: string;
    lastName?: string;
    username?: string;
    phone?: string;
  };
}

export interface TelegramAccount {
  id: string;
  phoneNumber: string;
  apiId?: string;
  apiHash?: string;
  sessionString: string;
  userProfile?: {
    id: string;
    firstName: string;
    lastName?: string;
    username?: string;
    phone?: string;
  };
  isActive: boolean; // Participates in round-robin auto-rotation
  dailySentCount: number;
  lastUsedAt?: string;
  floodWaitUntil?: number; // Epoch timestamp in ms
  status: 'active' | 'flood_wait' | 'disabled' | 'error';
  statusMessage?: string;
}

export interface TargetGroup {
  id: string;
  title: string;
  usernameOrLink: string; // e.g. @my_group or t.me/group_link or -100123456789
  isActive: boolean;
  memberCount?: number;
  status: 'joined' | 'pending' | 'failed' | 'not_joined';
  category?: string; // e.g. 'promotional' | 'exchange' | 'general'
  lastPostedAt?: string;
  lastPostedByAccountId?: string;
  lastPostedByAccountPhone?: string;
  errorMessage?: string;
}

export interface ProductCampaign {
  id: string;
  title: string;
  price: string;
  description: string;
  imageUrl: string; // Base64 data URL or HTTP URL
  contactHandle: string; // e.g. @MyStoreAdmin
  hashtags: string[];
  isActive: boolean;
  createdAt: string;
}

export interface AntiBotSettings {
  autoClickCaptcha: boolean; // کلیک خودکار روی دکمه شیشه‌ای "من ربات نیستم"
  autoForceJoinChannels: boolean; // جوین خودکار در کانال‌های اجباری گروه
  autoInviteContacts: boolean; // اد کردن رندوم مخاطبین تلگرام جهت باز کردن قفل
  contactsToInviteCount: number; // تعداد مخاطبین جهت اد کردن (مثلاً ۳ تا ۵)
  sendGreetingFirst?: boolean; // ارسال پیام تست اولیه ("سلام بچه ها") جهت تست ربات نگهبان
  greetingMessage?: string; // متن پیام تست اولیه (پیش‌فرض: "سلام بچه ها")
}

export interface SchedulerConfig {
  intervalMinutes: number; // Interval in minutes selected by user
  jitterSeconds: number; // Random offset to prevent detection (e.g., 40 to 60 sec)
  dailyLimit: number; // Max messages per day (e.g., 30-50/day)
  dailySentCount?: number; // Tracked count for current date
  dailyResetDate?: string; // e.g. '2026-08-11'
  nightModePause: boolean; // Pause between night hours (e.g., 01:00 AM to 07:00 AM)
  nightModeStartHour?: number; // Default 1 (1 AM)
  nightModeEndHour?: number; // Default 7 (7 AM)
  onlyPromotionalGroups?: boolean; // Send ads only to groups marked as promotional/exchange
  multiAccountDispatchMode?: 'parallel_multichannel' | 'sequential_rotation'; // ارسال همزمان بین اکانت‌ها یا چرخش نوبتی
  maxConcurrentAccounts?: number; // سقف تعداد اکانت‌های همزمان فعال
  isAutoRunActive: boolean; // Master switch
  antiBot?: AntiBotSettings;
  lastRunTime?: string;
  nextRunTime?: string;
  totalSentCount: number;
  totalSuccessCount: number;
  totalFailedCount: number;
}

export interface BroadcastAccountStat {
  accountId: string;
  accountPhone: string;
  accountName?: string;
  sentCount: number;
  failedCount: number;
  hitRateLimit?: boolean;
}

export interface ActiveBroadcastWorkerProgress {
  accountId: string;
  accountPhone: string;
  accountName?: string;
  currentGroupId?: string;
  currentGroupTitle?: string;
  status: 'idle' | 'preparing' | 'antibot_verifying' | 'sending' | 'cooldown' | 'flood_waited' | 'finished';
  sentSuccessCount: number;
  failedCount: number;
  lastAction?: string;
}

export interface ActiveBroadcastProgress {
  isRunning: boolean;
  startTime: string;
  totalGroups: number;
  completedGroups: number;
  successCount: number;
  failedCount: number;
  dispatchMode: 'parallel_multichannel' | 'sequential_rotation';
  workers: ActiveBroadcastWorkerProgress[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  groupTitle?: string;
  message: string;
  details?: string;
  campaignTitle?: string;
}

export interface GroupMonitoringReport {
  id: string;
  groupId: string;
  groupTitle: string;
  usernameOrLink: string;
  lastCheckedAt: string;
  step: 'JOINING' | 'GREETING_SENT' | 'ANTI_BOT_VERIFYING' | 'RE_TESTING' | 'CAMPAIGN_SENT' | 'MANUAL_REVIEW_NEEDED' | 'FAILED';
  botDetected: boolean;
  botTypeOrName?: string; // e.g. RoseBot, GroupHelp, Shield, CustomBot
  captchaClicked?: boolean;
  channelJoined?: boolean;
  contactsInvited?: number;
  statusMessage: string;
  requiresManualCheck: boolean; // Flag if manual check is needed
}

export interface BroadcastGroupDetail {
  groupId: string;
  groupTitle: string;
  usernameOrLink: string;
  status: 'success' | 'failed' | 'skipped';
  botDetected: boolean;
  botResolved: boolean;
  accountPhone?: string;
  accountName?: string;
  message?: string;
  postedAt?: string;
}

export interface BroadcastReport {
  id: string;
  timestamp: string;
  durationSeconds: number;
  campaignTitle: string;
  totalAttempted: number; // چند گروه اقدام شده
  successCount: number; // چند پیام موفق ثبت شده
  failedCount: number; // چند پیام ثبت نشده
  botDetectedCount: number; // تعداد کل گروه‌های دارای ربات ناظر
  botResolvedCount: number; // تعداد گروه‌های دارای بات که مانع آن‌ها حل شده و پیام به درستی ثبت شده
  accountsUsedCount: number;
  accountsList: string[];
  dispatchMode?: 'parallel_multichannel' | 'sequential_rotation';
  accountBreakdown?: BroadcastAccountStat[];
  details: BroadcastGroupDetail[];
}

export type BotButtonLocation = 'reply_keyboard' | 'inline_button' | 'text_command' | 'popup_ok' | 'any_location';
export type ButtonTriggerMode = 'after_delay' | 'on_any_message' | 'on_keyword_match' | 'on_popup_dialog';

export interface AnonymousBotButtonStep {
  id: string;
  label: string; // Text on button or command to send, e.g. "به یه ناشناس وصلم کن!" or "/start"
  buttonLocation: BotButtonLocation; // reply_keyboard (منوی پایین), inline_button (شیشه‌ای زیر پیام), text_command (دستور متنی), popup_ok (تایید دیالوگ), any_location
  triggerMode?: ButtonTriggerMode; // after_delay (بعد از تاخیر زمانی), on_any_message (بعد از دریافت هر پیام), on_keyword_match (بعد از کلیدواژه خاص)
  triggerKeyword?: string; // e.g. "جستجو"
  delaySeconds: number; // تاخیر به ثانیه قبل از زدن دکمه
  matchMode?: 'exact' | 'contains' | 'fuzzy';
  autoConfirmPopup?: boolean;
}

export interface AnonymousBotProfile {
  id: string;
  name: string; // e.g. 'ربات هایپر گپ (@HyperGap)'
  botUsername: string; // e.g. '@HyperGap'
  startCommand: string; // e.g. '/start'
  entrySteps: AnonymousBotButtonStep[]; // ترتیب کلیک‌ها و دکمه‌های ورود به چت
  connectionKeywords: string[]; // جملات کلیدی که نشان‌دهنده وصل شدن به ناشناس است
  exitSteps: AnonymousBotButtonStep[]; // ترتیب کلیک‌ها و دکمه‌های خروج از چت
  partnerDisconnectedKeywords: string[]; // جملات نشان‌دهنده خروج یا قطع شدن مخاطب
  notInChatKeywords?: string[]; // پیام‌های نشان‌دهنده خارج از چت بودن (مانند «متوجه نشدم 🤔»، «دستور نامعتبر») جهت شروع مجدد فرایند ورود
  alreadyInChatKeywords?: string[]; // پیام‌های خطای چت فعال (مانند «⚠️ خطا : هم اکنون شما در حال چت هستید !») جهت خروج فوری
  autoDismissPopups?: boolean;
  popupOkKeywords?: string[];
  fuzzyButtonMatching?: boolean;
  delayBetweenButtonsMs: number;
  enabled: boolean;
  notes?: string;
  customIgnoredKeywords?: string[]; // عبارات و پیام‌های سیستمی خاص ربات برای نادیده گرفتن
}

export interface AnonymousProductPromotion {
  enabled: boolean;
  productName: string; // عنوان محصول مثلاً «فیلترشکن اختصاصی پرسرعت»
  productDescription: string; // متن توضیحات و پیشنهاد محصول برای ناشناس
  imageUrl?: string; // آدرس تصویر بنر یا محصول
  contactHandleOrLink?: string; // آیدی کانال یا پشتیبانی مثلاً @FastVpnSupport
  sendMode: 'ai_natural_mention' | 'send_photo_with_caption_before_exit' | 'send_custom_card_at_step'; 
  sendAtMessageNumber?: number; // پیام شماره چند (پیش‌فرض پیام آخر یا ۲)
}

export interface AnonymousChatInstructions {
  systemPrompt: string; // دستورالعمل متنی کامل هوش مصنوعی برای نحوه صحبت با کاربر ناشناس
  maxMessagesPerChat: number; // تعداد پیامی که بات باید با کاربر صحبت کند قبل از خروج (مثلاً ۳ یا ۵)
  initiateGreetingOnConnect?: boolean; // ارسال خودکار پیام سلام/شروع به محض اتصال موفق به مخاطب ناشناس
  initialGreetingText?: string; // متن پیام شروع اولیه مثلاً «سلام خوبی؟ 🌸» یا «سلام چطوری؟»
  initialGreetings?: string[]; // لیست چندگانه متن‌های سلام برای ارسال تصادفی و چرخش پیام‌های شروع
  greetingMode?: 'single' | 'random_list'; // حالت ارسال سلام: تک پیام ثابت یا انتخاب تصادفی از لیست
  greetingDelaySeconds?: number; // تاخیر ارسال پیام سلام پس از اتصال (ثانیه، مثلاً ۰.۵ الی ۵)
  enablePreExitFarewell?: boolean; // ارسال متن خداحافظی دقیقا پس از رسیدن به سقف پیام و قبل از ارسال تبلیغ و خروج
  preExitFarewellText?: string; // متن پیام خداحافظی مثلاً «خب عزیزم من کار برام پیش اومد باید برم، مراقب خودت باش 🌸»
  preExitFarewells?: string[]; // لیست چندگانه متن‌های خداحافظی برای انتخاب تصادفی
  farewellMode?: 'single' | 'random_list'; // حالت ارسال خداحافظی: تک پیام ثابت یا انتخاب تصادفی از لیست
  farewellDelaySeconds?: number; // تاخیر بین پیام خداحافظی و پیام تبلیغاتی/خروج (ثانیه)
  sendPromoBeforeExitAlways?: boolean; // ارسال حتمی عکس و توضیحات کمپین تبلیغاتی در پایان چت قبل از خروج (در صورتی که قبلاً ارسال نشده باشد)
  replyDelaySeconds: number; // تاخیر شبیه‌سازی تایپ قبل از ارسال پاسخ (ثانیه)
  messageAggregationDelaySeconds?: number; // زمان انتظار برای تجمیع پیام‌های متوالی مخاطب قبل از پاسخ (ثانیه، مثلاً ۲.۵ الی ۳.۵)
  silenceTimeoutSeconds: number; // حداکثر زمان انتظار در صورت عدم پاسخ مخاطب (ثانیه)
  enableSilenceNudge: boolean; // ارسال پیام پیگیری در صورت سکوت مخاطب
  silenceNudgeText: string; // متن پیگیری مثلاً «هستی؟ 🌸»
  inappropriateKeywords: string[]; // کلیدواژه‌های نامناسب برای خروج فوری
  customIgnoredSystemPhrases?: string[]; // عبارات سیستمی ربات که نباید پیام مخاطب تلقی شوند
  productPromotion?: AnonymousProductPromotion; // محصول و عکس تبلیغاتی اختصاصی چت ناشناس
}

export interface AnonymousChatMessage {
  id: string;
  sender: 'bot_system' | 'stranger' | 'me_melody' | 'operator_manual';
  text: string;
  timestamp: string;
}

export interface AnonymousChatSession {
  id: string;
  botId: string;
  botUsername: string;
  botName: string;
  accountId: string;
  accountPhone: string;
  accountName?: string;
  partnerTag?: string; // شناسه یا تگ هم‌صحبت جاری (مثلاً /user_80Wazd)
  status: 'idle' | 'navigating_buttons' | 'waiting_for_stranger' | 'chatting' | 'exiting_chat' | 'ended' | 'failed';
  statusMessage?: string;
  exitReason?: 'max_messages_reached' | 'stranger_silence' | 'stranger_disconnected' | 'inappropriate_content' | 'manual_operator_skip' | 'bot_timeout';
  startedAt: string;
  connectedAt?: string;
  endedAt?: string;
  messagesCount: number;
  strangerMessagesCount: number;
  aiMessagesCount: number;
  promoSent?: boolean; // مشخص‌کننده اینکه آیا بنر و متن تبلیغاتی کمپین در این چت ارسال شده است یا خیر
  transcript: AnonymousChatMessage[];
}

export interface AnonymousChatAutomatorConfig {
  isActive: boolean;
  selectedBotId: string;
  bots: AnonymousBotProfile[];
  instructions: AnonymousChatInstructions;
  loopForever: boolean; // تکرار مداوم و رفتن خودکار به هم‌صحبت بعدی بعد از خروج
  cooldownBetweenChatsSeconds: number; // استراحت کوتاه بین چت‌ها (ثانیه)
  stats: {
    totalChatsInitiated: number;
    totalRepliesFromStrangers: number;
    lastActiveAt?: string;
  };
}

export interface AppState {
  credentials: TelegramCredentials;
  accounts?: TelegramAccount[];
  activeAccountId?: string;
  groups: TargetGroup[];
  campaigns: ProductCampaign[];
  scheduler: SchedulerConfig;
  logs: LogEntry[];
  monitoringReports?: GroupMonitoringReport[];
  lastBroadcastReport?: BroadcastReport;
  broadcastHistory?: BroadcastReport[];
  activeBroadcastProgress?: ActiveBroadcastProgress;
  anonymousAutomator?: AnonymousChatAutomatorConfig;
  activeAnonymousSession?: AnonymousChatSession;
  anonymousSessionHistory?: AnonymousChatSession[];
}


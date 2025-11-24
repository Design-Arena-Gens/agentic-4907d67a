"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type ToneOption = "friendly" | "fast" | "promo";

interface AutomationStep {
  id: number;
  trigger: string;
  response: string;
  tone: ToneOption;
  active: boolean;
  tags: string[];
}

const toneOptions: Record<
  ToneOption,
  { label: string; description: string; systemPrompt: string }
> = {
  friendly: {
    label: "لهجة ودودة",
    description: "أسلوب محادثي، شخصي، ويخلق علاقة مريحة مع العميل.",
    systemPrompt:
      "حافظ على نبرة بشوشة، أضف كلمات ترحيبية قصيرة، وقدّم حلولاً واضحة بدون إطالة."
  },
  fast: {
    label: "رد سريع",
    description:
      "مباشر ومختصر، مثالي لحالات دعم العملاء أو الردود المتكررة والمستعجلة.",
    systemPrompt:
      "ارسل الرد في جملة أو جملتين قصيرتين، مع توجيه المستخدم للخطوة التالية فوراً."
  },
  promo: {
    label: "نبرة ترويجية",
    description:
      "تركّز على إبراز قيمة العرض وتشجيع المستخدم على اتخاذ قرار الشراء.",
    systemPrompt:
      "اجعل الرسالة جذابة، مع إبراز العرض والمهلة الزمنية، دون مبالغة أو وعود غير واقعية."
  }
};

const tagOptions = [
  "ترحيب",
  "تأكيد الطلب",
  "دعم فني",
  "مبيعات",
  "استفسار عام",
  "تذكير متابعة"
];

const defaultSteps: AutomationStep[] = [
  {
    id: 1,
    trigger: "مرحبا",
    response:
      "أهلاً وسهلاً! 😊 يسعدنا التواصل معك. كيف نقدر نساعدك اليوم؟",
    tone: "friendly",
    active: true,
    tags: ["ترحيب"]
  },
  {
    id: 2,
    trigger: "سعر",
    response:
      "عرضنا الحالي يبدأ من 149 ريال ويتضمن شحن مجاني. هل تحب أرسل لك رابط الطلب؟",
    tone: "promo",
    active: true,
    tags: ["مبيعات"]
  },
  {
    id: 3,
    trigger: "تتبع",
    response:
      "بإمكاني أساعدك بتتبع الشحنة فوراً. أرسل رقم الطلب أو البريد الإلكتروني المسجّل وسأطلعك على الحالة.",
    tone: "fast",
    active: true,
    tags: ["دعم فني"]
  }
];

const quickTemplates: Array<Pick<AutomationStep, "trigger" | "response">> = [
  {
    trigger: "خصم",
    response:
      "استفد من كود الخصم INSTABOT واحصل على %15 لمدة 24 ساعة فقط! هل تود متابعة الطلب؟"
  },
  {
    trigger: "شحن",
    response:
      "الشحن المحلي يستغرق من 2 إلى 3 أيام عمل. أرسل لي المدينة لأتأكد من أقرب مركز توصيل لك."
  },
  {
    trigger: "تعاون",
    response:
      "يسعدنا التعاون معك! أرسل لنا نوع المحتوى الذي تقدمه وروابط الحسابات لنراجعها ونرد عليك خلال 24 ساعة."
  }
];

const integrationChecklist: Array<{
  title: string;
  description: string;
  hint: string;
  link: string;
}> = [
  {
    title: "تفعيل حساب مطوّر في Meta",
    description:
      "اربط حساب إنستغرام التجاري مع تطبيق Meta وفعّل صلاحية instagram_basic وinstagram_manage_messages.",
    hint: "يمكنك استخدام Meta for Developers لإنشاء تطبيق جديد أو إضافة الصلاحيات لتطبيقك الحالي.",
    link: "https://developers.facebook.com/docs/instagram-api"
  },
  {
    title: "إعداد Webhook آمن",
    description:
      "استقبل رسائل إنستغرام عبر webhook HTTPS مع تحقق من التوقيع (X-Hub-Signature-256) قبل معالجة أي رسالة.",
    hint: "استخدم سر التحقق verify_token كما هو مذكور في لوحة Meta مع تشفير متماثل.",
    link: "https://developers.facebook.com/docs/graph-api/webhooks"
  },
  {
    title: "تخزين السيناريوهات",
    description:
      "قم بتخزين الردود التلقائية في قاعدة بيانات أو ملف إعدادات مع إمكانية تحديثها دون إعادة النشر.",
    hint: "Supabase أو Firebase خياران سريعان للانطلاق، ويمكنك تحديث الردود من لوحة تحكم داخلية.",
    link: "https://supabase.com/docs/guides/database"
  },
  {
    title: "المراقبة والتحسين",
    description:
      "سجّل كل رسالة واردة والرد المصاحب لها لتقييم الأداء وتحسين الكلمات المفتاحية.",
    hint: "استخدم أدوات مراقبة مثل Vercel Cron أو Sentry لتنبيهك في حال فشل إرسال الرد.",
    link: "https://vercel.com/docs/cron-jobs/overview"
  }
];

const insights = [
  {
    label: "نسبة الرد التلقائي",
    value: "92%",
    trend: "+7%",
    caption: "من الرسائل الخاصة يتم الرد عليها في أقل من 10 ثوانٍ."
  },
  {
    label: "زيادة التحويلات",
    value: "3.4x",
    trend: "+1.1x",
    caption: "مقارنةً بالرد اليدوي على الاستفسارات حول الأسعار."
  },
  {
    label: "استفسارات مغلقة",
    value: "187",
    trend: "+23",
    caption: "تم حلها خلال آخر 7 أيام بواسطة الروبوت."
  }
];

const escapeForSnippet = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$")
    .replace(/"/g, '\\"');

const generateSnippet = (steps: AutomationStep[], tone: ToneOption) => {
  const activeSteps = steps.filter((step) => step.active);
  const stepsLiteral = activeSteps
    .map(
      (step) =>
        `  {\n    trigger: "${escapeForSnippet(step.trigger.toLowerCase())}",\n    response: "${escapeForSnippet(step.response)}",\n    tags: ${JSON.stringify(step.tags)}\n  }`
    )
    .join(",\n");

  return `import express from "express";
import crypto from "crypto";
import fetch from "node-fetch";

const router = express.Router();

const flows = [
${stepsLiteral}
];

const toneRule = "${escapeForSnippet(toneOptions[tone].systemPrompt)}";

router.post("/instagram/webhook", async (req, res) => {
  const signature = req.headers["x-hub-signature-256"];
  if (!verifySignature(signature, JSON.stringify(req.body))) {
    return res.sendStatus(403);
  }

  const messagingEvent = req.body.entry?.[0]?.messaging?.[0];
  const text = messagingEvent?.message?.text?.toLowerCase();

  if (!text) {
    return res.sendStatus(200);
  }

  const match = flows.find((flow) => text.includes(flow.trigger));

  if (!match) {
    return res.sendStatus(200);
  }

  const aiResponse = await renderResponse({
    toneRule,
    message: messagingEvent.message.text,
    reply: match.response,
    tags: match.tags
  });

  await sendInstagramReply(messagingEvent.sender.id, aiResponse);
  return res.sendStatus(200);
});

function verifySignature(signature, payload) {
  if (!process.env.META_APP_SECRET || !signature) return false;
  const hash = crypto
    .createHmac("sha256", process.env.META_APP_SECRET)
    .update(payload)
    .digest("hex");
  return signature === \`sha256=\${hash}\`;
}

async function renderResponse(context) {
  // استبدل هذا الطلب بنداء فعلي إلى واجهة LLM أو خدمة الذكاء الاصطناعي المفضلة لديك.
  return \`\${context.reply}\\n\\n(\${context.toneRule})\`;
}

async function sendInstagramReply(receiverId, text) {
  const url = \`https://graph.facebook.com/v19.0/\${receiverId}/messages\`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${process.env.META_PAGE_ACCESS_TOKEN}\`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_type: "RESPONSE",
      recipient: { id: receiverId },
      message: { text }
    })
  });

  if (!response.ok) {
    console.error(await response.text());
  }
}

export default router;
`;
};

const previewAvatar = {
  user:
    "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=80&h=80&q=80",
  bot: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=facearea&w=80&h=80&q=80"
};

interface PreviewMessage {
  role: "user" | "bot";
  text: string;
  delay: string;
}

const buildPreview = (steps: AutomationStep[]): PreviewMessage[] => {
  const activeSteps = steps.filter((step) => step.active);

  if (!activeSteps.length) {
    return [
      {
        role: "user",
        text: "مرحباً! هل هناك خصومات متوفرة اليوم؟",
        delay: "الآن"
      },
      {
        role: "bot",
        text:
          "ابدأ بإضافة كلمة مفتاحية في اللوحة اليسرى لتفعيل الردود التلقائية.",
        delay: "ثانية واحدة"
      }
    ];
  }

  return activeSteps.flatMap((step, index) => {
    const delay = `${index * 3 + 1} ثانية`;
    return [
      {
        role: "user",
        text: `رسالة الوارد تحتوي على "${step.trigger}"`,
        delay: "الآن"
      },
      {
        role: "bot",
        text: step.response,
        delay
      }
    ];
  });
};

export default function HomePage() {
  const [steps, setSteps] = useState<AutomationStep[]>(defaultSteps);
  const [selectedTone, setSelectedTone] = useState<ToneOption>("friendly");
  const [newTrigger, setNewTrigger] = useState("");
  const [newResponse, setNewResponse] = useState("");
  const [campaignName, setCampaignName] = useState("لوحة الردود الذكية");
  const [goal, setGoal] = useState("تحويل المتابعين إلى عملاء متواصلين");
  const [quickTemplateIndex, setQuickTemplateIndex] = useState(0);
  const [tagDraft, setTagDraft] = useState(tagOptions[0] ?? "ترحيب");
  const [copyStatus, setCopyStatus] = useState<"idle" | "success">("idle");
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const previewMessages = useMemo(() => buildPreview(steps), [steps]);
  const snippet = useMemo(
    () => generateSnippet(steps, selectedTone),
    [steps, selectedTone]
  );

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleAddStep = () => {
    const trimmedTrigger = newTrigger.trim();
    const trimmedResponse = newResponse.trim();
    if (!trimmedTrigger || !trimmedResponse) {
      return;
    }

    const nextId = Math.max(0, ...steps.map((step) => step.id)) + 1;
    setSteps((prev) => [
      ...prev,
      {
        id: nextId,
        trigger: trimmedTrigger,
        response: trimmedResponse,
        tone: selectedTone,
        active: true,
        tags: [tagDraft]
      }
    ]);

    setNewTrigger("");
    setNewResponse("");
  };

  const handleToggleStep = (id: number) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === id ? { ...step, active: !step.active } : step
      )
    );
  };

  const handleUpdateStep = (
    id: number,
    field: "trigger" | "response",
    value: string
  ) => {
    const sanitized = value.startsWith(" ") ? value.trimStart() : value;
    setSteps((prev) =>
      prev.map((step) =>
        step.id === id ? { ...step, [field]: sanitized } : step
      )
    );
  };

  const cycleQuickTemplate = () => {
    const nextIndex = (quickTemplateIndex + 1) % quickTemplates.length;
    const template = quickTemplates[nextIndex];
    setQuickTemplateIndex(nextIndex);
    setNewTrigger(template.trigger);
    setNewResponse(template.response);
    setTagDraft("مبيعات");
  };

  const handleCopySnippet = async () => {
    try {
      if (typeof navigator !== "undefined" && "clipboard" in navigator) {
        await navigator.clipboard.writeText(snippet);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = snippet;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopyStatus("success");
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopyStatus("idle");
      }, 3000);
    } catch (error) {
      console.error("فشل النسخ", error);
    }
  };

  return (
    <main className="page">
      <section className="hero">
        <div className="hero__badge">منصة جاهزة لردود إنستغرام الذكية</div>
        <h1 className="hero__title">
          صمّم روبوت رد تلقائي يعكس أسلوب علامتك على إنستغرام
        </h1>
        <p className="hero__subtitle">
          جهّز الكلمات المفتاحية والردود خلال دقائق، واربطها بواجهة Meta
          الرسمية مع تعليمات تكامل دقيقة، واحصل على سيناريوهات جاهزة
          للتخصيص الفوري.
        </p>
        <div className="hero__cta">
          <button className="button button--primary" onClick={cycleQuickTemplate}>
            إضافة قالب فوري
          </button>
          <span className="hero__cta-note">
            يتم تدوير القوالب المقترحة تلقائياً لتسريع بناء الحملة.
          </span>
        </div>
      </section>

      <section className="designer">
        <div className="panel panel--composer">
          <header className="panel__header">
            <div>
              <h2 className="panel__title">مُركّب الردود</h2>
              <p className="panel__subtitle">
                أبنِ سيناريوهات متعددة للقنوات داخل صندوق رسائل إنستغرام.
              </p>
            </div>
            <div className="tone-selector">
              {(Object.keys(toneOptions) as ToneOption[]).map((toneKey) => {
                const option = toneOptions[toneKey];
                return (
                  <button
                    key={toneKey}
                    className={`tone-selector__item${
                      selectedTone === toneKey ? " tone-selector__item--active" : ""
                    }`}
                    onClick={() => setSelectedTone(toneKey)}
                    type="button"
                  >
                    <span className="tone-selector__label">{option.label}</span>
                    <span className="tone-selector__hint">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </header>

          <div className="form-section">
            <label className="form-field">
              <span className="form-field__label">اسم الحملة</span>
              <input
                value={campaignName}
                onChange={(event) => setCampaignName(event.target.value)}
                className="input"
                placeholder="مثال: ردود عروض الجمعة البيضاء"
              />
            </label>
            <label className="form-field">
              <span className="form-field__label">الهدف الرئيسي</span>
              <input
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                className="input"
                placeholder="حدد النتيجة التي تسعى للوصول إليها"
              />
            </label>
          </div>

          <div className="steps">
            <div className="steps__header">
              <h3 className="steps__title">القواعد الحالية</h3>
              <span className="steps__counter">{steps.length} قاعدة مفعّلة</span>
            </div>
            <ul className="steps__list">
              {steps.map((step) => (
                <li
                  key={step.id}
                  className={`step-card${step.active ? " step-card--active" : ""}`}
                >
                  <header className="step-card__header">
                    <button
                      type="button"
                      className={`toggle${step.active ? " toggle--on" : ""}`}
                      onClick={() => handleToggleStep(step.id)}
                    >
                      <span className="toggle__dot" />
                    </button>
                    <span className="step-card__badge">{step.tags.join("، ")}</span>
                  </header>
                  <label className="form-field">
                    <span className="form-field__label">الكلمة المفتاحية</span>
                    <input
                      value={step.trigger}
                      onChange={(event) =>
                        handleUpdateStep(step.id, "trigger", event.target.value)
                      }
                      className="input input--inline"
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-field__label">الرد التلقائي</span>
                    <textarea
                      value={step.response}
                      onChange={(event) =>
                        handleUpdateStep(step.id, "response", event.target.value)
                      }
                      className="textarea"
                      rows={3}
                    />
                  </label>
                  <p className="step-card__footer">
                    يتم إرسال الرد خلال ثانيتين وفق سياق{" "}
                    <strong>{toneOptions[step.tone].label}</strong>.
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="new-rule">
            <h3 className="new-rule__title">إضافة قاعدة جديدة</h3>
            <div className="new-rule__grid">
              <label className="form-field">
                <span className="form-field__label">كلمة مفتاحية</span>
                <input
                  value={newTrigger}
                  onChange={(event) => setNewTrigger(event.target.value)}
                  className="input"
                  placeholder="مثل: توفر، موعد، خصم"
                />
              </label>
              <label className="form-field">
                <span className="form-field__label">وسم تنظيمي</span>
                <select
                  value={tagDraft}
                  onChange={(event) => setTagDraft(event.target.value)}
                  className="input input--select"
                >
                  {tagOptions.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="form-field form-field--full">
              <span className="form-field__label">نص الرد</span>
              <textarea
                value={newResponse}
                onChange={(event) => setNewResponse(event.target.value)}
                className="textarea"
                rows={4}
                placeholder="اكتب الرد الذي ترغب في إرساله عند التقاط الكلمة المفتاحية."
              />
            </label>
            <div className="new-rule__actions">
              <button className="button button--ghost" onClick={cycleQuickTemplate}>
                اقتراح آخر
              </button>
              <button className="button button--primary" onClick={handleAddStep}>
                حفظ القاعدة
              </button>
            </div>
          </div>
        </div>

        <div className="panel panel--preview">
          <header className="panel__header panel__header--stacked">
            <div>
              <h2 className="panel__title">محاكاة صندوق الرسائل</h2>
              <p className="panel__subtitle">
                راقب كيف يظهر الرد للمستخدم النهائي وتأكد من ملاءمة النبرة.
              </p>
            </div>
            <div className="summary">
              <div className="summary__item">
                <span className="summary__label">الحملة</span>
                <span className="summary__value">{campaignName || "حملة جديدة"}</span>
              </div>
              <div className="summary__item">
                <span className="summary__label">الهدف</span>
                <span className="summary__value">{goal || "لم يتم التحديد"}</span>
              </div>
              <div className="summary__item">
                <span className="summary__label">الردود المفعّلة</span>
                <span className="summary__value">
                  {steps.filter((step) => step.active).length}
                </span>
              </div>
            </div>
          </header>

          <div className="preview">
            <div className="preview__phone">
              <div className="preview__screen">
                <div className="preview__header">
                  <span className="preview__status">إنستغرام مباشر</span>
                  <div className="preview__dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
                <div className="preview__conversation">
                  {previewMessages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`bubble bubble--${message.role}`}
                    >
                      <div className="bubble__meta">
                        <Image
                          src={previewAvatar[message.role]}
                          alt={message.role === "user" ? "العميل" : "الروبوت"}
                          className="bubble__avatar"
                          width={26}
                          height={26}
                        />
                        <span className="bubble__role">
                          {message.role === "user" ? "العميل" : "روبوتك"}
                        </span>
                        <span className="bubble__delay">{message.delay}</span>
                      </div>
                      <p className="bubble__text">{message.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="snippet">
            <div className="snippet__header">
              <div>
                <h3 className="snippet__title">تكامل Node.js جاهز</h3>
                <p className="snippet__subtitle">
                  استخدم المقطع في خادم Next.js API Route أو Edge Function بعد ضبط
                  مفاتيح Meta.
                </p>
              </div>
              <button className="button button--secondary" onClick={handleCopySnippet}>
                {copyStatus === "success" ? "تم النسخ ✅" : "نسخ الكود"}
              </button>
            </div>
            <pre className="snippet__code">
              <code>{snippet}</code>
            </pre>
          </div>
        </div>
      </section>

      <section className="guides">
        <h2 className="guides__title">خطوات التكامل السريع</h2>
        <p className="guides__subtitle">
          اتبع الخطوات التالية لتوصيل الروبوت مع واجهات Meta الرسمية وتشغيله في
          بيئة الإنتاج.
        </p>
        <div className="guide-grid">
          {integrationChecklist.map((step) => (
            <article key={step.title} className="guide-card">
              <header className="guide-card__header">
                <h3 className="guide-card__title">{step.title}</h3>
                <a className="guide-card__link" href={step.link} target="_blank">
                  قراءة الدليل ↗
                </a>
              </header>
              <p className="guide-card__description">{step.description}</p>
              <p className="guide-card__hint">{step.hint}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="insights">
        <h2 className="insights__title">مؤشرات الأداء المباشر</h2>
        <div className="insights__grid">
          {insights.map((item) => (
            <div key={item.label} className="insight-card">
              <div className="insight-card__value">
                <span>{item.value}</span>
                <small>{item.trend}</small>
              </div>
              <p className="insight-card__label">{item.label}</p>
              <p className="insight-card__caption">{item.caption}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <div className="footer__content">
          <h2 className="footer__title">استعد للرد على كل رسالة في اللحظة المناسبة</h2>
          <p className="footer__subtitle">
            أنشئ البنية الأساسية خلال دقائق، واربطها بمصادر بياناتك، ثم تابع
            الأداء من خلال لوحة تحكم موحّدة.
          </p>
        </div>
        <div className="footer__actions">
          <a className="button button--primary" href="#start">
            ابدأ الإطلاق
          </a>
          <a className="button button--ghost" href="mailto:hello@agentic.bot">
            احجز جلسة استشارية
          </a>
        </div>
      </footer>
    </main>
  );
}

# ندوة الاحتراف — Webinar Landing Page

مشروع صفحة هبوط كامل لتسجيل المستخدمين في ندوة مجانية، مبني بـ HTML5 / CSS3 / Vanilla JavaScript، مع خلفية Google Apps Script + Google Sheets، وجاهز للرفع داخل منصة **سلة (Salla)** أو أي استضافة Static.

---

## 📁 هيكل المشروع

```
webinar-project/
├── index.html          → الصفحة الرئيسية (صفحة الهبوط)
├── thank-you.html       → صفحة الشكر بعد التسجيل
├── css/style.css        → التنسيقات الكاملة
├── js/app.js            → كل منطق الجافاسكربت (عداد، نموذج، سلايدر، إلخ)
├── apps-script/Code.gs  → السكربت الخلفي (Google Apps Script)
├── assets/               → الصور، الأيقونات، الشعار
├── robots.txt
└── README.md
```

> **ملاحظة معمارية مهمة:** بدلاً من استخدام Google Form، يرسل النموذج البيانات مباشرة عبر `fetch()` إلى Google Apps Script المنشور كـ Web App، والذي يكتبها في Google Sheets. هذا يمنحك تحكمًا كاملاً بالتصميم والتحقق من الأخطاء ومنع التكرار، وهو ما لا يوفره Google Form الجاهز.

---

## 1) إنشاء ملف Google Sheets

1. افتح [Google Sheets](https://sheets.google.com) وأنشئ ملفًا جديدًا فارغًا.
2. سمِّه مثلًا: `Webinar Registrations`.
3. لا تحتاج لإنشاء أي أعمدة يدويًا — السكربت سينشئها تلقائيًا أول مرة يعمل فيها.

---

## 2) نشر Google Apps Script

1. من داخل ملف الشيت، اذهب إلى **الإضافات (Extensions) → Apps Script**.
2. احذف أي كود موجود بالافتراض، وانسخ محتوى ملف `apps-script/Code.gs` بالكامل والصقه.
3. عدّل الإعدادات في أعلى الملف:
   ```js
   var CONFIG = {
     SHEET_NAME: 'Registrations',
     ADMIN_EMAIL: 'admin@example.com',       // بريدك لاستقبال إشعارات التسجيل
     WEBINAR_NAME: 'ندوة الاحتراف المجانية',
     WEBINAR_DATE_TEXT: 'الأحد 10 أغسطس 2026 - الساعة 7:00 مساءً',
     WEBINAR_JOIN_LINK: 'https://example.com/live',
     SEND_ADMIN_NOTIFICATION: true
   };
   ```
4. احفظ المشروع (Ctrl+S) وسمِّه مثلًا `Webinar Backend`.
5. من الأعلى اضغط **نشر (Deploy) → نشر جديد (New deployment)**.
6. اختر نوع النشر: **Web app**.
7. الإعدادات:
   - **Execute as:** Me (حسابك)
   - **Who has access:** Anyone
8. اضغط **Deploy**، وسيطلب منك Google صلاحيات — وافق عليها (Authorize access).
9. بعد النشر، ستحصل على رابط شبيه بـ:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
   **انسخ هذا الرابط** — ستحتاجه في الخطوة التالية.

> **ملاحظة:** في كل مرة تُعدّل فيها الكود، يجب عمل **Deploy → Manage deployments → تعديل (Edit) → New version** حتى تنعكس التعديلات على الرابط المنشور.

---

## 3) ربط الرابط داخل JavaScript

1. افتح ملف `js/app.js`.
2. ابحث عن السطر التالي داخل `CONFIG`:
   ```js
   APPS_SCRIPT_URL: 'https://script.google.com/macros/s/PASTE_YOUR_DEPLOYMENT_ID_HERE/exec',
   ```
3. استبدله بالرابط الذي نسخته في الخطوة السابقة.
4. عدّل أيضًا:
   ```js
   WEBINAR_DATE_ISO: '2026-08-10T19:00:00+03:00',   // تاريخ ووقت الندوة (لتوقيت العداد التنازلي)
   WHATSAPP_LINK: 'https://chat.whatsapp.com/PASTE_YOUR_INVITE_LINK_HERE',
   CALENDAR_EVENT: { title, details, location, durationMinutes }
   ```
5. تأكد أن `WEBINAR_DATE_ISO` في `app.js` مطابق لـ `WEBINAR_DATE_TEXT` و `startDate` في `<script type="application/ld+json">` داخل `index.html`.

---

## 4) رفع المشروع على منصة سلة (Salla)

هناك طريقتان:

### الطريقة الأولى — صفحة مخصصة داخل الثيم
1. ادخل إلى لوحة تحكم سلة → **المتجر → الثيمات → تحرير الثيم (Theme Editor)**.
2. أنشئ صفحة جديدة (Custom Page) وضع بها محتوى `index.html` (الجزء الداخلي فقط من `<body>`)، أو استخدم قسم **Custom HTML**.
3. ارفع ملف `style.css` إلى إعدادات CSS المخصصة في الثيم (Theme → Custom CSS)، أو أضفه كـ `<link>` بعد رفعه إلى مضيف ملفات (مثل GitHub Pages أو Cloudflare Pages).
4. أضف كود `app.js` داخل قسم **Custom JavaScript** في إعدادات الثيم.

### الطريقة الثانية — استضافة خارجية + Iframe أو رابط مستقل
1. ارفع مجلد المشروع بالكامل إلى استضافة Static مجانية مثل **GitHub Pages**, **Cloudflare Pages**, أو **Netlify**.
2. احصل على رابط الصفحة (مثال: `https://username.github.io/webinar-project/`).
3. استخدم هذا الرابط كصفحة هبوط مستقلة لحملاتك الإعلانية (Google Ads / Meta Ads)، أو اربطه بدومين فرعي (Subdomain) من داخل سلة.

> **الأسهل والأكثر استقرارًا لصفحات الحملات الإعلانية:** استضافة خارجية (GitHub Pages مجانية 100%) مع ربط دومين فرعي مثل `webinar.yourstore.com`.

---

## 5) ربط Google Tag Manager (GTM)

1. أنشئ حاوية (Container) جديدة على [tagmanager.google.com](https://tagmanager.google.com).
2. انسخ كود GTM (الجزء الخاص بـ `<head>` والجزء الخاص بـ `<body>`).
3. افتح `index.html` و `thank-you.html`، وابحث عن التعليقات:
   ```html
   <!-- Google Tag Manager -->
   ```
   و
   ```html
   <!-- Google Tag Manager (noscript) -->
   ```
4. أزل علامات التعليق `<!-- -->` والصق معرف الحاوية `GTM-XXXXXXX` الخاص بك.

---

## 6) ربط GA4 (عبر GTM أو مباشرة)

**الطريقة المفضلة:** أضف Tag من نوع **Google Analytics: GA4 Configuration** داخل GTM نفسه، وفعّله عند حدث `All Pages`. لا حاجة لتعديل الكود.

**أو مباشرة:** افتح `index.html`، ابحث عن تعليق `<!-- GA4 -->` داخل `<head>`، أزل التعليق، وضع معرف القياس `G-XXXXXXXXXX` الخاص بك.

الأحداث الجاهزة في `app.js` والتي ستظهر في `dataLayer`:
`page_view`, `start_registration`, `submit_registration`, `registration_success`, `button_click`, `countdown_finished`, `video_play`, `scroll_depth`.

يمكنك ربط أي منها بـ **Trigger مخصص (Custom Event)** داخل GTM لإرسالها إلى GA4 كـ Events.

---

## 7) ربط Meta Pixel (فيسبوك)

**عبر GTM (مفضّل):** استخدم قالب **Facebook Pixel** الجاهز من GTM Community Templates.

**أو مباشرة:** في `index.html`، أزل التعليق عن قسم:
```html
<!-- Meta Pixel (اختياري إذا لم تستخدم GTM) -->
```
وضع `YOUR_PIXEL_ID` الخاص بك. حدث `fbq('track', 'Lead')` مفعّل تلقائيًا في `app.js` عند نجاح التسجيل.

---

## 8) ربط TikTok Pixel

نفس الفكرة: أزل التعليق عن قسم **TikTok Pixel** في `index.html` وضع معرف البكسل `YOUR_TIKTOK_PIXEL_ID`. حدث `CompleteRegistration` مفعّل تلقائيًا عند نجاح التسجيل.

---

## 9) ربط Snap Pixel و LinkedIn Insight (اختياري)

نفس الأسلوب — أزل التعليق عن الأقسام المخصصة لكل منصة داخل `<head>` في `index.html`، وضع المعرفات الخاصة بك (`YOUR_SNAP_PIXEL_ID`, `YOUR_PARTNER_ID`).

---

## 10) تخصيص النصوص والألوان

### النصوص
كل النصوص موجودة مباشرة داخل `index.html` و `thank-you.html` بصيغة HTML عادية — عدّل العناوين والفقرات والأسئلة الشائعة مباشرة داخل الملفين.

### الألوان
كل الألوان معرّفة كمتغيرات CSS في أعلى ملف `css/style.css`:
```css
:root{
  --color-bg:      #FAF7F1;  /* الخلفية الكريمية */
  --color-bg-dark: #14110D;  /* الأسود الدافئ */
  --color-gold:    #A9814A;  /* الذهبي المميز */
  --color-brown:   #6B5642;  /* البني الدافئ */
  ...
}
```
غيّر القيم هنا فقط، وستتحدث كل عناصر الصفحة تلقائيًا لأن كل الأنماط تستخدم هذه المتغيرات.

### الصور
استبدل الملفات داخل `assets/images/` بنفس الأسماء المستخدمة في الكود (`speaker.jpg`, `speaker-portrait.jpg`, `testimonial-1.jpg`, `og-cover.jpg`, `favicon.png`)، أو غيّر المسارات في الكود لتطابق ملفاتك.

---

## 11) اختبار المشروع محليًا

يمكنك فتح `index.html` مباشرة في المتصفح، أو تشغيل خادم محلي بسيط:
```bash
npx serve .
```
ثم افتح الرابط الذي يظهر في الطرفية.

---

## 12) قائمة تحقق قبل الإطلاق (Pre-launch Checklist)

- [ ] تحديث `APPS_SCRIPT_URL` في `app.js`
- [ ] تحديث `WEBINAR_DATE_ISO` في `app.js` ومطابقته مع `index.html`
- [ ] تحديث رابط واتساب `WHATSAPP_LINK`
- [ ] تحديث رابط الانضمام الفعلي `WEBINAR_JOIN_LINK` في `Code.gs`
- [ ] تحديث البريد الإداري `ADMIN_EMAIL` في `Code.gs`
- [ ] رفع الصور الحقيقية داخل `assets/images/`
- [ ] ربط GTM / GA4 / Meta / TikTok حسب الحاجة
- [ ] تجربة تسجيل حقيقي والتأكد من وصول البريد ووصول البيانات إلى الشيت
- [ ] تجربة تسجيل بنفس البيانات مرة ثانية والتأكد من ظهور رسالة "مسجل مسبقًا"
- [ ] فحص السرعة عبر [PageSpeed Insights](https://pagespeed.web.dev)

---

## 🎨 دليل الألوان

| المتغير | القيمة | الاستخدام |
|---|---|---|
| `--color-bg` | `#FAF7F1` | خلفية عامة كريمية |
| `--color-bg-dark` | `#14110D` | خلفية القوائم/الأقسام الداكنة |
| `--color-gold` | `#A9814A` | اللون المميز (أزرار، تفاصيل) |
| `--color-brown` | `#6B5642` | لمسات دافئة إضافية |

---

بالتوفيق في إطلاق الندوة 🎉

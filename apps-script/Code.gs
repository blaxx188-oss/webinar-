/**
 * =============================================================================
 * ندوة الاحتراف — Code.gs
 * سكربت Google Apps Script لاستقبال بيانات التسجيل، حفظها في Google Sheets،
 * منع التسجيل المكرر، وإرسال رسائل بريد إلكتروني تلقائية.
 *
 * خطوات النشر موضحة بالتفصيل في README.md
 * =============================================================================
 */

/* -----------------------------------------------------------------------
   0) الإعدادات العامة — عدّل هذه القيم فقط
   ----------------------------------------------------------------------- */
var CONFIG = {
  SHEET_NAME: 'Registrations',           // اسم الشيت الذي سيتم الحفظ فيه
  ADMIN_EMAIL: 'admin@example.com',      // البريد الذي يستقبل إشعار كل تسجيل جديد
  WEBINAR_NAME: 'ندوة الاحتراف المجانية',
  WEBINAR_DATE_TEXT: 'الأحد 10 أغسطس 2026 - الساعة 7:00 مساءً',
  WEBINAR_JOIN_LINK: 'https://example.com/live', // رابط الانضمام الفعلي للندوة
  SEND_ADMIN_NOTIFICATION: true
};

/* -----------------------------------------------------------------------
   1) نقطة الاستقبال الرئيسية (POST من صفحة التسجيل)
   ----------------------------------------------------------------------- */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000); // منع التعارض عند وصول طلبين في نفس اللحظة

  try {
    var data = parseRequestBody(e);

    var fullName = (data.fullName || '').toString().trim();
    var email = (data.email || '').toString().trim().toLowerCase();
    var phone = normalizePhone((data.phone || '').toString().trim());

    // تحقق أساسي من صحة البيانات على مستوى الخادم أيضًا
    if (!fullName || !isValidEmail(email) || !isValidPhone(phone)) {
      return jsonResponse({ status: 'error', message: 'بيانات غير صحيحة.' });
    }

    var sheet = getOrCreateSheet();

    // التحقق من عدم وجود تسجيل مسبق بنفس البريد أو رقم الجوال
    if (isDuplicate(sheet, email, phone)) {
      return jsonResponse({ status: 'duplicate', message: 'هذا البريد أو رقم الجوال مسجل مسبقًا.' });
    }

    // إضافة صف جديد بالبيانات
    sheet.appendRow([
      new Date(),          // وقت التسجيل
      fullName,
      email,
      phone,
      data.source || '',   // مصدر التسجيل (رابط الصفحة)
      data.timestamp || ''
    ]);

    // إرسال بريد التأكيد للمستخدم
    sendConfirmationEmail(fullName, email);

    // إرسال إشعار للإدارة
    if (CONFIG.SEND_ADMIN_NOTIFICATION) {
      sendAdminNotification(fullName, email, phone);
    }

    return jsonResponse({ status: 'success', message: 'تم التسجيل بنجاح.' });

  } catch (err) {
    return jsonResponse({ status: 'error', message: 'حدث خطأ في الخادم: ' + err.message });
  } finally {
    lock.releaseLock();
  }
}

/* -----------------------------------------------------------------------
   2) نقطة اختبار GET (للتأكد من أن الرابط يعمل بعد النشر)
   ----------------------------------------------------------------------- */
function doGet(e) {
  return jsonResponse({ status: 'ok', message: 'الخدمة تعمل بشكل صحيح.' });
}

/* -----------------------------------------------------------------------
   3) قراءة بيانات الطلب (يدعم JSON المُرسل بصيغة text/plain لتفادي CORS)
   ----------------------------------------------------------------------- */
function parseRequestBody(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('لا توجد بيانات مرسلة.');
  }
  return JSON.parse(e.postData.contents);
}

/* -----------------------------------------------------------------------
   4) الحصول على الشيت أو إنشاؤه مع رأس الأعمدة إن لم يكن موجودًا
   ----------------------------------------------------------------------- */
function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.appendRow(['وقت التسجيل', 'الاسم الكامل', 'البريد الإلكتروني', 'رقم الجوال', 'المصدر', 'وقت الإرسال من المتصفح']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/* -----------------------------------------------------------------------
   5) التحقق من التكرار: مقارنة البريد ورقم الجوال بكل الصفوف الحالية
   ----------------------------------------------------------------------- */
function isDuplicate(sheet, email, phone) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false; // لا توجد بيانات بعد رأس الجدول

  // الأعمدة: C = البريد الإلكتروني (3), D = رقم الجوال (4)
  var range = sheet.getRange(2, 3, lastRow - 1, 2).getValues();

  for (var i = 0; i < range.length; i++) {
    var existingEmail = (range[i][0] || '').toString().trim().toLowerCase();
    var existingPhone = normalizePhone((range[i][1] || '').toString().trim());

    if (existingEmail === email || existingPhone === phone) {
      return true;
    }
  }
  return false;
}

/* -----------------------------------------------------------------------
   6) دوال التحقق من صحة البيانات
   ----------------------------------------------------------------------- */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^(\+?9665|05)[0-9]{8}$/.test(phone);
}

function normalizePhone(phone) {
  // توحيد الصيغة إلى 05xxxxxxxx بغض النظر عن كتابة +966 أو 966 أو 05
  var cleaned = phone.replace(/\s|-/g, '');
  if (cleaned.indexOf('+966') === 0) cleaned = '0' + cleaned.substring(4);
  else if (cleaned.indexOf('966') === 0) cleaned = '0' + cleaned.substring(3);
  return cleaned;
}

/* -----------------------------------------------------------------------
   7) إرسال بريد التأكيد للمستخدم
   ----------------------------------------------------------------------- */
function sendConfirmationEmail(fullName, email) {
  var subject = 'تأكيد التسجيل — ' + CONFIG.WEBINAR_NAME;
  var body =
    'مرحبًا ' + fullName + '،\n\n' +
    'تم تأكيد تسجيلك بنجاح في "' + CONFIG.WEBINAR_NAME + '".\n\n' +
    'موعد الندوة: ' + CONFIG.WEBINAR_DATE_TEXT + '\n' +
    'رابط الانضمام: ' + CONFIG.WEBINAR_JOIN_LINK + '\n\n' +
    'نرحب بك، ونتطلع لرؤيتك في الندوة.\n\n' +
    'مع تحياتنا.';

  MailApp.sendEmail(email, subject, body);
}

/* -----------------------------------------------------------------------
   8) إرسال إشعار للإدارة عند كل تسجيل جديد
   ----------------------------------------------------------------------- */
function sendAdminNotification(fullName, email, phone) {
  var subject = 'تسجيل جديد — ' + CONFIG.WEBINAR_NAME;
  var body =
    'تم تسجيل مشترك جديد:\n\n' +
    'الاسم: ' + fullName + '\n' +
    'البريد الإلكتروني: ' + email + '\n' +
    'رقم الجوال: ' + phone + '\n' +
    'الوقت: ' + new Date().toLocaleString('ar-SA');

  MailApp.sendEmail(CONFIG.ADMIN_EMAIL, subject, body);
}

/* -----------------------------------------------------------------------
   9) بناء استجابة JSON موحدة
   ----------------------------------------------------------------------- */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

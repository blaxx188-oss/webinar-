/* =========================================================================
   ندوة الاحتراف — app.js
   Vanilla JavaScript (ES6) — بدون أي مكتبات خارجية
   ========================================================================= */
(function () {
  'use strict';

  /* -----------------------------------------------------------------------
     0) الإعدادات العامة — عدّل هذه القيم فقط
     ----------------------------------------------------------------------- */
  var CONFIG = {
    // تاريخ ووقت الندوة بصيغة ISO مع فرق التوقيت (توقيت السعودية +03:00)
    WEBINAR_DATE_ISO: '2026-08-10T19:00:00+03:00',

    // رابط تطبيق Google Apps Script بعد النشر (Web App URL)
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/PASTE_YOUR_DEPLOYMENT_ID_HERE/exec',

    // بيانات إضافة الحدث إلى Google Calendar
    CALENDAR_EVENT: {
      title: 'ندوة الاحتراف المجانية',
      details: 'ندوة مجانية عبر الإنترنت مدتها 60 دقيقة — رابط الانضمام سيصل عبر البريد الإلكتروني.',
      location: 'أونلاين — الرابط سيصل عبر البريد الإلكتروني وواتساب',
      // مدة الحدث بالدقائق
      durationMinutes: 60
    },

    // رابط قناة أو مجموعة واتساب للتذكيرات
    WHATSAPP_LINK: 'https://chat.whatsapp.com/PASTE_YOUR_INVITE_LINK_HERE',

    // مفتاح التخزين المحلي لمنع إعادة التسجيل من نفس الجهاز
    STORAGE_KEY: 'webinar_registered_v1'
  };

  /* -----------------------------------------------------------------------
     1) أدوات مساعدة عامة
     ----------------------------------------------------------------------- */
  window.dataLayer = window.dataLayer || [];
  function pushEvent(eventName, extra) {
    var payload = Object.assign({ event: eventName }, extra || {});
    window.dataLayer.push(payload);
    // eslint-disable-next-line no-console
    console.log('[dataLayer]', payload);
  }

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function pad(num) { return String(num).padStart(2, '0'); }

  /* -----------------------------------------------------------------------
     2) حدث Page View فور تحميل الصفحة
     ----------------------------------------------------------------------- */
  pushEvent('page_view', { page_path: window.location.pathname });

  /* -----------------------------------------------------------------------
     3) شريط تقدّم التمرير + حالة الهيدر عند التمرير
     ----------------------------------------------------------------------- */
  var scrollBar = qs('#scrollBar');
  var siteHeader = qs('#siteHeader');

  function onScroll() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    if (scrollBar) scrollBar.style.width = percent + '%';
    if (siteHeader) {
      if (scrollTop > 12) siteHeader.classList.add('is-scrolled');
      else siteHeader.classList.remove('is-scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* -----------------------------------------------------------------------
     4) تتبع عمق التمرير (Scroll Depth) 25% / 50% / 75% / 100%
     ----------------------------------------------------------------------- */
  (function scrollDepthTracker() {
    var fired = { 25: false, 50: false, 75: false, 100: false };

    function check() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      var percent = (scrollTop / docHeight) * 100;

      [25, 50, 75, 100].forEach(function (threshold) {
        if (!fired[threshold] && percent >= threshold - 1) {
          fired[threshold] = true;
          pushEvent('scroll_depth', { depth_percent: threshold });
        }
      });
    }
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('load', check);
  })();

  /* -----------------------------------------------------------------------
     5) Scroll Reveal عبر IntersectionObserver
     ----------------------------------------------------------------------- */
  (function scrollReveal() {
    var items = qsa('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    items.forEach(function (el) { observer.observe(el); });
  })();

  /* -----------------------------------------------------------------------
     6) العداد التنازلي (يعمل في الصفحة الرئيسية وصفحة الشكر)
     ----------------------------------------------------------------------- */
  (function countdown() {
    var elDays = qs('#cd-days');
    var elHours = qs('#cd-hours');
    var elMinutes = qs('#cd-minutes');
    var elSeconds = qs('#cd-seconds');
    var wrap = qs('#countdown');
    if (!wrap) return;

    var target = new Date(CONFIG.WEBINAR_DATE_ISO).getTime();
    var finishedFired = false;

    function tick() {
      var now = new Date().getTime();
      var diff = target - now;

      if (diff <= 0) {
        wrap.innerHTML = '<div class="countdown--finished">بدأت الندوة الآن 🔴</div>';
        if (!finishedFired) {
          finishedFired = true;
          pushEvent('countdown_finished');
        }
        clearInterval(timer);
        return;
      }

      var days = Math.floor(diff / (1000 * 60 * 60 * 24));
      var hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      var minutes = Math.floor((diff / (1000 * 60)) % 60);
      var seconds = Math.floor((diff / 1000) % 60);

      updateUnit(elDays, pad(days));
      updateUnit(elHours, pad(hours));
      updateUnit(elMinutes, pad(minutes));
      updateUnit(elSeconds, pad(seconds));
    }

    function updateUnit(el, value) {
      if (!el) return;
      if (el.textContent !== value) {
        el.textContent = value;
        el.classList.remove('is-tick');
        // إعادة تشغيل الحركة
        void el.offsetWidth;
        el.classList.add('is-tick');
      }
    }

    var timer = setInterval(tick, 1000);
    tick();
  })();

  /* -----------------------------------------------------------------------
     7) تأثير Ripple على الأزرار
     ----------------------------------------------------------------------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.btn') : null;
    if (!btn) return;

    var rect = btn.getBoundingClientRect();
    var ripple = document.createElement('span');
    var size = Math.max(rect.width, rect.height);
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    setTimeout(function () { ripple.remove(); }, 650);

    // تتبع نقرات الأزرار مع تصنيفها عبر data-cta
    var ctaName = btn.getAttribute('data-cta');
    if (ctaName) pushEvent('button_click', { cta: ctaName });
  });

  /* -----------------------------------------------------------------------
     8) FAQ Accordion
     ----------------------------------------------------------------------- */
  (function faqAccordion() {
    var items = qsa('.faq-item');
    items.forEach(function (item) {
      var q = qs('.faq-item__q', item);
      var a = qs('.faq-item__a', item);
      if (!q || !a) return;

      q.addEventListener('click', function () {
        var isOpen = item.classList.contains('is-open');

        // إغلاق البقية (اختياري: سلوك أكورديون حصري)
        items.forEach(function (other) {
          if (other !== item) {
            other.classList.remove('is-open');
            qs('.faq-item__q', other).setAttribute('aria-expanded', 'false');
            qs('.faq-item__a', other).style.maxHeight = null;
          }
        });

        if (isOpen) {
          item.classList.remove('is-open');
          q.setAttribute('aria-expanded', 'false');
          a.style.maxHeight = null;
        } else {
          item.classList.add('is-open');
          q.setAttribute('aria-expanded', 'true');
          a.style.maxHeight = a.scrollHeight + 'px';
        }
      });
    });
  })();

  /* -----------------------------------------------------------------------
     9) Testimonials Slider (تلقائي + نقاط)
     ----------------------------------------------------------------------- */
  (function testimonialsSlider() {
    var list = qs('#testiList');
    var dotsWrap = qs('#testiDots');
    if (!list || !dotsWrap) return;

    var slides = qsa('.testi__slide', list);
    var current = 0;
    var autoplayMs = 6000;
    var autoplayTimer = null;

    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'testi__dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', 'الانتقال إلى الرأي رقم ' + (i + 1));
      dot.addEventListener('click', function () { goTo(i); resetAutoplay(); });
      dotsWrap.appendChild(dot);
    });

    var dots = qsa('.testi__dot', dotsWrap);

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      list.style.transform = 'translateX(' + (current * 100) + '%)';
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === current); });
    }

    function next() { goTo(current + 1); }

    function resetAutoplay() {
      if (autoplayTimer) clearInterval(autoplayTimer);
      autoplayTimer = setInterval(next, autoplayMs);
    }

    // ملاحظة: بما أن الاتجاه RTL، نستخدم اتجاه موجب للسلايدر داخليًا عبر transform
    goTo(0);
    resetAutoplay();
  })();

  /* -----------------------------------------------------------------------
     10) Toast Notifications
     ----------------------------------------------------------------------- */
  function showToast(message, type) {
    var region = qs('#toastRegion');
    if (!region) return;

    var toast = document.createElement('div');
    toast.className = 'toast' + (type ? ' toast--' + type : '');
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    region.appendChild(toast);

    setTimeout(function () {
      toast.classList.add('is-leaving');
      setTimeout(function () { toast.remove(); }, 220);
    }, 3600);
  }

  /* -----------------------------------------------------------------------
     11) بناء رابط Google Calendar ورابط واتساب (تُستخدم في الصفحتين)
     ----------------------------------------------------------------------- */
  function buildCalendarLink() {
    var start = new Date(CONFIG.WEBINAR_DATE_ISO);
    var end = new Date(start.getTime() + CONFIG.CALENDAR_EVENT.durationMinutes * 60000);

    function toGCalFormat(date) {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    var params = new URLSearchParams({
      action: 'TEMPLATE',
      text: CONFIG.CALENDAR_EVENT.title,
      dates: toGCalFormat(start) + '/' + toGCalFormat(end),
      details: CONFIG.CALENDAR_EVENT.details,
      location: CONFIG.CALENDAR_EVENT.location
    });

    return 'https://calendar.google.com/calendar/render?' + params.toString();
  }

  function wireCalendarAndWhatsappButtons() {
    var calBtns = qsa('#addToCalendarBtn');
    var waBtns = qsa('#whatsappBtn');
    var calLink = buildCalendarLink();

    calBtns.forEach(function (btn) {
      btn.href = calLink;
      btn.addEventListener('click', function () { pushEvent('button_click', { cta: 'add_to_calendar' }); });
    });
    waBtns.forEach(function (btn) {
      btn.href = CONFIG.WHATSAPP_LINK;
      btn.addEventListener('click', function () { pushEvent('button_click', { cta: 'whatsapp_join' }); });
    });
  }
  wireCalendarAndWhatsappButtons();

  /* -----------------------------------------------------------------------
     12) Modal (نافذة النجاح)
     ----------------------------------------------------------------------- */
  var modal = qs('#successModal');
  var modalClose = qs('#modalClose');

  function openModal() {
    if (!modal) return;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  /* -----------------------------------------------------------------------
     13) التحقق من صحة النموذج + الإرسال عبر Fetch
     ----------------------------------------------------------------------- */
  (function registrationForm() {
    var form = qs('#regForm');
    if (!form) return;

    var submitBtn = qs('#submitBtn');
    var isSubmitting = false;

    var validators = {
      fullName: function (value) { return value.trim().length >= 3; },
      email: function (value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); },
      phone: function (value) { return /^(\+?9665|05)[0-9]{8}$/.test(value.trim().replace(/\s/g, '')); }
    };

    function setFieldError(field, hasError) {
      var wrap = field.closest('.form-field');
      if (!wrap) return;
      wrap.classList.toggle('has-error', hasError);
      field.classList.toggle('is-invalid', hasError);
    }

    function validateForm() {
      var valid = true;
      ['fullName', 'email', 'phone'].forEach(function (name) {
        var field = qs('[name="' + name + '"]', form);
        var ok = validators[name](field.value);
        setFieldError(field, !ok);
        if (!ok) valid = false;
      });
      return valid;
    }

    // إزالة رسالة الخطأ فور الكتابة
    qsa('input', form).forEach(function (input) {
      input.addEventListener('input', function () {
        setFieldError(input, false);
      });
    });

    // تتبّع بداية التسجيل عند أول تفاعل مع النموذج
    var startTracked = false;
    form.addEventListener('focusin', function () {
      if (!startTracked) {
        startTracked = true;
        pushEvent('start_registration');
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (isSubmitting) return; // منع الإرسال المزدوج

      // منع التسجيل المكرر من نفس الجهاز
      var alreadyRegistered = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (alreadyRegistered) {
        showToast('لقد قمت بالتسجيل مسبقًا من هذا الجهاز. تحقق من بريدك الإلكتروني.', 'error');
        pushEvent('submit_registration', { result: 'already_registered_local' });
        openModal();
        return;
      }

      if (!validateForm()) {
        showToast('يرجى تصحيح الحقول المظللة قبل المتابعة.', 'error');
        return;
      }

      var payload = {
        fullName: qs('[name="fullName"]', form).value.trim(),
        email: qs('[name="email"]', form).value.trim(),
        phone: qs('[name="phone"]', form).value.trim(),
        source: window.location.href,
        timestamp: new Date().toISOString()
      };

      pushEvent('submit_registration', { result: 'attempt' });

      isSubmitting = true;
      form.classList.add('is-loading');
      submitBtn.disabled = true;

      fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        // text/plain لتفادي مشاكل CORS Preflight مع Google Apps Script
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          isSubmitting = false;
          form.classList.remove('is-loading');
          submitBtn.disabled = false;

          if (data.status === 'success') {
            localStorage.setItem(CONFIG.STORAGE_KEY, '1');
            showToast('تم التسجيل بنجاح! تحقق من بريدك الإلكتروني.', 'success');
            pushEvent('registration_success');

            // Meta Pixel — Lead
            if (typeof window.fbq === 'function') window.fbq('track', 'Lead');
            // TikTok Pixel — CompleteRegistration
            if (window.ttq && typeof window.ttq.track === 'function') window.ttq.track('CompleteRegistration');

            openModal();
            form.reset();
          } else if (data.status === 'duplicate') {
            localStorage.setItem(CONFIG.STORAGE_KEY, '1');
            showToast('هذا البريد أو رقم الجوال مسجل مسبقًا.', 'error');
            pushEvent('submit_registration', { result: 'duplicate' });
            openModal();
          } else {
            showToast('حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.', 'error');
            pushEvent('submit_registration', { result: 'error' });
          }
        })
        .catch(function () {
          isSubmitting = false;
          form.classList.remove('is-loading');
          submitBtn.disabled = false;
          showToast('تعذّر الاتصال بالخادم، يرجى التحقق من الاتصال بالإنترنت.', 'error');
          pushEvent('submit_registration', { result: 'network_error' });
        });
    });
  })();

  /* -----------------------------------------------------------------------
     14) تتبّع تشغيل الفيديو الترحيبي في صفحة الشكر
     ----------------------------------------------------------------------- */
  (function videoTracking() {
    var iframe = qs('iframe[title="فيديو ترحيبي"]');
    if (!iframe) return;
    var fired = false;
    iframe.addEventListener('load', function () {
      if (fired) return;
      fired = true;
      pushEvent('video_play', { video: 'welcome_video' });
    });
  })();

  /* -----------------------------------------------------------------------
     15) السنة الحالية في الفوتر
     ----------------------------------------------------------------------- */
  var yearEl = qs('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();

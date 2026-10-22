// GA4: production traffic only; no contact form values are sent.
(function () {
  'use strict';
  var measurementId = 'G-ZE6KQJMWLZ';
  if (!/^(www\.)?kurashinotsumugi\.com$/.test(window.location.hostname)) return;
  if (window.__tsumugiAnalyticsLoaded) return;
  window.__tsumugiAnalyticsLoaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);

  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.appendChild(script);

  // Fixed event parameters only. Never pass names, email, phone or message text.
  window.tsumugiTrackLead = function () {
    window.gtag('event', 'generate_lead', {
      send_to: measurementId,
      form_id: 'contactForm'
    });
  };

  // A click is not a completed call. Do not prevent the phone link's action.
  document.addEventListener('click', function (event) {
    var target = event.target;
    var link = target && typeof target.closest === 'function' ? target.closest('a[href]') : null;
    if (!link || !/^tel:/i.test(link.getAttribute('href') || '')) return;
    try {
      window.gtag('event', 'phone_click', { send_to: measurementId });
    } catch (error) {
      // Analytics must never interrupt navigation.
    }
  });
})();

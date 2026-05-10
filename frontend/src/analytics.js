const GTM_ID = import.meta.env.VITE_GTM_ID;
const CLARITY_ID = import.meta.env.VITE_CLARITY_PROJECT_ID;

export function initAnalytics() {
  // Google Tag Manager
  if (GTM_ID && GTM_ID !== 'GTM-XXXXXXX') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
    document.head.appendChild(script);
  }

  // Microsoft Clarity
  if (CLARITY_ID && CLARITY_ID !== 'xxxxxxxxxxxx') {
    (function (c, l, a, r, i, t, y) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      t = l.createElement(r);
      t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
  }
}

// Track page views on route change (call from router)
export function trackPageView(path) {
  if (GTM_ID && GTM_ID !== 'GTM-XXXXXXX') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'page_view', page_path: path });
  }
}

// Track custom events (button clicks, etc.)
export function trackEvent(action, category, label, value) {
  if (GTM_ID && GTM_ID !== 'GTM-XXXXXXX') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'custom_event',
      event_action: action,
      event_category: category,
      event_label: label,
      event_value: value,
    });
  }
}

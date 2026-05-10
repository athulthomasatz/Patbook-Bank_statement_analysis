const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const CLARITY_ID = import.meta.env.VITE_CLARITY_PROJECT_ID;

export function initAnalytics() {
  // Google Analytics (gtag.js)
  if (GA_ID && GA_ID !== 'G-XXXXXXXXXX') {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID, {
      page_path: window.location.pathname + window.location.search,
    });
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
  if (GA_ID && GA_ID !== 'G-XXXXXXXXXX' && window.gtag) {
    window.gtag('config', GA_ID, { page_path: path });
  }
}

// Track custom events (button clicks, etc.)
export function trackEvent(action, category, label, value) {
  if (GA_ID && GA_ID !== 'G-XXXXXXXXXX' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

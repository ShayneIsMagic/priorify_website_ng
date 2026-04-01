(function () {
  "use strict";

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", "G-PKGY8GTT1T", {
    page_location: window.location.href,
    page_title: document.title,
  });

  window.trackCTA = function (label) {
    gtag("event", "cta_click", { cta_label: label });
  };
  window.trackAI = function (action) {
    gtag("event", "ai_assist_interaction", { action: action });
  };
  window.trackFAQ = function (question) {
    var q = question ? String(question).substring(0, 50) : "";
    gtag("event", "faq_open", { faq_question: q });
  };
})();

(function () {
  "use strict";

  var FALLBACK_QUESTIONS = {
    intro: "Great challenge. Tell us a bit more so we can tailor the analysis.",
    questions: [
      { key: "role", label: "Your Title / Role", placeholder: "e.g. VP of Operations" },
      { key: "industry", label: "Industry", placeholder: "e.g. Healthcare, Defense, SaaS" },
      { key: "company_size", label: "Employee Headcount", placeholder: "e.g. ~400 employees" },
      { key: "products", label: "Products or Services", placeholder: "e.g. Hospital management software" },
      { key: "competitors", label: "Key Competitors", placeholder: "e.g. Epic Systems, Cerner" },
      { key: "geographic_location", label: "Location / Region", placeholder: "e.g. Dallas TX, Toronto Canada" },
      { key: "extra", label: "Anything Else?", placeholder: "e.g. Just completed a merger" },
    ],
  };

  var FALLBACK_RESULT = {
    headline: "Let's clarify your strategic priorities",
    priorities: [
      { title: "Stakeholder Alignment", why: "Misaligned priorities are the #1 hidden barrier to execution.", severity: "high" },
      { title: "Resisting Forces", why: "Unseen obstacles quietly undermine your driving forces.", severity: "high" },
      { title: "Resource Allocation", why: "Without data-driven prioritization, resources flow to the loudest voice.", severity: "medium" },
    ],
    locked_preview: { title: "Organizational Change Readiness", severity: "high" },
    hidden_insight: "The intelligence to solve this likely already exists inside your organization.",
    next_step: "A deeper analysis with your actual stakeholders would reveal the priorities hiding beneath the surface.",
    alignment_risk_pct: 38,
    misalignment_annual_cost: "$2.4M - $4.8M annually",
    resisting_forces: [
      "Mid-management resistance to transparency",
      "Competing departmental incentive structures",
      "Institutional knowledge silos between legacy teams",
    ],
  };

  var MYPATH_FALLBACK = {
    headline: "Your path to extraordinary impact",
    timeframe: "2-5 years with focused execution",
    phases: [
      {
        title: "Foundation Building",
        duration: "0-6 months",
        actions: [
          "Map the specific skills and credentials required for your goal",
          "Identify 3 people who have achieved what you are pursuing and study their paths",
          "Begin the highest-leverage learning activity you can start this week",
        ],
        milestone: "Clear roadmap with measurable milestones defined",
      },
      {
        title: "Accelerated Development",
        duration: "6-18 months",
        actions: [
          "Pursue the key credential or experience that opens the most doors",
          "Build relationships with mentors and peers in your target domain",
          "Create visible proof of your capability through projects or content",
        ],
        milestone: "Recognized as a serious contender in your target space",
      },
      {
        title: "Strategic Positioning",
        duration: "18-36 months",
        actions: [
          "Pursue the specific role or achievement that defines success",
          "Leverage your network for introductions to decision-makers",
          "Position your unique combination of skills as a competitive advantage",
        ],
        milestone: "Goal achieved or clear line of sight to achievement",
      },
    ],
    locked_preview: { title: "Sustained Leadership & Legacy", duration: "36+ months" },
    blind_spot: "Most people over-invest in credentials and under-invest in relationships.",
    critical_first_step: "Block 2 hours this week to identify and reach out to one person who is currently where you want to be.",
  };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /** Client-side anti-spam (honeypots + timing + quotas). Pair with server/Turnstile for production. */
  var SPAM_GUARD = {
    MIN_MS_ABSOLUTE: 900,
    MIN_MS_WITHOUT_INTERACTION: 3200,
    MAX_SUBMITS_PER_HOUR: 12,
    HOUR_MS: 3600000,
    AI_ANALYZE_MAX_PER_HOUR: 24,
  };

  function honeypotTrip(form) {
    var inputs = form.querySelectorAll(".contact-form__hp input");
    for (var i = 0; i < inputs.length; i++) {
      if (String(inputs[i].value || "").replace(/\s/g, "")) return true;
    }
    return false;
  }

  function initHumanTouchTracking(form) {
    if (form.getAttribute("data-spam-touch-init")) return;
    form.setAttribute("data-spam-touch-init", "1");
    form.setAttribute("data-spam-started", String(Date.now()));
    function markHuman(e) {
      if (e.target && e.target.closest && !e.target.closest(".contact-form__hp")) {
        form.setAttribute("data-spam-human", "1");
      }
    }
    form.addEventListener("input", markHuman, true);
    form.addEventListener("change", markHuman, true);
  }

  function checkFormTiming(form) {
    var started = parseInt(form.getAttribute("data-spam-started") || "0", 10);
    if (!started) return { ok: false, code: "init" };
    var elapsed = Date.now() - started;
    if (elapsed < SPAM_GUARD.MIN_MS_ABSOLUTE) return { ok: false, code: "fast" };
    if (elapsed < SPAM_GUARD.MIN_MS_WITHOUT_INTERACTION && form.getAttribute("data-spam-human") !== "1") {
      return { ok: false, code: "interaction" };
    }
    return { ok: true };
  }

  function readSubmitQuota(storageKey) {
    try {
      var raw = sessionStorage.getItem(storageKey);
      var now = Date.now();
      var list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];
      list = list.filter(function (t) {
        return now - t < SPAM_GUARD.HOUR_MS;
      });
      return { ok: list.length < SPAM_GUARD.MAX_SUBMITS_PER_HOUR, list: list };
    } catch (err) {
      return { ok: true, list: [] };
    }
  }

  function recordSubmitQuota(storageKey, existingList) {
    try {
      var now = Date.now();
      var list = (existingList || []).filter(function (t) {
        return now - t < SPAM_GUARD.HOUR_MS;
      });
      list.push(now);
      sessionStorage.setItem(storageKey, JSON.stringify(list));
    } catch (err) {}
  }

  function bumpAiDemoAnalyze(storageKey) {
    try {
      var now = Date.now();
      var raw = sessionStorage.getItem(storageKey);
      var o = raw ? JSON.parse(raw) : null;
      if (!o || now - o.start > SPAM_GUARD.HOUR_MS) o = { start: now, count: 0 };
      if (o.count >= SPAM_GUARD.AI_ANALYZE_MAX_PER_HOUR) return false;
      o.count += 1;
      sessionStorage.setItem(storageKey, JSON.stringify(o));
      return true;
    } catch (err) {
      return true;
    }
  }

  function renderAiDemoQuotaMessage(root, text) {
    root.innerHTML =
      '<div class="ai-panel" role="alert"><p style="font-size:15px;color:#1b1464;font-weight:600;margin:0 0 8px">Preview limit reached</p>' +
      '<p style="font-size:14px;color:#2c3b4e;line-height:1.6;margin:0 0 16px;opacity:0.85">' +
      escapeHtml(text) +
      '</p><button type="button" class="btn btn--secondary" data-ai-quota-reset>OK</button></div>';
    $("[data-ai-quota-reset]", root).addEventListener("click", function () {
      root.innerHTML = "";
      root.removeAttribute("data-step");
      initAiDemo();
    });
  }

  function renderMyPathQuotaMessage(root, text) {
    root.innerHTML =
      '<div class="ai-panel" role="alert"><p style="font-size:15px;color:#1b1464;font-weight:600;margin:0 0 8px">Preview limit reached</p>' +
      '<p style="font-size:14px;color:#2c3b4e;line-height:1.6;margin:0 0 16px;opacity:0.85">' +
      escapeHtml(text) +
      '</p><button type="button" class="btn btn--secondary" data-mp-quota-reset>OK</button></div>';
    $("[data-mp-quota-reset]", root).addEventListener("click", function () {
      root.removeAttribute("data-initialized");
      initMyPathDemo();
    });
  }

  function initOptionalTurnstile() {
    var meta = document.querySelector('meta[name="priorify-turnstile-site-key"]');
    if (!meta) return;
    var key = String(meta.getAttribute("content") || "").trim();
    if (!key) return;
    var forms = $all("[data-estimate-form], [data-contact-form]");
    if (!forms.length) return;
    function mountWidgets() {
      if (!window.turnstile || typeof window.turnstile.render !== "function") return;
      forms.forEach(function (form) {
        if (form.getAttribute("data-cf-widget-id")) return;
        var btn = form.querySelector(".contact-form__submit");
        if (!btn || !btn.parentNode) return;
        var slot = document.createElement("div");
        slot.className = "priorify-turnstile-mount";
        btn.parentNode.insertBefore(slot, btn);
        var id = window.turnstile.render(slot, { sitekey: key, theme: "light" });
        if (id != null) form.setAttribute("data-cf-widget-id", String(id));
      });
    }
    if (window.turnstile && window.turnstile.render) {
      mountWidgets();
      return;
    }
    var sc = document.createElement("script");
    sc.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    sc.async = true;
    sc.defer = true;
    sc.addEventListener("load", function () {
      window.setTimeout(mountWidgets, 0);
    });
    document.head.appendChild(sc);
  }

  function initYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function initHeaderScroll() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    function onScroll() {
      if (window.scrollY > 50) header.classList.add("is-scrolled");
      else header.classList.remove("is-scrolled");
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initMobileNav() {
    var toggle = document.querySelector(".site-header__toggle");
    var panel = document.querySelector("#site-nav-mobile");
    if (!toggle || !panel) return;
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
      panel.classList.toggle("is-open", !open);
      panel.hidden = open;
    });
    $all(".site-nav-mobile a").forEach(function (a) {
      a.addEventListener("click", function () {
        toggle.setAttribute("aria-expanded", "false");
        panel.classList.remove("is-open");
        panel.hidden = true;
      });
    });
  }

  function initRotatingWord() {
    var wrap = document.querySelector("[data-rotating-word]");
    if (!wrap) return;
    var words = JSON.parse(wrap.getAttribute("data-words") || "[]");
    if (!words.length) return;
    var inner = wrap.querySelector(".rotating-word__inner");
    if (!inner) return;
    var idx = 0;
    var phase = "visible";
    function tick() {
      phase = "exit";
      inner.classList.remove("is-enter", "is-exit");
      inner.classList.add("is-exit");
      window.setTimeout(function () {
        idx = (idx + 1) % words.length;
        inner.textContent = words[idx];
        phase = "enter";
        inner.classList.remove("is-exit");
        inner.classList.add("is-enter");
        window.setTimeout(function () {
          inner.classList.remove("is-enter");
          phase = "visible";
        }, 50);
      }, 450);
    }
    window.setInterval(tick, 3600);
  }

  function initRotatingSentence() {
    var wrap = document.querySelector("[data-rotating-sentence]");
    if (!wrap) return;
    var sentences = JSON.parse(wrap.getAttribute("data-sentences") || "[]");
    if (!sentences.length) return;
    var pre = wrap.querySelector("[data-rs-pre]");
    var word = wrap.querySelector("[data-rs-word]");
    var post = wrap.querySelector("[data-rs-post]");
    if (!pre || !word || !post) return;
    var idx = 0;
    function apply() {
      var s = sentences[idx];
      pre.textContent = s.pre;
      word.textContent = s.word;
      post.textContent = s.post;
    }
    apply();
    window.setInterval(function () {
      wrap.style.opacity = "0";
      wrap.style.transform = "translateY(-20px)";
      window.setTimeout(function () {
        idx = (idx + 1) % sentences.length;
        apply();
        wrap.style.opacity = "1";
        wrap.style.transform = "translateY(0)";
      }, 500);
    }, 4500);
    wrap.style.display = "inline-block";
    wrap.style.transition = "opacity 0.5s ease, transform 0.5s ease";
  }

  function severityColor(s) {
    if (s === "high") return "#bf4f28";
    if (s === "medium") return "#fbb03b";
    return "#8b9daf";
  }

  function severityBorder(s) {
    return "2px solid " + severityColor(s);
  }

  function renderAiResult(container, data) {
    var prioritiesHtml = data.priorities
      .map(function (p, i) {
        return (
          '<div class="ai-result-priority" style="display:flex;gap:12px;align-items:flex-start;padding:14px 16px;background:rgba(255,255,255,0.5);border-radius:12px;border:' +
          severityBorder(p.severity) +
          '">' +
          '<span style="font-size:11px;font-weight:700;color:' +
          severityColor(p.severity) +
          ';text-transform:uppercase;min-width:50px;margin-top:2px">' +
          p.severity +
          "</span>" +
          '<div><p style="color:#1b1464;font-weight:600;font-size:14px;margin:0 0 3px">' +
          escapeHtml(p.title) +
          '</p><p style="color:#2c3b4e;font-size:13px;line-height:1.5;opacity:0.7;margin:0">' +
          escapeHtml(p.why) +
          "</p></div></div>"
        );
      })
      .join("");

    var forces = (data.resisting_forces || []).map(function (f, i) {
      var c = i === 0 ? "#bf4f28" : i === 1 ? "#fbb03b" : "#8b9daf";
      return (
        '<div style="display:flex;gap:10px;align-items:center;padding:10px 14px;background:rgba(255,255,255,0.04);border-radius:10px;border-left:3px solid ' +
        c +
        '"><span style="font-size:11px;font-weight:700;color:' +
        c +
        ';min-width:18px">R' +
        (i + 1) +
        '</span><span style="font-size:13px;color:rgba(255,255,255,0.75)">' +
        escapeHtml(f) +
        "</span></div>"
      );
    });

    var locked = data.locked_preview;
    var lockedBlock = "";
    if (locked) {
      lockedBlock =
        '<div style="position:relative;overflow:hidden;border-radius:12px;border:' +
        severityBorder(locked.severity) +
        '">' +
        '<div style="display:flex;gap:12px;padding:14px 16px;background:rgba(255,255,255,0.5)">' +
        '<span style="font-size:11px;font-weight:700;color:' +
        severityColor(locked.severity) +
        ';text-transform:uppercase;min-width:50px">' +
        locked.severity +
        '</span><div><p style="color:#1b1464;font-weight:600;font-size:14px;margin:0 0 3px">' +
        escapeHtml(locked.title) +
        '</p><p style="color:#2c3b4e;font-size:13px;line-height:1.5;opacity:0.7;margin:0">This priority explores deeper systemic factors and root causes that leadership teams often overlook...</p></div></div>' +
        '<div style="position:absolute;bottom:0;left:0;right:0;height:75%;background:linear-gradient(to bottom,rgba(255,255,255,0) 0%,rgba(255,255,255,0.7) 30%,rgba(255,255,255,0.95) 100%);backdrop-filter:blur(4px);display:flex;align-items:flex-end;justify-content:center;padding-bottom:14px">' +
        '<a href="/pricing/" class="btn btn--blue" style="font-size:12px;padding:8px 20px">Unlock Full Analysis</a></div></div>';
    }

    container.innerHTML =
      '<div class="ai-panel" style="animation:fadeUp .6s ease">' +
      '<p style="font-size:11px;color:#3b82f6;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px">Your Priority Pulse</p>' +
      '<h3 style="font-size:20px;color:#1b1464;font-weight:700;margin:0 0 20px;font-family:var(--font-heading)">' +
      escapeHtml(data.headline) +
      "</h3>" +
      '<div style="display:flex;flex-direction:column;gap:10px">' +
      prioritiesHtml +
      lockedBlock +
      "</div>" +
      '<div style="margin-top:16px;padding:14px 16px;background:rgba(59,130,246,0.06);border-radius:12px;border:1px solid rgba(59,130,246,0.15)">' +
      '<p style="font-size:11px;color:#3b82f6;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 5px">&#10022; Hidden Insight</p>' +
      '<p style="color:#2c3b4e;font-size:13px;line-height:1.6;font-style:italic;opacity:0.75;margin:0">' +
      escapeHtml(data.hidden_insight) +
      "</p></div>" +
      '<div style="margin-top:20px;padding:24px;background:linear-gradient(135deg,#000b28 0%,#1b1464 50%,#1d4ed8 100%);border-radius:16px;color:#fff">' +
      '<div style="margin-bottom:20px">' +
      '<p style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#ffd506;margin:0 0 4px">Leadership Alignment Risk</p>' +
      '<p style="font-size:13px;color:rgba(255,255,255,0.55);line-height:1.5;margin:0">Based on similar organizations, teams are typically only <span style="color:#ffd506;font-weight:700">' +
      (100 - (data.alignment_risk_pct || 38)) +
      "% aligned</span> on which priorities matter most.</p>" +
      '<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:10px">' +
      '<div></div><div style="text-align:center"><p style="font-size:32px;font-weight:800;color:#bf4f28;font-family:var(--font-heading);margin:0;line-height:1">' +
      (data.alignment_risk_pct || 38) +
      '%</p><p style="font-size:10px;color:rgba(255,255,255,0.4);margin:2px 0 0">at risk</p></div></div>' +
      '<div style="height:6px;border-radius:3px;background:rgba(255,255,255,0.1);overflow:hidden;margin-top:8px">' +
      '<div style="height:100%;border-radius:3px;background:linear-gradient(90deg,#ffd506 0%,#bf4f28 100%);width:' +
      (data.alignment_risk_pct || 38) +
      '%;transition:width 1.5s ease"></div></div></div>' +
      (data.misalignment_annual_cost
        ? '<div style="padding:16px 18px;background:rgba(255,255,255,0.06);border-radius:12px;margin-bottom:20px;border:1px solid rgba(255,255,255,0.08)">' +
          '<p style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.4);margin:0 0 6px">Estimated Cost of Misalignment</p>' +
          '<p style="font-size:22px;font-weight:800;color:#ffd506;font-family:var(--font-heading);margin:0 0 4px">' +
          escapeHtml(data.misalignment_annual_cost) +
          '</p><p style="font-size:12px;color:rgba(255,255,255,0.45);line-height:1.5;margin:0">The gap between what you see and what your stakeholders see is where strategy breaks down.</p></div>'
        : "") +
      '<div style="position:relative;overflow:hidden;border-radius:12px">' +
      '<div style="padding:18px;background:rgba(255,255,255,0.04)">' +
      '<p style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.5);margin:0 0 12px">Projected Resisting Forces</p>' +
      '<div style="display:flex;flex-direction:column;gap:8px">' +
      forces.join("") +
      "</div></div>" +
      '<div style="position:absolute;bottom:0;left:0;right:0;height:70%;background:linear-gradient(to bottom,rgba(0,11,40,0) 0%,rgba(0,11,40,0.8) 40%,rgba(0,11,40,0.97) 100%);backdrop-filter:blur(3px);display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:16px;gap:8px">' +
      '<p style="font-size:13px;color:rgba(255,255,255,0.6);text-align:center;max-width:320px;margin:0">Discover where your team actually disagrees — and the forces working against your goals.</p>' +
      '<a href="/pricing/" class="btn" style="background:#ffd506;color:#1b1464;font-size:13px;font-weight:700;padding:10px 24px">See What Your Stakeholders Think</a></div></div></div>' +
      '<div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(201,194,178,0.3);display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between">' +
      '<p style="color:#2c3b4e;font-size:13px;flex:1 1 180px;opacity:0.6;margin:0">' +
      escapeHtml(data.next_step) +
      '</p><div style="display:flex;gap:8px">' +
      '<button type="button" class="btn btn--secondary" data-ai-demo-reset style="font-size:13px;padding:9px 16px">Try Another</button>' +
      '<a href="/pricing/" class="btn btn--blue" style="font-size:13px;padding:9px 18px">See Full Options</a></div></div>' +
      '<p style="font-size:10px;color:#2c3b4e;opacity:0.45;text-align:center;margin-top:10px">This is a surface-level demo. A full PriorityPath engages your actual stakeholders. Live AI requires a secure backend — this preview uses sample analysis.</p></div>';

    var resetBtn = container.querySelector("[data-ai-demo-reset]");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        trackAIAssist("demo_try_another");
        container.innerHTML = "";
        initAiDemo();
      });
    }
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function trackAIAssist(action) {
    if (typeof window.trackAI === "function") window.trackAI(action);
  }

  function initAnalyticsEvents() {
    document.addEventListener("click", function (e) {
      if (typeof window.trackCTA !== "function") return;
      var t = e.target.closest("[data-track-cta]");
      if (t) {
        var label = t.getAttribute("data-track-cta");
        if (label) window.trackCTA(label);
        return;
      }
      var navCta = e.target.closest(".btn-nav-cta");
      if (navCta) window.trackCTA("nav-get-priorified");
    });
    var faqList = document.querySelector(".faq-list");
    if (faqList && typeof window.trackFAQ === "function") {
      faqList.addEventListener("toggle", function (e) {
        var d = e.target;
        if (d.tagName !== "DETAILS" || !d.open) return;
        var s = d.querySelector("summary");
        if (s) window.trackFAQ(s.textContent || "");
      });
    }
  }

  function initAiDemo() {
    var root = document.getElementById("priorify-ai-demo");
    if (!root) return;

    root.innerHTML =
      '<div data-step="1">' +
      '<label class="ai-demo__label" for="ai-challenge">Describe the challenge or goal your organization is facing</label>' +
      '<div class="ai-demo__input-row">' +
      '<textarea id="ai-challenge" rows="2" placeholder="e.g. We are a 400-person healthcare company struggling to align leadership after a merger..."></textarea>' +
      '<button type="button" class="ai-demo__next" data-ai-next disabled>Next</button></div>' +
      '<p class="ai-demo__hint">Free instant analysis | No email required | Demo uses sample output — wire an API for live AI</p></div>';

    var ta = $("#ai-challenge", root);
    var next = $("[data-ai-next]", root);
    function sync() {
      next.disabled = !ta.value.trim();
    }
    ta.addEventListener("input", sync);
    ta.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!next.disabled) next.click();
      }
    });
    next.addEventListener("click", function () {
      if (!ta.value.trim()) return;
      trackAIAssist("demo_step1_next");
      root.innerHTML =
        '<div class="ai-demo__loading" data-step="1b"><div class="loading-dots"><span></span><span></span><span></span></div>' +
        '<p style="color:#2c3b4e;margin-top:14px;font-size:13px;opacity:0.5">Preparing your tailored questions...</p></div>';
      window.setTimeout(function () {
        showQuestionStep(root, ta.value.trim());
      }, 600);
    });
  }

  function showQuestionStep(root, challenge) {
    var dyn = FALLBACK_QUESTIONS;
    var fields = dyn.questions
      .map(function (q) {
        return (
          '<div><label for="ctx-' +
          q.key +
          '">' +
          escapeHtml(q.label) +
          '</label><input type="text" id="ctx-' +
          q.key +
          '" name="' +
          q.key +
          '" placeholder="' +
          escapeHtml(q.placeholder) +
          '" /></div>'
        );
      })
      .join("");
    root.innerHTML =
      '<div class="ai-panel" data-step="2"><div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:20px">' +
      '<span style="font-size:18px" aria-hidden="true">&#10022;</span><div><p style="font-size:15px;font-weight:600;color:#1b1464;margin:0 0 4px">' +
      escapeHtml(dyn.intro) +
      '</p><p style="font-size:13px;color:#2c3b4e;opacity:0.6;margin:0">All fields are optional but help us give you a more specific analysis.</p></div></div>' +
      '<div class="ai-panel__grid">' +
      fields +
      '</div><div class="ai-panel__actions">' +
      '<button type="button" class="btn btn--secondary" data-ai-back>Back</button>' +
      '<button type="button" class="btn btn--blue" data-ai-analyze>Analyze My Challenge</button></div></div>';

    $("[data-ai-back]", root).addEventListener("click", function () {
      trackAIAssist("demo_back");
      root.innerHTML = "";
      root.removeAttribute("data-step");
      initAiDemo();
    });
    $("[data-ai-analyze]", root).addEventListener("click", function () {
      if (!bumpAiDemoAnalyze("priorify_ai_demo_org_v1")) {
        renderAiDemoQuotaMessage(
          root,
          "Too many preview runs from this browser in the last hour. Try again later, or use Get Priorified for a full conversation."
        );
        return;
      }
      trackAIAssist("demo_analyze");
      root.innerHTML =
        '<div class="ai-demo__loading"><div class="loading-dots"><span></span><span></span><span></span></div>' +
        '<p style="color:#2c3b4e;margin-top:18px;font-size:14px;opacity:0.6">Analyzing through a stakeholder intelligence lens...</p></div>';
      window.setTimeout(function () {
        renderAiResult(root, FALLBACK_RESULT);
      }, 800);
    });
  }

  function initMyPathDemo() {
    var root = document.getElementById("mypath-demo");
    if (!root || root.getAttribute("data-initialized")) return;
    root.setAttribute("data-initialized", "1");
    root.innerHTML =
      '<div data-mp-step="1">' +
      '<label class="ai-demo__label" for="mp-goal">Describe the goal you want to achieve — be as specific as you like</label>' +
      '<div class="ai-demo__input-row">' +
      '<textarea id="mp-goal" rows="2" placeholder="e.g. I want to become a NASA astronaut, I am currently a mechanical engineering student..."></textarea>' +
      '<button type="button" class="ai-demo__next" data-mp-next disabled>Next</button></div>' +
      '<p class="ai-demo__hint">Free strategic preview | Full plan available for $39 | Demo uses sample output</p></div>';

    var ta = $("#mp-goal", root);
    var next = $("[data-mp-next]", root);
    function sync() {
      next.disabled = !ta.value.trim();
    }
    ta.addEventListener("input", sync);
    next.addEventListener("click", function () {
      if (!ta.value.trim()) return;
      root.innerHTML =
        '<div class="ai-demo__loading"><div class="loading-dots"><span></span><span></span><span></span></div>' +
        '<p style="color:#2c3b4e;margin-top:14px;font-size:13px;opacity:0.5">Preparing your tailored questions...</p></div>';
      window.setTimeout(function () {
        showMyPathStep2(root);
      }, 600);
    });
  }

  function showMyPathStep2(root) {
    root.innerHTML =
      '<div class="ai-panel"><p style="font-size:15px;font-weight:600;color:#1b1464;margin:0 0 4px">Tell us a bit about your background (all optional).</p>' +
      '<p style="font-size:13px;color:#2c3b4e;opacity:0.6;margin:0 0 16px">Fields help tailor a future live experience.</p>' +
      '<div class="ai-panel__grid">' +
      '<div><label for="mp-edu">Education</label><input id="mp-edu" type="text" placeholder="e.g. BS Mechanical Engineering" /></div>' +
      '<div><label for="mp-role">Current role</label><input id="mp-role" type="text" placeholder="e.g. Student / Engineer" /></div></div>' +
      '<div class="ai-panel__actions"><button type="button" class="btn btn--secondary" data-mp-back>Back</button>' +
      '<button type="button" class="btn btn--blue" data-mp-map>Map My Path</button></div></div>';
    $("[data-mp-back]", root).addEventListener("click", function () {
      root.removeAttribute("data-initialized");
      initMyPathDemo();
    });
    $("[data-mp-map]", root).addEventListener("click", function () {
      if (!bumpAiDemoAnalyze("priorify_ai_demo_mp_v1")) {
        renderMyPathQuotaMessage(
          root,
          "Too many preview runs from this browser in the last hour. Try again later, or see pricing for the full MyPriorityPath plan."
        );
        return;
      }
      root.innerHTML =
        '<div class="ai-demo__loading"><div class="loading-dots"><span></span><span></span><span></span></div>' +
        '<p style="color:#2c3b4e;margin-top:18px;font-size:14px;opacity:0.6">Mapping your strategic path...</p></div>';
      window.setTimeout(function () {
        renderMyPathResult(root, MYPATH_FALLBACK);
      }, 800);
    });
  }

  function renderMyPathResult(root, data) {
    var phases = data.phases
      .map(function (p, i) {
        var cols = ["#3b82f6", "#bf4f28", "#fbb03b"][i] || "#3b82f6";
        var actions = p.actions
          .map(function (a) {
            return (
              '<div style="display:flex;gap:8px;align-items:flex-start"><span style="color:' +
              cols +
              ';font-size:12px;margin-top:3px">&#8594;</span><span style="font-size:13px;color:#2c3b4e;line-height:1.5;opacity:0.75">' +
              escapeHtml(a) +
              "</span></div>"
            );
          })
          .join("");
        return (
          '<div style="padding:16px 18px;background:rgba(255,255,255,0.5);border-radius:12px;border:2px solid ' +
          cols +
          '">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
          '<p style="color:#1b1464;font-weight:700;font-size:15px;margin:0">' +
          escapeHtml(p.title) +
          '</p><span style="font-size:11px;color:' +
          cols +
          ';font-weight:600">' +
          escapeHtml(p.duration) +
          "</span></div>" +
          '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px">' +
          actions +
          '</div><div style="padding:8px 12px;background:rgba(255,255,255,0.5);border-radius:12px">' +
          '<span style="font-size:11px;color:#2c3b4e;opacity:0.5;font-weight:600">MILESTONE: </span>' +
          '<span style="font-size:12px;color:#2c3b4e;opacity:0.7">' +
          escapeHtml(p.milestone) +
          "</span></div></div>"
        );
      })
      .join("");

    root.innerHTML =
      '<div class="ai-panel">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:16px">' +
      '<div><p style="font-size:11px;color:#bf4f28;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 6px">Your MyPriorityPath Preview</p>' +
      '<h3 style="font-size:20px;color:#1b1464;font-weight:700;margin:0;font-family:var(--font-heading)">' +
      escapeHtml(data.headline) +
      '</h3></div><span style="font-size:12px;padding:5px 12px;background:rgba(251,176,59,0.2);color:#bf4f28;border-radius:20px;font-weight:600;white-space:nowrap">' +
      escapeHtml(data.timeframe) +
      '</span></div><div style="display:flex;flex-direction:column;gap:14px">' +
      phases +
      '<div style="position:relative;overflow:hidden;border-radius:12px;border:2px solid #fbb03b">' +
      '<div style="padding:16px 18px"><p style="font-weight:700;color:#1b1464;margin:0 0 8px">' +
      escapeHtml(data.locked_preview.title) +
      '</p><p style="font-size:13px;margin:0;opacity:0.75">Additional phase details unlock with the full plan.</p></div>' +
      '<div style="position:absolute;bottom:0;left:0;right:0;height:70%;background:linear-gradient(to bottom,rgba(255,255,255,0) 0%,rgba(255,255,255,0.95) 100%);display:flex;align-items:flex-end;justify-content:center;padding-bottom:14px">' +
      '<a href="/pricing/" class="btn btn--blue" style="font-size:12px">Unlock Full Strategic Plan</a></div></div></div>' +
      '<div style="margin-top:16px;padding:14px 16px;background:rgba(251,176,59,0.08);border-radius:12px;border:1px solid rgba(251,176,59,0.2)">' +
      '<p style="font-size:11px;color:#bf4f28;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 5px">&#10022; Blind Spot</p>' +
      '<p style="color:#2c3b4e;font-size:13px;line-height:1.6;font-style:italic;opacity:0.75;margin:0">' +
      escapeHtml(data.blind_spot) +
      '</p></div><div style="margin-top:12px;padding:12px 16px;background:rgba(59,130,246,0.06);border-radius:12px;border:1px solid rgba(59,130,246,0.12)">' +
      '<p style="font-size:11px;color:#3b82f6;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 5px">&#9889; Do This Week</p>' +
      '<p style="color:#2c3b4e;font-size:13px;line-height:1.6;opacity:0.75;margin:0">' +
      escapeHtml(data.critical_first_step) +
      '</p></div><p style="text-align:center;margin-top:16px"><button type="button" class="btn btn--secondary" data-mp-reset>Start Over</button></p></div>';

    $("[data-mp-reset]", root).addEventListener("click", function () {
      root.removeAttribute("data-initialized");
      initMyPathDemo();
    });
  }

  function initProcessTabs() {
    var tabs = document.querySelector(".process-tabs");
    if (!tabs) return;
    var buttons = $all(".process-tab", tabs);
    var panels = $all(".process-panel");
    if (!buttons.length || !panels.length) return;
    var idx = 0;
    function show(i) {
      idx = i;
      buttons.forEach(function (b, j) {
        b.classList.toggle("is-active", j === i);
        b.setAttribute("aria-pressed", j === i ? "true" : "false");
      });
      panels.forEach(function (p, j) {
        p.hidden = j !== i;
      });
    }
    buttons.forEach(function (btn, i) {
      btn.addEventListener("click", function () {
        show(i);
      });
    });
    var prev = document.querySelector("[data-process-prev]");
    var next = document.querySelector("[data-process-next]");
    if (prev)
      prev.addEventListener("click", function () {
        show(Math.max(0, idx - 1));
      });
    if (next)
      next.addEventListener("click", function () {
        show(Math.min(buttons.length - 1, idx + 1));
      });
    show(0);
  }

  function initContactForm() {
    var form = document.querySelector("[data-contact-form]");
    if (!form) return;
    initHumanTouchTracking(form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = form.querySelector("[data-form-message]");
      function fail(text) {
        if (msg) {
          msg.hidden = false;
          msg.textContent = text;
          msg.className = "form-msg form-msg--err";
        }
      }
      if (honeypotTrip(form)) {
        return;
      }
      var timing = checkFormTiming(form);
      if (!timing.ok) {
        fail("Please take a moment to complete the form, then try again.");
        return;
      }
      var quota = readSubmitQuota("priorify_sg_contact");
      if (!quota.ok) {
        fail("Too many submissions from this browser recently. Please try again later or email us directly.");
        return;
      }
      var wid = form.getAttribute("data-cf-widget-id");
      if (wid && window.turnstile && typeof window.turnstile.getResponse === "function") {
        var tok = window.turnstile.getResponse(wid);
        if (!tok) {
          fail("Please complete the verification challenge above.");
          return;
        }
      }
      recordSubmitQuota("priorify_sg_contact", quota.list);
      if (wid && window.turnstile && typeof window.turnstile.reset === "function") {
        window.turnstile.reset(wid);
      }
      if (msg) {
        msg.hidden = false;
        msg.textContent = "Thanks — wire this form to Formspree, Netlify Forms, or your backend (see README).";
        msg.className = "form-msg form-msg--ok";
      }
    });
  }

  function initEstimateForm() {
    var form = document.querySelector("[data-estimate-form]");
    if (!form) return;
    initHumanTouchTracking(form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = form.querySelector("[data-estimate-form-message]");
      function fail(text) {
        if (msg) {
          msg.hidden = false;
          msg.textContent = text;
          msg.className = "form-msg form-msg--err";
        }
      }
      if (honeypotTrip(form)) {
        return;
      }
      var timing = checkFormTiming(form);
      if (!timing.ok) {
        fail("Please take a moment to complete the form, then try again.");
        return;
      }
      var quota = readSubmitQuota("priorify_sg_estimate");
      if (!quota.ok) {
        fail("Too many submissions from this browser recently. Please try again later or email us directly.");
        return;
      }
      var wid = form.getAttribute("data-cf-widget-id");
      if (wid && window.turnstile && typeof window.turnstile.getResponse === "function") {
        var tok = window.turnstile.getResponse(wid);
        if (!tok) {
          fail("Please complete the verification challenge above.");
          return;
        }
      }
      recordSubmitQuota("priorify_sg_estimate", quota.list);
      if (wid && window.turnstile && typeof window.turnstile.reset === "function") {
        window.turnstile.reset(wid);
      }
      if (msg) {
        msg.hidden = false;
        msg.textContent =
          "Thanks — your estimate request is queued for demo. Connect this form to your CRM or Formspree the same way as the general contact form (see README).";
        msg.className = "form-msg form-msg--ok";
      }
    });
  }

  function init() {
    window.dataLayer = window.dataLayer || [];
    initAnalyticsEvents();
    initYear();
    initHeaderScroll();
    initMobileNav();
    initRotatingWord();
    initRotatingSentence();
    initOptionalTurnstile();
    initAiDemo();
    initMyPathDemo();
    initProcessTabs();
    initContactForm();
    initEstimateForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

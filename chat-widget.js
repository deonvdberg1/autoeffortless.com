/* AutoEffortless AI Chat Widget — talks to /api/ai/chat via app.autoeffortless.com */
(function () {
  'use strict';
  var API = 'https://app.autoeffortless.com/api/ai/chat';
  var SID_KEY = 'ae_sid';
  var HISTORY_KEY = 'ae_chat_history';

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }
  function sid() {
    var s = localStorage.getItem(SID_KEY);
    if (!s) {
      s = 'web-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem(SID_KEY, s);
    }
    return s;
  }
  function loadHistory() {
    try { return JSON.parse(sessionStorage.getItem(HISTORY_KEY)) || []; } catch (e) { return []; }
  }
  function saveHistory(h) {
    try { sessionStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-16))); } catch (e) {}
  }

  var history = loadHistory();
  var lead = null; // {name?, email?, phone?}
  var busy = false;
  var pendingEmail = null, pendingPhone = null;

  var btn, panel, msgsEl, chipsEl, inputEl, sendBtn, typingEl, teaser, leadForm, leadName, leadEmail, leadPhone;

  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  var SEND_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';

  function build() {
    btn = document.createElement('button');
    btn.className = 'ae-chat-btn';
    btn.setAttribute('aria-label', 'Chat with the AutoEffortless AI assistant');
    btn.innerHTML = ICON + '<span class="ae-pulse"></span>';
    document.body.appendChild(btn);

    teaser = document.createElement('div');
    teaser.className = 'ae-teaser';
    teaser.style.display = 'none';
    teaser.innerHTML = 'Ask our AI anything <small>Pricing, timelines, what we build…</small>';
    document.body.appendChild(teaser);

    panel = document.createElement('div');
    panel.className = 'ae-chat-panel';
    panel.innerHTML =
      '<div class="ae-head">' +
        '<div class="ae-avatar"><img src="/logo-icon.svg" alt="AutoEffortless" /></div>' +
        '<div class="ae-mid"><div class="ae-name">AutoEffortless Assistant <span class="ae-dot"></span></div>' +
        '<div class="ae-sub">AI — replies instantly · POPIA compliant</div></div>' +
        '<button class="ae-close" aria-label="Close chat">×</button>' +
      '</div>' +
      '<div class="ae-msgs"></div>' +
      '<div class="ae-chips"></div>' +
      '<div class="ae-leadform">' +
        '<h5>Leave your details — we\'ll be in touch within hours</h5>' +
        '<input type="text" class="ae-l-name" placeholder="Your name (optional)" maxlength="120" />' +
        '<input type="email" class="ae-l-email" placeholder="Email address" maxlength="160" />' +
        '<input type="tel" class="ae-l-phone" placeholder="WhatsApp number" maxlength="40" />' +
        '<button class="ae-btn ae-l-submit">Send my details</button>' +
        '<div class="ae-lead-note">✅ Thanks — we\'ll be in touch within hours.</div>' +
      '</div>' +
      '<div class="ae-inputrow">' +
        '<input type="text" class="ae-input" placeholder="Type your message…" maxlength="2000" autocomplete="off" />' +
        '<button class="ae-send" aria-label="Send">' + SEND_ICON + '</button>' +
      '</div>' +
      '<div class="ae-foot">' +
        '<span>AI assistant · <a href="/privacy-policy.html">Privacy</a></span>' +
        '<button type="button" class="ae-lead-toggle">Leave your details</button>' +
        '<a href="https://wa.me/27615274429" target="_blank" rel="noopener">Chat with a human →</a>' +
      '</div>';
    document.body.appendChild(panel);

    msgsEl = panel.querySelector('.ae-msgs');
    chipsEl = panel.querySelector('.ae-chips');
    inputEl = panel.querySelector('.ae-input');
    sendBtn = panel.querySelector('.ae-send');
    leadForm = panel.querySelector('.ae-leadform');
    leadName = leadForm.querySelector('.ae-l-name');
    leadEmail = leadForm.querySelector('.ae-l-email');
    leadPhone = leadForm.querySelector('.ae-l-phone');

    var CHIPS = ['What do you do?', 'How much does it cost?', 'How fast can you build it?', 'WhatsApp assistant?', 'Do you have examples?'];
    CHIPS.forEach(function (c) {
      var chip = document.createElement('button');
      chip.className = 'ae-chip';
      chip.textContent = c;
      chip.addEventListener('click', function () { open(); send(c); });
      chipsEl.appendChild(chip);
    });

    btn.addEventListener('click', function () { open(); dismissTeaser(); });
    // Hero "AGENT ONLINE" badge opens the chat
    var heroBadge = document.querySelector('.hero .badge');
    if (heroBadge) {
      heroBadge.style.cursor = 'pointer';
      heroBadge.addEventListener('click', function () { open(); dismissTeaser(); });
    }
    teaser.addEventListener('click', function () { open(); dismissTeaser(); });
    panel.querySelector('.ae-close').addEventListener('click', close);
    panel.querySelector('.ae-lead-toggle').addEventListener('click', function () {
      leadForm.classList.toggle('ae-open');
      if (leadForm.classList.contains('ae-open')) leadName.focus();
    });
    leadForm.querySelector('.ae-l-submit').addEventListener('click', submitLeadForm);

    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitInput(); }
    });
    sendBtn.addEventListener('click', submitInput);

    // Teaser nudge once per page view (after 9s)
    var t = setTimeout(function () {
      if (!panel.classList.contains('ae-open')) teaser.style.display = 'block';
    }, 9000);
    window.addEventListener('scroll', dismissTeaser, { once: true });
  }

  function open() {
    if (!panel.classList.contains('ae-open')) {
      panel.classList.add('ae-open');
      if (window.AETrack) AETrack('ai-chat-open');
      if (msgsEl.children.length === 0) greet();
      inputEl.focus();
    }
  }
  function close() { panel.classList.remove('ae-open'); }
  function dismissTeaser() { teaser.style.display = 'none'; }

  function addBubble(text, who) {
    var b = document.createElement('div');
    b.className = 'ae-b ' + (who === 'user' ? 'ae-user' : 'ae-ai');
    b.innerHTML = esc(text).replace(/\n/g, '<br>').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    msgsEl.appendChild(b);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return b;
  }
  function addNote(text) {
    var b = document.createElement('div');
    b.className = 'ae-b ae-note';
    b.textContent = text;
    msgsEl.appendChild(b);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }
  function showTyping() {
    typingEl = document.createElement('div');
    typingEl.className = 'ae-b ae-ai';
    typingEl.innerHTML = '<span class="ae-typing"><i></i><i></i><i></i></span>';
    msgsEl.appendChild(typingEl);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }
  function hideTyping() { if (typingEl) { typingEl.remove(); typingEl = null; } }

  function greet() {
    addBubble('Hi there 👋 I\'m the AutoEffortless assistant. Ask me about our AI apps, websites, email & calendar syncing, booking systems, or WhatsApp assistants — or tell me about your business.', 'ai');
  }

  function submitInput() {
    var text = inputEl.value.trim();
    if (!text || busy) return;
    inputEl.value = '';
    send(text);
  }

  function send(text) {
    busy = true;
    sendBtn.disabled = true;
    addBubble(text, 'user');
    history.push({ role: 'user', content: text });
    saveHistory(history);

    // Detect contact details typed in the message
    var em = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    var ph = text.match(/(\+?[0-9][0-9\s-]{8,16})/);
    if (em) pendingEmail = em[0];
    if (ph) pendingPhone = ph[0].trim();

    var payloadLead = null;
    if (lead) { payloadLead = lead; lead = null; }
    else if (pendingEmail || pendingPhone) { payloadLead = { email: pendingEmail || '', phone: pendingPhone || '' }; }

    showTyping();
    if (window.AETrack) AETrack('ai-chat-send');

    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-10), sessionId: sid(), lead: payloadLead })
    }).then(function (r) {
      return r.json().then(function (d) { return { ok: r.ok, d: d }; });
    }).then(function (res) {
      hideTyping();
      busy = false;
      sendBtn.disabled = false;
      if (res.ok && res.d && res.d.reply) {
        history.push({ role: 'assistant', content: res.d.reply });
        saveHistory(history);
        addBubble(res.d.reply, 'ai');
        if (res.d.leadSaved && window.AETrack) AETrack('ai-chat-lead');
        if (res.d.leadSaved && res.d.refCode) addNote('Details received · ref ' + res.d.refCode);
      } else {
        addBubble('Sorry, I\'m having a moment right now. Please try again — or WhatsApp us directly at https://wa.me/27615274429 and a human will reply within hours.', 'ai');
      }
    }).catch(function () {
      hideTyping();
      busy = false;
      sendBtn.disabled = false;
      addBubble('Sorry, I\'m having a moment right now. Please try again — or WhatsApp us directly at https://wa.me/27615274429 and a human will reply within hours.', 'ai');
    });
  }

  function submitLeadForm() {
    var name = leadName.value.trim();
    var email = leadEmail.value.trim();
    var phone = leadPhone.value.trim();
    if (!email && !phone) { leadEmail.focus(); return; }
    var btnEl = leadForm.querySelector('.ae-l-submit');
    btnEl.disabled = true;
    var payloadLead = { name: name, email: email, phone: phone };
    lead = payloadLead; // attached to next send
    var note = leadForm.querySelector('.ae-lead-note');
    if (history.length === 0) history.push({ role: 'user', content: 'Hi — I\'d like to leave my details.' });
    showTyping();
    if (window.AETrack) AETrack('ai-chat-lead');
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-10), sessionId: sid(), lead: payloadLead })
    }).then(function (r) { return r.json(); }).then(function (d) {
      hideTyping();
      btnEl.disabled = false;
      if (d && d.reply) {
        history.push({ role: 'assistant', content: d.reply });
        saveHistory(history);
        addBubble(d.reply, 'ai');
        leadForm.classList.remove('ae-open');
        note.style.display = 'block';
        setTimeout(function () { note.style.display = 'none'; }, 8000);
        leadForm.querySelectorAll('input').forEach(function (i) { i.value = ''; });
      } else {
        addBubble('Sorry, I couldn\'t save that just now. Please WhatsApp us at https://wa.me/27615274429 — we reply within hours.', 'ai');
      }
    }).catch(function () {
      hideTyping();
      btnEl.disabled = false;
      addBubble('Sorry, I couldn\'t save that just now. Please WhatsApp us at https://wa.me/27615274429 — we reply within hours.', 'ai');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();

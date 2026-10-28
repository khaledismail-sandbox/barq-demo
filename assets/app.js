/* barq demo — shared UI + per-user state. All tracking goes through BarqAmp (amp.js). */
window.Barq = (function () {
  'use strict';
  var D = window.BarqData;
  var ROOT = window.BarqAmp ? BarqAmp.ROOT : './';

  /* ---------- icons (inline SVG, stroke = currentColor) ---------- */
  function svg(inner, size, extra) {
    size = size || 24;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || '') + '>' + inner + '</svg>';
  }
  var I = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/>',
    transfer: '<path d="M4 8h15"/><path d="m15 4 4 4-4 4"/><path d="M20 16H5"/><path d="m9 12-4 4 4 4"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 10h18"/>',
    gift: '<rect x="3.5" y="9" width="17" height="11" rx="1.5"/><path d="M12 9v11M3.5 13h17"/><path d="M12 9S10.5 4 8 4.5 7 9 12 9Zm0 0s1.5-5 4-4.5S17 9 12 9Z"/>',
    more: '<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>',
    back: '<path d="M20 12H4"/><path d="m10 6-6 6 6 6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    send: '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>',
    down: '<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>',
    qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Z"/><path d="m9 12 2 2 4-4"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
    support: '<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/>',
    gauge: '<path d="M4 18a8 8 0 1 1 16 0"/><path d="m12 18 4-6"/>',
    logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 16l-4-4 4-4"/><path d="M6 12h10"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    camera: '<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    pin: '<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
    bank: '<path d="M3 9.5 12 4l9 5.5"/><path d="M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3.5 20h17"/>'
  };
  function icon(name, size, extra) { return svg(I[name] || '', size, extra); }

  // barq mark redrawn from the app icon (spark with lightning-step stem).
  var MARK = '<svg viewBox="0 0 40 64" aria-hidden="true"><path fill="currentColor" d="M17 0h6v15h3v6c0 6 4 10 10 10v4c-6 0-10 4-10 10v4h-3v15h-6V54h-3v-4c0-6-4-10-10-10v-4c6 0 10-4 10-10v-5h3V0Zm3 25c-1 5-3 8-8 9.5 5 1.5 7 4.5 8 9.5 1-5 3-8 8-9.5-5-1.5-7-4.5-8-9.5Z"/></svg>';

  /* ---------- formatting ---------- */
  function round2(n) { return Math.round(n * 100) / 100; }
  function money(n, dp) {
    dp = dp == null ? 2 : dp;
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  }
  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map(function (s) { return s[0]; }).join('').toUpperCase();
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function avatar(name, corridor, cls) {
    var c = corridor ? D.corridor(corridor) : null;
    return '<span class="avatar ' + (cls || '') + '">' + esc(initials(name)) + (c ? '<span class="flag">' + c.flag + '</span>' : '') + '</span>';
  }

  /* ---------- per-user state (localStorage, barq_* keys) ---------- */
  function get(k, def) {
    try { var v = localStorage.getItem('barq_' + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; }
  }
  function set(k, v) { try { localStorage.setItem('barq_' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  function del(k) { try { localStorage.removeItem('barq_' + k); } catch (e) { /* ignore */ } }

  function persona() { return window.BarqAmp ? BarqAmp.persona() : null; }
  function personaKey() { var p = persona(); return p ? p.persona : 'new_unverified'; }
  function isVerified() { return personaKey() === 'verified_returning'; }
  function defaults() { return D.personaDefaults[personaKey()]; }
  function displayName() { var p = persona(); return p && p.name ? p.name : defaults().name; }

  function validFor(rec) { return rec && rec.name && rec.corridor && (!rec.owner || rec.owner === personaKey()); }

  function beneficiary() {
    var b = get('beneficiary');
    if (!validFor(b)) {
      b = D.recipient(defaults().recipient);
      set('beneficiary', b);
    }
    return b;
  }

  function amount() {
    var a = Number(get('amount'));
    if (!a || a <= 0) { a = defaults().amount; set('amount', a); }
    return a;
  }

  function rand4() { return String(Math.floor(1000 + Math.random() * 9000)); }

  function buildQuote(rec, amt) {
    var c = D.corridor(rec.corridor);
    var q = {
      quote_id: 'Q-' + c.cc + '-' + rand4(),
      corridor: c.code,
      send_amount_sar: amt,
      fx_rate: c.rate,
      payout_speed: c.speed,
      recipient: rec.name
    };
    set('quote', q);
    return q;
  }

  /** Current quote, always consistent with the active persona's beneficiary + amount. */
  function quote() {
    var b = beneficiary();
    var amt = amount();
    var q = get('quote');
    if (!q || q.recipient !== b.name || q.corridor !== b.corridor || !/^Q-[A-Z]{2}-\d{4}$/.test(q.quote_id)) {
      q = buildQuote(b, amt);
    } else if (q.send_amount_sar !== amt) {
      q.send_amount_sar = amt;
      set('quote', q);
    }
    return q;
  }

  function selectBeneficiary(rec) {
    set('beneficiary', rec);
    set('corridor', rec.corridor);
    return buildQuote(rec, amount());
  }

  function setAmount(a) {
    a = Math.max(1, Math.round(Number(a) || 0));
    set('amount', a);
    return quote();
  }

  function totals(q) {
    var total = round2(q.send_amount_sar + D.FEE_SAR + D.VAT_SAR);
    return {
      send_total_sar: total,
      fx_margin_sar: round2(total * D.FX_MARGIN_PCT / 100),
      receive: round2(q.send_amount_sar * q.fx_rate)
    };
  }

  function referral() { return get('referral'); }

  /* ---------- chrome: status bar, tab bar, sheets, toast ---------- */
  function screenEl() { return document.querySelector('.screen'); }

  function statusBar() {
    var el = document.querySelector('.statusbar');
    if (!el) return;
    el.innerHTML = '<span>9:41</span><span class="sb-icons">' +
      '<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>' +
      '<svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true"><path d="M8 2.2c2.4 0 4.5.9 6.1 2.4l1.2-1.3A10.3 10.3 0 0 0 8 .4C5.2.4 2.6 1.5.7 3.3l1.2 1.3A8.6 8.6 0 0 1 8 2.2Zm0 3.6c1.4 0 2.6.5 3.6 1.4l1.2-1.3A7 7 0 0 0 8 4a7 7 0 0 0-4.8 1.9l1.2 1.3c1-.9 2.2-1.4 3.6-1.4ZM8 9.4l2.2-2.3a3.3 3.3 0 0 0-4.4 0L8 9.4Z"/></svg>' +
      '<svg width="27" height="13" viewBox="0 0 27 13" fill="none" aria-hidden="true"><rect x=".5" y=".5" width="23" height="12" rx="3.5" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="20" height="9" rx="2" fill="currentColor"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fill="currentColor" opacity=".5"/></svg>' +
      '</span>';
  }

  function closeSheet() {
    var b = document.querySelector('.sheet-backdrop');
    if (b) b.remove();
  }

  function sheet(html) {
    closeSheet();
    var b = document.createElement('div');
    b.className = 'sheet-backdrop';
    b.innerHTML = '<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>' + html + '</div>';
    b.addEventListener('click', function (e) {
      if (e.target === b || e.target.closest('[data-close]')) closeSheet();
    });
    screenEl().appendChild(b);
    return b;
  }

  function appOnlySheet(title, body) {
    sheet('<h3>' + esc(title) + '</h3><p class="sub">' + esc(body || 'Available in the barq app.') + '</p>' +
      '<div class="card tint-blue mt16 row"><span class="logo-mark" style="width:44px;height:44px;border-radius:12px"><img src="' + ROOT + 'assets/icon.png" alt=""></span>' +
      '<div class="grow"><div class="strong">Available in the barq app</div><div class="caption">1 app, limitless possibilities ⚡</div></div></div>' +
      '<button class="btn mt16" data-close>Got it</button>');
  }

  function moreSheet() {
    var p = persona();
    var b = sheet('<h3>More</h3>' +
      '<div class="caption">' + esc(p ? p.userId : '') + '</div>' +
      '<div class="mt12">' +
      '<button class="list-row" data-act="support">' + icon('support', 22) + '<span class="grow">Support</span><span class="chev">' + icon('chev', 18) + '</span></button>' +
      '<a class="list-row" href="' + ROOT + 'profile/limits/">' + icon('gauge', 22) + '<span class="grow">Wallet limits</span><span class="chev">' + icon('chev', 18) + '</span></a>' +
      '<button class="list-row" data-act="logout" style="color:var(--danger)">' + icon('logout', 22) + '<span class="grow">Log out</span></button>' +
      '</div>');
    b.querySelector('[data-act="support"]').addEventListener('click', function () {
      sheet('<h3>Support</h3><p class="sub">We\'re here 24/7.</p>' +
        '<button class="list-row mt12" data-act="chat">' + icon('support', 22) + '<span class="grow">Chat with Support</span><span class="chev">' + icon('chev', 18) + '</span></button>' +
        '<button class="btn secondary mt16" data-close>Close</button>')
        .querySelector('[data-act="chat"]').addEventListener('click', function () {
          appOnlySheet('Chat with Support', 'Live chat with the barq team is available in the barq app.');
        });
    });
    b.querySelector('[data-act="logout"]').addEventListener('click', function () { BarqAmp.logout(); });
  }

  function tabBar() {
    var nav = document.querySelector('nav.tabbar');
    if (!nav) return;
    var active = nav.getAttribute('data-active');
    var tabs = [
      { id: 'home', label: 'Home', ic: 'home', href: ROOT + 'home/' },
      { id: 'transfers', label: 'Transfers', ic: 'transfer', href: ROOT + 'send/' },
      { id: 'cards', label: 'Cards', ic: 'card', sheet: 'cards' },
      { id: 'rewards', label: 'Rewards', ic: 'gift', href: ROOT + 'rewards/wheel/', from: 'rewards_tab' },
      { id: 'more', label: 'More', ic: 'more', sheet: 'more' }
    ];
    nav.innerHTML = tabs.map(function (t) {
      var cls = t.id === active ? ' class="active"' : '';
      var inner = icon(t.ic, 24) + '<span>' + t.label + '</span>';
      if (t.href) return '<a href="' + t.href + '"' + cls + ' data-tab="' + t.id + '"' + (t.from ? ' data-from="' + t.from + '"' : '') + '>' + inner + '</a>';
      return '<button type="button"' + cls + ' data-tab="' + t.id + '" data-sheet="' + t.sheet + '">' + inner + '</button>';
    }).join('');
    nav.addEventListener('click', function (e) {
      var el = e.target.closest('[data-tab]');
      if (!el) return;
      if (el.getAttribute('data-from')) set('wheel_from', el.getAttribute('data-from'));
      var s = el.getAttribute('data-sheet');
      if (s === 'cards') { e.preventDefault(); appOnlySheet('Cards', 'Manage your barq VISA card, freeze it or order a physical card in the barq app.'); }
      if (s === 'more') { e.preventDefault(); moreSheet(); }
    });
  }

  var toastTimer;
  function toast(msg) {
    var old = document.querySelector('.toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    screenEl().appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.remove(); }, 2200);
  }

  function wireBack() {
    document.querySelectorAll('[data-back]').forEach(function (b) {
      if (!b.innerHTML.trim()) b.innerHTML = icon('back', 24);
      b.addEventListener('click', function () { location.href = b.getAttribute('data-back'); });
    });
  }

  function fillMarks() {
    document.querySelectorAll('[data-mark]').forEach(function (el) { el.innerHTML = MARK; });
    document.querySelectorAll('[data-icon]').forEach(function (el) {
      el.innerHTML = icon(el.getAttribute('data-icon'), parseInt(el.getAttribute('data-size') || '24', 10));
    });
  }

  // Pages restored from the back/forward cache re-run so their load events and state stay accurate.
  window.addEventListener('pageshow', function (e) { if (e.persisted && persona()) location.reload(); });

  document.addEventListener('DOMContentLoaded', function () {
    statusBar();
    tabBar();
    wireBack();
    fillMarks();
  });

  return {
    ROOT: ROOT,
    icon: icon,
    MARK: MARK,
    money: money,
    round2: round2,
    initials: initials,
    esc: esc,
    avatar: avatar,
    get: get,
    set: set,
    del: del,
    persona: persona,
    personaKey: personaKey,
    isVerified: isVerified,
    defaults: defaults,
    displayName: displayName,
    beneficiary: beneficiary,
    amount: amount,
    quote: quote,
    buildQuote: buildQuote,
    selectBeneficiary: selectBeneficiary,
    setAmount: setAmount,
    totals: totals,
    referral: referral,
    sheet: sheet,
    closeSheet: closeSheet,
    appOnlySheet: appOnlySheet,
    toast: toast
  };
})();

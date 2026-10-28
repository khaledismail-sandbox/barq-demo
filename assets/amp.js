/*
 * barq demo — the ONE analytics wrapper. Every event goes through window.BarqAmp.
 *  1. identify before the first track on every page (tracks are queued until identify completes)
 *  2. country/region/city on every event (geoPlugin, incl. SDK session + frustration events)
 *  3. no event before a persona exists (except /kyc-guided/, which boots with allowFallback)
 */
(function () {
  'use strict';

  var KEY = 'eaab296fb14408ea7bb00b1e58b41087';
  var SR_CFG_URL = 'https://sr-client-cfg.amplitude.com/config/' + KEY + '?config_group=browser';
  var SCRIPT = document.currentScript;
  var ROOT = SCRIPT && SCRIPT.src ? SCRIPT.src.replace(/assets\/amp\.js(\?.*)?$/, '') : './';
  var IDENTIFY_TIMEOUT_MS = 1500;
  var NAV_WAIT_MS = 800;
  var REC_KEYS = { barq_rec: 1, barq_rec_log: 1, barq_rec_wire: 1 };

  var PERSONAS = {
    verified_returning: {
      code: 'v',
      user: {
        verified_customer: true,
        wallet_limit_tier: 'full',
        utm_medium: 'cpc',
        utm_source: 'google',
        utm_campaign: 'google_send_money_ksa',
        referrer: 'https://www.google.com/',
        referring_domain: 'www.google.com',
        account_age_days: 412,
        device_type: 'ios'
      },
      geo: { country: 'Saudi Arabia', region: 'Riyadh Region', city: 'Riyadh' }
    },
    new_unverified: {
      code: 'n',
      user: {
        verified_customer: false,
        wallet_limit_tier: 'basic',
        utm_medium: 'social',
        utm_source: 'snapchat',
        utm_campaign: 'snap_first_transfer_free',
        referrer: 'https://www.snapchat.com/',
        referring_domain: 'www.snapchat.com',
        account_age_days: 0,
        device_type: 'android'
      },
      geo: { country: 'Saudi Arabia', region: 'Makkah Region', city: 'Jeddah' }
    }
  };

  var FUNNEL = {
    'Wallet Home Viewed': 1,
    'Transfer Quote Viewed': 2,
    'Send Money Started': 3,
    'Transfer Review Viewed': 4,
    'International Transfer Completed': 5
  };

  var SDK_EVENTS = {
    '[Amplitude] Start Session': 1,
    '[Amplitude] End Session': 1,
    '[Amplitude] Rage Click': 1,
    '[Amplitude] Dead Click': 1
  };

  var state = { fallback: null, inited: false, ready: false, queue: [], pageStart: Date.now() };

  /* ---------- helpers ---------- */

  function today() {
    return new Date().toISOString().split('T')[0].replace(/-/g, '');
  }

  function generateUserId(name, demoNumber, personaCode) {
    var clean = String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '') || 'user';
    return clean + '_' + personaCode + '_' + demoNumber + '_' + today();
  }

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage full / blocked */ } }

  function clearBarqKeys(keepRecorder) {
    try {
      Object.keys(localStorage).forEach(function (k) {
        if (k.indexOf('barq_') === 0 && !(keepRecorder && REC_KEYS[k])) localStorage.removeItem(k);
      });
    } catch (e) { /* ignore */ }
  }

  function readPersona() {
    try {
      var p = JSON.parse(lsGet('barq_persona') || 'null');
      if (p && p.date === today() && PERSONAS[p.persona] && p.userId) return p;
    } catch (e) { /* ignore */ }
    return null;
  }

  function current() { return readPersona() || state.fallback; }

  function amp() { return window.amplitude; }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------- opt-in recorder (records at send time, inside the wrapper) ---------- */

  function record(name, props, options, extra) {
    if (lsGet('barq_rec') !== '1') return;
    var p = current();
    var entry = {
      ts: new Date().toISOString(),
      page: location.pathname,
      name: name,
      props: props || {},
      options: options || null,
      user_id: p ? p.userId : null,
      country: p ? PERSONAS[p.persona].geo.country : null
    };
    if (extra) for (var k in extra) entry[k] = extra[k];
    var log;
    try { log = JSON.parse(lsGet('barq_rec_log') || '[]'); } catch (e) { log = []; }
    log.push(entry);
    if (log.length > 2000) log = log.slice(-2000);
    lsSet('barq_rec_log', JSON.stringify(log));
  }

  /** Event as it leaves the SDK pipeline (after enrichment) — proves country, ids and revenue placement. */
  function recordWire(ev) {
    if (lsGet('barq_rec') !== '1') return;
    var log;
    try { log = JSON.parse(lsGet('barq_rec_wire') || '[]'); } catch (e) { log = []; }
    log.push({
      name: ev.event_type, user_id: ev.user_id, session_id: ev.session_id,
      country: ev.country, region: ev.region, city: ev.city,
      revenue: ev.revenue, price: ev.price, quantity: ev.quantity, revenueType: ev.revenueType,
      props: ev.event_properties, user_props: ev.user_properties, page: location.pathname
    });
    if (log.length > 2000) log = log.slice(-2000);
    lsSet('barq_rec_wire', JSON.stringify(log));
  }

  var rec = {
    on: function () { lsSet('barq_rec', '1'); return 'barq recorder ON'; },
    off: function () { try { localStorage.removeItem('barq_rec'); } catch (e) {} return 'barq recorder OFF'; },
    clear: function () { lsSet('barq_rec_log', '[]'); lsSet('barq_rec_wire', '[]'); return 'barq recorder log cleared'; },
    wire: function () {
      try { return JSON.parse(lsGet('barq_rec_wire') || '[]'); } catch (e) { return []; }
    },
    dump: function () {
      var log;
      try { log = JSON.parse(lsGet('barq_rec_log') || '[]'); } catch (e) { log = []; }
      if (console.table) {
        console.table(log.map(function (e) {
          return { ts: e.ts, page: e.page, name: e.name, country: e.country, props: JSON.stringify(e.props), options: e.options ? JSON.stringify(e.options) : '' };
        }));
      }
      return log;
    }
  };

  /* ---------- geo enrichment plugin ---------- */

  var geoPlugin = {
    name: 'barq-geo',
    type: 'enrichment',
    setup: function () { return Promise.resolve(); },
    execute: function (event) {
      var p = current();
      if (!p) {
        console.warn('[BarqAmp] dropped event without persona:', event && event.event_type);
        return Promise.resolve(null);
      }
      var g = PERSONAS[p.persona].geo;
      event.country = g.country;
      event.region = g.region;
      event.city = g.city;
      if (SDK_EVENTS[event.event_type]) record(event.event_type, event.event_properties, null, { source: 'sdk' });
      recordWire(event);
      return Promise.resolve(event);
    }
  };

  /* ---------- SDK init ---------- */

  // The unified loader auto-inits with its own defaults unless an init call is already queued,
  // so every page queues one: persona pages normally, public pages opted out (nothing is sent).
  function initSdk(userId, optOut) {
    if (state.inited) return true;
    var a = amp();
    if (!a || typeof a.init !== 'function') {
      console.warn('[BarqAmp] Amplitude SDK not loaded — events disabled on this page.');
      return false;
    }
    state.optedOut = !!optOut;
    if (window.sessionReplay) a.add(window.sessionReplay.plugin({
      sampleRate: 1,
      privacyConfig: {
        defaultMaskLevel: 'light',
        maskSelector: ['.amp-mask'],
        blockSelector: ['.amp-block']
      }
    }));
    if (window.engagement) a.add(window.engagement.plugin());
    a.add(geoPlugin);

    a.init(KEY, userId, {
      optOut: !!optOut,
      fetchRemoteConfig: true,
      autocapture: {
        attribution: false,
        pageViews: false,
        sessions: true,
        formInteractions: false,
        fileDownloads: false,
        elementInteractions: false,
        frustrationInteractions: true
      }
    });
    state.inited = true;
    return true;
  }

  function releaseQueue() {
    state.ready = true;
    var q = state.queue;
    state.queue = [];
    q.forEach(function (job) { job(); });
  }

  function identifyThenRelease(p) {
    var a = amp();
    a.setUserId(p.userId);
    var cfg = PERSONAS[p.persona];
    var props = { persona: p.persona };
    for (var k in cfg.user) props[k] = cfg.user[k];
    var once = {
      initial_utm_source: cfg.user.utm_source,
      initial_utm_medium: cfg.user.utm_medium,
      initial_utm_campaign: cfg.user.utm_campaign,
      initial_referrer: cfg.user.referrer,
      initial_referring_domain: cfg.user.referring_domain
    };
    if (typeof a.Identify !== 'function') {
      console.warn('[BarqAmp] amplitude.Identify unavailable — releasing tracks without identify.');
      releaseQueue();
      return;
    }
    var id = new a.Identify();
    Object.keys(props).forEach(function (key) { id.set(key, props[key]); });
    Object.keys(once).forEach(function (key) { id.setOnce(key, once[key]); });
    record('$identify', { $set: props, $setOnce: once }, null);
    var res = a.identify(id);
    if (a.flush) a.flush();
    var done = res && res.promise ? res.promise : Promise.resolve();
    Promise.race([done, wait(IDENTIFY_TIMEOUT_MS)]).then(releaseQueue, releaseQueue);
  }

  /* ---------- public API ---------- */

  function track(name, props, options, _flush) {
    if (!current()) {
      console.warn('[BarqAmp] track("' + name + '") ignored — no persona yet.');
      return Promise.resolve(null);
    }
    if (!state.inited) {
      console.warn('[BarqAmp] track("' + name + '") ignored — SDK not initialised.');
      return Promise.resolve(null);
    }
    return new Promise(function (resolve) {
      var job = function () {
        if (FUNNEL[name]) {
          var deepest = parseInt(lsGet('barq_deepest') || '0', 10);
          if (FUNNEL[name] > deepest) lsSet('barq_deepest', String(FUNNEL[name]));
          if (FUNNEL[name] === 5) lsSet('barq_converted', '1');
        }
        record(name, props, options);
        var res = options ? amp().track(name, props, options) : amp().track(name, props);
        if (_flush && amp().flush) amp().flush();
        (res && res.promise ? res.promise : Promise.resolve()).then(resolve, resolve);
      };
      if (state.ready) job(); else state.queue.push(job);
    });
  }

  function trackThenGo(name, props, href, options) {
    var gone = false;
    function go() { if (!gone) { gone = true; location.href = href; } }
    Promise.race([track(name, props, options, true), wait(NAV_WAIT_MS)]).then(go, go);
  }

  function normalisedPath() {
    return location.pathname.replace(/index\.html$/, '').replace(/\/+$/, '') || '/';
  }

  function pageView(title) {
    var path = normalisedPath();
    return track('[Amplitude] Page Viewed', {
      '[Amplitude] Page Domain': location.hostname,
      '[Amplitude] Page Location': location.origin + path,
      '[Amplitude] Page Path': path,
      '[Amplitude] Page Title': 'barq — ' + title,
      '[Amplitude] Page URL': location.origin + path
    });
  }

  /** Call from <head> on every persona-gated page. Redirects to the splash (no tracking) without a persona. */
  function boot(opts) {
    opts = opts || {};
    var p = readPersona();
    if (!p && opts.allowFallback) {
      state.fallback = { persona: 'new_unverified', userId: 'kyc_guided_demo', name: 'Guest', demo: 1, fallback: true };
      p = state.fallback;
    }
    if (!p) {
      location.replace(ROOT);
      return false;
    }
    if (opts.title) document.title = 'barq — ' + opts.title;
    if (!initSdk(p.userId)) return true;
    identifyThenRelease(p);
    if (opts.title) pageView(opts.title);
    return true;
  }

  /** Login / signup submit: wipes all per-user state, resets Amplitude, then sets the new identity. */
  function startPersona(persona, name, demoNumber) {
    var cfg = PERSONAS[persona];
    var demo = parseInt(demoNumber, 10) || 1;
    var uid = generateUserId(name, demo, cfg.code);
    clearBarqKeys(true);
    var p = { persona: persona, userId: uid, name: String(name || '').trim() || 'User', demo: demo, date: today() };
    lsSet('barq_persona', JSON.stringify(p));
    state.ready = false;
    if (initSdk(uid)) {
      var a = amp();
      if (state.optedOut) { a.setOptOut(false); state.optedOut = false; }
      a.reset();
      a.setUserId(uid);
      // New session for the new identity -> [Amplitude] Start Session anchors this user's replay.
      if (a.setSessionId) a.setSessionId(Date.now());
      identifyThenRelease(p);
    }
    return uid;
  }

  /** Splash, login, signup, 404: claim init (so the loader doesn't auto-init) but send nothing. */
  function bootPublic() {
    initSdk(undefined, true);
  }

  function logout() {
    if (state.inited && amp() && amp().reset) amp().reset();
    clearBarqKeys(false);
    location.href = ROOT;
  }

  /* ---------- session_ended on every page exit ---------- */

  window.addEventListener('pagehide', function () {
    var p = current();
    if (!state.inited || state.optedOut || !p) return;
    var a = amp();
    try { a.setTransport('beacon'); } catch (e) { /* older SDK */ }
    if (!state.ready) releaseQueue();
    var deepest = Math.min(5, Math.max(1, parseInt(lsGet('barq_deepest') || '1', 10)));
    var sid = a.getSessionId ? a.getSessionId() : null;
    var started = typeof sid === 'number' && sid > 0 ? sid : state.pageStart;
    track('session_ended', {
      deepest_funnel_step_reached: deepest,
      converted: lsGet('barq_converted') === '1',
      session_duration_seconds: Math.max(0, Math.round((Date.now() - started) / 1000))
    });
    if (a.flush) a.flush();
  });

  window.addEventListener('pageshow', function (e) {
    if (e.persisted && state.inited) {
      try { amp().setTransport('fetch'); } catch (err) { /* ignore */ }
    }
  });

  /* ---------- diagnostics ---------- */

  function findMaskKeys(obj, path, out) {
    if (!obj || typeof obj !== 'object') return out;
    Object.keys(obj).forEach(function (k) {
      var v = obj[k];
      var here = path ? path + '.' + k : k;
      if (/mask/i.test(k) && (typeof v !== 'object' || v === null)) out.push(here + ' = ' + JSON.stringify(v));
      else if (typeof v === 'object') findMaskKeys(v, here, out);
    });
    return out;
  }

  function sdkCheck() {
    var a = window.amplitude;
    var report = {
      amplitude: typeof a,
      'amplitude.track': a ? typeof a.track : 'n/a',
      sessionReplay: typeof window.sessionReplay,
      'sessionReplay.plugin': window.sessionReplay ? typeof window.sessionReplay.plugin : 'n/a',
      engagement: typeof window.engagement,
      'engagement.plugin': window.engagement ? typeof window.engagement.plugin : 'n/a',
      Experiment: typeof window.Experiment,
      webExperiment: typeof window.webExperiment,
      WebExperiment: typeof window.WebExperiment
    };
    var expFound = ['Experiment', 'webExperiment', 'WebExperiment'].filter(function (k) {
      return typeof window[k] !== 'undefined';
    });
    report.experimentGlobalsFound = expFound.length ? expFound.join(', ') : 'NONE';
    console.log('[BarqAmp] sdkCheck', report);
    if (!expFound.length) console.error('[BarqAmp] No Web Experiment global found (Experiment / webExperiment / WebExperiment).');
    window.__barqSdkCheck = report;
    return fetch(SR_CFG_URL).then(function (r) { return r.json(); }).then(function (cfg) {
      var masks = findMaskKeys(cfg, '', []);
      report.sessionReplayRemoteMask = masks.length ? masks.join('; ') : 'not set remotely (code value "light" applies)';
      console.log('[BarqAmp] Session Replay remote mask config:', report.sessionReplayRemoteMask);
      return report;
    }).catch(function (err) {
      report.sessionReplayRemoteMask = 'fetch failed: ' + err;
      console.warn('[BarqAmp] could not fetch Session Replay remote config', err);
      return report;
    });
  }

  window.BarqAmp = {
    ROOT: ROOT,
    PERSONAS: PERSONAS,
    geoPlugin: geoPlugin,
    generateUserId: generateUserId,
    persona: current,
    boot: boot,
    bootPublic: bootPublic,
    startPersona: startPersona,
    logout: logout,
    track: track,
    trackThenGo: trackThenGo,
    pageView: pageView,
    sdkCheck: sdkCheck,
    rec: rec
  };
})();

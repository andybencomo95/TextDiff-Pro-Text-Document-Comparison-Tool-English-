/* TextDiff Pro - Live global visitor counter
 * Data source : CounterAPI (countapi.mileshilliard.com) - free, no key, CORS enabled
 * Geo source  : ipwho.is -> ipapi.co -> freeipapi.com (fallback chain, CORS enabled)
 * Privacy     : only anonymous country counters are stored. No IPs, no personal data.
 * Anti-inflation : one visit counted per visitor per day (anonymous local id).
 */
"use strict";
(function () {
  const NS = "textdiffpro_live_v1";
  const API = "https://countapi.mileshilliard.com/api/v1";
  const CACHE_KEY = "tdiff_live_cache_v1";
  const CACHE_TTL = 30 * 60 * 1000;
  const $ = (id) => document.getElementById(id);
  const totalEl = $("lvTotal"), weekEl = $("lvWeek"), monthEl = $("lvMonth"), yearEl = $("lvYear");
  const onlineEl = $("lvOnline"), listEl = $("lvCountries"), topEl = $("lvTop5");
  const statusEl = $("lvStatus"), nEl = $("lvNCountries");
  const myFlagEl = $("lvMyFlag"), myCountryEl = $("lvMyCountry"), searchEl = $("lvSearch");
  if (!totalEl || !listEl) return;
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const isoWeek = (() => {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const wd = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - wd + 3);
    const first = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
    const fwd = (first.getUTCDay() + 6) % 7; first.setUTCDate(first.getUTCDate() - fwd + 3);
    return pad(1 + Math.round((d - first) / 6048e5));
  })();
  const K = {
    total: NS + "_total",
    year: NS + "_y" + now.getFullYear(),
    month: NS + "_m" + now.getFullYear() + pad(now.getMonth() + 1),
    week: NS + "_w" + now.getFullYear() + "W" + isoWeek,
  };
  const CC = { US: "United States", GB: "United Kingdom", CA: "Canada", AU: "Australia", ES: "Spain", MX: "Mexico", AR: "Argentina", CO: "Colombia", CL: "Chile", PE: "Peru", VE: "Venezuela", EC: "Ecuador", UY: "Uruguay", PY: "Paraguay", BO: "Bolivia", CR: "Costa Rica", PA: "Panama", DO: "Dominican Rep.", GT: "Guatemala", HN: "Honduras", SV: "El Salvador", NI: "Nicaragua", CU: "Cuba", PR: "Puerto Rico", BR: "Brazil", PT: "Portugal", FR: "France", DE: "Germany", IT: "Italy", NL: "Netherlands", BE: "Belgium", CH: "Switzerland", AT: "Austria", IE: "Ireland", SE: "Sweden", NO: "Norway", DK: "Denmark", FI: "Finland", PL: "Poland", GR: "Greece", RO: "Romania", UA: "Ukraine", TR: "Turkey", IL: "Israel", AE: "UAE", SA: "Saudi Arabia", IN: "India", PK: "Pakistan", BD: "Bangladesh", CN: "China", JP: "Japan", KR: "South Korea", SG: "Singapore", MY: "Malaysia", ID: "Indonesia", PH: "Philippines", TH: "Thailand", VN: "Vietnam", TW: "Taiwan", HK: "Hong Kong", ZA: "South Africa", NG: "Nigeria", EG: "Egypt", MA: "Morocco", KE: "Kenya", NZ: "New Zealand" };
  const flag = (cc) => { try { return String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 127397 + c.charCodeAt())); } catch (e) { return "?"; } };
  const fmt = (n) => Number(n || 0).toLocaleString("en-US");
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  async function api(path) { const r = await fetch(API + path); if (!r.ok) throw new Error("API " + r.status); return r.json(); }
  const get = (k) => api("/get/" + encodeURIComponent(k)).then((d) => Number(d.value) || 0).catch(() => 0);
  const hit = (k) => api("/hit/" + encodeURIComponent(k)).then((d) => Number(d.value) || 0).catch(() => 0);
  /* ---- local cache: keeps the widget fast and avoids hammering the API ---- */
  function cacheGet(ttl) {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const c = JSON.parse(raw);
      if (!c || !c.t || Date.now() - c.t > (ttl || CACHE_TTL)) return null;
      return c;
    } catch (e) { return null; }
  }
  function cacheSet(data, countries) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d: data, c: countries || null })); } catch (e) {}
  }
  /* ---- run parallel requests with a small concurrency limit (be nice to the API) ---- */
  async function pooled(tasks, limit) {
    const out = new Array(tasks.length);
    let idx = 0;
    async function worker() {
      while (idx < tasks.length) {
        const i = idx++;
        try { out[i] = await tasks[i](); } catch (e) { out[i] = 0; }
      }
    }
    const n = Math.min(limit || 8, tasks.length);
    await Promise.all(Array.from({ length: n }, worker));
    return out;
  }
  /* ---- anonymous visitor id (random, stored locally, never sent) ---- */
  function visitorId() {
    try {
      let v = localStorage.getItem("tdiff_vid");
      if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("tdiff_vid", v); }
      return v;
    } catch (e) { return "anon"; }
  }
  /* ---- one counted visit per visitor per day (prevents refresh inflation) ---- */
  function isFirstVisitToday() {
    const key = "tdiff_visit_" + now.toISOString().slice(0, 10);
    try {
      const seen = localStorage.getItem(key);
      localStorage.setItem(key, visitorId());
      return !seen;
    } catch (e) { return true; }
  }
  const GEO_APIS = [
    { url: "https://ipwho.is/", pick: (j) => ({ cc: j.country_code, name: j.country }) },
    { url: "https://ipapi.co/json/", pick: (j) => ({ cc: j.country_code || j.country, name: j.country_name }) },
    { url: "https://freeipapi.com/api/json", pick: (j) => ({ cc: j.countryCode, name: j.countryName }) },
  ];
  async function geo() {
    for (const g of GEO_APIS) {
      try {
        const ctl = new AbortController();
        const to = setTimeout(() => ctl.abort(), 5000);
        const r = await fetch(g.url, { signal: ctl.signal });
        clearTimeout(to);
        if (!r.ok) continue;
        const j = await r.json();
        const v = g.pick(j) || {};
        const cc = String(v.cc || "").toUpperCase();
        if (/^[A-Z]{2}$/.test(cc)) return { cc: cc, name: v.name || CC[cc] || cc };
      } catch (e) {}
    }
    return null;
  }
  let rows = [];
  function paint() {
    if (!listEl || !topEl) return;
    const q = ((searchEl && searchEl.value) || "").toLowerCase();
    const shown = rows.filter((r) => !q || r.name.toLowerCase().includes(q) || r.cc.toLowerCase() === q);
    if (nEl) nEl.textContent = rows.length ? rows.length + (rows.length === 1 ? " country" : " countries") : "";
    listEl.innerHTML = shown.length ? shown.map((r, i) =>
      '<div class="live-row' + (i === 0 ? " top1" : "") + (r.me ? " me" : "") + '"><span class="flag">' + flag(r.cc) + '</span><span class="cc">' + esc(r.cc) + '</span><span class="nm">' + esc(r.name) + (r.me ? " (you)" : "") + '</span><span class="ct">' + fmt(r.n) + "</span></div>"
    ).join("") : '<p class="live-loading">No countries match.</p>';
    const max = rows.length ? rows[0].n : 0;
    topEl.innerHTML = rows.slice(0, 5).map((r, i) =>
      '<div><div class="live-top"><span class="flag">' + flag(r.cc) + '</span><span class="nm">#' + (i + 1) + " " + esc(r.name) + '</span><span class="ct">' + fmt(r.n) + '</span></div><div class="live-bar"><i style="width:' + (max ? Math.round(r.n / max * 100) : 0) + '%"></i></div></div>'
    ).join("") || '<p class="live-loading">No data yet.</p>';
  }
  if (searchEl) searchEl.addEventListener("input", paint);
  /* ---- "online right now": global count of visitors active in the last minute.
     The counter API has no TTL/listing, so we use one rolling counter key per
     minute (NS_onl_YYYYMMDDHHMM). Every visitor increments the current minute
     key at most once (dedup via a local flag) and we read that key back.
     A 30s heartbeat keeps long sessions counted. ---- */
  function minuteStamp(d) {
    return String(d.getFullYear()) + pad(d.getMonth() + 1) + pad(d.getDate()) + pad(d.getHours()) + pad(d.getMinutes());
  }
  async function beacon() {
    const stamp = minuteStamp(new Date());
    const key = NS + "_onl_" + stamp;
    const flag = "tdiff_onl_" + stamp;
    try {
      if (!localStorage.getItem(flag)) {
        localStorage.setItem(flag, visitorId());
        await hit(key);
      }
    } catch (e) {}
    return get(key);
  }
  function renderCounts(d) {
    totalEl.textContent = fmt(d.total);
    weekEl.textContent = fmt(d.week);
    monthEl.textContent = fmt(d.month);
    yearEl.textContent = fmt(d.year);
    if (onlineEl) onlineEl.textContent = fmt(d.online);
  }
  (async () => {
    const cached = cacheGet(CACHE_TTL);
    if (cached) {
      renderCounts(cached.d);
      if (cached.c) {
        rows = Object.keys(cached.c).map((cc) => ({ cc: cc, name: CC[cc] || cc, n: cached.c[cc] || 0, me: false })).filter((r) => r.n > 0).sort((a, b) => b.n - a.n);
        if (rows.length) paint();
      }
    }
    let mine = null;
    try { mine = await geo(); } catch (e) {}
    if (mine) {
      myFlagEl.textContent = flag(mine.cc);
      myCountryEl.textContent = mine.name + " (" + mine.cc + ") - your visit";
    } else {
      myFlagEl.textContent = "?";
      myCountryEl.textContent = "Country unavailable (offline?)";
    }
    const online = await beacon();
    const first = isFirstVisitToday();
    const jobs = [K.total, K.year, K.month, K.week].map((k) => (first ? hit(k) : get(k)));
    if (mine) jobs.push((first ? hit(NS + "_c_" + mine.cc) : get(NS + "_c_" + mine.cc)));
    const res = await Promise.allSettled(jobs);
    const num = (i) => (res[i] && res[i].status === "fulfilled" ? Number(res[i].value) || 0 : 0);
    const counts = { total: num(0), year: num(1), month: num(2), week: num(3), online: online };
    renderCounts(counts);
    let myCount = 0;
    if (mine && res[4] && res[4].status === "fulfilled") myCount = Number(res[4].value) || 0;
    const codes = Object.keys(CC);
    /* country breakdown loads in the background so the main cards appear instantly */
    const loadCountries = async () => {
      const ccached = cacheGet(CACHE_TTL);
      const ccMap = (ccached && ccached.c) || null;
      let countryCounts;
      if (ccMap) {
        countryCounts = codes.map((cc) => (mine && cc === mine.cc ? myCount : (ccMap[cc] || 0)));
      } else {
        countryCounts = await pooled(codes.map((cc) => () => (mine && cc === mine.cc ? Promise.resolve(myCount) : get(NS + "_c_" + cc))), 8);
      }
      const ccObj = {};
      codes.forEach((cc, i) => { ccObj[cc] = countryCounts[i] || 0; });
      rows = codes.map((cc) => ({ cc: cc, name: CC[cc], n: ccObj[cc] || 0, me: !!(mine && cc === mine.cc) })).filter((r) => r.n > 0);
      if (mine && !rows.some((r) => r.cc === mine.cc)) rows.push({ cc: mine.cc, name: mine.name || CC[mine.cc] || mine.cc, n: myCount, me: true });
      rows.sort((a, b) => b.n - a.n);
      paint();
      cacheSet(counts, ccObj);
    };
    loadCountries();
    statusEl.textContent = first ? "Live - your visit was just counted." : "Live - updated just now (1 visit counted per day per visitor).";
    /* keep "online now" fresh (30s heartbeat) without re-counting the visit */
    setInterval(async () => { const n = await beacon(); if (onlineEl) onlineEl.textContent = fmt(n); }, 30000);
  })().catch(() => {
    if (!cached) {
      totalEl.textContent = "-"; weekEl.textContent = "-"; monthEl.textContent = "-"; yearEl.textContent = "-";
      listEl.innerHTML = '<p class="live-loading">Could not reach the live counter.</p>';
    }
    statusEl.textContent = "Counter offline - showing last known values.";
  });
})();

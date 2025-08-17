// Wait until scripts are available even with defer
document.addEventListener("DOMContentLoaded", () => { initPage(); });

async function initPage(){
  // --- CONFIG ---
  const SUPABASE_URL = "https://todzlrbaovbqdwxdlcxs.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvZHpscmJhb3ZicWR3eGRsY3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNzM1MjIsImV4cCI6MjA3MDc0OTUyMn0.zsE2fHxF8QUPpiOfYXKz4oe8wVccN76ewDd56u2F6FY";
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const MODERATED = false;

  const urlParams = new URLSearchParams(location.search);
  const tilerId = urlParams.get("id");

  // --- UTIL ---
  const $ = s=>document.querySelector(s);
  const $$ = s=>document.querySelectorAll(s);
  function escapeHtml(str){ return String(str||"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;","&gt;":"&gt;","\"":"&quot;","'":"&#39;"}[s])); }
  function percentFrom5(avg){ return Math.round((avg/5)*100) + "%"; }
  function starsFromAvg(avg){ const r = Math.round(avg||0); return "★".repeat(r) + "☆".repeat(5-r); }
  function avgOfRow(r){ return ((r.quality||0)+(r.service||0)+(r.timeline||0)+(r.pricing||0)+(r.cleanliness||0))/5; }

  // Footer WA wiring retries (header/footer are injected async)
  function wireFooterWhatsApp(cleanWa, name, tries=0){
    const waFooter = document.getElementById("whatsappLink");
    if (waFooter && cleanWa){
      waFooter.href = `https://wa.me/94${cleanWa}`;
      waFooter.textContent = "WhatsApp " + name;
      waFooter.classList.add("link");
      return;
    }
    if (tries < 20) setTimeout(()=>wireFooterWhatsApp(cleanWa, name, tries+1), 200);
  }

  // --- PROFILE (also wires buttons + footer WhatsApp) ---
  async function loadTilerProfile(){
    try{
      if(!tilerId){
        $("#tilerName").textContent = "Tiler not found";
        $(".container").insertAdjacentHTML("afterbegin",
          `<div class="card"><p class="muted">Missing ?id= in the URL. Example: <code>/tilers/tiler.html?id=saman-anurudda</code></p></div>`);
        return;
      }
      const res = await fetch("/tilers/tilers.json", { cache:"no-cache" });
      if(!res.ok) throw new Error("Could not load /tilers/tilers.json");
      const data = await res.json();
      const tiler = data.find(t => String(t.id) === String(tilerId));
      if(!tiler){
        $("#tilerName").textContent = "Tiler not found";
        $(".container").insertAdjacentHTML("afterbegin",
          `<div class="card"><p class="muted">Invalid tiler id: <code>${escapeHtml(tilerId)}</code></p></div>`);
        return;
      }

      document.title = `${tiler.name} | TILERSHUB`;
      $("#tilerName").textContent = tiler.name;
      $("#tilerCity").textContent = "Verified Tiler – " + (tiler.city||"");
      $("#bioText").textContent = tiler.bio || "";
      $("#highlightTags").innerHTML = (tiler.highlights||[]).map(h=>`<span class="highlight-tag">${escapeHtml(h)}</span>`).join("");
      $("#coverImage").style.backgroundImage = `url('${tiler.cover || "/default-cover.jpg"}')`;
      $("#profilePic").style.backgroundImage = `url('${tiler.image}')`;

      const cleanWa = String(tiler.whatsapp || "").replace(/\D/g,"").replace(/^0/,"");

      // Action buttons
      const btnWA = $("#btnWhatsApp");
      if (btnWA && cleanWa) {
        const msg = `Hi ${tiler.name}, I found you on TILERSHUB and would like to discuss a tiling job. (${location.href})`;
        btnWA.href = `https://wa.me/94${cleanWa}?text=${encodeURIComponent(msg)}`;
      } else if (btnWA) {
        btnWA.style.display = "none";
      }

      const btnFB = $("#btnFacebook");
      if (btnFB) {
        const fbUrl = tiler.facebook && tiler.facebook.trim();
        const msgr = tiler.messenger && tiler.messenger.trim();
        if (msgr) {
          btnFB.href = `https://m.me/${encodeURIComponent(msgr)}`;
          btnFB.querySelector("span").textContent = "Messenger";
        } else if (fbUrl) {
          btnFB.href = fbUrl;
          btnFB.querySelector("span").textContent = "Facebook";
        } else {
          btnFB.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}`;
          btnFB.querySelector("span").textContent = "Share";
        }
      }

      if (cleanWa) wireFooterWhatsApp(cleanWa, tiler.name);

      // Load evaluation for this tiler
      await loadEvaluation(tiler);
    }catch(e){
      console.error(e);
      $(".container").insertAdjacentHTML("afterbegin",
        `<div class="card"><p class="muted">Could not load profile. Check if <code>/tilers/tilers.json</code> exists and is publicly readable.</p></div>`);
    }
  }

  /* ===== EVALUATION: load from /tilers/evaluation-result.json and render ===== */

  // Robust key/id helpers
  function normKey(s){
    return String(s||"")
      .replace(/\u2013|\u2014/g, "-") // en/em dash → hyphen
      .replace(/\s+/g, " ")           // collapse spaces
      .replace(/\s*:\s*$/, "")        // drop trailing colon
      .trim()
      .toLowerCase();
  }
  function slugifyId(s){
    return String(s||"")
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,"-")
      .replace(/^-+|-+$/g,"");
  }
  function byNorm(obj, key){
    if(!obj) return undefined;
    const table = {};
    for(const k of Object.keys(obj)) table[normKey(k)] = obj[k];
    return table[normKey(key)];
  }
  function getSection(obj, title){
    return byNorm(obj, title) || byNorm(obj, title.replace(/–/g,"-"));
  }

  async function loadEvaluation(tiler){
    const id = String(tiler.id);
    const name = String(tiler.name||"");
    const variants = [id, name, slugifyId(name), slugifyId(id)];
    const card = document.getElementById("evaluationCard");
    let ev = null, sourceNote = "";

    try {
      const r = await fetch("/tilers/evaluation-result.json", { cache: "no-cache" });
      if (r.ok) {
        const data = await r.json();

        // OBJECT keyed by id?
        if (data && typeof data === "object" && !Array.isArray(data)) {
          const keyMap = {};
          for (const k of Object.keys(data)) keyMap[normKey(k)] = data[k];
          for (const v of variants) {
            if (ev) break;
            ev = keyMap[normKey(v)];
            if (ev) sourceNote = `found by key "${v}"`;
          }
          if (!ev) {
            // fallback: match by "Tiler Name"
            for (const k of Object.keys(data)) {
              const rec = data[k];
              const recName = rec["Tiler Name"] || rec["Tiler Name:"] || rec.name;
              if (recName && normKey(recName) === normKey(name)) { ev = rec; sourceNote = `matched by "Tiler Name"`; break; }
            }
          }
        }

        // ARRAY of records?
        if (!ev && Array.isArray(data)) {
          ev = data.find(rec =>
            normKey(rec["Tiler ID"]||rec.id||"") === normKey(id) ||
            normKey(rec["Tiler Name"]||"") === normKey(name) ||
            normKey(slugifyId(rec["Tiler Name"]||"")) === normKey(slugifyId(name))
          );
          if (ev) sourceNote = "found in array";
        }
      }
    } catch (e) {
      console.error("evaluation-result.json fetch error:", e);
    }

    if (!ev) { card.style.display = "none"; return; }

    attachEvalDebug(ev, sourceNote);
    const mapped = mapPdfJsonToMetrics(ev);
    renderEvaluation(mapped);
    card.style.display = "";
  }

  function mapPdfJsonToMetrics(pdfRaw){
    const pdf = {};
    for(const k of Object.keys(pdfRaw||{})) pdf[normKey(k)] = pdfRaw[k];

    const dateVal = pdf[normKey("Date (YYYY-MM-DD)")] || pdf[normKey("Date")] || "";
    const assessor = pdf[normKey("Assessor Name")] || pdf[normKey("Assessor Name:")] || "TILERSHUB";
    const levelText =
      pdf[normKey("Certification Level")] ||
      pdf[normKey("Certification Level Applied (CT/ACT/MT)")] ||
      "Verified";

    const cs = getSection(pdfRaw, "Customer Service – 10 Points") || getSection(pdfRaw, "Customer Service - 10 Points") || {};
    const wq = getSection(pdfRaw, "Work Quality – 50 Points") || getSection(pdfRaw, "Work Quality - 50 Points") || {};
    const tt = getSection(pdfRaw, "Tools & Technology – 10 Points") || getSection(pdfRaw, "Tools & Technology - 10 Points") || {};
    const se = getSection(pdfRaw, "Safety Equipment – 10 Points") || getSection(pdfRaw, "Safety Equipment - 10 Points") || {};
    const kt = getSection(pdfRaw, "Knowledge & Theory Test – 10 Points") || getSection(pdfRaw, "Knowledge & Theory Test - 10 Points") || {};
    const cf = getSection(pdfRaw, "Customer Feedback – 10 Points") || getSection(pdfRaw, "Customer Feedback - 10 Points") || {};
    const fs = getSection(pdfRaw, "Final Scoring Framework") || {};

    const crit = (section, label)=>{
      if(!section) return undefined;
      const map = {};
      for(const k of Object.keys(section)) map[normKey(k)] = section[k];
      return map[normKey(label)];
    };

    const toPct = v => Math.round((Number(v)||0) * 20);

    const metrics = {
      workmanship: avgPercent([
        crit(wq, "Final finish quality"),
        crit(wq, "Cutting & grinding precision"),
        crit(wq, "Clean work during installation")
      ], toPct),
      waterproofing: toPct( crit(kt, "Question 1 (Standards, materials)") ),
      adhesive_usage: toPct( crit(wq, "Adhesive spreading & coverage") ),
      tile_alignment: toPct( crit(wq, "Layout lines & accuracy") ),
      grout_finish: toPct( crit(wq, "Grouting accuracy & neatness") ),
      safety: avgPercent([
        crit(se, "PPE usage (gloves, mask, boots)"),
        crit(se, "Safe work practices")
      ], toPct),
      site_cleanliness: toPct( crit(wq, "Site cleanliness") ),
      timeliness: toPct( crit(cs, "Timeliness & punctuality") ),
      communication: toPct( crit(cs, "Communication with client") ),
      pricing_fairness: 0 // not part of the PDF; keep 0 or compute elsewhere
    };

    const fsMap = {};
    for(const k of Object.keys(fs)) fsMap[normKey(k)] = fs[k];
    const overall = Number(
      fsMap[normKey("TOTAL SCORE")] ??
      (
        (fsMap[normKey("Customer Service subtotal")]||0) +
        (fsMap[normKey("Work Quality subtotal")]||0) +
        (fsMap[normKey("Tools & Technology subtotal")]||0) +
        (fsMap[normKey("Safety Equipment subtotal")]||0) +
        (fsMap[normKey("Knowledge & Theory Test subtotal")]||0) +
        (fsMap[normKey("Customer Feedback subtotal")]||0)
      )
    );

    let levelClass = "verified";
    if(/master/i.test(levelText)) levelClass = "master";
    else if(/pro|act/i.test(levelText)) levelClass = "pro";

    return {
      level: levelText,
      levelClass,
      overall_score: isFinite(overall) ? overall : 0,
      last_audit_date: dateVal,
      evaluator: assessor,
      metrics,
      checks: [
        { label: "Verified NIC & Business Registration", pass: true },
        { label: "Insurance/Indemnity Coverage", pass: true }
      ],
      notes: pdf[normKey("Assessor Comments")] || pdf[normKey("Assessor Comments:")] || ""
    };
  }

  function renderEvaluation(ev){
    // header
    const levelEl = document.getElementById("evalLevel");
    levelEl.textContent = ev.level;
    levelEl.classList.remove("master","pro","verified");
    levelEl.classList.add(ev.levelClass || "verified");

    document.getElementById("evalMeta").textContent =
      `Audited: ${ev.last_audit_date || "—"} · By ${ev.evaluator || "TILERSHUB"}`;
    document.getElementById("evalOverall").textContent =
      `Overall: ${Math.round(Number(ev.overall_score)||0)}%`;

    // metrics
    const barsRoot = document.getElementById("evalBars");
    const ordered = [
      ["workmanship","Workmanship"],
      ["waterproofing","Waterproofing"],
      ["adhesive_usage","Adhesive Usage"],
      ["tile_alignment","Tile Alignment"],
      ["grout_finish","Grout Finish"],
      ["safety","Safety"],
      ["site_cleanliness","Site Cleanliness"],
      ["timeliness","Timeliness"],
      ["communication","Communication"],
      ["pricing_fairness","Pricing Fairness"]
    ];
    barsRoot.innerHTML = ordered.map(([k,label]) => metricHTML(label, ev.metrics?.[k] ?? 0)).join("");
    requestAnimationFrame(() => {
      barsRoot.querySelectorAll(".bar > span").forEach((span, i)=>{
        const key = ordered[i][0];
        const pct = clampPct(ev.metrics?.[key] ?? 0);
        span.style.width = pct + "%";
      });
    });

    // checks
    const checksRoot = document.getElementById("evalChecks");
    checksRoot.innerHTML = "";
    (ev.checks||[]).forEach(c => checksRoot.insertAdjacentHTML("beforeend", checkHTML(c.label, !!c.pass)));

    // notes
    const notesWrap = document.getElementById("evalNotes");
    const notesBody = notesWrap.querySelector(".notes-body");
    if(ev.notes){
      notesBody.textContent = ev.notes;
      notesWrap.style.display = "";
    }else{
      notesWrap.style.display = "none";
    }
  }

  function metricHTML(label, score){
    const pct = clampPct(score);
    return `
      <div class="metric" role="listitem" aria-label="${escapeHtml(label)} ${pct}%">
        <div class="row"><span>${escapeHtml(label)}</span><strong>${pct}%</strong></div>
        <div class="bar" aria-hidden="true"><span style="width:0%"></span></div>
      </div>
    `;
  }
  function checkHTML(label, pass){
    return `
      <div class="check ${pass ? "pass" : "fail"}">
        <svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
          ${pass
            ? '<path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>'
            : '<path d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z"/>'}
        </svg>
        <div>${escapeHtml(label)}</div>
      </div>
    `;
  }
  function clampPct(n){ return Math.max(0, Math.min(100, Number(n)||0)); }
  function avgPercent(values, toPct){
    const nums = (values||[]).map(v => toPct(v)).filter(n => Number.isFinite(n));
    if (!nums.length) return 0;
    return Math.round(nums.reduce((a,b)=>a+b,0)/nums.length);
  }

  // Tiny debug helper (toggle view of loaded raw JSON)
  function attachEvalDebug(ev, sourceNote){
    let btn = document.getElementById("evalDebugBtn");
    if(!btn){
      const head = document.getElementById("evalHeader");
      btn = document.createElement("button");
      btn.id = "evalDebugBtn";
      btn.textContent = "Debug";
      btn.type = "button";
      btn.style.cssText = "margin-left:auto;border:1px solid var(--border);background:#fff;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:12px";
      head && head.appendChild(btn);
    }
    let open = false, pre;
    btn.onclick = () => {
      open = !open;
      if(open){
        pre = document.createElement("pre");
        pre.style.cssText = "white-space:pre-wrap;background:#f7f9fc;border:1px solid var(--border);padding:10px;border-radius:10px;margin-top:8px;font-size:12px";
        pre.textContent = `(${sourceNote})\n` + JSON.stringify(ev, null, 2);
        document.getElementById("evaluationCard").appendChild(pre);
      } else if(pre){
        pre.remove();
      }
    };
  }

  // --- REVIEWS LOAD/RENDER ---
  async function loadReviews(){
    if(!tilerId){ renderEmptySummary(); return; }
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("tiler_id", tilerId)
      .eq("approved", true)
      .order("created_at", { ascending:false });
    if(error){ console.error(error); renderEmptySummary(); renderReviews([]); return; }
    renderSummary(data); renderReviews(data);
  }
  function renderEmptySummary(){
    $("#summaryGrid").innerHTML =
      `<div>Quality of Work: —</div><div>Customer Service: —</div><div>Timeliness: —</div><div>Pricing Fairness: —</div><div>Cleanliness: —</div><div><strong>No reviews yet</strong></div>`;
    $("#ratingStars").innerHTML = "☆☆☆☆☆";
  }
  function renderSummary(rows){
    if(!rows.length){ renderEmptySummary(); return; }
    const n = rows.length;
    const sum = rows.reduce((a,r)=>({ q:a.q+(r.quality||0), s:a.s+(r.service||0), t:a.t+(r.timeline||0), p:a.p+(r.pricing||0), c:a.c+(r.cleanliness||0) }),{q:0,s:0,t:0,p:0,c:0});
    const avgQ=sum.q/n, avgS=sum.s/n, avgT=sum.t/n, avgP=sum.p/n, avgC=sum.c/n;
    const avgStars=(avgQ+avgS+avgT+avgP+avgC)/5;
    const recommends = Math.round((rows.filter(r=>(((r.quality||0)+(r.service||0)+(r.timeline||0)+(r.pricing||0)+(r.cleanliness||0))/5)>=4).length/n)*100);
    $("#summaryGrid").innerHTML =
      `<div>Quality of Work: ${percentFrom5(avgQ)}</div><div>Customer Service: ${percentFrom5(avgS)}</div><div>Timeliness: ${percentFrom5(avgT)}</div><div>Pricing Fairness: ${percentFrom5(avgP)}</div><div>Cleanliness: ${percentFrom5(avgC)}</div><div><strong>${recommends}% recommends this tiler</strong></div>`;
    $("#ratingStars").innerHTML = starsFromAvg(avgStars);
  }
  function renderReviews(rows){
    const list = $("#reviewList");
    list.querySelectorAll(".review-card").forEach(n=>n.remove());
    rows.forEach(r=>{
      const avg = Math.round((((r.quality||0)+(r.service||0)+(r.timeline||0)+(r.pricing||0)+(r.cleanliness||0))/5));
      const created = new Date(r.created_at).toISOString().split("T")[0];
      const phone = r.phone ? escapeHtml(r.phone) : "N/A";
      const email = r.email ? escapeHtml(r.email) : "N/A";
      const comment = escapeHtml(r.comment||"");
      const name = escapeHtml(r.name||"Anonymous");
      list.insertAdjacentHTML("beforeend", `
        <div class="review-card" style="border-top:1px solid #eee;margin-top:10px;padding-top:10px">
          <strong>${name}</strong> <small>– ${created}</small>
          <div class="stars" aria-label="Review average">${"★".repeat(avg)}${"☆".repeat(5-avg)}</div>
          ${comment ? `<p style="margin:.4rem 0 .2rem">${comment}</p>` : ``}
          ${(r.phone||r.email)?`<p class="muted"><small>Phone: ${phone} &nbsp;|&nbsp; Email: ${email}</small></p>`:''}
        </div>`);
    });
  }

  // --- SUBMIT REVIEW ---
  window.submitReview = async function submitReview(){
    if(!tilerId){ return alert("Missing tiler id."); }
    const btn = document.getElementById("submitBtn");
    btn.disabled = true;

    if(document.getElementById("website").value.trim()){ btn.disabled=false; return; } // honeypot

    const name = document.getElementById("name").value.trim() || "Anonymous";
    const phone = document.getElementById("phone").value.trim() || null;
    const email = document.getElementById("email").value.trim() || null;
    const quality = parseInt(document.getElementById("quality").value,10)||5;
    const service = parseInt(document.getElementById("service").value,10)||5;
    const timeline = parseInt(document.getElementById("timeline").value,10)||5;
    const pricing = parseInt(document.getElementById("pricing").value,10)||5;
    const cleanliness = parseInt(document.getElementById("cleanliness").value,10)||5;
    const comment = document.getElementById("comment").value.trim() || null;

    if(![quality,service,timeline,pricing,cleanliness].every(v=>v>=1 && v<=5)){
      btn.disabled=false; return alert("Please select valid ratings (1–5).");
    }

    const payload = { tiler_id: tilerId, name, phone, email, quality, service, timeline, pricing, cleanliness, comment };
    if(MODERATED){ payload.approved = false; }

    const { error } = await supabase.from("reviews").insert([payload]);
    if(error){ console.error(error); btn.disabled=false; return alert("Could not submit review. Please try again."); }

    ["name","phone","email","comment"].forEach(id=>document.getElementById(id).value="");
    ["quality","service","timeline","pricing","cleanliness"].forEach(id=>document.getElementById(id).value="5");

    if(MODERATED){ alert("Thanks! Your review will be visible after approval."); }
    else { await loadReviews(); alert("Review submitted."); }

    btn.disabled=false;
  };

  // Kickoff
  await loadTilerProfile();
  await loadReviews();

  // If include.js later dispatches a custom event, refresh again (harmless if already loaded)
  document.addEventListener("includes:ready", async () => { await loadTilerProfile(); await loadReviews(); });
}
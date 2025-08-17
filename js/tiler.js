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

  /* ============== EVALUATION: EXACT PDF RENDERING (no summarizing) ============== */

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

    renderExactEvaluation(ev);  // <<< exact, no summarization
    card.style.display = "";
  }

  // ---------- EXACT RENDERER ----------
  function renderExactEvaluation(pdfRaw){
    // Normalize a shallow lookup, but we will display the ORIGINAL labels verbatim.
    const nget = (key) => {
      const map = {};
      for(const k of Object.keys(pdfRaw||{})) map[normKey(k)] = k;
      const foundKey = map[normKey(key)];
      return foundKey ? pdfRaw[foundKey] : undefined;
    };

    // Header fields (shown as meta)
    const assessor = nget("Assessor Name") || nget("Assessor Name:") || "TILERSHUB";
    const dateVal  = nget("Date (YYYY-MM-DD)") || nget("Date (YYYY-MM-DD):") || nget("Date") || "";
    const levelApplied = nget("Certification Level Applied (CT/ACT/MT)") || nget("Certification Level Applied (CT/ACT/MT):");
    const levelFinal   = nget("Certification Level") || nget("Certification Level:");
    const comments     = nget("Assessor Comments") || nget("Assessor Comments:");

    // Display level pill + meta
    const levelText = levelFinal || levelApplied || "Verified";
    const levelEl = document.getElementById("evalLevel");
    levelEl.textContent = levelText;
    levelEl.classList.remove("master","pro","verified");
    levelEl.classList.add(/master/i.test(levelText) ? "master" : (/pro|act/i.test(levelText) ? "pro" : "verified"));

    document.getElementById("evalMeta").textContent =
      `Audited: ${dateVal || "—"} · By ${assessor || "TILERSHUB"}`;

    // Overall line from Final Scoring (if present)
    const fs = nget("Final Scoring Framework");
    let overall = "";
    if (fs && typeof fs === "object") {
      const keyMap = {};
      for(const k of Object.keys(fs)) keyMap[normKey(k)] = k;
      const totalKey = keyMap[normKey("TOTAL SCORE")];
      if (totalKey) overall = `${fs[totalKey]}%`;
    }
    document.getElementById("evalOverall").textContent = `Overall: ${overall || "—"}`;

    // Container roots
    const barsRoot   = document.getElementById("evalBars");
    const checksRoot = document.getElementById("evalChecks");
    const notesWrap  = document.getElementById("evalNotes");
    const notesBody  = notesWrap.querySelector(".notes-body");

    // We will use evalBars area to render the exact sections (not just bars)
    barsRoot.innerHTML = "";

    // Render helper: a titled block listing every sub-key with its raw mark
    function renderSectionBlock(titleWanted){
      const section = nget(titleWanted);
      const displayTitleKey = section ? findOriginalKey(pdfRaw, titleWanted) : null;

      if (!section || typeof section !== "object") return;
      const block = document.createElement("div");
      block.className = "metric"; // reuse card-ish styling
      const title = escapeHtml(displayTitleKey || titleWanted);
      const items = Object.keys(section).map(k => ({
        label: k,
        value: section[k]
      }));

      // Build markup: title + list of rows with score and tiny bar
      const inner = [
        `<div class="row" style="margin-bottom:8px"><strong>${title}</strong></div>`,
        `<div role="list" style="display:grid;gap:8px">`
      ];

      items.forEach(({label, value}) => {
        const vNum = Number(value);
        const pct = Number.isFinite(vNum) ? clampPct(vNum * 20) : 0; // assume 0–5 scale → %
        inner.push(`
          <div role="listitem" aria-label="${escapeHtml(label)} ${escapeHtml(String(value))}/5">
            <div class="row">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(String(value))}${Number.isFinite(vNum) ? " / 5" : ""}</strong>
            </div>
            ${Number.isFinite(vNum) ? `<div class="bar" aria-hidden="true"><span style="width:${pct}%"></span></div>` : ``}
          </div>
        `);
      });

      inner.push(`</div>`);
      block.innerHTML = inner.join("");
      barsRoot.appendChild(block);
    }

    // Order of sections as in the PDF
    const SECTION_TITLES = [
      "Customer Service – 10 Points",
      "Work Quality – 50 Points",
      "Tools & Technology – 10 Points",
      "Safety Equipment – 10 Points",
      "Knowledge & Theory Test – 10 Points",
      "Customer Feedback – 10 Points"
    ];

    // Header fields block (simple facts)
    const headerFacts = [];
    pushFact(headerFacts, "Project Address", nget("Project Address") || nget("Project Address:"));
    pushFact(headerFacts, "Certification Level Applied (CT/ACT/MT)", levelApplied);
    pushFact(headerFacts, "Certification Level", levelFinal);
    const highlights = nget("Key Highlights / Specializations (Tick applicable)");
    if (Array.isArray(highlights) && highlights.length){
      headerFacts.push(`<div><strong>Key Highlights:</strong><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">${highlights.map(h=>`<span class="pill">${escapeHtml(h)}</span>`).join("")}</div></div>`);
    }
    if (headerFacts.length){
      const hdr = document.createElement("div");
      hdr.className = "metric";
      hdr.innerHTML = `<div class="row" style="margin-bottom:8px"><strong>Evaluation Details</strong></div>${headerFacts.join("")}`;
      barsRoot.appendChild(hdr);
    }

    // Each scored section exactly as provided
    SECTION_TITLES.forEach(renderSectionBlock);

    // Final Scoring Framework (all fields verbatim)
    if (fs && typeof fs === "object") {
      const fsBlock = document.createElement("div");
      fsBlock.className = "metric";
      fsBlock.innerHTML = `<div class="row" style="margin-bottom:8px"><strong>${escapeHtml(findOriginalKey(pdfRaw,"Final Scoring Framework") || "Final Scoring Framework")}</strong></div>`;
      const list = document.createElement("div");
      list.setAttribute("role","list");
      list.style.display = "grid";
      list.style.gap = "8px";
      Object.keys(fs).forEach(k=>{
        const val = fs[k];
        const isNum = Number.isFinite(Number(val));
        const pct   = isNum ? clampPct(Number(val)) : null; // TOTAL SCORE is already in %
        const row = document.createElement("div");
        row.setAttribute("role","listitem");
        row.innerHTML = `
          <div class="row">
            <span>${escapeHtml(k)}</span>
            <strong>${escapeHtml(String(val))}${/TOTAL SCORE/i.test(k) && isNum ? "%" : ""}</strong>
          </div>
          ${(/TOTAL SCORE/i.test(k) && isNum) ? `<div class="bar" aria-hidden="true"><span style="width:${pct}%"></span></div>` : ``}
        `;
        list.appendChild(row);
      });
      fsBlock.appendChild(list);
      barsRoot.appendChild(fsBlock);
    }

    // Notes
    if (comments) {
      notesBody.textContent = String(comments);
      notesWrap.style.display = "";
    } else {
      notesWrap.style.display = "none";
    }

    // Checks area (optional; keep minimal to avoid changing your data model)
    checksRoot.innerHTML = "";
  }

  // Helpers for exact renderer
  function findOriginalKey(obj, desired){
    const n = normKey(desired);
    for (const k of Object.keys(obj||{})) if (normKey(k) === n) return k;
    return null;
  }
  function pushFact(arr, label, val){
    if(!val) return;
    arr.push(`
      <div class="row">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(String(val))}</strong>
      </div>
    `);
  }
  function clampPct(n){ return Math.max(0, Math.min(100, Number(n)||0)); }

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

  /* ==================== REVIEWS (unchanged) ==================== */
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
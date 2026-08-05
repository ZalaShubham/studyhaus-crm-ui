import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase.js";

// State
let allSeats = [];
let activeAttendance = [];
let studentPhotos = {};
let currentFloor = "Ground Floor";
let unsubSeats = null;
let unsubAttendance = null;

// Helpers
const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

// NOTE: NO zero-padding — matches Firestore seat numbers exactly ("A1", "A34", not "A01")
const generateRange = (prefix, start, end) => {
  const arr = [];
  if (start <= end) {
    for (let i = start; i <= end; i++) arr.push(`${prefix}${i}`);
  } else {
    for (let i = start; i >= end; i--) arr.push(`${prefix}${i}`);
  }
  return arr;
};

const fetchMissingPhotos = async (records) => {
  let fetchedAny = false;
  for (const rec of records) {
    if (studentPhotos[rec.studentId] === undefined) {
      try {
        const snap = await getDoc(doc(db, "studentDocuments", rec.studentId));
        studentPhotos[rec.studentId] = (snap.exists() && snap.data().selfie) ? snap.data().selfie : null;
        if (snap.exists() && snap.data().selfie) fetchedAny = true;
      } catch (e) {
        studentPhotos[rec.studentId] = null;
      }
    }
  }
  if (fetchedAny) renderLiveMap();
};

// ─────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────
export const initLiveSeatMapUI = () => {
  const container = document.getElementById("page-live-seat-map");
  if (!container) return;

  container.innerHTML = `
    <!-- Header -->
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h1 data-i18n="liveSeat.title">Live Seat Map</h1>
        <p class="page-subtitle" id="live-subtitle">Real-time occupancy and attendance.</p>
      </div>
      <div style="display:flex; align-items:center; gap:0.75rem;">
        <div style="background:#f1f5f9; padding:4px 14px; border-radius:999px; display:inline-flex; align-items:center; gap:6px; border:1px solid #e2e8f0;">
          <span style="width:8px; height:8px; background:#ef4444; border-radius:50%; animation:pulse 1.5s infinite;"></span>
          <span style="font-size:13px; font-weight:600; color:#475569;" data-i18n="liveSeat.liveActive">Live Updates Active</span>
        </div>
      </div>
    </div>

    <!-- Legend — matches regular Seat Map style -->
    <div class="seat-legend" style="display:flex; gap:1rem; margin-bottom:1.5rem; flex-wrap:wrap;">
      <span class="legend-pill" style="background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; padding:4px 12px; border-radius:999px; font-size:13px; font-weight:500; display:inline-flex; align-items:center; gap:6px;">
        <span style="width:8px; height:8px; border-radius:50%; background:currentColor;"></span>
        <span data-i18n="liveSeat.vacant">Vacant</span>
      </span>
      <span class="legend-pill" style="background:#fef2f2; color:#991b1b; border:1px solid #fecaca; padding:4px 12px; border-radius:999px; font-size:13px; font-weight:500; display:inline-flex; align-items:center; gap:6px;">
        <span style="width:8px; height:8px; border-radius:50%; background:currentColor;"></span>
        <span data-i18n="liveSeat.present">Present</span>
      </span>
    </div>

    <!-- Floor Tabs — identical markup to regular Seat Map -->
    <div class="floor-tabs" style="display:inline-flex; gap:0.5rem; background:#f1f5f9; padding:4px; border-radius:999px; margin-bottom:1.5rem;">
      <button class="live-floor-tab active" data-floor="Ground Floor" data-i18n="floor.ground"
        style="border:none; background:#fff; color:#0f172a; padding:6px 16px; border-radius:999px; font-weight:500; font-size:13px; cursor:pointer; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
        Ground Floor
      </button>
      <button class="live-floor-tab" data-floor="First Floor" data-i18n="floor.first"
        style="border:none; background:transparent; color:#475569; padding:6px 16px; border-radius:999px; font-weight:500; font-size:13px; cursor:pointer;">
        First Floor
      </button>
    </div>

    <!-- Main Floor Card — identical structure to regular Seat Map -->
    <div class="card" style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:1.5rem; margin-bottom:2rem; overflow-x:auto;">
      <h3 style="font-size:15px; font-weight:600; color:#0f172a; margin-bottom:4px;" id="live-floor-title" data-i18n="floor.ground">Ground Floor</h3>
      <p style="font-size:13px; color:#94a3b8; margin-bottom:1.5rem;">Section A · Section B · hover a seat to see who is present</p>
      <div id="live-seat-grid">
        <div style="text-align:center; padding:3rem; color:#94a3b8;">Connecting to live stream...</div>
      </div>
    </div>
  `;

  if (typeof window.translateDOM === 'function') window.translateDOM();

  // Floor tab click listeners
  document.querySelectorAll(".live-floor-tab").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".live-floor-tab").forEach(b => {
        b.style.background = 'transparent';
        b.style.color = '#475569';
        b.style.boxShadow = 'none';
      });
      const target = e.currentTarget;
      target.style.background = '#fff';
      target.style.color = '#0f172a';
      target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
      currentFloor = target.getAttribute("data-floor");

      const titleEl = document.getElementById("live-floor-title");
      if (titleEl) {
        titleEl.setAttribute('data-i18n', currentFloor === 'First Floor' ? 'floor.first' : 'floor.ground');
        if (typeof window.translateDOM === 'function') window.translateDOM();
      }
      renderLiveMap();
    });
  });

  startListeners();
};

// ─────────────────────────────────────────────────────────────
// FIRESTORE LISTENERS
// ─────────────────────────────────────────────────────────────
const startListeners = () => {
  if (unsubSeats) unsubSeats();
  if (unsubAttendance) unsubAttendance();

  unsubSeats = onSnapshot(collection(db, "seats"), (snap) => {
    allSeats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderLiveMap();
  });

  const today = getTodayStr();
  const q = query(
    collection(db, "attendance"),
    where("date", "==", today),
    where("checkOut", "==", null)
  );
  unsubAttendance = onSnapshot(q, (snap) => {
    activeAttendance = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderLiveMap();
    fetchMissingPhotos(activeAttendance);
  });
};

// ─────────────────────────────────────────────────────────────
// RENDER — card style exactly matches regular Seat Map
// ─────────────────────────────────────────────────────────────
const renderLiveMap = () => {
  const grid = document.getElementById("live-seat-grid");
  if (!grid) return;

  const presentCount = activeAttendance.length;
  const subtitle = document.getElementById("live-subtitle");
  if (subtitle) subtitle.innerText = `${presentCount} present · live`;

  // ── Single seat card — bigger cards matching image design ──
  const renderSeatCard = (seatNumStr) => {
    const seatExists = allSeats.some(s => s.seatNumber === String(seatNumStr));

    if (!seatExists) {
      return `
        <div style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:10px; height:80px; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:13px;">
          ${seatNumStr}
        </div>
      `;
    }

    const att = activeAttendance.find(a => a.seatNumber === String(seatNumStr));

    if (att) {
      // PRESENT — seat number + colored avatar + student name
      const name = att.studentName || '?';
      const firstName = name.split(' ')[0];
      const initial = firstName.charAt(0).toUpperCase();

      // Generate a consistent color from the initial
      const colors = [
        '#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f43f5e'
      ];
      const colorIndex = initial.charCodeAt(0) % colors.length;
      const avatarColor = colors[colorIndex];

      return `
        <div title="${name}"
          style="background:#fef2f2; border:1.5px solid #fecaca; color:#991b1b; border-radius:10px; height:80px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; cursor:default; overflow:hidden; padding:6px; transition:transform 0.15s; box-shadow:0 1px 3px rgba(239,68,68,0.12);"
          onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(239,68,68,0.2)';"
          onmouseout="this.style.transform='none'; this.style.boxShadow='0 1px 3px rgba(239,68,68,0.12)';">
          <div style="font-size:11px; font-weight:700; color:#dc2626; line-height:1;">${seatNumStr}</div>
          <div style="width:32px; height:32px; border-radius:50%; background:${avatarColor}; color:#fff; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; flex-shrink:0;">${initial}</div>
          <div style="font-size:10px; font-weight:600; color:#991b1b; max-width:80px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; line-height:1;">${firstName}</div>
        </div>
      `;
    } else {
      // VACANT — clean green card with seat number
      return `
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; border-radius:10px; height:80px; display:flex; align-items:center; justify-content:center; cursor:default; transition:transform 0.15s;"
          onmouseover="this.style.transform='translateY(-2px)';"
          onmouseout="this.style.transform='none';">
          <div style="font-size:15px; font-weight:600;">${seatNumStr}</div>
        </div>
      `;
    }
  };

  const renderColHtml = (arr) => {
    let html = `<div style="display:flex; flex-direction:column; gap:0.5rem; flex:1;">`;
    arr.forEach(n => { html += renderSeatCard(n); });
    html += `</div>`;
    return html;
  };

  // ── Floor layouts — identical column structure to regular Seat Map ──
  let html = '';

  if (currentFloor === 'First Floor') {
    html = `
      <div style="background:#fff; padding:3rem 2rem 3rem 2rem; border-radius:12px; position:relative; border:1px solid #e2e8f0; min-width:800px;">
        <div style="position:absolute; top:0; left:50%; transform:translateX(-50%); background:#f1f5f9; border:1px solid #e2e8f0; border-top:none; padding:0.5rem 2.5rem; border-radius:0 0 12px 12px; font-weight:700; color:#475569; letter-spacing:2px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">DOOR</div>
        <div style="display:flex; gap:1.5rem; justify-content:center; max-width:800px; margin:0 auto;">
          ${renderColHtml(generateRange('B', 1, 10))}
          ${renderColHtml(generateRange('B', 20, 11))}
          <div style="width:40px; flex-shrink:0;"></div>
          ${renderColHtml(generateRange('B', 21, 30))}
          ${renderColHtml(generateRange('B', 40, 31))}
        </div>
      </div>
    `;
  } else {
    // Ground Floor — exact same column ranges as regular Seat Map
    html = `
      <div style="background:#fff; padding:3rem 2rem 2rem 2rem; border-radius:12px; position:relative; border:1px solid #e2e8f0; min-width:900px;">
        <div style="position:absolute; top:0; left:50%; transform:translateX(-50%); background:#f1f5f9; border:1px solid #e2e8f0; border-top:none; padding:0.5rem 2.5rem; border-radius:0 0 12px 12px; font-weight:700; color:#475569; letter-spacing:2px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">DOOR</div>
        <div style="display:flex; gap:1.5rem; justify-content:center; max-width:900px; margin:0 auto; align-items:flex-start;">
          ${renderColHtml(generateRange('A', 1, 17))}
          ${renderColHtml(generateRange('A', 34, 18))}
          <div style="display:flex; flex-direction:column; align-items:center; gap:0.5rem; width:80px; flex-shrink:0; align-self:center;">
            ${renderSeatCard('A63')}
            ${renderSeatCard('A64')}
            ${renderSeatCard('A65')}
            ${renderSeatCard('A66')}
            ${renderSeatCard('A67')}
            ${renderSeatCard('A68')}
          </div>
          ${renderColHtml(generateRange('A', 35, 48))}
          ${renderColHtml(generateRange('A', 62, 49))}
        </div>
      </div>
    `;
  }

  grid.innerHTML = html;
};

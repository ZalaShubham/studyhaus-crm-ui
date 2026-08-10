import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase.js";

// State
let allSeats = [];
let activeAttendance = [];
let studentPhotos = {};
let currentFloor = "Ground Floor";
let unsubSeats = null;
let unsubAttendance = null;

// Helpers — IST-aware date (India is UTC+5:30)
const getTodayStr = () => {
  // Add 5h30m to UTC so the date matches IST local date even near midnight
  const now = new Date();
  const istOffset = 5 * 60 + 30; // minutes
  const istMs = now.getTime() + istOffset * 60 * 1000;
  const d = new Date(istMs);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
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
  for (const rec of records) {
    if (studentPhotos[rec.studentId] === undefined) {
      try {
        // Primary: studentDocuments/{id}.selfie (uploaded during admission)
        const docsSnap = await getDoc(doc(db, "studentDocuments", rec.studentId));
        let photoUrl = (docsSnap.exists() && docsSnap.data().selfie) ? docsSnap.data().selfie : null;

        // Fallback: students/{id}.selfieUrl
        if (!photoUrl) {
          const stuSnap = await getDoc(doc(db, "students", rec.studentId));
          photoUrl = (stuSnap.exists() && stuSnap.data().selfieUrl) ? stuSnap.data().selfieUrl : null;
        }

        studentPhotos[rec.studentId] = photoUrl; // null means "checked, no photo"
      } catch (e) {
        studentPhotos[rec.studentId] = null;
      }
    }
  }
  // Always re-render after resolving photos — even if all are null
  renderLiveMap();
};

// ─────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────
export const initLiveSeatMapUI = () => {
  initLiveSeatMapInTab("page-live-seat-map");
};

export const initLiveSeatMapInTab = (containerId) => {
  const container = document.getElementById(containerId);
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
  // Tear down any existing listeners before re-subscribing (prevents duplicates)
  if (unsubSeats) { unsubSeats(); unsubSeats = null; }
  if (unsubAttendance) { unsubAttendance(); unsubAttendance = null; }

  unsubSeats = onSnapshot(collection(db, "seats"), (snap) => {
    allSeats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderLiveMap();
  });

  const today = getTodayStr();

  // Use checkOut==null as the query — this is a single-field filter that
  // catches ALL currently-present students, including records created before
  // the `status` field was added to the attendance schema.
  // Firestore can query null values with a single-field auto-index (no composite index needed).
  // We then filter by today's date client-side to exclude any stale open sessions from previous days.
  const q = query(
    collection(db, "attendance"),
    where("checkOut", "==", null)
  );
  unsubAttendance = onSnapshot(q, (snap) => {
    // Filter to today's date only (handles stale records from days where app crashed before checkout)
    activeAttendance = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(r => r.date === today);
    renderLiveMap();
    fetchMissingPhotos(activeAttendance);
  }, (err) => {
    console.error("[LiveSeatMap] Firestore attendance query error:", err);
    const grid = document.getElementById("live-seat-grid");
    if (grid) grid.innerHTML = `<div style="text-align:center;padding:2rem;color:#ef4444;">Error loading attendance data: ${err.message}</div>`;
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
        <div style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:10px; height:90px; display:grid; place-items:center; color:#94a3b8; font-size:13px;">
          ${seatNumStr}
        </div>
      `;
    }


    const att = activeAttendance.find(a => a.seatNumber === String(seatNumStr));

    if (att) {
      // PRESENT — show photo or colored initial avatar
      const name = att.studentName || '?';
      const firstName = name.split(' ')[0];
      const initial = firstName.charAt(0).toUpperCase();

      const colors = [
        '#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f43f5e'
      ];
      const avatarColor = colors[initial.charCodeAt(0) % colors.length];

      // Check-in time badge
      let checkInBadge = '';
      if (att.checkIn) {
        const t = new Date(att.checkIn);
        const hh = String(t.getHours()).padStart(2,'0');
        const mm = String(t.getMinutes()).padStart(2,'0');
        checkInBadge = `<div style="font-size:9px; color:#dc2626; font-weight:500; letter-spacing:0.3px; text-align:center;">${hh}:${mm}</div>`;
      }

      // Use real photo if available, else initial avatar
      const photoUrl = studentPhotos[att.studentId];
      const avatarHtml = photoUrl
        ? `<img src="${photoUrl}" alt="${name}"
            style="width:38px; height:38px; border-radius:50%; object-fit:cover;
                   border:2px solid #fca5a5; flex-shrink:0;"
            onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';" />
           <div style="display:none; width:38px; height:38px; border-radius:50%; background:${avatarColor};
                       color:#fff; align-items:center; justify-content:center; font-size:15px; font-weight:700; flex-shrink:0;">${initial}</div>`
        : `<div style="width:38px; height:38px; border-radius:50%; background:${avatarColor};
                       color:#fff; display:flex; align-items:center; justify-content:center;
                       font-size:15px; font-weight:700; flex-shrink:0;">${initial}</div>`;

      return `
        <div style="background:#fef2f2; border:1.5px solid #fecaca; color:#991b1b; border-radius:10px;
                 width:100%; height:90px; box-sizing:border-box;
                 display:flex; flex-direction:column; align-items:center;
                 justify-content:center; gap:3px; cursor:default; overflow:hidden; padding:6px;
                 box-shadow:0 1px 3px rgba(239,68,68,0.12);">
          <div style="font-size:10px; font-weight:700; color:#dc2626; line-height:1; text-align:center;">${seatNumStr}</div>
          <div style="display:flex; align-items:center; justify-content:center; position:relative;">
            ${avatarHtml}
            <div style="position:absolute; bottom:-1px; right:-2px; width:11px; height:11px;
                        background:#22c55e; border-radius:50%; border:1.5px solid #fff;"></div>
          </div>
          <div style="font-size:10px; font-weight:600; color:#991b1b; max-width:78px; white-space:nowrap;
                      overflow:hidden; text-overflow:ellipsis; line-height:1; text-align:center;">${firstName}</div>
          ${checkInBadge}
        </div>
      `;
    } else {
      // VACANT — clean green card, number perfectly centered
      return `
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; border-radius:10px;
                    width:100%; height:90px; box-sizing:border-box;
                    display:grid; place-items:center; cursor:default;">
          <div style="font-size:15px; font-weight:600;">${seatNumStr}</div>
        </div>
      `;
    }



  };


  const renderColHtml = (arr) => {
    // No align-items here — default is 'stretch', so every card fills the full column width.
    // This ensures seat numbers are always centered inside a consistent-width card.
    let html = `<div style="display:flex; flex-direction:column; gap:0.5rem; flex:1; min-width:0;">`;
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
          ${renderColHtml(generateRange('A', 1, 18))}
          ${renderColHtml(generateRange('A', 34, 19))}
          <div style="display:flex; flex-direction:column; align-items:center; gap:0.5rem; width:80px; flex-shrink:0; align-self:center;">
            ${renderSeatCard('A67')}
            ${renderSeatCard('A68')}
          </div>
          ${renderColHtml(generateRange('A', 35, 48))}
          ${renderColHtml(generateRange('A', 66, 49))}
        </div>
      </div>
    `;
  }

  grid.innerHTML = html;
};

import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase.js";

// State
let allSeats = [];
let activeAttendance = [];
let studentPhotos = {}; // Cache: studentId -> base64
let currentFloor = "Ground Floor";
let unsubSeats = null;
let unsubAttendance = null;

// Helpers
const getTodayStr = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const generateRange = (prefix, start, end) => {
  let arr = [];
  if (start <= end) {
    for (let i = start; i <= end; i++) arr.push(`${prefix}${String(i).padStart(2, '0')}`);
  } else {
    for (let i = start; i >= end; i--) arr.push(`${prefix}${String(i).padStart(2, '0')}`);
  }
  return arr;
};

const fetchMissingPhotos = async (records) => {
  let fetchedAny = false;
  for (const rec of records) {
    if (studentPhotos[rec.studentId] === undefined) {
      try {
        const snap = await getDoc(doc(db, "studentDocuments", rec.studentId));
        if (snap.exists() && snap.data().selfie) {
          studentPhotos[rec.studentId] = snap.data().selfie;
          fetchedAny = true;
        } else {
          studentPhotos[rec.studentId] = null; // Mark as fetched but missing
        }
      } catch (e) {
        console.error("Failed to fetch photo for", rec.studentId, e);
        studentPhotos[rec.studentId] = null;
      }
    }
  }
  if (fetchedAny) renderLiveMap(); // Re-render once photos load
};

// UI Rendering
export const initLiveSeatMapUI = () => {
  const container = document.getElementById("page-live-seat-map");
  if (!container) return;

  container.innerHTML = `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h1>Live Seat Map</h1>
        <p class="page-subtitle">Real-time occupancy and attendance.</p>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <div style="background:#f1f5f9; padding:4px 12px; border-radius:999px; display:inline-flex; align-items:center; gap:6px;">
          <span style="width:8px; height:8px; background:var(--danger); border-radius:50%; animation: pulse 2s infinite;"></span>
          <span style="font-size:13px; font-weight:600; color:#475569;">Live Updates Active</span>
        </div>
      </div>
    </div>
    
    <!-- Legend -->
    <div class="seat-legend" style="display:flex; gap:1rem; margin-bottom:1.5rem;">
      <span class="legend-pill" style="background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; padding:4px 12px; border-radius:999px; font-size:13px; font-weight:500; display:inline-flex; align-items:center; gap:6px;">
        <span style="width:8px; height:8px; border-radius:50%; background:currentColor;"></span>Vacant
      </span>
      <span class="legend-pill" style="background:#fef2f2; color:#991b1b; border:1px solid #fecaca; padding:4px 12px; border-radius:999px; font-size:13px; font-weight:500; display:inline-flex; align-items:center; gap:6px;">
        <span style="width:8px; height:8px; border-radius:50%; background:currentColor;"></span>Present
      </span>
    </div>

    <!-- Floor Tabs -->
    <div class="floor-tabs" style="display:inline-flex; gap:0.5rem; background:#f1f5f9; padding:4px; border-radius:999px; margin-bottom:1.5rem;">
      <button class="live-floor-tab active" data-floor="Ground Floor" style="border:none; background:#fff; color:#0f172a; padding:6px 16px; border-radius:999px; font-weight:500; font-size:13px; cursor:pointer; box-shadow:0 1px 2px rgba(0,0,0,0.05);">${window.t('floor.ground')}</button>
      <button class="live-floor-tab" data-floor="First Floor" style="border:none; background:transparent; color:#475569; padding:6px 16px; border-radius:999px; font-weight:500; font-size:13px; cursor:pointer;">${window.t('floor.first')}</button>
    </div>

    <!-- Map Container -->
    <div class="card" style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:1.5rem; margin-bottom:2rem; overflow-x:auto;">
      <h3 style="font-size:15px; font-weight:600; color:#0f172a; margin-bottom:1.5rem;" id="live-floor-title">${window.t('floor.ground')}</h3>
      <div id="live-seat-grid">
        <div style="text-align:center; padding: 2rem; color: #94a3b8;">Connecting to live stream...</div>
      </div>
    </div>
  `;

  // Listeners
  document.querySelectorAll(".live-floor-tab").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".live-floor-tab").forEach(b => {
        b.style.background = 'transparent';
        b.style.color = '#475569';
        b.style.boxShadow = 'none';
      });
      const target = e.target;
      target.style.background = '#fff';
      target.style.color = '#0f172a';
      target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
      
      currentFloor = target.getAttribute("data-floor");
      document.getElementById("live-floor-title").innerText = currentFloor;
      renderLiveMap();
    });
  });

  startListeners();
};

const startListeners = () => {
  // Clear old listeners if re-initialized
  if (unsubSeats) unsubSeats();
  if (unsubAttendance) unsubAttendance();

  // 1. Listen to Seats (to know valid seats for the floor)
  unsubSeats = onSnapshot(collection(db, "seats"), (snap) => {
    allSeats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderLiveMap();
  });

  // 2. Listen to active attendance for TODAY
  const today = getTodayStr();
  const q = query(
    collection(db, "attendance"),
    where("date", "==", today),
    where("checkOut", "==", null)
  );

  unsubAttendance = onSnapshot(q, (snap) => {
    activeAttendance = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderLiveMap();
    fetchMissingPhotos(activeAttendance);
  });
};

const renderLiveMap = () => {
  const grid = document.getElementById("live-seat-grid");
  if (!grid) return;

  const renderSeatCard = (seatNumStr) => {
    const seatExists = allSeats.some(s => s.seatNumber === String(seatNumStr));
    if (!seatExists) {
      return `
        <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; height: 100px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 14px; opacity: 0.5;">
          ${seatNumStr}
        </div>
      `;
    }

    const att = activeAttendance.find(a => a.seatNumber === String(seatNumStr));
    
    if (att) {
      // PRESENT
      const photo = studentPhotos[att.studentId];
      const name = att.studentName.split(" ")[0]; // First name for compactness
      const photoHtml = photo 
        ? `<img src="${photo}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 4px;" />` 
        : `<div style="width: 40px; height: 40px; border-radius: 50%; background: #e2e8f0; color: #64748b; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 4px;">${name.charAt(0).toUpperCase()}</div>`;
      
      return `
        <div style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; border-radius: 8px; height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; overflow: hidden; padding: 4px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);" title="${att.studentName} is present">
          ${photoHtml}
          <div style="font-size: 11px; font-weight: 700; line-height: 1.2; text-transform: capitalize; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${name}</div>
          <div style="font-size: 10px; opacity: 0.7;">Seat ${seatNumStr}</div>
        </div>
      `;
    } else {
      // VACANT
      return `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; border-radius: 8px; height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4px;">
          <div style="font-size: 12px; opacity: 0.7; margin-bottom: 4px;">Vacant</div>
          <div style="font-size: 13px; font-weight: 700;">Seat ${seatNumStr}</div>
        </div>
      `;
    }
  };

  const renderColHtml = (arr) => {
    let colHtml = `<div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1; min-width: 90px;">`;
    arr.forEach(num => { colHtml += renderSeatCard(num); });
    colHtml += `</div>`;
    return colHtml;
  };

  let html = "";
  if (currentFloor === "First Floor") {
    html = `
      <div style="background: #fff; padding: 3rem 2rem 3rem 2rem; border-radius: 12px; position: relative; border: 1px solid #e2e8f0; min-width: 800px;">
        <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); background: #f1f5f9; border: 1px solid #e2e8f0; border-top: none; padding: 0.5rem 2.5rem; border-radius: 0 0 12px 12px; font-weight: 700; color: #475569; letter-spacing: 2px;">DOOR</div>
        <div style="display: flex; gap: 1.5rem; justify-content: center; max-width: 1000px; margin: 0 auto;">
          ${renderColHtml(generateRange('B', 1, 10))}
          ${renderColHtml(generateRange('B', 20, 11))}
          <div style="width: 40px; flex-shrink: 0;"></div>
          ${renderColHtml(generateRange('B', 21, 30))}
          ${renderColHtml(generateRange('B', 40, 31))}
        </div>
      </div>
    `;
  } else if (currentFloor === "Ground Floor") {
    html = `
      <div style="background: #fff; padding: 3rem 2rem 2rem 2rem; border-radius: 12px; position: relative; border: 1px solid #e2e8f0; min-width: 900px;">
        <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); background: #f1f5f9; border: 1px solid #e2e8f0; border-top: none; padding: 0.5rem 2.5rem; border-radius: 0 0 12px 12px; font-weight: 700; color: #475569; letter-spacing: 2px;">DOOR</div>
        <div style="display: flex; gap: 1.5rem; justify-content: center; max-width: 1100px; margin: 0 auto; align-items: flex-start;">
          ${renderColHtml(generateRange('A', 1, 17))}
          ${renderColHtml(generateRange('A', 34, 18))}
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; width: 90px; flex-shrink: 0; align-self: center;">
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
  } else {
    // Fallback
    html = `<div style="padding: 2rem; text-align: center;">Floor layout not defined for ${currentFloor}</div>`;
  }

  grid.innerHTML = html;
};

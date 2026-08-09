import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase.js";

// ──────────────────────────────────────────────
// State for custom Selfie capture
// ──────────────────────────────────────────────
let capturedSelfieFile = null;
let selfieStream = null;

// ──────────────────────────────────────────────
// Image compression via Canvas (client-side, free)
// ──────────────────────────────────────────────

/**
 * Compress and resize an image File to a base64 string.
 * Max width/height: 800px. Quality: 0.7 (JPEG).
 * @param {File} file
 * @returns {Promise<string>} base64 data URL
 */
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      // For non-images (e.g. PDF), read as base64 directly (no compression)
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height / width) * MAX); width = MAX; }
        else { width = Math.round((width / height) * MAX); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = reject;
    img.src = url;
  });
};

// ──────────────────────────────────────────────
// Save / Load document images in Firestore
// ──────────────────────────────────────────────

/**
 * Save compressed document images into Firestore.
 * Stored in: studentDocuments/{studentId}
 * @param {Object} files - { aadhaarFront: File|null, aadhaarBack: File|null, selfie: File|null }
 * @param {string} studentId
 * @param {function} onProgress - called with 0-100
 * @returns {Promise<Object>} field names added { aadhaarFrontUrl, aadhaarBackUrl, selfieUrl }
 */
export const uploadAdmissionDocuments = async (files, studentId, onProgress = () => {}) => {
  const entries = Object.entries(files).filter(([, f]) => f !== null);
  if (entries.length === 0) return {};

  const docData = { studentId, updatedAt: new Date().toISOString() };
  const urlMap = {};
  let done = 0;

  for (const [key, file] of entries) {
    onProgress(Math.round((done / entries.length) * 90));
    const base64 = await compressImage(file);
    docData[key] = base64;                    // store in Firestore doc
    urlMap[`${key}Url`] = `firestore:${key}`; // marker so student doc knows it's stored
    done++;
  }

  // Write to Firestore sub-collection
  await setDoc(doc(db, "studentDocuments", studentId), docData, { merge: true });
  onProgress(100);
  setTimeout(() => onProgress(0), 600);
  return urlMap;
};

/**
 * Load document images for a student from Firestore
 * @param {string} studentId
 * @returns {Promise<Object|null>}
 */
export const loadStudentDocuments = async (studentId) => {
  const snap = await getDoc(doc(db, "studentDocuments", studentId));
  return snap.exists() ? snap.data() : null;
};

// ──────────────────────────────────────────────
// UI rendering
// ──────────────────────────────────────────────

const DOC_TYPES = [
  { key: "aadhaarFront", label: "Aadhaar Front", accept: "image/*,.pdf", icon: "🪪" },
  { key: "aadhaarBack",  label: "Aadhaar Back",  accept: "image/*,.pdf", icon: "🪪" },
  { key: "selfie",       label: "Selfie Photo",  accept: "image/*",      icon: "🤳" },
];

/**
 * Render the document upload UI inside container.
 * @param {string} containerId
 */
export const initDocumentUploads = (containerId = "doc-upload-section") => {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <label style="display:block;font-size:12.5px;font-weight:600;color:var(--text-secondary);
      text-transform:uppercase;letter-spacing:.04em;margin-bottom:.75rem;">
      Document Uploads
      <span style="color:var(--text-muted);font-weight:400;text-transform:none;margin-left:4px;">
        (Optional · stored securely)
      </span>
    </label>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;">
      ${DOC_TYPES.map(d => {
        if (d.key === "selfie") {
          return `
            <div id="doc-card-${d.key}" style="
              border:2px dashed var(--border-bright);border-radius:12px;padding:1rem .75rem;
              text-align:center;cursor:pointer;transition:border-color .2s,background .2s;
              position:relative;background:rgba(255,255,255,.02);"
              onclick="window.__openSelfieCamera()">
              
              <div id="doc-preview-${d.key}" style="display:none;margin-bottom:.5rem;position:relative;">
                <img id="doc-img-${d.key}" style="width:100%;height:76px;object-fit:cover;
                  border-radius:8px;" src="" alt="preview" />
                <button type="button"
                  onclick="event.stopPropagation();window.__clearDocUpload('${d.key}')"
                  style="position:absolute;top:3px;right:3px;background:rgba(244,63,94,.9);
                  border:none;color:#fff;width:20px;height:20px;border-radius:50%;font-size:12px;
                  cursor:pointer;line-height:1;">✕</button>
              </div>
              <div id="doc-placeholder-${d.key}">
                <div style="font-size:1.5rem;margin-bottom:.3rem;">${d.icon}</div>
                <div style="font-size:12px;font-weight:600;color:var(--text-primary);">${d.label}</div>
                <div id="doc-sublabel-${d.key}" style="font-size:11px;color:var(--text-muted);margin-top:2px;">Take Live Selfie</div>
              </div>
              <div id="doc-name-${d.key}" style="font-size:11px;color:var(--accent-emerald);
                margin-top:.3rem;display:none;word-break:break-all;">Selfie captured<br><span style="color:var(--primary);text-decoration:underline;">Retake Selfie</span></div>
            </div>
          `;
        } else {
          return `
            <div id="doc-card-${d.key}" style="
              border:2px dashed var(--border-bright);border-radius:12px;padding:1rem .75rem;
              text-align:center;cursor:pointer;transition:border-color .2s,background .2s;
              position:relative;background:rgba(255,255,255,.02);"
              onclick="document.getElementById('doc-input-${d.key}').click()">
              <input type="file" id="doc-input-${d.key}" accept="${d.accept}"
                style="display:none;" data-key="${d.key}" />
              <div id="doc-preview-${d.key}" style="display:none;margin-bottom:.5rem;position:relative;">
                <img id="doc-img-${d.key}" style="width:100%;height:76px;object-fit:cover;
                  border-radius:8px;" src="" alt="preview" />
                <button type="button"
                  onclick="event.stopPropagation();window.__clearDocUpload('${d.key}')"
                  style="position:absolute;top:3px;right:3px;background:rgba(244,63,94,.9);
                  border:none;color:#fff;width:20px;height:20px;border-radius:50%;font-size:12px;
                  cursor:pointer;line-height:1;">✕</button>
              </div>
              <div id="doc-placeholder-${d.key}">
                <div style="font-size:1.5rem;margin-bottom:.3rem;">${d.icon}</div>
                <div style="font-size:12px;font-weight:600;color:var(--text-primary);">${d.label}</div>
                <div id="doc-sublabel-${d.key}" style="font-size:11px;color:var(--text-muted);margin-top:2px;">Click to select</div>
              </div>
              <div id="doc-name-${d.key}" style="font-size:11px;color:var(--accent-emerald);
                margin-top:.3rem;display:none;word-break:break-all;"></div>
            </div>
          `;
        }
      }).join("")}
    </div>

    <!-- Upload progress bar -->
    <div id="doc-upload-progress" style="display:none;margin-top:.75rem;">
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">
        Saving documents… <span id="doc-progress-pct">0</span>%
      </div>
      <div style="height:4px;background:rgba(255,255,255,.08);border-radius:99px;overflow:hidden;">
        <div id="doc-progress-bar" style="height:100%;width:0%;
          background:linear-gradient(90deg,#8b5cf6,#10b981);transition:width .25s;"></div>
      </div>
    </div>
  `;

  // Ensure camera modal exists in the body
  if (!document.getElementById("selfie-camera-modal")) {
    const modalDiv = document.createElement("div");
    modalDiv.innerHTML = `
      <dialog id="selfie-camera-modal" style="padding:0; border:none; border-radius:12px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1); width:90%; max-width:400px; background:var(--bg-card,#fff); color:var(--text-primary,#0f172a);">
        <div style="padding:1.5rem; border-bottom:1px solid var(--border,#e2e8f0);">
          <h2 style="font-size:1.25rem; font-weight:700; margin:0;">Take Selfie</h2>
        </div>
        <div style="padding:1.5rem; text-align:center;">
          <div style="background:#000; border-radius:8px; overflow:hidden; position:relative; width:100%; height:auto; aspect-ratio:3/4; display:flex; align-items:center; justify-content:center;">
             <video id="selfie-video" autoplay muted playsInline style="width:100%; height:100%; object-fit:cover;"></video>
          </div>
          <div style="display:flex; justify-content:space-between; gap:0.75rem; margin-top:1.5rem;">
            <button type="button" class="btn btn-ghost" onclick="window.__closeSelfieCamera()" style="flex:1; padding:10px 16px; border:1px solid var(--border,#e2e8f0); border-radius:999px; background:transparent;">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="window.__captureSelfie()" style="flex:1; padding:10px 16px; border:none; border-radius:999px; background:#0f172a; color:#fff;">Capture Selfie</button>
          </div>
        </div>
      </dialog>
    `;
    document.body.appendChild(modalDiv.firstElementChild);
  }

  // Wire each file input (for non-selfie docs)
  DOC_TYPES.forEach(({ key }) => {
    if (key === "selfie") return;
    const input = document.getElementById(`doc-input-${key}`);
    input.addEventListener("change", () => {
      const file = input.files[0];
      if (!file) return;
      const img       = document.getElementById(`doc-img-${key}`);
      const preview   = document.getElementById(`doc-preview-${key}`);
      const placeholder = document.getElementById(`doc-placeholder-${key}`);
      const nameEl    = document.getElementById(`doc-name-${key}`);
      const card      = document.getElementById(`doc-card-${key}`);

      if (file.type.startsWith("image/")) {
        img.src = URL.createObjectURL(file);
        preview.style.display = "block";
        placeholder.style.display = "none";
      } else {
        preview.style.display = "none";
        placeholder.style.display = "block";
      }
      nameEl.textContent = file.name;
      nameEl.style.display = "block";
      card.style.borderColor = "var(--accent-emerald)";
      card.style.background = "rgba(16,185,129,.06)";
    });
  });

  // Global handlers for selfie camera
  window.__openSelfieCamera = async () => {
    if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera access requires a secure connection. Please access the site via HTTPS or localhost to use the live selfie feature.");
      return;
    }

    const modal = document.getElementById("selfie-camera-modal");
    const video = document.getElementById("selfie-video");
    modal.showModal();
    try {
      selfieStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      video.srcObject = selfieStream;
    } catch (err) {
      alert("Camera permission is required to capture your selfie.");
      window.__closeSelfieCamera();
    }
  };

  window.__closeSelfieCamera = () => {
    const modal = document.getElementById("selfie-camera-modal");
    const video = document.getElementById("selfie-video");
    if (selfieStream) {
      selfieStream.getTracks().forEach(track => track.stop());
      selfieStream = null;
    }
    video.srcObject = null;
    modal.close();
  };

  window.__captureSelfie = () => {
    const video = document.getElementById("selfie-video");
    if (!selfieStream) return;
    
    // Draw to canvas
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to file
    canvas.toBlob((blob) => {
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
      capturedSelfieFile = file;
      
      // Update UI
      const key = "selfie";
      const img = document.getElementById(`doc-img-${key}`);
      const preview = document.getElementById(`doc-preview-${key}`);
      const placeholder = document.getElementById(`doc-placeholder-${key}`);
      const nameEl = document.getElementById(`doc-name-${key}`);
      const card = document.getElementById(`doc-card-${key}`);
      
      img.src = URL.createObjectURL(file);
      preview.style.display = "block";
      placeholder.style.display = "none";
      nameEl.style.display = "block"; // Contains "Selfie captured" + "Retake Selfie"
      card.style.borderColor = "var(--accent-emerald)";
      card.style.background = "rgba(16,185,129,.06)";
      
      window.__closeSelfieCamera();
    }, "image/jpeg", 0.9);
  };

  // Clear handler (global so inline onclick works)
  window.__clearDocUpload = (key) => {
    if (key === "selfie") {
      capturedSelfieFile = null;
    } else {
      document.getElementById(`doc-input-${key}`).value = "";
    }
    document.getElementById(`doc-preview-${key}`).style.display = "none";
    document.getElementById(`doc-placeholder-${key}`).style.display = "block";
    document.getElementById(`doc-name-${key}`).style.display = "none";
    const card = document.getElementById(`doc-card-${key}`);
    card.style.borderColor = "";
    card.style.background = "";
  };
};

/**
 * Collect the selected File objects from the upload UI.
 * @returns {{ aadhaarFront: File|null, aadhaarBack: File|null, selfie: File|null }}
 */
export const getSelectedDocumentFiles = () => {
  const getFile = (id) => {
    const el = document.getElementById(id);
    return el && el.files && el.files[0] ? el.files[0] : null;
  };
  return {
    aadhaarFront: getFile("doc-input-aadhaarFront"),
    aadhaarBack:  getFile("doc-input-aadhaarBack"),
    selfie:       capturedSelfieFile,
  };
};

/**
 * Update the progress bar UI.
 * @param {number} pct - 0 to 100
 */
export const setUploadProgress = (pct) => {
  const wrap  = document.getElementById("doc-upload-progress");
  const bar   = document.getElementById("doc-progress-bar");
  const label = document.getElementById("doc-progress-pct");
  if (!wrap) return;
  wrap.style.display = (pct > 0 && pct <= 100) ? "block" : "none";
  if (bar)   bar.style.width = pct + "%";
  if (label) label.textContent = pct;
};

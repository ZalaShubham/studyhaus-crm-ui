import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, getDocs, query } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { validatePlan } from "./planValidation.js";
import { canEditPlans, canViewManualPlans, enforcePlanUIPermissions } from "./planPermissions.js";

const DEFAULT_PLANS = [
  {
    planName: "Regular Fixed Seat",
    price: 1000,
    duration: "1 Month",
    seatType: "Fixed",
    isManual: false,
    status: "Active",
    createdAt: new Date().toISOString()
  },
  {
    planName: "Rotational Seat",
    price: 800,
    duration: "1 Month",
    seatType: "Rotational",
    capacity: 30,
    isManual: false,
    status: "Active",
    createdAt: new Date().toISOString()
  },
  {
    planName: "Night Study",
    price: 700,
    duration: "1 Month",
    allowedStartTime: "19:00",
    allowedEndTime: "07:00",
    isManual: false,
    status: "Active",
    createdAt: new Date().toISOString()
  }
];

/**
 * Initializes the membership plans module
 */
export const initMembershipPlans = async () => {
  const grid = document.getElementById("membership-plans-grid");
  if (!grid) return; // Not on the memberships page

  // 1. Enforce UI Permissions for this page
  enforcePlanUIPermissions();

  // 2. Setup the "New Plan" button (Owner only)
  const newPlanBtn = document.getElementById("btn-new-plan");
  if (newPlanBtn) {
    newPlanBtn.onclick = handleCreateManualPlan;
  }

  // 3. Ensure Default Plans exist
  await seedDefaultPlans();

  // 4. Start real-time listener for the UI
  listenToPlans();
};

/**
 * Seeds default plans if the collection is empty
 */
const seedDefaultPlans = async () => {
  try {
    const plansRef = collection(db, "membershipPlans");
    const snapshot = await getDocs(query(plansRef));
    
    if (snapshot.empty) {
      console.log("No plans found. Seeding default plans...");
      for (const plan of DEFAULT_PLANS) {
        await addDoc(plansRef, plan);
      }
    }
  } catch (error) {
    console.error("Error seeding default plans:", error);
  }
};

/**
 * Real-time listener that injects HTML into the grid
 */
const listenToPlans = () => {
  const grid = document.getElementById("membership-plans-grid");
  if (!grid) return; // Not on a page that has this element

  const plansRef = collection(db, "membershipPlans");

  onSnapshot(plansRef, (snapshot) => {
    if (snapshot.empty) {
      grid.innerHTML = `<div style="padding: 2rem; color: var(--text-muted);">No plans available.</div>`;
      return;
    }

    const showManual = canViewManualPlans();
    const canEdit = canEditPlans();
    let html = "";

    snapshot.forEach(docSnap => {
      const plan = docSnap.data();
      const id = docSnap.id;

      // Filter out manual plans if user is not Owner
      if (plan.isManual && !showManual) return;

      // Build features list
      let featuresHtml = `<div class="plan-feature">✓ ${plan.duration || 'N/A'}</div>`;
      if (plan.seatType) featuresHtml += `<div class="plan-feature">✓ ${plan.seatType} seat</div>`;
      if (plan.capacity) featuresHtml += `<div class="plan-feature">✓ Max Capacity: ${plan.capacity}</div>`;
      if (plan.allowedStartTime) featuresHtml += `<div class="plan-feature">✓ Timings: ${plan.allowedStartTime} to ${plan.allowedEndTime}</div>`;
      if (plan.notes) featuresHtml += `<div class="plan-feature muted">${plan.notes}</div>`;

      // Build Action Buttons for Owner
      let actionsHtml = "";
      if (canEdit) {
        actionsHtml = `
          <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); display: flex; gap: 1rem; font-size: 0.85rem;">
            <a href="#" onclick="window.editPlan('${id}', '${plan.planName}', '${plan.price}'); return false;" style="color: var(--primary); text-decoration: none;">Edit</a>
            <a href="#" onclick="window.deletePlan('${id}', '${plan.planName}'); return false;" style="color: var(--danger); text-decoration: none;">Delete</a>
          </div>
        `;
      }

      // Check if it's the "Most Popular"
      const isPopular = plan.planName === "Rotational Seat";
      const cardClass = isPopular ? "plan-card featured" : "plan-card";
      const badgeHtml = isPopular ? `<div class="plan-badge">Popular</div>` : "";

      html += `
        <div class="${cardClass}">
          ${badgeHtml}
          <div class="plan-top">
            <div class="plan-name">${plan.planName} ${plan.isManual ? ' <span style="font-size:0.7em; color:var(--text-muted);">(Manual)</span>' : ''}</div>
            <div class="plan-price">₹${plan.price}<span>/${plan.duration != null ? (typeof plan.duration === 'number' ? plan.duration + ' days' : String(plan.duration).toLowerCase()) : 'custom'}</span></div>
          </div>
          <div class="plan-features">
            ${featuresHtml}
          </div>
          ${actionsHtml}
        </div>
      `;
    });

    grid.innerHTML = html;
  }, (error) => {
    console.error("Error listening to plans:", error);
    if (grid) grid.innerHTML = `<div style="color: var(--danger); padding: 1rem;">Failed to load plans.</div>`;
  });
};

/**
 * Handle Manual Plan Creation
 */
const handleCreateManualPlan = async () => {
  const name = prompt("Enter Custom Plan Name:");
  if (!name) return;

  const priceStr = prompt("Enter Price (e.g. 500):");
  if (!priceStr) return;

  const duration = prompt("Enter Duration (e.g. 1 Week, 1 Month):");
  if (!duration) return;

  const notes = prompt("Enter Notes (Optional):");

  const newPlan = {
    planName: name,
    price: Number(priceStr),
    duration: duration,
    notes: notes || "",
    isManual: true,
    status: "Active",
    createdAt: new Date().toISOString()
  };

  try {
    await validatePlan(newPlan);
    const plansRef = collection(db, "membershipPlans");
    await addDoc(plansRef, newPlan);
    alert("Manual Plan created successfully!");
  } catch (error) {
    alert("Error: " + error.message);
  }
};

/**
 * Global edit handler
 */
window.editPlan = async (id, currentName, currentPrice) => {
  const newPriceStr = prompt(`Update price for ${currentName}:`, currentPrice);
  if (!newPriceStr) return;

  const newPrice = Number(newPriceStr);
  if (isNaN(newPrice) || newPrice <= 0) {
    alert("Invalid price.");
    return;
  }

  try {
    const docRef = doc(db, "membershipPlans", id);
    await updateDoc(docRef, {
      price: newPrice,
      updatedAt: new Date().toISOString()
    });
    alert("Plan updated successfully!");
  } catch (error) {
    alert("Failed to update plan: " + error.message);
  }
};

/**
 * Global delete handler
 */
window.deletePlan = async (id, planName) => {
  if (confirm(`Are you sure you want to delete '${planName}'?`)) {
    try {
      const docRef = doc(db, "membershipPlans", id);
      await deleteDoc(docRef);
      alert("Plan deleted.");
    } catch (error) {
      alert("Failed to delete plan: " + error.message);
    }
  }
};

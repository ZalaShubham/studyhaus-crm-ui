import { createAnnouncement, listenToAnnouncements, deleteAnnouncement } from "./announcementService.js";

/**
 * Initializes the announcements UI listener
 */
export const initAnnouncementAdminUI = () => {
  const notifList = document.querySelector("#page-notifications .notif-list");
  if (!notifList) return; // not on a dashboard with notifications

  notifList.innerHTML = `<div style="text-align:center; padding: 2rem;">Loading announcements...</div>`;

  listenToAnnouncements((announcements) => {
    // Update badges
    const count = announcements.length;
    document.querySelectorAll('.nav-badge').forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    });

    if (count === 0) {
      notifList.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-muted);">No announcements scheduled.</div>`;
      return;
    }

    let html = "";
    announcements.forEach(a => {
      // Icon depending on type
      let iconHtml = "";
      let iconClass = "";
      if (a.type === "warning") {
        iconClass = "red";
        iconHtml = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
      } else if (a.type === "success") {
        iconClass = "green";
        iconHtml = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
      } else {
        iconClass = "amber";
        iconHtml = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
      }

      const dateStr = a.createdAt?.seconds 
        ? new Date(a.createdAt.seconds * 1000).toLocaleString() 
        : "Just now";

      const scheduledStr = a.scheduledFor ? `Scheduled for: ${new Date(a.scheduledFor).toLocaleString()}` : "";

      html += `
        <div class="notif-item">
          <div class="notif-icon ${iconClass}">${iconHtml}</div>
          <div class="notif-content" style="flex: 1;">
            <div style="display:flex; justify-content:space-between;">
              <div class="notif-title">${a.title}</div>
              <button class="btn btn-ghost" style="padding:2px 5px; color:var(--danger);" onclick="window.deleteAnnouncementHandler('${a.id}')">Delete</button>
            </div>
            <div class="notif-body">${a.message}</div>
            <div class="notif-time">${scheduledStr ? scheduledStr : 'Sent: ' + dateStr} · Audience: ${a.audience}</div>
          </div>
        </div>
      `;
    });
    notifList.innerHTML = html;
  });
};

/**
 * Handles the submission of the announcement form
 */
window.submitAnnouncement = async () => {
  const btn = document.getElementById("btn-schedule-announcement");
  if (btn) { btn.disabled = true; btn.textContent = "Scheduling..."; }

  const data = {
    title: document.getElementById("ann-title").value,
    message: document.getElementById("ann-message").value,
    type: document.getElementById("ann-type").value,
    audience: document.getElementById("ann-audience").value,
    scheduledFor: document.getElementById("ann-date").value || null,
    createdBy: localStorage.getItem("userName") || "Admin"
  };

  const res = await createAnnouncement(data);
  
  if (btn) { btn.disabled = false; btn.textContent = "Schedule"; }

  if (res.success) {
    window.showToast("Announcement scheduled successfully!", "success");
    
    document.getElementById("announcement-modal").close();
    document.getElementById("announcement-form").reset();
  } else {
    window.showToast("Error: " + res.error, "error");
  }
};

/**
 * Handles deleting an announcement
 */
window.deleteAnnouncementHandler = async (id) => {
  const confirmed = await window.showCustomConfirm("Delete Announcement", "Are you sure you want to delete this announcement?", "Delete", true);
  if (confirmed) {
    const res = await deleteAnnouncement(id);
    if (res.success) {
      window.showToast("Announcement deleted", "success");
    } else {
      window.showToast("Error deleting announcement: " + res.error, "error");
    }
  }
};

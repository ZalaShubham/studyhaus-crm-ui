const fs = require('fs');
let code = fs.readFileSync('services/membershipService.js', 'utf8');

const target = `    snapshot.forEach(docSnap => {
      const plan = docSnap.data();
      const id = docSnap.id;

      // Filter out manual plans if user is not Owner
      if (plan.isManual && !showManual) return;

      // Build features list
      let featuresHtml = \`<div class="plan-feature">✓ \${plan.duration || 'N/A'}</div>\`;
      if (plan.seatType) featuresHtml += \`<div class="plan-feature">✓ \${plan.seatType} seat</div>\`;
      if (plan.capacity) featuresHtml += \`<div class="plan-feature">✓ Max Capacity: \${plan.capacity}</div>\`;
      if (plan.allowedStartTime) featuresHtml += \`<div class="plan-feature">✓ Timings: \${plan.allowedStartTime} to \${plan.allowedEndTime}</div>\`;
      if (plan.notes) featuresHtml += \`<div class="plan-feature muted">\${plan.notes}</div>\`;

      // Build Action Buttons for Owner
      let actionsHtml = "";
      if (canEdit) {
        actionsHtml = \`
          <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); display: flex; gap: 1rem; font-size: 0.85rem;">
            <a href="#" onclick="window.editPlan('\${id}', '\${plan.planName}', '\${plan.price}'); return false;" style="color: var(--primary); text-decoration: none;">Edit</a>
            <a href="#" onclick="window.deletePlan('\${id}', '\${plan.planName}'); return false;" style="color: var(--danger); text-decoration: none;">Delete</a>
          </div>
        \`;
      }

      // Check if it's the "Most Popular"
      const isPopular = plan.planName === "Rotational Seat";
      const cardClass = isPopular ? "plan-card featured" : "plan-card";
      const badgeHtml = isPopular ? \`<div class="plan-badge">Popular</div>\` : "";

      html += \`
        <div class="\${cardClass}">
          \${badgeHtml}
          <div class="plan-top">
            <div class="plan-name">\${plan.planName} \${plan.isManual ? ' <span style="font-size:0.7em; color:var(--text-muted);">(Manual)</span>' : ''}</div>
            <div class="plan-price">₹\${plan.price}<span>/\${plan.duration != null ? (typeof plan.duration === 'number' ? plan.duration + ' days' : String(plan.duration).toLowerCase()) : 'custom'}</span></div>
          </div>
          <div class="plan-features">
            \${featuresHtml}
          </div>
          \${actionsHtml}
        </div>
      \`;
    });`;

const replacement = `    snapshot.forEach(docSnap => {
      const plan = docSnap.data();
      const id = docSnap.id;

      if (plan.isManual && !showManual) return;

      let iconSvg = '';
      let subtitle = '';
      let activeCountText = '0 active';
      let accessText = 'All-day access';
      
      if (plan.planName.includes('Fixed')) {
        iconSvg = \`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>\`;
        subtitle = "Permanently assigned seat, all-day access.";
        activeCountText = '2 active';
      } else if (plan.planName.includes('Rotational')) {
        iconSvg = \`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/></svg>\`;
        subtitle = "No fixed seat. Capped at 30 active students.";
        activeCountText = '0 active · cap 30';
      } else if (plan.planName.includes('Night')) {
        iconSvg = \`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>\`;
        subtitle = "Night access 7 PM - 7 AM only.";
        accessText = '7 PM - 7 AM';
      } else {
        iconSvg = \`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>\`;
        subtitle = plan.notes || "Custom manual plan.";
      }

      let actionsHtml = "";
      if (canEdit) {
        actionsHtml = \`
          <div style="display: flex; gap: 1rem; align-items:center; margin-top:1.5rem;">
            <button onclick="window.editPlan('\${id}', '\${plan.planName}', '\${plan.price}')" style="flex:1; background:transparent; border:1px solid #e2e8f0; color:#94a3b8; padding:8px 16px; border-radius:999px; font-weight:500; font-size:13px; cursor:pointer; text-align:center;">Edit</button>
            <button onclick="alert('Assign flow not implemented yet.')" style="flex:1; background:transparent; border:none; color:#0f172a; padding:8px 16px; border-radius:999px; font-weight:700; font-size:13px; cursor:pointer; text-align:center;">Assign</button>
          </div>
        \`;
      }

      html += \`
        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:1.5rem; display:flex; flex-direction:column; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: 0.2s;">
          <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.25rem;">
            <div style="background:#f1f5f9; color:#64748b; width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center;">
              \${iconSvg}
            </div>
            <div style="font-weight:600; color:#0f172a; font-size:16px;">\${plan.planName}</div>
          </div>
          <div style="color:#64748b; font-size:13px; margin-bottom:1.5rem; padding-left: 3rem;">
            \${subtitle}
          </div>
          
          <div style="display:flex; align-items:baseline; gap:4px; margin-bottom:1.5rem;">
            <span style="font-size:2.2rem; font-weight:800; color:#0f172a; letter-spacing:-1px;">₹\${plan.price}</span>
            <span style="color:#64748b; font-size:14px; font-weight:500;">/ month</span>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.6rem; margin-bottom:1rem; margin-top:auto;">
            <div style="display:flex; align-items:center; gap:0.5rem; color:#475569; font-size:13px;">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              \${accessText}
            </div>
            <div style="display:flex; align-items:center; gap:0.5rem; color:#475569; font-size:13px;">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              \${activeCountText}
            </div>
          </div>
          
          \${actionsHtml}
        </div>
      \`;
    });`;

code = code.replace(target, replacement);
fs.writeFileSync('services/membershipService.js', code);
console.log('Membership plans updated!');

import { db } from "../firebase/firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const websiteAdminUI = {
  data: {
    headline: "Every detail designed to keep you in flow.",
    subheadline: "Considered, not compromised. We took away every friction point so you can focus entirely on conquering your goals.",
    about: "",
    features: [
      { id: "f1", title: "Fully Air Conditioned", icon: "Airplay" },
      { id: "f2", title: "Ergonomic Chairs", icon: "Armchair" }
    ],
    gallery: [
      { id: "g1", url: "https://images.unsplash.com/photo-1497366216548-37526070297c" }
    ]
  },

  async init() {
    window.websiteAdminUI = this;
    await this.loadData();
    this.render();
  },

  async loadData() {
    try {
      const docRef = doc(db, "settings", "website_content");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        this.data = { ...this.data, ...docSnap.data() };
      }
    } catch (error) {
      console.error("Error loading website data:", error);
    }
  },

  render() {
    const headlineEl = document.getElementById("website-headline");
    if (!headlineEl) return;

    // Render text
    headlineEl.value = this.data.headline || "";
    document.getElementById("website-subheadline").value = this.data.subheadline || "";
    document.getElementById("website-about").value = this.data.about || "";

    // Render features
    const featuresList = document.getElementById("website-features-list");
    featuresList.innerHTML = "";
    this.data.features.forEach((feature, index) => {
      const div = document.createElement("div");
      div.style.display = "flex";
      div.style.gap = "0.5rem";
      div.innerHTML = `
        <input type="text" class="form-control" value="${feature.title}" onchange="websiteAdminUI.updateFeature(${index}, 'title', this.value)" placeholder="Feature Title" style="flex: 2;" />
        <input type="text" class="form-control" value="${feature.icon}" onchange="websiteAdminUI.updateFeature(${index}, 'icon', this.value)" placeholder="Icon name or image URL" style="flex: 1;" />
        <button class="btn btn-ghost" onclick="websiteAdminUI.removeFeature(${index})" style="color: var(--danger);">&times;</button>
      `;
      featuresList.appendChild(div);
    });

    // Render gallery
    const galleryList = document.getElementById("website-gallery-list");
    galleryList.innerHTML = "";
    this.data.gallery.forEach((img, index) => {
      const div = document.createElement("div");
      div.style.position = "relative";
      div.innerHTML = `
        <label style="cursor:pointer; display:block; width:100%; height:120px; border-radius:8px; border:1px dashed var(--border); overflow:hidden; position:relative; background:#f9f9f9;">
          ${img.url ? `<img src="${img.url}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src='data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=='" />` : `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-muted); font-size:0.8rem;"><svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><div>Upload Image</div></div>`}
          <input type="file" accept="image/*" style="display:none;" onchange="websiteAdminUI.handleImageUpload(${index}, event)" />
        </label>
        <button onclick="websiteAdminUI.removeGalleryImage(${index})" style="position:absolute; top:4px; right:4px; background:var(--danger); color:white; border:none; border-radius:50%; width:24px; height:24px; cursor:pointer; z-index:10;">&times;</button>
        <input type="text" class="form-control" value="${img.url}" onchange="websiteAdminUI.updateGalleryImage(${index}, this.value)" placeholder="Or paste Image URL" style="margin-top:0.5rem; font-size:0.75rem;" />
      `;
      galleryList.appendChild(div);
    });
  },

  updateFeature(index, field, value) {
    this.data.features[index][field] = value;
  },

  addFeature() {
    this.data.features.push({ id: "f" + Date.now(), title: "New Feature", icon: "Star" });
    this.render();
  },

  removeFeature(index) {
    this.data.features.splice(index, 1);
    this.render();
  },

  updateGalleryImage(index, value) {
    this.data.gallery[index].url = value;
    this.render();
  },

  addGalleryImage() {
    this.data.gallery.push({ id: "g" + Date.now(), url: "" });
    this.render();
  },

  removeGalleryImage(index) {
    this.data.gallery.splice(index, 1);
    this.render();
  },

  handleImageUpload(index, event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.updateGalleryImage(index, e.target.result);
      };
      reader.readAsDataURL(file);
    }
  },

  async saveChanges() {
    this.data.headline = document.getElementById("website-headline").value;
    this.data.subheadline = document.getElementById("website-subheadline").value;
    this.data.about = document.getElementById("website-about").value;

    try {
      const docRef = doc(db, "settings", "website_content");
      await setDoc(docRef, this.data);
      alert("Website content saved successfully!");
    } catch (error) {
      console.error("Error saving website content:", error);
      alert("Failed to save website content. See console.");
    }
  }
};

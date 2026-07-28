import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebase.js";

/**
 * Creates a new announcement in Firestore
 */
export const createAnnouncement = async (data) => {
  try {
    const docRef = await addDoc(collection(db, "announcements"), {
      title: data.title,
      message: data.message,
      audience: data.audience || "All Students", // "All Students", "Active Only", etc.
      scheduledFor: data.scheduledFor || null, // Optional future date
      type: data.type || "info", // "info", "warning", "success"
      createdBy: data.createdBy,
      createdAt: serverTimestamp(),
      status: "Active"
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating announcement:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Listens to all announcements in real-time
 */
export const listenToAnnouncements = (onUpdate) => {
  const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const announcements = [];
    snapshot.forEach(doc => {
      announcements.push({ id: doc.id, ...doc.data() });
    });
    onUpdate(announcements);
  });
};

/**
 * Deletes an announcement
 */
export const deleteAnnouncement = async (id) => {
  try {
    await deleteDoc(doc(db, "announcements", id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return { success: false, error: error.message };
  }
};

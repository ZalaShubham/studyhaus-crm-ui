import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "./firebase/firebase.js";
import { seedInitialSeats } from "./services/seatService.js";

const resetSeats = async () => {
  console.log("Fetching existing seats...");
  const seatsRef = collection(db, "seats");
  const snap = await getDocs(seatsRef);
  
  if (!snap.empty) {
    console.log(`Deleting ${snap.docs.length} existing seats...`);
    const deletePromises = snap.docs.map(d => deleteDoc(doc(db, "seats", d.id)));
    await Promise.all(deletePromises);
    console.log("All existing seats deleted.");
  }
  
  console.log("Running seedInitialSeats()...");
  await seedInitialSeats();
  console.log("Done! You can now refresh the browser.");
  process.exit(0);
};

resetSeats();

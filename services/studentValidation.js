import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { checkRotationalCapacity } from "./planValidation.js";

/**
 * Validates a new student admission request.
 * Throws errors if validation fails.
 */
export const validateStudentData = async (data) => {
  if (!data.name || data.name.trim() === "") throw new Error("Full Name is required.");
  if (!data.phone || data.phone.trim() === "") throw new Error("Phone Number is required.");
  if (!data.dob) throw new Error("Date of Birth is required.");
  if (!data.gender) throw new Error("Gender is required.");
  if (!data.planId) throw new Error("Membership Plan is required.");
  
  if (!data.paymentMethod) throw new Error("Payment Option must be selected.");
  if (data.paymentMethod === "Pay Later" && !data.paymentDueDate) {
    throw new Error("Due Date is required for Pay Later option.");
  }
  if (data.paymentMethod === "Pay Now" && (!data.transactionId || data.transactionId.trim() === "")) {
    throw new Error("Transaction ID is required for Pay Now option.");
  }

  // Terms and conditions
  if (!data.termsAccepted) throw new Error("You must accept the Terms & Conditions.");

  // Check capacity if plan is Rotational
  if (data.planName === "Rotational Seat") {
    const isAvailable = await checkRotationalCapacity();
    if (!isAvailable) {
      throw new Error("The Rotational Seat plan has reached its maximum capacity (30 students).");
    }
  }

  // Duplicate Checks in both 'students' and 'admissions'
  await checkDuplicates(data.phone, data.email);
  return true;
};

/**
 * Checks if phone or email already exists in system.
 */
const checkDuplicates = async (phone, email) => {
  const collections = ["students", "admissions"];
  
  for (const colName of collections) {
    // Check phone
    const phoneQ = query(collection(db, colName), where("phone", "==", phone));
    const phoneSnap = await getDocs(phoneQ);
    if (!phoneSnap.empty) {
      throw new Error(`Phone number ${phone} is already registered.`);
    }

    // Check email if provided
    if (email && email.trim() !== "") {
      const emailQ = query(collection(db, colName), where("email", "==", email));
      const emailSnap = await getDocs(emailQ);
      if (!emailSnap.empty) {
        throw new Error(`Email ${email} is already registered.`);
      }
    }
  }
};

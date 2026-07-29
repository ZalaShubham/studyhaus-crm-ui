import { db } from "./firebase/firebase.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

async function seedExpenses() {
    console.log("Seeding expenses...");
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const expenses = [
        {
            expenseName: "Electricity Bill",
            categoryId: "cat_electricity",
            categoryName: "Electricity",
            amount: 5000,
            paymentMethod: "Bank Transfer",
            vendor: "State Electricity Board",
            description: "Monthly electricity bill",
            expenseDate: todayStr,
            createdBy: "Admin User",
            status: "Paid",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        },
        {
            expenseName: "Internet Bill",
            categoryId: "cat_internet",
            categoryName: "Internet",
            amount: 1500,
            paymentMethod: "Credit Card",
            vendor: "ISP Provider",
            description: "Monthly broadband",
            expenseDate: todayStr,
            createdBy: "Admin User",
            status: "Paid",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        },
        {
            expenseName: "Cleaning Supplies",
            categoryId: "cat_cleaning",
            categoryName: "Cleaning",
            amount: 800,
            paymentMethod: "Cash",
            vendor: "Local Store",
            description: "Brooms and mops",
            expenseDate: todayStr,
            createdBy: "Admin User",
            status: "Pending",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }
    ];

    for (let exp of expenses) {
        await addDoc(collection(db, "expenses"), exp);
        console.log("Added expense:", exp.expenseName);
    }
    
    console.log("Done");
    process.exit(0);
}

seedExpenses().catch(console.error);

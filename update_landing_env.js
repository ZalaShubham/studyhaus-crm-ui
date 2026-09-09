const fs = require('fs');
const envPath = 'E:/INTERNSHIP-JUNTOAUG2026/ShreeJi Library/ShreeJi Library/.env';

const newEnv = `VITE_FIREBASE_API_KEY=AIzaSyAkOoZLga4CY67UjWp8hwmGj9yjJoop88I
VITE_FIREBASE_AUTH_DOMAIN=studyhaus-crm.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=studyhaus-crm
VITE_FIREBASE_STORAGE_BUCKET=studyhaus-crm.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1008571854677
VITE_FIREBASE_APP_ID=1:1008571854677:web:8f8e42ce3b0ffddddfc9dc
`;

fs.writeFileSync(envPath, newEnv);
console.log('Updated .env');

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyD0kB8YuswSczIm0NN8y_PrZOX8rsKnckg",
    authDomain: "app-gerenciamento-44d01.firebaseapp.com",
    projectId: "app-gerenciamento-44d01",
    storageBucket: "app-gerenciamento-44d01.firebasestorage.app",
    messagingSenderId: "87622104511",
    appId: "1:87622104511:web:c21140fdb91ea345519d0a"
};

// Initialize Firebase (only if not already initialized)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);
const auth = getAuth(app);

export { db, app, auth };

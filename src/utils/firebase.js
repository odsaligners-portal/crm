// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// TODO: Add your own Firebase configuration from your Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyBqYK5HTlcOxY5eLfVG-O7WOaxQs6Uv2lQ",
  authDomain: "mern-blog-fa022.firebaseapp.com",
  projectId: "mern-blog-fa022",
  storageBucket: "mern-blog-fa022.appspot.com",
  messagingSenderId: "766364253855",
  appId: "1:766364253855:web:24942c51b0a8fa56586caa"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const storage = getStorage(app);

export { app, storage }; 
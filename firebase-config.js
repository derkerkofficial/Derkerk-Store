// Firebase SDK 라이브러리 (최신 버전 사용)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDhPf0A4RBc4q8TV5FythPrRlsGA0Mspjc",
  authDomain: "derkerk-84352.firebaseapp.com",
  projectId: "derkerk-84352",
  storageBucket: "derkerk-84352.firebasestorage.app",
  messagingSenderId: "207773631707",
  appId: "1:207773631707:web:cb68d7c5173f1f48e4b8fe",
  measurementId: "G-2JFXG1HLKZ"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 다른 파일에서 쓸 수 있게 내보내기
export { db, collection, addDoc, getDocs, query, where };

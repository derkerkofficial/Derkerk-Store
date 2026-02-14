import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDhPf0A4RBc4q8TV5FythPrRlsGA0Mspjc",
  authDomain: "derkerk-84352.firebaseapp.com",
  projectId: "derkerk-84352",
  storageBucket: "derkerk-84352.firebasestorage.app",
  messagingSenderId: "207773631707",
  appId: "1:207773631707:web:cb68d7c5173f1f48e4b8fe",
  measurementId: "G-2JFXG1HLKZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// [중요] 버튼 클릭 시 무조건 반응하도록 설정
window.handleSaveWithDuplicateCheck = async function() {
    console.log("저장 버튼 클릭됨!"); // 개발자 도구용
    alert("저장 버튼이 눌렸습니다! 작업을 시작합니다."); // 태블릿 확인용

    const name = document.getElementById('productName').value.trim();
    if (!name) { alert("상품명을 입력하세요!"); return; }

    try {
        const productData = {
            name: name,
            price: parseInt(document.getElementById('productPrice').value) || 0,
            updatedAt: new Date()
        };
        
        await addDoc(collection(db, "products"), productData);
        alert("🎉 서버 저장 성공!");
        location.reload(); // 성공 시 새로고침
    } catch (e) {
        alert("❌ 저장 실패 에러내용: " + e.message);
    }
};

// 페이지 로드 확인
window.onload = () => {
    alert("새로운 pdt.js 파일이 정상적으로 로드되었습니다!");
};

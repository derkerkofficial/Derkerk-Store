import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDhPf0A4RBc4q8TV5FythPrRlsGA0Mspjc",
  authDomain: "derkerk-84352.firebaseapp.com",
  projectId: "derkerk-84352",
  storageBucket: "derkerk-84352.firebasestorage.app",
  messagingSenderId: "207773631707",
  appId: "1:207773631707:web:cb68d7c5173f1f48e4b8fe",
  measurementId: "G-2JFXG1HLKZ"
};

// 초기화 확인용
let db;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) {
    alert("파이어베이스 초기화 에러: " + e.message);
}

// [기존 변수/기능 100% 유지]
let products = [];
let categories = [];
let highlights = []; 
let colors = []; 
let currentColor = null;
let editingId = null; 
let currentFilter = 'All';
let currentDescImages = []; 

const sizeOptions = { 
    standard: ['S','M','L','XL'], 
    doubleZero: ['44','55','66','77'], 
    letter: ['XS','S','M','L','XL'], 
    custom: [] 
};

// --- [서버 로드] ---
async function loadProductsFromServer() {
    try {
        const q = query(collection(db, "products"), orderBy("updatedAt", "desc"));
        const querySnapshot = await getDocs(q);
        products = [];
        querySnapshot.forEach((doc) => {
            products.push({ ...doc.data(), firebaseUrl: doc.id });
        });
        renderProducts();
        if (typeof renderFilters === 'function') renderFilters();
    } catch (e) {
        console.error("로드 실패:", e);
    }
}

// --- [저장 로직: 핵심] ---
async function handleSaveWithDuplicateCheck() {
    try {
        const nameInput = document.getElementById('productName');
        const newName = nameInput.value.trim();
        if (!newName) { alert("상품명을 입력해주세요."); return; }
        
        if (editingId === null) {
            const isDuplicate = products.some(p => p.name === newName);
            if (isDuplicate) { alert("이미 존재하는 상품명입니다."); return; }
        }
        
        // 저장 데이터 생성
        const price = parseInt(document.getElementById('productPrice').value) || 0;
        const discount = parseInt(document.getElementById('discountRate').value) || 0;
        const desc = document.getElementById('productDesc').value.trim();
        const checkedCats = Array.from(document.querySelectorAll('input[name="prodCat"]:checked')).map(cb => cb.value);
        const checkedHighs = Array.from(document.querySelectorAll('input[name="prodHigh"]:checked')).map(cb => cb.value);
        
        const productData = { 
            name: newName, price, discount, desc, 
            categories: checkedCats, 
            highlights: checkedHighs, 
            descImages: [...currentDescImages], 
            colors: JSON.parse(JSON.stringify(colors)),
            updatedAt: new Date()
        };

        if (editingId !== null) {
            await updateDoc(doc(db, "products", editingId), productData);
            alert("수정 성공!");
        } else {
            await addDoc(collection(db, "products"), productData);
            alert("신규 저장 성공!");
        }
        
        resetForm();
        await loadProductsFromServer();
    } catch (e) {
        alert("저장 에러 발생: " + e.message);
        console.error(e);
    }
}

// --- [UI 및 부가 기능: 사장님 원본 그대로] ---
function checkNameInput() {
    const nameVal = document.getElementById('productName').value.trim();
    const dynamicArea = document.getElementById('dynamicDetails');
    if (!dynamicArea) return;
    if (nameVal.length > 0 || editingId !== null) {
        dynamicArea.style.maxHeight = "5000px"; dynamicArea.style.opacity = "1";
        dynamicArea.style.display = "block";
    } else {
        dynamicArea.style.maxHeight = "0"; dynamicArea.style.opacity = "0";
    }
}

function renderProducts() {
    const list = document.getElementById('productList');
    if(!list) return;
    list.innerHTML = products.map(p => `
        <div class="product-item" style="border:1px solid #444; padding:10px; margin-bottom:5px;">
            <div onclick="editProduct('${p.firebaseUrl}')" style="cursor:pointer;">
                <strong>${p.name}</strong> - ${p.price}원
            </div>
            <button onclick="deleteProduct('${p.firebaseUrl}')">삭제</button>
        </div>
    `).join('');
}

function resetForm() {
    editingId = null; colors = []; currentDescImages = [];
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productDesc').value = '';
    checkNameInput();
}

// --- [모든 함수를 window에 강제 등록 (태블릿 필수)] ---
window.handleSaveWithDuplicateCheck = handleSaveWithDuplicateCheck;
window.checkNameInput = checkNameInput;
window.editProduct = (id) => {
    editingId = id;
    const p = products.find(prod => prod.firebaseUrl === id);
    if (!p) return;
    document.getElementById('productName').value = p.name;
    document.getElementById('productPrice').value = p.price;
    document.getElementById('productDesc').value = p.desc;
    colors = p.colors || [];
    currentDescImages = p.descImages || [];
    checkNameInput();
};
window.deleteProduct = async (id) => {
    if(confirm("삭제하시겠습니까?")) {
        await deleteDoc(doc(db, "products", id));
        loadProductsFromServer();
    }
};
window.calculateSalePrice = () => {
    const p = parseInt(document.getElementById('productPrice').value) || 0;
    const d = parseInt(document.getElementById('discountRate').value) || 0;
    document.getElementById('finalPriceDisplay').innerText = Math.floor(p * (1 - d/100)).toLocaleString() + "원";
};
window.addCategory = () => {
    const v = document.getElementById('newCategoryInput').value.trim();
    if(v) { categories.push(v); window.renderCategories(); }
};
window.renderCategories = () => {
    const g = document.getElementById('categoryCheckboxGroup');
    if(g) g.innerHTML = categories.map(c => `<label><input type="checkbox" name="prodCat" value="${c}"> ${c}</label>`).join('');
};

// 초기 실행
window.onload = loadProductsFromServer;

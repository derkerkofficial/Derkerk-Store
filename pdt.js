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

// 전역 변수 (기존 기능 100% 유지)
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

// --- [UI 제어: 상품명 입력 시 상세창 열기] ---
function checkNameInput() {
    const nameVal = document.getElementById('productName').value.trim();
    const dynamicArea = document.getElementById('dynamicDetails');
    const saveBtn = document.getElementById('saveNameBtn');
    
    if (nameVal.length > 0 || editingId !== null) {
        if (dynamicArea) {
            dynamicArea.style.maxHeight = "none"; 
            dynamicArea.style.opacity = "1";
            dynamicArea.style.pointerEvents = "auto";
            dynamicArea.style.display = "block"; // 강제 표시
        }
        if (saveBtn) saveBtn.style.display = 'block';
    } else {
        if (dynamicArea) {
            dynamicArea.style.maxHeight = "0";
            dynamicArea.style.opacity = "0";
            dynamicArea.style.display = "none";
        }
        if (saveBtn) saveBtn.style.display = 'none';
    }
}

// --- [서버 통신] ---
async function loadProductsFromServer() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        products = [];
        querySnapshot.forEach((doc) => {
            products.push({ ...doc.data(), firebaseUrl: doc.id });
        });
        renderProducts();
        renderFilters();
        renderCategories(); // 카테고리 목록도 다시 그려줌
        renderHighlights();
    } catch (e) {
        console.error("데이터 로드 실패:", e);
    }
}

async function saveProduct() {
    const name = document.getElementById('productName').value.trim();
    const price = parseInt(document.getElementById('productPrice').value) || 0;
    const discount = parseInt(document.getElementById('discountRate').value) || 0;
    const desc = document.getElementById('productDesc').value.trim();
    const checkedCats = Array.from(document.querySelectorAll('input[name="prodCat"]:checked')).map(cb => cb.value);
    const checkedHighs = Array.from(document.querySelectorAll('input[name="prodHigh"]:checked')).map(cb => cb.value);
    
    const productData = { 
        name, price, discount, desc, 
        categories: checkedCats, 
        highlights: checkedHighs, 
        descImages: [...currentDescImages], 
        colors: JSON.parse(JSON.stringify(colors)),
        updatedAt: new Date()
    };
    
    try {
        if (editingId !== null) {
            await updateDoc(doc(db, "products", editingId), productData);
            alert("수정 완료!");
        } else {
            await addDoc(collection(db, "products"), productData);
            alert("서버 저장 완료!");
        }
        resetForm(); 
        await loadProductsFromServer(); 
    } catch (e) {
        alert("저장 실패: " + e.message);
    }
}

// --- [렌더링 함수들] ---
function renderProducts() {
    const list = document.getElementById('productList'); 
    if(!list) return;
    list.innerHTML = '';
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    const filtered = products.filter(p => {
        const matchCategory = currentFilter === 'All' || (p.categories && p.categories.includes(currentFilter));
        return matchCategory && p.name.toLowerCase().includes(searchTerm);
    });

    filtered.forEach((p) => {
        const salePrice = Math.floor((p.price || 0) * (1 - (p.discount || 0) / 100));
        list.innerHTML += `
            <div class="product-item" style="border:1px solid #444; margin-bottom:5px; padding:10px; display:flex; justify-content:space-between; align-items:center;">
                <div onclick="editProduct('${p.firebaseUrl}')" style="cursor:pointer; flex:1;">
                    <strong>${p.name}</strong> - ${salePrice.toLocaleString()}원
                </div>
                <button onclick="deleteProduct('${p.firebaseUrl}')" style="background:red; color:white; border:none; padding:5px;">삭제</button>
            </div>`;
    });
}

function renderCategories(){
    const list = document.getElementById('categoryList'), group = document.getElementById('categoryCheckboxGroup');
    if(list) list.innerHTML = categories.map((c, i) => `<div class="item-wrapper"><span>${c}</span><button onclick="deleteCategory(${i})">✕</button></div>`).join('');
    if(group) group.innerHTML = categories.map(c => `<label><input type="checkbox" name="prodCat" value="${c}"> ${c}</label>`).join('');
}

function renderHighlights() {
    const list = document.getElementById('highlightList'), group = document.getElementById('highlightCheckboxGroup');
    if(list) list.innerHTML = highlights.map((h, i) => `<div class="item-wrapper"><span>${h}</span><button onclick="highlights.splice(${i},1); renderHighlights();">✕</button></div>`).join('');
    if(group) group.innerHTML = highlights.map(h => `<label><input type="checkbox" name="prodHigh" value="${h}"> ${h}</label>`).join('');
}

// --- [기존 기능 복구] ---
function addCategory(){
    const val = document.getElementById('newCategoryInput').value.trim();
    if(!val || categories.includes(val)) return;
    categories.push(val); renderCategories(); renderFilters();
}
function deleteCategory(i){ categories.splice(i,1); renderCategories(); renderFilters(); renderProducts(); }

function addColor() {
    const nameInput = document.getElementById('colorInput');
    const name = nameInput.value.trim();
    if (!name) return;
    colors.push({ name: name, sizeType: 'standard', stock: {S:0,M:0,L:0,XL:0}, images: [] });
    nameInput.value = ''; renderColors();
}
function renderColors() {
    const list = document.getElementById('colorList'); if(!list) return;
    list.innerHTML = colors.map(c => `<div class="item-wrapper ${currentColor === c.name ? 'active' : ''}" onclick="selectColor('${c.name}')">${c.name} <button onclick="event.stopPropagation(); deleteColor('${c.name}')">✕</button></div>`).join('');
}
function selectColor(name) {
    currentColor = name; renderColors(); 
    const colorData = colors.find(c => c.name === name);
    document.getElementById('variantEditor').style.display = 'block';
    renderStockTable();
}
function updateStock(size, val) {
    const colorData = colors.find(c => c.name === currentColor);
    if(colorData) colorData.stock[size] = parseInt(val) || 0;
}
function renderStockTable() {
    const tbody = document.getElementById('stockTable'); if(!tbody) return;
    const colorData = colors.find(c => c.name === currentColor);
    if(!colorData) return;
    tbody.innerHTML = Object.keys(colorData.stock).map(size => `<tr><td>${size}</td><td><input type="number" value="${colorData.stock[size]}" oninput="updateStock('${size}', this.value)"></td></tr>`).join('');
}

function editProduct(id) {
    editingId = id; 
    const p = products.find(prod => prod.firebaseUrl === id);
    if (!p) return;
    document.getElementById('productName').value = p.name;
    document.getElementById('productPrice').value = p.price;
    document.getElementById('productDesc').value = p.desc;
    colors = p.colors || [];
    currentDescImages = p.descImages || [];
    checkNameInput();
    renderColors();
}

function resetForm() {
    editingId = null; colors = [];
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productDesc').value = '';
    checkNameInput();
}

// --- [태블릿 필수: 모든 함수 전역 등록] ---
window.checkNameInput = checkNameInput;
window.handleSaveWithDuplicateCheck = () => { if(confirm("저장하시겠습니까?")) saveProduct(); };
window.addCategory = addCategory;
window.deleteCategory = deleteCategory;
window.addHighlight = () => {
    const val = document.getElementById('newHighlightInput').value.trim();
    if(val) { highlights.push(val); renderHighlights(); }
};
window.addColor = addColor;
window.selectColor = selectColor;
window.deleteColor = (name) => { colors = colors.filter(c => c.name !== name); renderColors(); };
window.updateStock = updateStock;
window.editProduct = editProduct;
window.deleteProduct = async (id) => { if(confirm("삭제?")) { await deleteDoc(doc(db, "products", id)); loadProductsFromServer(); } };
window.calculateSalePrice = () => {
    const p = parseInt(document.getElementById('productPrice').value) || 0;
    const d = parseInt(document.getElementById('discountRate').value) || 0;
    document.getElementById('finalPriceDisplay').innerText = Math.floor(p * (1 - d/100)).toLocaleString() + "원";
};
window.setFilter = (cat) => { currentFilter = cat; renderProducts(); };
window.uploadDescImages = (e) => {
    Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => { currentDescImages.push(ev.target.result); };
        reader.readAsDataURL(file);
    });
};

window.onload = () => { loadProductsFromServer(); };

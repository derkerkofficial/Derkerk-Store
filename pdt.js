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

// 상태 변수 (기존 기능 100% 유지)
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

// --- [서버 연동] 로드/저장/삭제 ---

async function loadProductsFromServer() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        products = [];
        querySnapshot.forEach((doc) => {
            products.push({ ...doc.data(), firebaseUrl: doc.id });
        });
        renderProducts();
        renderFilters(); 
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

async function deleteProduct(id) { 
    if(confirm("정말 서버에서 삭제하시겠습니까?")) {
        try {
            await deleteDoc(doc(db, "products", id));
            alert("삭제되었습니다.");
            await loadProductsFromServer();
        } catch (e) {
            alert("삭제 실패");
        }
    }
}

// --- [UI 렌더링] ---

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
        let stockSum = "";
        (p.colors || []).forEach(c => {
            let sInfo = Object.entries(c.stock).map(([s,v]) => `${s}:${v}`).join(', ');
            stockSum += `<span style="background:#333; padding:2px 6px; border-radius:4px; font-size:0.8rem; margin-right:4px;">${c.name}</span> [${sInfo}] `;
        });
        const salePrice = Math.floor((p.price || 0) * (1 - (p.discount || 0) / 100));
        list.innerHTML += `
            <div class="product-item">
                <div onclick="editProduct('${p.firebaseUrl}')" style="flex:1; cursor:pointer;">
                    <div style="font-weight:bold;">${p.name} - ${salePrice.toLocaleString()}원</div>
                    <div style="color:#888; font-size:0.85rem;">${stockSum}</div>
                </div>
                <button onclick="deleteProduct('${p.firebaseUrl}')" style="background:#444 !important; color:#fff !important; padding:5px 10px;">삭제</button>
            </div>`;
    });
}

function editProduct(id) {
    editingId = id; 
    const p = products.find(prod => prod.firebaseUrl === id);
    if (!p) return;
    
    document.getElementById('productName').value = p.name;
    document.getElementById('productPrice').value = p.price;
    document.getElementById('discountRate').value = p.discount;
    document.getElementById('productDesc').value = p.desc;
    calculateSalePrice();
    
    colors = JSON.parse(JSON.stringify(p.colors || [])); 
    currentDescImages = p.descImages ? [...p.descImages] : [];
    
    renderDescImageList();
    document.getElementById('editSection').style.display = 'block';
    document.getElementById('saveNameBtn').style.display = 'block';
    
    renderColors(); 
    document.querySelectorAll('input[name="prodCat"]').forEach(cb => cb.checked = (p.categories || []).includes(cb.value));
    document.querySelectorAll('input[name="prodHigh"]').forEach(cb => cb.checked = (p.highlights || []).includes(cb.value));
    
    checkNameInput(); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- [기능] 카테고리/색상/이미지 ---

function addCategory(){
    const val = document.getElementById('newCategoryInput').value.trim();
    if(!val || categories.includes(val)) return;
    categories.push(val); renderCategories(); renderFilters();
}

function renderCategories(){
    const list = document.getElementById('categoryList'), group = document.getElementById('categoryCheckboxGroup');
    if(!list || !group) return;
    list.innerHTML = ''; group.innerHTML = '';
    categories.forEach((c,i)=>{
        list.innerHTML += `<div class="item-wrapper"><span>${c}</span><button class="delete-x-btn" onclick="deleteCategory(${i})">✕</button></div>`;
        group.innerHTML += `<label><input type="checkbox" name="prodCat" value="${c}"> ${c}</label>`;
    });
}

function deleteCategory(i){ categories.splice(i,1); renderCategories(); renderFilters(); renderProducts(); }

function addHighlight() {
    const val = document.getElementById('newHighlightInput').value.trim();
    if(!val || highlights.includes(val)) return;
    highlights.push(val); renderHighlights();
}

function renderHighlights() {
    const list = document.getElementById('highlightList'), group = document.getElementById('highlightCheckboxGroup');
    if(!list || !group) return;
    list.innerHTML = ''; group.innerHTML = '';
    highlights.forEach((h, i) => {
        list.innerHTML += `<div class="item-wrapper"><span>${h}</span><button class="delete-x-btn" onclick="highlights.splice(${i},1); renderHighlights();">✕</button></div>`;
        group.innerHTML += `<label><input type="checkbox" name="prodHigh" value="${h}"> ${h}</label>`;
    });
}

function addColor() {
    const nameInput = document.getElementById('colorInput');
    const name = nameInput.value.trim();
    if (!name || colors.find(c => c.name === name)) return;
    colors.push({ name: name, sizeType: 'standard', stock: {S:0,M:0,L:0,XL:0}, images: [] });
    nameInput.value = ''; renderColors();
}

function renderColors() {
    const list = document.getElementById('colorList'); if(!list) return;
    list.innerHTML = '';
    colors.forEach((c) => {
        const active = currentColor === c.name ? 'active' : '';
        list.innerHTML += `<div class="item-wrapper ${active}" onclick="selectColor('${c.name}')"><span>${c.name}</span><button class="delete-x-btn" onclick="event.stopPropagation(); deleteColor('${c.name}')">✕</button></div>`;
    });
}

function selectColor(name) {
    currentColor = name; renderColors(); 
    const colorData = colors.find(c => c.name === name);
    if(!colorData) return;
    document.getElementById('variantEditor').style.display = 'block';
    document.getElementById('sizeType').value = colorData.sizeType;
    changeSizeType(false); renderImages();
}

function deleteColor(name) {
    colors = colors.filter(c => c.name !== name);
    if(currentColor === name) { currentColor = null; document.getElementById('variantEditor').style.display = 'none'; }
    renderColors();
}

function changeSizeType(forceClear) {
    if(!currentColor) return;
    const colorData = colors.find(c => c.name === currentColor);
    const type = document.getElementById('sizeType').value;
    colorData.sizeType = type;
    const customArea = document.getElementById('customSizeControls');
    if (type === 'custom') {
        customArea.style.display = 'flex';
        if(forceClear) colorData.stock = {};
    } else {
        customArea.style.display = 'none';
        if(forceClear) {
            const newStock = {};
            sizeOptions[type].forEach(s => newStock[s] = 0);
            colorData.stock = newStock;
        }
    }
    renderStockTable();
}

function renderStockTable() {
    const tbody = document.getElementById('stockTable'); if(!tbody) return;
    tbody.innerHTML = '';
    const colorData = colors.find(c => c.name === currentColor);
    if(!colorData) return;
    Object.keys(colorData.stock).forEach(size => {
        tbody.innerHTML += `<tr><td>${size}</td><td><input type="number" class="stock-input" value="${colorData.stock[size]}" oninput="updateStock('${size}', this.value)"></td><td><button class="delete-x-btn" onclick="removeSizeItem('${size}')">✕</button></td></tr>`;
    });
}

function updateStock(size, val) {
    const colorData = colors.find(c => c.name === currentColor);
    if(colorData) colorData.stock[size] = Math.max(0, parseInt(val) || 0);
}

function removeSizeItem(size) {
    const colorData = colors.find(c => c.name === currentColor);
    if(colorData) { delete colorData.stock[size]; renderStockTable(); }
}

function addCustomSizeItem() {
    const colorData = colors.find(c => c.name === currentColor);
    const sInput = document.getElementById('customSizeName');
    const sName = sInput.value.trim();
    if(!sName || colorData.stock[sName] !== undefined) return;
    colorData.stock[sName] = 0; sInput.value = ''; renderStockTable();
}

function uploadImages(e) {
    const colorData = colors.find(c => c.name === currentColor);
    Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => { colorData.images.push(ev.target.result); renderImages(); };
        reader.readAsDataURL(file);
    });
}

function renderImages() {
    const list = document.getElementById('imageList'); if(!list) return;
    list.innerHTML = '';
    const colorData = colors.find(c => c.name === currentColor);
    if(!colorData) return;
    colorData.images.forEach((img, idx) => {
        list.innerHTML += `<div class="image-container"><img src="${img}" style="width:50px;height:50px;"><div class="delete-overlay" onclick="deleteImage(${idx})">삭제</div></div>`;
    });
}

function deleteImage(idx) {
    const colorData = colors.find(c => c.name === currentColor);
    colorData.images.splice(idx,1); renderImages();
}

function uploadDescImages(e) {
    Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => { currentDescImages.push(ev.target.result); renderDescImageList(); };
        reader.readAsDataURL(file);
    });
}

function renderDescImageList() {
    const list = document.getElementById('descImageList'); if(!list) return;
    list.innerHTML = '';
    currentDescImages.forEach((img, idx) => {
        list.innerHTML += `<div class="image-container"><img src="${img}" style="width:80px;height:100px;object-fit:cover;"><div class="delete-overlay" onclick="currentDescImages.splice(${idx},1); renderDescImageList();">삭제</div></div>`;
    });
}

// --- [보조 기능] 가격/필터/리셋 ---

function checkNameInput() {
    const nameVal = document.getElementById('productName').value.trim();
    const dynamicArea = document.getElementById('dynamicDetails');
    if (nameVal.length > 0 || editingId !== null) {
        dynamicArea.style.maxHeight = "2000px"; dynamicArea.style.opacity = "1";
        dynamicArea.style.pointerEvents = "auto";
    } else {
        dynamicArea.style.maxHeight = "0"; dynamicArea.style.opacity = "0";
    }
}

function calculateSalePrice() {
    const price = parseInt(document.getElementById('productPrice').value) || 0;
    const discount = parseInt(document.getElementById('discountRate').value) || 0;
    const final = Math.floor(price * (1 - discount / 100));
    document.getElementById('finalPriceDisplay').innerText = final.toLocaleString() + "원";
}

function renderFilters() {
    const area = document.getElementById('filterArea'); if(!area) return;
    area.innerHTML = `<button class="filter-btn ${currentFilter === 'All' ? 'active' : ''}" onclick="setFilter('All')">All</button>`;
    categories.forEach(c => area.innerHTML += `<button class="filter-btn ${currentFilter === c ? 'active' : ''}" onclick="setFilter('${c}')">${c}</button>`);
}

function setFilter(cat) { currentFilter = cat; renderFilters(); renderProducts(); }

function resetForm() {
    editingId = null; colors = []; currentDescImages = [];
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('discountRate').value = '';
    document.getElementById('productDesc').value = '';
    document.getElementById('finalPriceDisplay').innerText = '0원';
    document.getElementById('descImageList').innerHTML = '';
    document.querySelectorAll('input[name="prodCat"]').forEach(cb => cb.checked = false);
    document.getElementById('editSection').style.display = 'none';
    document.getElementById('saveNameBtn').style.display = 'none';
    checkNameInput();
}

// --- [최중요] 태블릿/HTML 연동 (window 등록) ---

window.handleSaveWithDuplicateCheck = async () => {
    if (!document.getElementById('productName').value.trim()) { alert("상품명을 입력하세요."); return; }
    await saveProduct();
};
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.addCategory = addCategory;
window.deleteCategory = deleteCategory;
window.addHighlight = addHighlight;
window.addColor = addColor;
window.selectColor = selectColor;
window.deleteColor = deleteColor;
window.changeSizeType = changeSizeType;
window.addCustomSizeItem = addCustomSizeItem;
window.uploadImages = uploadImages;
window.deleteImage = deleteImage;
window.uploadDescImages = uploadDescImages;
window.removeSizeItem = removeSizeItem;
window.updateStock = updateStock;
window.setFilter = setFilter;
window.checkNameInput = checkNameInput;
window.calculateSalePrice = calculateSalePrice;
window.limitValues = (el) => { if (el.value < 0) el.value = 0; };

window.onload = () => { loadProductsFromServer(); };

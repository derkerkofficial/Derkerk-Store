/**
 * admin.js - Derkerk Admin Logic (최종 수정 버전)
 */

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

// --- [수정] 상품명 입력 감지 로직 ---
function checkNameInput() {
    const nameVal = document.getElementById('productName').value.trim();
    const dynamicArea = document.getElementById('dynamicDetails');
    if (!dynamicArea) return;

    if (nameVal.length > 0 || editingId !== null) {
        dynamicArea.style.maxHeight = "2000px"; 
        dynamicArea.style.opacity = "1";
        dynamicArea.style.pointerEvents = "auto";
        dynamicArea.style.marginTop = "20px";
    } else {
        dynamicArea.style.maxHeight = "0";
        dynamicArea.style.opacity = "0";
        dynamicArea.style.pointerEvents = "none";
        dynamicArea.style.marginTop = "0";
    }
}

// --- 공통 기능 ---
function limitValues(el) {
    if (el.value < 0) el.value = 0;
    if (el.id === 'discountRate' && el.value > 100) el.value = 100;
}

function calculateSalePrice() {
    const price = parseInt(document.getElementById('productPrice').value) || 0;
    const discount = parseInt(document.getElementById('discountRate').value) || 0;
    const final = Math.floor(price * (1 - discount / 100));
    document.getElementById('finalPriceDisplay').innerText = final.toLocaleString() + "원";
}

function handleSaveWithDuplicateCheck() {
    const nameInput = document.getElementById('productName');
    const newName = nameInput.value.trim();
    if (!newName) { alert("상품명을 입력해주세요."); return; }
    const isDuplicate = products.some(p => {
        if (editingId !== null && p.id === editingId) return false; 
        return p.name === newName;
    });
    if (isDuplicate) { alert("이미 존재하는 상품명입니다."); nameInput.focus(); return; }
    saveProduct();
}

function saveProduct() {
    const name = document.getElementById('productName').value.trim();
    const price = parseInt(document.getElementById('productPrice').value) || 0;
    const discount = parseInt(document.getElementById('discountRate').value) || 0;
    const desc = document.getElementById('productDesc').value.trim();
    const checkedCats = Array.from(document.querySelectorAll('input[name="prodCat"]:checked')).map(cb => cb.value);
    const checkedHighs = Array.from(document.querySelectorAll('input[name="prodHigh"]:checked')).map(cb => cb.value);
    
    const productData = { 
        id: editingId !== null ? editingId : Date.now(), 
        name, price, discount, desc, 
        categories: checkedCats, 
        highlights: checkedHighs, 
        descImages: [...currentDescImages], 
        colors: JSON.parse(JSON.stringify(colors)) 
    };
    
    if (editingId !== null) {
        const idx = products.findIndex(p => p.id === editingId);
        if (idx !== -1) products[idx] = productData;
    } else {
        products.push(productData);
    }
    
    resetForm(); 
    renderProducts();
    alert("저장되었습니다.");
}

// --- [수정] 리스트 출력 (화면 흔들림 방지 위해 높이 유지) ---
function renderProducts() {
    const list = document.getElementById('productList'); 
    if(!list) return;
    list.innerHTML = '';
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    const filtered = products.filter(p => {
        const matchCategory = currentFilter === 'All' || p.categories.includes(currentFilter);
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
            <div class="product-item" style="cursor:pointer;">
                <div onclick="editProduct(${p.id})" style="flex:1;">
                    <div style="font-weight:bold;">${p.name} - ${salePrice.toLocaleString()}원</div>
                    <div style="color:#888; font-size:0.85rem;">${stockSum}</div>
                </div>
                <button onclick="deleteProduct(${p.id})" style="background:#444 !important; color:#fff !important; padding:5px 10px;">삭제</button>
            </div>`;
    });
}

function editProduct(id) {
    editingId = id; 
    const p = products.find(prod => prod.id === id);
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
    document.querySelectorAll('input[name="prodCat"]').forEach(cb => cb.checked = p.categories.includes(cb.value));
    document.querySelectorAll('input[name="prodHigh"]').forEach(cb => cb.checked = (p.highlights || []).includes(cb.value));
    
    checkNameInput(); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
    editingId = null; colors = []; currentColor = null; currentDescImages = [];
    document.getElementById('productName').value = ''; 
    document.getElementById('productPrice').value = '';
    document.getElementById('discountRate').value = ''; 
    document.getElementById('productDesc').value = ''; 
    document.getElementById('finalPriceDisplay').innerText = '0원';
    document.getElementById('descImageList').innerHTML = '';
    document.querySelectorAll('input[name="prodCat"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[name="prodHigh"]').forEach(cb => cb.checked = false);
    document.getElementById('editSection').style.display = 'none';
    document.getElementById('saveNameBtn').style.display = 'none';
    document.getElementById('variantEditor').style.display = 'none';
    renderColors(); 
    checkNameInput(); 
}

// --- [수정] 색상 관리 (정렬 보정) ---
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
        list.innerHTML += `<div class="item-wrapper ${active}" draggable="true" data-name="${c.name}" onclick="selectColor('${c.name}')"><span>${c.name}</span><button class="delete-x-btn" onclick="event.stopPropagation(); deleteColor('${c.name}')">✕</button></div>`;
    });
    list.removeEventListener('dragend', updateColorOrder);
    list.addEventListener('dragend', updateColorOrder);
}

function updateColorOrder() {
    const currentItems = Array.from(document.querySelectorAll('#colorList .item-wrapper'));
    colors = currentItems.map(item => colors.find(c => c.name === item.getAttribute('data-name')));
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

// --- [수정] 재고 관리 (포커스 시 자동 선택 기능 추가) ---
function changeSizeType(forceClear) {
    if(!currentColor) return;
    const colorData = colors.find(c => c.name === currentColor);
    const type = document.getElementById('sizeType').value;
    colorData.sizeType = type;
    const customArea = document.getElementById('customSizeControls');
    if (type === 'custom') {
        customArea.style.display = 'flex'; // flex로 변경하여 간격 조정
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
    Object.keys(colorData.stock).forEach(size => {
        tbody.innerHTML += `<tr><td>${size}</td><td><input type="number" class="stock-input" min="0" value="${colorData.stock[size]}" oninput="updateStock('${size}', this.value)" onfocus="this.select()"></td><td><button class="delete-x-btn" onclick="removeSizeItem('${size}')">✕</button></td></tr>`;
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
    colorData.stock[sName] = 0; 
    sInput.value = ''; renderStockTable();
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
    colorData.images.forEach((img, idx) => {
        list.innerHTML += `<div class="image-container"><img src="${img}" style="width:50px;height:50px;"><div class="delete-overlay" onclick="deleteImage(${idx})">삭제</div></div>`;
    });
}

function deleteImage(idx) {
    const colorData = colors.find(c => c.name === currentColor);
    colorData.images.splice(idx,1); renderImages();
}

// --- 카테고리/필터 유지 ---
function markChanged() { document.getElementById('saveNameBtn').style.display = 'block'; }
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
        list.innerHTML += `<div class="item-wrapper" draggable="true"><span>${c}</span><button class="delete-x-btn" onclick="deleteCategory(${i})">✕</button></div>`;
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
        list.innerHTML += `<div class="item-wrapper" draggable="true"><span>${h}</span><button class="delete-x-btn" onclick="highlights.splice(${i},1); renderHighlights();">✕</button></div>`;
        group.innerHTML += `<label><input type="checkbox" name="prodHigh" value="${h}"> ${h}</label>`;
    });
}
function renderFilters() {
    const area = document.getElementById('filterArea'); if(!area) return;
    area.innerHTML = `<button class="filter-btn ${currentFilter === 'All' ? 'active' : ''}" onclick="setFilter('All')">All</button>`;
    categories.forEach(c => area.innerHTML += `<button class="filter-btn ${currentFilter === c ? 'active' : ''}" onclick="setFilter('${c}')">${c}</button>`);
}
function setFilter(cat) { currentFilter = cat; renderFilters(); renderProducts(); }
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
function deleteProduct(id) { 
    if(confirm("정말 삭제하시겠습니까?")) { products = products.filter(p => p.id !== id); renderProducts(); }
}

window.onload = () => { renderFilters(); renderCategories(); renderHighlights(); };

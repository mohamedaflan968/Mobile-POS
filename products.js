const ProductsManager = {
    initialized: false,

    init() {
        console.log('ProductsManager init called');
        
        this.loadProducts();
        this.renderProductsTable();
        this.setupEventListeners();
        this.populateCategoryFilter();
        this.initialized = true;
        
        console.log('ProductsManager initialized');
    },

    loadProducts() {
        App.products = JSON.parse(localStorage.getItem('pos_app_products') || '[]');
        if (App.products.length === 0) {
            App.products = App.getDefaultProducts();
            App.saveProducts();
        }
        console.log('Products loaded:', App.products.length);
    },

    renderProductsTable(searchTerm = '', category = '') {
        const tbody = document.getElementById('products-body');
        if (!tbody) return;
        
        let filteredProducts = App.products;
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredProducts = filteredProducts.filter(p => 
                p.name.toLowerCase().includes(term) || 
                p.barcode.toLowerCase().includes(term)
            );
        }
        
        if (category) {
            filteredProducts = filteredProducts.filter(p => p.category === category);
        }
        
        if (filteredProducts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted py-4">
                        <i class="fas fa-box-open fa-3x mb-3"></i>
                        <p>No products found</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = filteredProducts.map(product => `
            <tr>
                <td>
                    ${product.image ? 
                        `<img src="${product.image}" class="product-image">` : 
                        `<div class="product-image bg-secondary d-flex align-items-center justify-content-center text-white"><i class="fas fa-box"></i></div>`}
                </td>
                <td><code>${product.barcode}</code></td>
                <td>${product.name}</td>
                <td><span class="badge bg-info">${product.category}</span></td>
                <td>Rs.${product.price.toFixed(2)}</td>
                <td><span class="${product.stock <= 10 ? 'text-danger' : ''}">${product.stock}</span></td>
                <td>${product.discount}%</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-warning" onclick="ProductsManager.editProduct(${product.id})" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger" onclick="ProductsManager.deleteProduct(${product.id})" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    renderModalProducts(searchTerm = '') {
        const tbody = document.getElementById('modal-products-body');
        if (!tbody) return;
        
        let filteredProducts = App.products;
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredProducts = filteredProducts.filter(p => 
                p.name.toLowerCase().includes(term) || 
                p.barcode.toLowerCase().includes(term)
            );
        }
        
        tbody.innerHTML = filteredProducts.map(product => `
            <tr>
                <td>
                    ${product.image ? 
                        `<img src="${product.image}" class="product-image">` : 
                        `<div class="product-image bg-secondary d-flex align-items-center justify-content-center text-white"><i class="fas fa-box"></i></div>`}
                </td>
                <td>${product.name}</td>
                <td>Rs.${product.price.toFixed(2)}</td>
                <td>${product.stock}</td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="ProductsManager.addProductToBill(${product.id})">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </td>
            </tr>
        `).join('');
    },

    populateCategoryFilter() {
        const categoryFilter = document.getElementById('category-filter');
        if (!categoryFilter) return;
        
        const categories = [...new Set(App.products.map(p => p.category))];
        
        categoryFilter.innerHTML = '<option value="">All Categories</option>' + 
            categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    },

    addProduct() {
        const barcode = document.getElementById('new-barcode').value.trim();
        const name = document.getElementById('new-name').value.trim();
        const category = document.getElementById('new-category').value;
        const price = parseFloat(document.getElementById('new-price').value);
        const stock = parseInt(document.getElementById('new-stock').value) || 0;
        const discount = parseFloat(document.getElementById('new-discount').value) || 0;
        const image = document.getElementById('new-image-data').value;
        const description = document.getElementById('new-description').value.trim();
        
        if (!barcode || !name || isNaN(price)) {
            App.showToast('Please fill all required fields!', 'error');
            return;
        }
        
        const existingProduct = App.products.find(p => p.barcode === barcode);
        if (existingProduct) {
            App.showToast('Product with this barcode already exists!', 'error');
            return;
        }
        
        const product = { barcode, name, category, price, stock, discount, image, description };
        
        App.addProduct(product);
        this.renderProductsTable();
        this.populateCategoryFilter();
        
        bootstrap.Modal.getInstance(document.getElementById('add-product-modal')).hide();
        this.resetAddProductForm();
    },

    resetAddProductForm() {
        document.getElementById('add-product-form').reset();
        document.getElementById('new-image-data').value = '';
    },

    editProduct(id) {
        const product = App.products.find(p => p.id === id);
        if (!product) return;
        
        document.getElementById('edit-product-id').value = product.id;
        document.getElementById('edit-barcode').value = product.barcode;
        document.getElementById('edit-name').value = product.name;
        document.getElementById('edit-category').value = product.category;
        document.getElementById('edit-price').value = product.price;
        document.getElementById('edit-stock').value = product.stock;
        document.getElementById('edit-discount').value = product.discount;
        document.getElementById('edit-description').value = product.description || '';
        
        const preview = document.getElementById('current-image-preview');
        if (preview) {
            preview.innerHTML = product.image ? `<img src="${product.image}" class="product-image-large">` : '';
        }
        
        new bootstrap.Modal(document.getElementById('edit-product-modal')).show();
    },

    updateProduct() {
        const id = parseInt(document.getElementById('edit-product-id').value);
        const barcode = document.getElementById('edit-barcode').value.trim();
        const name = document.getElementById('edit-name').value.trim();
        const category = document.getElementById('edit-category').value;
        const price = parseFloat(document.getElementById('edit-price').value);
        const stock = parseInt(document.getElementById('edit-stock').value) || 0;
        const discount = parseFloat(document.getElementById('edit-discount').value) || 0;
        const image = document.getElementById('edit-image-data').value || App.products.find(p => p.id === id)?.image || '';
        const description = document.getElementById('edit-description').value.trim();
        
        if (!barcode || !name || isNaN(price)) {
            App.showToast('Please fill all required fields!', 'error');
            return;
        }
        
        const existingProduct = App.products.find(p => p.barcode === barcode && p.id !== id);
        if (existingProduct) {
            App.showToast('Product with this barcode already exists!', 'error');
            return;
        }
        
        const updatedProduct = { barcode, name, category, price, stock, discount, image, description };
        
        App.updateProduct(id, updatedProduct);
        this.renderProductsTable();
        this.populateCategoryFilter();
        
        bootstrap.Modal.getInstance(document.getElementById('edit-product-modal')).hide();
    },

    deleteProduct(id) {
        if (confirm('Are you sure you want to delete this product?')) {
            App.deleteProduct(id);
            this.renderProductsTable();
            this.populateCategoryFilter();
        }
    },

    addProductToBill(id) {
        const product = App.products.find(p => p.id === id);
        if (!product) return;
        
        App.addToBill(product);
        bootstrap.Modal.getInstance(document.getElementById('product-select-modal')).hide();
    },

    handleImageUpload(input, outputId) {
        const file = input.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById(outputId).value = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    setupEventListeners() {
        const productSearch = document.getElementById('product-search');
        if (productSearch && !productSearch.hasAttribute('data-listener')) {
            productSearch.setAttribute('data-listener', 'true');
            productSearch.addEventListener('input', (e) => {
                const category = document.getElementById('category-filter').value;
                this.renderProductsTable(e.target.value, category);
            });
        }
        
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter && !categoryFilter.hasAttribute('data-listener')) {
            categoryFilter.setAttribute('data-listener', 'true');
            categoryFilter.addEventListener('change', (e) => {
                const search = document.getElementById('product-search').value;
                this.renderProductsTable(search, e.target.value);
            });
        }
        
        const saveProductBtn = document.getElementById('save-product');
        if (saveProductBtn && !saveProductBtn.hasAttribute('data-listener')) {
            saveProductBtn.setAttribute('data-listener', 'true');
            saveProductBtn.addEventListener('click', () => this.addProduct());
        }
        
        const updateProductBtn = document.getElementById('update-product');
        if (updateProductBtn && !updateProductBtn.hasAttribute('data-listener')) {
            updateProductBtn.setAttribute('data-listener', 'true');
            updateProductBtn.addEventListener('click', () => this.updateProduct());
        }
        
        const newImageInput = document.getElementById('new-image');
        if (newImageInput && !newImageInput.hasAttribute('data-listener')) {
            newImageInput.setAttribute('data-listener', 'true');
            newImageInput.addEventListener('change', (e) => {
                this.handleImageUpload(e.target, 'new-image-data');
            });
        }
        
        const editImageInput = document.getElementById('edit-image');
        if (editImageInput && !editImageInput.hasAttribute('data-listener')) {
            editImageInput.setAttribute('data-listener', 'true');
            editImageInput.addEventListener('change', (e) => {
                this.handleImageUpload(e.target, 'edit-image-data');
            });
        }
        
        const modalProductSearch = document.getElementById('modal-product-search');
        if (modalProductSearch && !modalProductSearch.hasAttribute('data-listener')) {
            modalProductSearch.setAttribute('data-listener', 'true');
            modalProductSearch.addEventListener('input', (e) => {
                this.renderModalProducts(e.target.value);
            });
        }
        
        const productSelectModal = document.getElementById('product-select-modal');
        if (productSelectModal) {
            productSelectModal.addEventListener('shown.bs.modal', () => {
                this.renderModalProducts();
            });
        }
    }
};

if (typeof window !== 'undefined') {
    window.ProductsManager = ProductsManager;
}

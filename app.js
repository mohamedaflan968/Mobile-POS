const APP_KEY = 'pos_app_';

const App = {
    currentUser: null,
    billItems: [],
    products: [],
    shopDetails: {
        name: 'My POS Shop',
        address: '123 Main Street, City',
        phone: '+91 9876543210',
        email: 'shop@email.com'
    },
    defaultCredentials: {
        username: 'admin',
        password: 'admin123'
    },

    init() {
        console.log('App init started');
        this.loadShopDetails();
        this.loadProducts();
        
        const isLoginPage = document.getElementById('login-section');
        const isDashboard = document.getElementById('billing-section');
        
        this.setupEventListeners();
        this.initPWA();
        this.loadDarkModePreference();
        
        if (isLoginPage) {
            console.log('Login page detected, checking auth...');
            this.checkAuth();
        }
        
        if (isDashboard) {
            console.log('Dashboard detected, initializing...');
            setTimeout(() => this.initDashboard(), 100);
        }
    },

    initDashboard() {
        console.log('Dashboard initializing...');
        
        this.checkLoginStatus();
        
        if (typeof ProductsManager !== 'undefined') {
            console.log('Initializing ProductsManager...');
            ProductsManager.init();
        }
        
        if (typeof SalesManager !== 'undefined') {
            console.log('Initializing SalesManager...');
            SalesManager.init();
        }
        
        if (typeof BarcodeScanner !== 'undefined') {
            console.log('Initializing BarcodeScanner...');
            BarcodeScanner.init();
        }
        
        this.updateQuickStats();
        this.loadShopDetailsToForm();
        
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                console.log('Switching to section:', section);
                this.showSection(section);
            });
        });
        
        console.log('Dashboard initialized');
    },

    loadShopDetailsToForm() {
        console.log('Loading shop details to form...');
        const shopNameEl = document.getElementById('shop-name');
        if (!shopNameEl) {
            console.log('Settings form not found');
            return;
        }
        
        shopNameEl.value = this.shopDetails.name || '';
        document.getElementById('shop-address').value = this.shopDetails.address || '';
        document.getElementById('shop-phone').value = this.shopDetails.phone || '';
        document.getElementById('shop-email').value = this.shopDetails.email || '';
        
        const adminName = document.getElementById('admin-name');
        if (adminName) {
            adminName.textContent = this.currentUser || 'Admin';
        }
        
        console.log('Shop details loaded:', this.shopDetails);
    },

    checkAuth() {
        const isLoggedIn = localStorage.getItem(APP_KEY + 'isLoggedIn');
        if (isLoggedIn === 'true') {
            setTimeout(() => this.showSplash(), 500);
        } else {
            this.showLogin();
        }
    },

    showSplash() {
        const splash = document.getElementById('splash-screen');
        const loginSection = document.getElementById('login-section');
        
        setTimeout(() => {
            splash.classList.add('fade-out');
            setTimeout(() => {
                splash.style.display = 'none';
                loginSection.style.display = 'flex';
            }, 500);
        }, 2000);
    },

    showLogin() {
        const splash = document.getElementById('splash-screen');
        const loginSection = document.getElementById('login-section');
        
        setTimeout(() => {
            splash.classList.add('fade-out');
            setTimeout(() => {
                splash.style.display = 'none';
                loginSection.style.display = 'flex';
            }, 500);
        }, 1500);
    },

    login(username, password, remember) {
        const storedUser = localStorage.getItem(APP_KEY + 'username') || this.defaultCredentials.username;
        const storedPass = localStorage.getItem(APP_KEY + 'password') || this.defaultCredentials.password;
        
        if (username === storedUser && password === storedPass) {
            localStorage.setItem(APP_KEY + 'isLoggedIn', 'true');
            if (remember) {
                localStorage.setItem(APP_KEY + 'remember', 'true');
            }
            this.showToast('Login successful!', 'success');
            window.location.href = 'dashboard.html';
            return true;
        }
        return false;
    },

    logout() {
        localStorage.removeItem(APP_KEY + 'isLoggedIn');
        this.showToast('Logged out successfully!', 'info');
        window.location.href = 'index.html';
    },

    checkLoginStatus() {
        const isLoggedIn = localStorage.getItem(APP_KEY + 'isLoggedIn');
        if (isLoggedIn !== 'true') {
            window.location.href = 'index.html';
            return false;
        }
        this.currentUser = localStorage.getItem(APP_KEY + 'username') || 'Admin';
        console.log('User logged in:', this.currentUser);
        return true;
    },

    loadShopDetails() {
        const stored = localStorage.getItem(APP_KEY + 'shopDetails');
        if (stored) {
            this.shopDetails = JSON.parse(stored);
            console.log('Loaded shop details:', this.shopDetails);
        }
    },

    saveShopDetails() {
        this.shopDetails = {
            name: document.getElementById('shop-name').value,
            address: document.getElementById('shop-address').value,
            phone: document.getElementById('shop-phone').value,
            email: document.getElementById('shop-email').value
        };
        localStorage.setItem(APP_KEY + 'shopDetails', JSON.stringify(this.shopDetails));
        this.showToast('Shop details saved!', 'success');
        console.log('Saved shop details:', this.shopDetails);
    },

    changePassword(newPassword) {
        if (newPassword) {
            localStorage.setItem(APP_KEY + 'password', newPassword);
            this.showToast('Password changed successfully!', 'success');
        }
    },

    loadProducts() {
        const stored = localStorage.getItem(APP_KEY + 'products');
        if (stored) {
            this.products = JSON.parse(stored);
        } else {
            this.products = this.getDefaultProducts();
            this.saveProducts();
        }
    },

    getDefaultProducts() {
        return [
            { id: 1, barcode: '8901234567890', name: 'Coca Cola 500ml', category: 'Beverages', price: 45, stock: 100, discount: 0, image: '', description: 'Soft drink' },
            { id: 2, barcode: '8901234567891', name: 'Pepsi 500ml', category: 'Beverages', price: 45, stock: 100, discount: 0, image: '', description: 'Soft drink' },
            { id: 3, barcode: '8901234567892', name: 'Parle-G Biscuit', category: 'Food', price: 10, stock: 200, discount: 0, image: '', description: 'Biscuits' },
            { id: 4, barcode: '8901234567893', name: 'Maggi Noodles', category: 'Food', price: 20, stock: 150, discount: 5, image: '', description: 'Instant noodles' },
            { id: 5, barcode: '8901234567894', name: 'Amul Milk 1L', category: 'Beverages', price: 60, stock: 80, discount: 0, image: '', description: 'Dairy milk' },
            { id: 6, barcode: '8901234567895', name: 'Sunlight Soap', category: 'General', price: 25, stock: 100, discount: 0, image: '', description: 'Washing soap' },
            { id: 7, barcode: '8901234567896', name: 'Colgate Toothpaste', category: 'General', price: 85, stock: 50, discount: 10, image: '', description: 'Toothpaste' },
            { id: 8, barcode: '8901234567897', name: 'Head & Shoulders', category: 'General', price: 180, stock: 30, discount: 0, image: '', description: 'Shampoo' }
        ];
    },

    saveProducts() {
        localStorage.setItem(APP_KEY + 'products', JSON.stringify(this.products));
    },

    addProduct(product) {
        product.id = Date.now();
        this.products.push(product);
        this.saveProducts();
        this.showToast('Product added successfully!', 'success');
    },

    updateProduct(id, updatedProduct) {
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...updatedProduct };
            this.saveProducts();
            this.showToast('Product updated successfully!', 'success');
        }
    },

    deleteProduct(id) {
        this.products = this.products.filter(p => p.id !== id);
        this.saveProducts();
        this.showToast('Product deleted successfully!', 'success');
    },

    findProductByBarcode(barcode) {
        return this.products.find(p => p.barcode === barcode);
    },

    addToBill(product) {
        const existingItem = this.billItems.find(item => item.product.id === product.id);
        
        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.billItems.push({
                product: product,
                quantity: 1,
                discount: product.discount || 0
            });
        }
        
        this.renderBill();
        this.showToast(`${product.name} added to bill!`, 'success');
    },

    updateBillItemQuantity(index, quantity) {
        if (quantity <= 0) {
            this.removeFromBill(index);
        } else {
            this.billItems[index].quantity = quantity;
            this.renderBill();
        }
    },

    updateBillItemDiscount(index, discount) {
        this.billItems[index].discount = Math.max(0, Math.min(100, discount));
        this.renderBill();
    },

    removeFromBill(index) {
        const item = this.billItems[index];
        this.billItems.splice(index, 1);
        this.renderBill();
        this.showToast(`${item.product.name} removed from bill!`, 'info');
    },

    clearBill() {
        this.billItems = [];
        this.renderBill();
        this.showToast('Bill cleared!', 'info');
    },

    calculateBill() {
        let subtotal = 0;
        let totalDiscount = 0;
        
        this.billItems.forEach(item => {
            const itemTotal = item.product.price * item.quantity;
            const itemDiscount = itemTotal * (item.discount / 100);
            subtotal += itemTotal;
            totalDiscount += itemDiscount;
        });
        
        return {
            subtotal: subtotal,
            discount: totalDiscount,
            total: subtotal - totalDiscount
        };
    },

    renderBill() {
        const tbody = document.getElementById('bill-body');
        const emptyBill = document.getElementById('empty-bill');
        const itemCount = document.getElementById('item-count');
        
        if (!tbody || !emptyBill) return;
        
        if (this.billItems.length === 0) {
            tbody.innerHTML = '';
            emptyBill.style.display = 'block';
            itemCount.textContent = '0 items';
        } else {
            emptyBill.style.display = 'none';
            itemCount.textContent = `${this.billItems.length} items`;
            
            tbody.innerHTML = this.billItems.map((item, index) => {
                const itemTotal = (item.product.price * item.quantity) * (1 - item.discount / 100);
                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td>
                            <div class="d-flex align-items-center">
                                ${item.product.image ? `<img src="${item.product.image}" class="product-image me-2">` : '<i class="fas fa-box me-2"></i>'}
                                ${item.product.name}
                            </div>
                        </td>
                        <td>Rs.${item.product.price.toFixed(2)}</td>
                        <td>
                            <div class="qty-controls">
                                <button class="btn btn-sm btn-outline-secondary" onclick="App.updateBillItemQuantity(${index}, ${item.quantity - 1})">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <input type="number" class="form-control form-control-sm" style="width: 50px; text-align: center;" 
                                    value="${item.quantity}" min="1" 
                                    onchange="App.updateBillItemQuantity(${index}, parseInt(this.value))">
                                <button class="btn btn-sm btn-outline-secondary" onclick="App.updateBillItemQuantity(${index}, ${item.quantity + 1})">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </td>
                        <td>
                            <input type="number" class="form-control form-control-sm" style="width: 60px;" 
                                value="${item.discount}" min="0" max="100" 
                                onchange="App.updateBillItemDiscount(${index}, parseFloat(this.value))">
                        </td>
                        <td>Rs.${itemTotal.toFixed(2)}</td>
                        <td>
                            <button class="btn btn-sm btn-danger" onclick="App.removeFromBill(${index})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
        
        this.updateBillSummary();
        this.updateQuickStats();
    },

    updateBillSummary() {
        const bill = this.calculateBill();
        const subtotalEl = document.getElementById('subtotal');
        const discountEl = document.getElementById('total-discount');
        const totalEl = document.getElementById('grand-total');
        
        if (subtotalEl) subtotalEl.textContent = `Rs.${bill.subtotal.toFixed(2)}`;
        if (discountEl) discountEl.textContent = `Rs.${bill.discount.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `Rs.${bill.total.toFixed(2)}`;
    },

    calculateChange() {
        const amountReceived = parseFloat(document.getElementById('amount-received').value) || 0;
        const bill = this.calculateBill();
        const change = Math.max(0, amountReceived - bill.total);
        const changeEl = document.getElementById('change-return');
        if (changeEl) changeEl.value = `Rs.${change.toFixed(2)}`;
        return change;
    },

    finishPurchase() {
        if (this.billItems.length === 0) {
            this.showToast('Bill is empty!', 'error');
            return;
        }
        
        const bill = this.calculateBill();
        const paymentMethod = document.getElementById('payment-method').value;
        const amountReceived = parseFloat(document.getElementById('amount-received').value) || 0;
        
        if (amountReceived < bill.total) {
            this.showToast('Insufficient amount received!', 'error');
            return;
        }
        
        const sale = {
            id: Date.now(),
            billNo: this.generateBillNo(),
            date: new Date().toISOString(),
            items: this.billItems.map(item => ({
                productId: item.product.id,
                productName: item.product.name,
                price: item.product.price,
                quantity: item.quantity,
                discount: item.discount,
                total: (item.product.price * item.quantity) * (1 - item.discount / 100)
            })),
            subtotal: bill.subtotal,
            discount: bill.discount,
            total: bill.total,
            paymentMethod: paymentMethod,
            amountReceived: amountReceived,
            change: amountReceived - bill.total
        };
        
        this.saveSale(sale);
        this.updateProductStock();
        this.showBillPreview(sale);
        this.clearBill();
        document.getElementById('amount-received').value = '';
        document.getElementById('change-return').value = 'Rs.0.00';
    },

    generateBillNo() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `BILL${year}${month}${day}${random}`;
    },

    saveSale(sale) {
        const sales = JSON.parse(localStorage.getItem(APP_KEY + 'sales') || '[]');
        sales.push(sale);
        localStorage.setItem(APP_KEY + 'sales', JSON.stringify(sales));
        console.log('Sale saved:', sale.billNo);
    },

    updateProductStock() {
        this.billItems.forEach(item => {
            const product = this.products.find(p => p.id === item.product.id);
            if (product) {
                product.stock = Math.max(0, product.stock - item.quantity);
            }
        });
        this.saveProducts();
    },

    showBillPreview(sale) {
        const modal = new bootstrap.Modal(document.getElementById('bill-preview-modal'));
        const content = document.getElementById('bill-preview-content');
        
        const date = new Date(sale.date);
        const formattedDate = date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const formattedTime = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        content.innerHTML = `
            <div class="bill-header">
                <img src="assets/logo.svg" class="shop-logo">
                <div class="bill-title">${this.shopDetails.name}</div>
                <div>${this.shopDetails.address}</div>
                <div>Ph: ${this.shopDetails.phone}</div>
            </div>
            <div class="bill-info">
                <div><strong>Bill No:</strong> ${sale.billNo}</div>
                <div><strong>Date:</strong> ${formattedDate}</div>
                <div><strong>Time:</strong> ${formattedTime}</div>
            </div>
            <table>
                <tr class="item-row">
                    <td class="item-name"><strong>Item</strong></td>
                    <td style="text-align: right;"><strong>Qty</strong></td>
                    <td style="text-align: right;"><strong>Rate</strong></td>
                    <td style="text-align: right;"><strong>Amt</strong></td>
                </tr>
                ${sale.items.map(item => `
                    <tr class="item-row">
                        <td class="item-name">${item.productName}</td>
                        <td style="text-align: right;">${item.quantity}</td>
                        <td style="text-align: right;">${item.price.toFixed(2)}</td>
                        <td style="text-align: right;">${item.total.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </table>
            <div class="bill-total">
                <div style="display: flex; justify-content: space-between;">
                    <span>Subtotal:</span>
                    <span>Rs.${sale.subtotal.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Discount:</span>
                    <span>-Rs.${sale.discount.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 16px;">
                    <span><strong>TOTAL:</strong></span>
                    <span><strong>Rs.${sale.total.toFixed(2)}</strong></span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 5px;">
                    <span>Paid (${sale.paymentMethod}):</span>
                    <span>Rs.${sale.amountReceived.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Change:</span>
                    <span>Rs.${sale.change.toFixed(2)}</span>
                </div>
            </div>
            <div class="bill-footer">
                <div>Thank you for visiting!</div>
                <div>Please visit again</div>
                <div>Powered by Mobile POS</div>
            </div>
        `;
        
        modal.show();
    },

    printBill() {
        window.print();
    },

    updateQuickStats() {
        const today = new Date().toDateString();
        const sales = JSON.parse(localStorage.getItem(APP_KEY + 'sales') || '[]');
        const todaySales = sales.filter(s => new Date(s.date).toDateString() === today);
        
        const countEl = document.getElementById('today-sales-count');
        const amountEl = document.getElementById('today-sales-amount');
        
        if (countEl) countEl.textContent = todaySales.length;
        if (amountEl) amountEl.textContent = `Rs.${todaySales.reduce((sum, s) => sum + s.total, 0).toFixed(0)}`;
    },

    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone!')) {
            localStorage.clear();
            this.showToast('All data cleared!', 'success');
            setTimeout(() => window.location.reload(), 1000);
        }
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} fade-in`;
        toast.innerHTML = `<div class="toast-body"><i class="fas fa-${this.getToastIcon(type)}"></i> ${message}</div>`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    getToastIcon(type) {
        const icons = { success: 'check-circle', error: 'exclamation-circle', warning: 'exclamation-triangle', info: 'info-circle' };
        return icons[type] || 'info-circle';
    },

    toggleDarkMode() {
        const body = document.body;
        body.classList.toggle('dark-mode');
        body.classList.toggle('light-mode');
        
        const isDark = body.classList.contains('dark-mode');
        localStorage.setItem(APP_KEY + 'darkMode', isDark);
    },

    loadDarkModePreference() {
        const isDark = localStorage.getItem(APP_KEY + 'darkMode');
        if (isDark === null) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.toggle('dark-mode', isDark === 'true');
            document.body.classList.toggle('light-mode', isDark === 'false');
        }
    },

    initPWA() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .then(reg => console.log('Service Worker registered'))
                .catch(err => console.log('Service Worker registration failed:', err));
        }
    },

    setupEventListeners() {
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarBackdrop = document.getElementById('sidebar-backdrop');
        
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('show');
                if (sidebarBackdrop) {
                    sidebarBackdrop.classList.toggle('show');
                }
            });
            
            if (sidebarBackdrop) {
                sidebarBackdrop.addEventListener('click', () => {
                    sidebar.classList.remove('show');
                    sidebarBackdrop.classList.remove('show');
                });
            }
        }
        
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                const remember = document.getElementById('remember-me').checked;
                
                if (!this.login(username, password, remember)) {
                    this.showToast('Invalid credentials!', 'error');
                }
            });
        }
        
        const skipLoginBtn = document.getElementById('skip-login');
        if (skipLoginBtn) {
            skipLoginBtn.addEventListener('click', () => {
                localStorage.setItem(APP_KEY + 'isLoggedIn', 'true');
                window.location.href = 'dashboard.html';
            });
        }
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
        
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
        }
        
        const finishPurchaseBtn = document.getElementById('finish-purchase');
        if (finishPurchaseBtn) {
            finishPurchaseBtn.addEventListener('click', () => this.finishPurchase());
        }
        
        const clearBillBtn = document.getElementById('clear-bill');
        if (clearBillBtn) {
            clearBillBtn.addEventListener('click', () => this.clearBill());
        }
        
        const printBillBtn = document.getElementById('print-bill');
        if (printBillBtn) {
            printBillBtn.addEventListener('click', () => this.printBill());
        }
        
        const amountReceived = document.getElementById('amount-received');
        if (amountReceived) {
            amountReceived.addEventListener('input', () => this.calculateChange());
        }
        
        const addByBarcodeBtn = document.getElementById('add-by-barcode');
        if (addByBarcodeBtn) {
            addByBarcodeBtn.addEventListener('click', () => {
                if (typeof BarcodeScanner !== 'undefined') {
                    BarcodeScanner.handleManualEntry();
                } else {
                    this.handleBarcodeInput();
                }
            });
        }
        
        const barcodeInput = document.getElementById('barcode-input');
        if (barcodeInput) {
            barcodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    if (typeof BarcodeScanner !== 'undefined') {
                        BarcodeScanner.handleManualEntry();
                    } else {
                        this.handleBarcodeInput();
                    }
                }
            });
        }
        
        const saveShopDetailsBtn = document.getElementById('save-shop-details');
        if (saveShopDetailsBtn) {
            saveShopDetailsBtn.addEventListener('click', () => this.saveShopDetails());
        }
        
        const changePasswordBtn = document.getElementById('change-password');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                const newPassword = document.getElementById('admin-password').value;
                this.changePassword(newPassword);
                document.getElementById('admin-password').value = '';
            });
        }
        
        const clearAllDataBtn = document.getElementById('clear-all-data');
        if (clearAllDataBtn) {
            clearAllDataBtn.addEventListener('click', () => this.clearAllData());
        }
        
        const togglePassword = document.getElementById('toggle-password');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                const passwordInput = document.getElementById('password');
                const type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;
                togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
            });
        }
    },

    handleBarcodeInput() {
        const barcode = document.getElementById('barcode-input').value.trim();
        if (!barcode) {
            this.showToast('Please enter a barcode!', 'warning');
            return;
        }
        
        const product = this.findProductByBarcode(barcode);
        if (product) {
            this.addToBill(product);
            document.getElementById('barcode-input').value = '';
        } else {
            this.showToast('Product not found!', 'error');
        }
    },

    showSection(sectionName) {
        console.log('showSection called:', sectionName);
        
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'none';
        });
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const section = document.getElementById(`${sectionName}-section`);
        const navLink = document.querySelector(`[data-section="${sectionName}"]`);
        
        if (section) section.style.display = 'block';
        if (navLink) navLink.classList.add('active');
        
        if (sectionName === 'sales' && typeof SalesManager !== 'undefined') {
            console.log('Refreshing sales...');
            SalesManager.refresh();
        }
        
        if (sectionName === 'settings') {
            console.log('Loading settings...');
            this.loadShopDetailsToForm();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting App...');
    App.init();
});

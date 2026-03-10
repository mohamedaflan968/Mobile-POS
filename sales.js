const SalesManager = {
    sales: [],
    filteredSales: [],
    fromDate: null,
    toDate: null,
    initialized: false,

    init() {
        console.log('SalesManager init called');
        
        if (this.initialized) {
            console.log('Already initialized, refreshing...');
            this.refresh();
            return;
        }
        
        this.loadSales();
        this.setDefaultDates();
        this.renderSalesTable();
        this.updateStats();
        this.setupEventListeners();
        this.initialized = true;
        console.log('SalesManager initialized');
    },

    loadSales() {
        this.sales = JSON.parse(localStorage.getItem('pos_app_sales') || '[]');
        this.filteredSales = [...this.sales];
        console.log('Loaded sales:', this.sales.length);
    },

    setDefaultDates() {
        const fromEl = document.getElementById('sales-from-date');
        const toEl = document.getElementById('sales-to-date');
        
        if (!fromEl || !toEl) return;
        
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        
        fromEl.value = firstDay.toISOString().split('T')[0];
        toEl.value = today.toISOString().split('T')[0];
        
        this.fromDate = firstDay;
        this.toDate = today;
    },

    filterSales() {
        const fromDateVal = document.getElementById('sales-from-date').value;
        const toDateVal = document.getElementById('sales-to-date').value;
        
        if (!fromDateVal || !toDateVal) {
            App.showToast('Please select both dates!', 'error');
            return;
        }
        
        this.fromDate = new Date(fromDateVal);
        this.toDate = new Date(toDateVal);
        this.toDate.setHours(23, 59, 59, 999);
        
        this.filteredSales = this.sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= this.fromDate && saleDate <= this.toDate;
        });
        
        this.renderSalesTable();
        this.updateStats();
        App.showToast(`Found ${this.filteredSales.length} sales!`, 'success');
    },

    renderSalesTable() {
        const tbody = document.getElementById('sales-body');
        if (!tbody) {
            console.log('Sales table body not found');
            return;
        }
        
        if (this.filteredSales.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted py-4">
                        <i class="fas fa-chart-line fa-3x mb-3"></i>
                        <p>No sales found</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.filteredSales.map(sale => {
            const date = new Date(sale.date);
            const formattedDate = date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const formattedTime = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            
            const itemCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
            
            return `
                <tr>
                    <td>
                        <div>${formattedDate}</div>
                        <small class="text-muted">${formattedTime}</small>
                    </td>
                    <td><code>${sale.billNo}</code></td>
                    <td>${itemCount}</td>
                    <td>₹${sale.subtotal.toFixed(2)}</td>
                    <td class="text-success">₹${sale.discount.toFixed(2)}</td>
                    <td><strong>₹${sale.total.toFixed(2)}</strong></td>
                    <td>
                        <span class="badge bg-${this.getPaymentBadge(sale.paymentMethod)}">${sale.paymentMethod}</span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="SalesManager.viewSaleDetails(${sale.id})" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    getPaymentBadge(method) {
        const badges = { cash: 'success', card: 'primary', upi: 'warning' };
        return badges[method] || 'secondary';
    },

    updateStats() {
        const totalSales = this.filteredSales.reduce((sum, sale) => sum + sale.total, 0);
        const totalBills = this.filteredSales.length;
        const totalItems = this.filteredSales.reduce((sum, sale) => {
            return sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
        }, 0);
        
        const totalSalesEl = document.getElementById('total-sales-amount');
        const totalBillsEl = document.getElementById('total-bills-count');
        const totalItemsEl = document.getElementById('total-items-sold');
        
        if (totalSalesEl) totalSalesEl.textContent = `₹${totalSales.toFixed(2)}`;
        if (totalBillsEl) totalBillsEl.textContent = totalBills;
        if (totalItemsEl) totalItemsEl.textContent = totalItems;
        
        console.log('Stats updated - Sales:', totalSales, 'Bills:', totalBills, 'Items:', totalItems);
    },

    refresh() {
        console.log('SalesManager refresh called');
        this.loadSales();
        this.setDefaultDates();
        this.renderSalesTable();
        this.updateStats();
    },

    viewSaleDetails(saleId) {
        const sale = this.sales.find(s => s.id === saleId);
        if (!sale) return;
        
        const date = new Date(sale.date);
        const formattedDate = date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const formattedTime = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        let details = `
            <div class="text-center mb-3">
                <h5>${App.shopDetails.name}</h5>
                <small>${App.shopDetails.address}</small><br>
                <small>Ph: ${App.shopDetails.phone}</small>
            </div>
            <hr>
            <div class="d-flex justify-content-between mb-2"><strong>Bill No:</strong><span>${sale.billNo}</span></div>
            <div class="d-flex justify-content-between mb-2"><strong>Date:</strong><span>${formattedDate}</span></div>
            <div class="d-flex justify-content-between mb-3"><strong>Time:</strong><span>${formattedTime}</span></div>
            <table class="table table-sm">
                <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
                <tbody>
                    ${sale.items.map(item => `
                        <tr><td>${item.productName}</td><td>${item.quantity}</td><td>₹${item.price.toFixed(2)}</td><td>₹${item.total.toFixed(2)}</td></tr>
                    `).join('')}
                </tbody>
            </table>
            <hr>
            <div class="d-flex justify-content-between mb-1"><span>Subtotal:</span><span>₹${sale.subtotal.toFixed(2)}</span></div>
            <div class="d-flex justify-content-between mb-2 text-success"><span>Discount:</span><span>-₹${sale.discount.toFixed(2)}</span></div>
            <div class="d-flex justify-content-between mb-3"><strong>Total:</strong><strong>₹${sale.total.toFixed(2)}</strong></div>
            <div class="d-flex justify-content-between mb-1"><span>Payment:</span><span class="badge bg-${this.getPaymentBadge(sale.paymentMethod)}">${sale.paymentMethod}</span></div>
        `;
        
        document.getElementById('bill-preview-content').innerHTML = details;
        new bootstrap.Modal(document.getElementById('bill-preview-modal')).show();
    },

    exportSales() {
        if (this.filteredSales.length === 0) {
            App.showToast('No sales to export!', 'error');
            return;
        }
        
        let csv = 'Date,Bill No,Items,Subtotal,Discount,Total,Payment Method\n';
        
        this.filteredSales.forEach(sale => {
            const date = new Date(sale.date).toLocaleDateString('en-IN');
            const itemCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
            csv += `${date},${sale.billNo},${itemCount},${sale.subtotal.toFixed(2)},${sale.discount.toFixed(2)},${sale.total.toFixed(2)},${sale.paymentMethod}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales_report_${this.fromDate.toISOString().split('T')[0]}_${this.toDate.toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        App.showToast('Sales exported successfully!', 'success');
    },

    printSales() {
        if (this.filteredSales.length === 0) {
            App.showToast('No sales to print!', 'error');
            return;
        }
        
        const totalSales = this.filteredSales.reduce((sum, sale) => sum + sale.total, 0);
        const totalBills = this.filteredSales.length;
        const totalItems = this.filteredSales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
        
        let printContent = `
            <html><head><title>Sales Report</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .stats { display: flex; justify-content: space-around; margin-bottom: 20px; }
                .stat-box { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background: #f5f5f5; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
            </style>
            </head><body>
                <div class="header">
                    <h2>${App.shopDetails.name}</h2>
                    <p>Sales Report</p>
                    <p>${this.fromDate.toLocaleDateString('en-IN')} - ${this.toDate.toLocaleDateString('en-IN')}</p>
                </div>
                <div class="stats">
                    <div class="stat-box"><h3>₹${totalSales.toFixed(2)}</h3><p>Total Sales</p></div>
                    <div class="stat-box"><h3>${totalBills}</h3><p>Total Bills</p></div>
                    <div class="stat-box"><h3>${totalItems}</h3><p>Items Sold</p></div>
                </div>
                <table>
                    <thead><tr><th>Date</th><th>Bill No</th><th>Items</th><th class="text-right">Subtotal</th><th class="text-right">Discount</th><th class="text-right">Total</th><th>Payment</th></tr></thead>
                    <tbody>
        `;
        
        this.filteredSales.forEach(sale => {
            const date = new Date(sale.date).toLocaleDateString('en-IN');
            const itemCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
            printContent += `<tr><td>${date}</td><td>${sale.billNo}</td><td class="text-center">${itemCount}</td><td class="text-right">₹${sale.subtotal.toFixed(2)}</td><td class="text-right">₹${sale.discount.toFixed(2)}</td><td class="text-right">₹${sale.total.toFixed(2)}</td><td>${sale.paymentMethod}</td></tr>`;
        });
        
        printContent += `</tbody></table><script>window.print();<\/script></body></html>`;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
    },

    setupEventListeners() {
        const filterBtn = document.getElementById('filter-sales');
        if (filterBtn && !filterBtn.hasAttribute('data-listener')) {
            filterBtn.setAttribute('data-listener', 'true');
            filterBtn.addEventListener('click', () => this.filterSales());
        }
        
        const exportBtn = document.getElementById('export-sales');
        if (exportBtn && !exportBtn.hasAttribute('data-listener')) {
            exportBtn.setAttribute('data-listener', 'true');
            exportBtn.addEventListener('click', () => this.exportSales());
        }
        
        const printBtn = document.getElementById('print-sales');
        if (printBtn && !printBtn.hasAttribute('data-listener')) {
            printBtn.setAttribute('data-listener', 'true');
            printBtn.addEventListener('click', () => this.printSales());
        }
    }
};

if (typeof window !== 'undefined') {
    window.SalesManager = SalesManager;
}

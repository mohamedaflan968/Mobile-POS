const BarcodeScanner = {
    html5QrcodeScanner: null,
    isScanning: false,

    init() {
        if (!App.checkLoginStatus()) return;
        
        this.setupEventListeners();
    },

    setupEventListeners() {
        const startScannerBtn = document.getElementById('start-scanner');
        if (startScannerBtn) {
            startScannerBtn.addEventListener('click', () => this.startScanner());
        }
        
        const stopScannerBtn = document.getElementById('stop-scanner');
        if (stopScannerBtn) {
            stopScannerBtn.addEventListener('click', () => this.stopScanner());
        }
    },

    startScanner() {
        const scannerContainer = document.getElementById('scanner-container');
        const readerDiv = document.getElementById('reader');
        
        scannerContainer.style.display = 'block';
        
        if (!this.html5QrcodeScanner) {
            this.html5QrcodeScanner = new Html5Qrcode("reader");
        }
        
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };
        
        this.html5QrcodeScanner.start(
            { facingMode: "environment" },
            config,
            (decodedText, decodedResult) => {
                this.onScanSuccess(decodedText, decodedResult);
            },
            (errorMessage) => {
                // Ignore scan errors - they happen frequently when no QR is in frame
            }
        ).catch(err => {
            console.error('Error starting scanner:', err);
            App.showToast('Error starting camera. Please check permissions!', 'error');
            this.stopScanner();
        });
        
        this.isScanning = true;
        App.showToast('Scanner started! Point at barcode.', 'info');
    },

    stopScanner() {
        const scannerContainer = document.getElementById('scanner-container');
        
        if (this.html5QrcodeScanner && this.isScanning) {
            this.html5QrcodeScanner.stop().then(() => {
                this.isScanning = false;
                scannerContainer.style.display = 'none';
                App.showToast('Scanner stopped!', 'info');
            }).catch(err => {
                console.error('Error stopping scanner:', err);
            });
        }
    },

    onScanSuccess(decodedText, decodedResult) {
        this.stopScanner();
        
        const barcode = decodedText.trim();
        
        const product = App.findProductByBarcode(barcode);
        
        if (product) {
            App.addToBill(product);
            this.playBeep();
            App.showToast(`${product.name} added!`, 'success');
        } else {
            document.getElementById('barcode-input').value = barcode;
            App.showToast('Product not found! Enter barcode manually or add product.', 'warning');
        }
    },

    playBeep() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 1000;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            console.log('Audio not supported');
        }
    },

    simulateBarcode(barcode) {
        const product = App.findProductByBarcode(barcode);
        
        if (product) {
            App.addToBill(product);
            this.playBeep();
            App.showToast(`${product.name} added!`, 'success');
            return true;
        } else {
            App.showToast('Product not found!', 'error');
            return false;
        }
    }
};

if (typeof window !== 'undefined') {
    window.BarcodeScanner = BarcodeScanner;
}

document.addEventListener('DOMContentLoaded', () => {
    BarcodeScanner.init();
});

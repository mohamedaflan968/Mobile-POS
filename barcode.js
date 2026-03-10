const BarcodeScanner = {
    html5QrcodeScanner: null,
    isScanning: false,
    lastScannedCode: null,
    scanCooldown: 2000,

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

        const barcodeInput = document.getElementById('barcode-input');
        if (barcodeInput) {
            barcodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleManualEntry();
            });
            barcodeInput.addEventListener('input', () => {
                this.lastScannedCode = null;
            });
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
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0,
            formatsToSupport: [
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.CODE_93,
                Html5QrcodeSupportedFormats.CODABAR,
                Html5QrcodeSupportedFormats.ITF,
                Html5QrcodeSupportedFormats.DATA_MATRIX,
                Html5QrcodeSupportedFormats.PDF_417,
                Html5QrcodeSupportedFormats.AZTEC
            ]
        };
        
        this.html5QrcodeScanner.start(
            { facingMode: "environment" },
            config,
            (decodedText, decodedResult) => {
                this.onScanSuccess(decodedText, decodedResult);
            },
            (errorMessage) => {
                // Ignore scan errors - they happen frequently when no barcode is in frame
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
        const currentTime = Date.now();
        
        if (this.lastScannedCode === decodedText && (currentTime - this.lastScanTime) < this.scanCooldown) {
            return;
        }
        
        this.lastScannedCode = decodedText;
        this.lastScanTime = currentTime;
        
        this.stopScanner();
        
        const barcode = decodedText.trim();
        
        const product = App.findProductByBarcode(barcode);
        
        if (product) {
            App.addToBill(product);
            this.playBeep();
            this.highlightInput();
            App.showToast(`${product.name} added!`, 'success');
        } else {
            document.getElementById('barcode-input').value = barcode;
            App.showToast('Product not found! Add it to inventory first.', 'warning');
        }
    },

    handleManualEntry() {
        const barcode = document.getElementById('barcode-input').value.trim();
        if (!barcode) {
            App.showToast('Please enter a barcode!', 'warning');
            return;
        }
        
        const product = App.findProductByBarcode(barcode);
        
        if (product) {
            App.addToBill(product);
            this.playBeep();
            this.highlightInput();
            document.getElementById('barcode-input').value = '';
            App.showToast(`${product.name} added!`, 'success');
        } else {
            App.showToast('Product not found!', 'error');
        }
    },

    highlightInput() {
        const input = document.getElementById('barcode-input');
        if (input) {
            input.classList.add('bg-success', 'text-white');
            setTimeout(() => {
                input.classList.remove('bg-success', 'text-white');
            }, 300);
            setTimeout(() => {
                input.focus();
            }, 350);
        }
    },

    playBeep() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 1200;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
        } catch (e) {
            console.log('Audio not supported');
        }
    },

    playErrorBeep() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 400;
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            console.log('Audio not supported');
        }
    },

    simulateBarcode(barcode) {
        const product = App.findProductByBarcode(barcode);
        
        if (product) {
            App.addToBill(product);
            this.playBeep();
            this.highlightInput();
            App.showToast(`${product.name} added!`, 'success');
            return true;
        } else {
            this.playErrorBeep();
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

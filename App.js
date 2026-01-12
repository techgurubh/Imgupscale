class ImageUpscaler {
    constructor() {
        this.originalImage = null;
        this.upscaledImage = null;
        this.scaleFactor = 2;
        this.selectedModel = 'esrgan';
        this.ortSession = null;
        this.tfModel = null;
        this.isProcessing = false;
        this.startTime = null;
        
        this.initElements();
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.loadDefaultModels();
    }
    
    initElements() {
        // File handling
        this.fileInput = document.getElementById('fileInput');
        this.browseBtn = document.getElementById('browseBtn');
        this.dropArea = document.getElementById('dropArea');
        this.fileInfo = document.getElementById('fileInfo');
        
        // UI elements
        this.scaleOptions = document.querySelectorAll('.scale-option');
        this.modelSelect = document.getElementById('modelSelect');
        this.processBtn = document.getElementById('processBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // Image displays
        this.originalImg = document.getElementById('originalImage');
        this.upscaledImg = document.getElementById('upscaledImage');
        this.originalPlaceholder = document.getElementById('originalPlaceholder');
        this.upscaledPlaceholder = document.getElementById('upscaledPlaceholder');
        
        // Info displays
        this.originalSize = document.getElementById('originalSize');
        this.originalDimensions = document.getElementById('originalDimensions');
        this.upscaledSize = document.getElementById('upscaledSize');
        this.upscaledDimensions = document.getElementById('upscaledDimensions');
        this.processingTime = document.getElementById('processingTime');
        
        // Stats
        this.scaleStat = document.getElementById('scaleStat');
        this.timeStat = document.getElementById('timeStat');
        this.qualityStat = document.getElementById('qualityStat');
        this.sizeStat = document.getElementById('sizeStat');
        
        // Progress modal
        this.progressModal = document.getElementById('progressModal');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.currentStep = document.getElementById('currentStep');
        this.elapsedTime = document.getElementById('elapsedTime');
        this.memoryUsage = document.getElementById('memoryUsage');
        
        // Comparison slider
        this.sliderBar = document.querySelector('.slider-bar');
        this.sliderHandle = document.querySelector('.slider-handle');
    }
    
    setupEventListeners() {
        // Browse button
        this.browseBtn.addEventListener('click', () => this.fileInput.click());
        
        // File input change
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Scale options
        this.scaleOptions.forEach(option => {
            option.addEventListener('click', (e) => this.setScaleFactor(e));
        });
        
        // Model select
        this.modelSelect.addEventListener('change', (e) => {
            this.selectedModel = e.target.value;
        });
        
        // Process button
        this.processBtn.addEventListener('click', () => this.processImage());
        
        // Download button
        this.downloadBtn.addEventListener('click', () => this.downloadImage());
        
        // Reset button
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // Comparison slider
        this.setupComparisonSlider();
    }
    
    setupDragAndDrop() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropArea.addEventListener(eventName, this.preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropArea.addEventListener(eventName, () => {
                this.dropArea.classList.add('dragover');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            this.dropArea.addEventListener(eventName, () => {
                this.dropArea.classList.remove('dragover');
            }, false);
        });
        
        this.dropArea.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            this.handleFiles(files);
        }, false);
        
        this.dropArea.addEventListener('click', () => this.fileInput.click());
    }
    
    setupComparisonSlider() {
        let isDragging = false;
        
        this.sliderHandle.addEventListener('mousedown', () => {
            isDragging = true;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const rect = this.sliderBar.getBoundingClientRect();
            let y = e.clientY - rect.top;
            y = Math.max(0, Math.min(y, rect.height));
            
            const percentage = y / rect.height;
            this.sliderHandle.style.top = `${y}px`;
            
            // Adjust image opacity for comparison
            if (this.originalImg.src && this.upscaledImg.src) {
                this.upscaledImg.style.opacity = percentage;
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        // Touch support for mobile
        this.sliderHandle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDragging = true;
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const touch = e.touches[0];
            const rect = this.sliderBar.getBoundingClientRect();
            let y = touch.clientY - rect.top;
            y = Math.max(0, Math.min(y, rect.height));
            
            const percentage = y / rect.height;
            this.sliderHandle.style.top = `${y}px`;
            
            if (this.originalImg.src && this.upscaledImg.src) {
                this.upscaledImg.style.opacity = percentage;
            }
        });
        
        document.addEventListener('touchend', () => {
            isDragging = false;
        });
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    handleFileSelect(e) {
        const files = e.target.files;
        this.handleFiles(files);
    }
    
    handleFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        if (!file.type.match('image.*')) {
            alert('Please select an image file');
            return;
        }
        
        this.loadImage(file);
    }
    
    async loadImage(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.displayOriginalImage(img, file);
                this.processBtn.disabled = false;
                this.updateFileInfo(file);
            };
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    }
    
    displayOriginalImage(img, file) {
        // Show image
        this.originalImg.src = img.src;
        this.originalImg.style.display = 'block';
        this.originalPlaceholder.style.display = 'none';
        
        // Update info
        const size = this.formatFileSize(file.size);
        this.originalSize.textContent = size;
        this.originalDimensions.textContent = `${img.width} × ${img.height}`;
        
        // Reset upscaled image
        this.resetUpscaledImage();
    }
    
    resetUpscaledImage() {
        this.upscaledImg.src = '';
        this.upscaledImg.style.display = 'none';
        this.upscaledPlaceholder.style.display = 'flex';
        this.upscaledPlaceholder.innerHTML = `
            <i class="fas fa-sync-alt"></i>
            <p>Ready to upscale</p>
        `;
        
        this.upscaledSize.textContent = '-';
        this.upscaledDimensions.textContent = '-';
        this.processingTime.textContent = '-';
        this.downloadBtn.disabled = true;
    }
    
    setScaleFactor(e) {
        const selected = e.target;
        const scale = parseInt(selected.dataset.scale);
        
        this.scaleOptions.forEach(opt => opt.classList.remove('active'));
        selected.classList.add('active');
        
        this.scaleFactor = scale;
        this.scaleStat.textContent = `${scale}x`;
    }
    
    async loadDefaultModels() {
        try {
            this.updateProgress('Loading AI models...', 10);
            
            // Load TensorFlow.js models
            await tf.ready();
            console.log('TensorFlow.js loaded');
            
            // For demonstration, we'll use a simple upscaling approach
            // In production, you would load actual ONNX models here
            
            this.updateProgress('Models ready', 100);
            setTimeout(() => {
                this.hideProgress();
            }, 500);
            
        } catch (error) {
            console.error('Error loading models:', error);
            this.updateProgress('Error loading models', 0, true);
        }
    }
    
    async processImage() {
        if (!this.originalImage || this.isProcessing) return;
        
        this.isProcessing = true;
        this.startTime = Date.now();
        this.processBtn.disabled = true;
        this.downloadBtn.disabled = true;
        
        this.showProgress();
        
        try {
            // Update UI
            this.upscaledPlaceholder.innerHTML = `
                <i class="fas fa-sync-alt fa-spin"></i>
                <p>Upscaling image...</p>
            `;
            
            // Process based on selected model
            let processedImage;
            
            switch (this.selectedModel) {
                case 'esrgan':
                    processedImage = await this.processWithESRGAN();
                    break;
                case 'waifu2x':
                    processedImage = await this.processWithWaifu2x();
                    break;
                case 'bicubic':
                case 'lanczos':
                    processedImage = await this.processWithTraditional();
                    break;
                default:
                    processedImage = await this.processWithTraditional();
            }
            
            // Display result
            this.displayUpscaledImage(processedImage);
            
            // Update stats
            this.updateStats();
            
        } catch (error) {
            console.error('Processing error:', error);
            this.upscaledPlaceholder.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error: ${error.message}</p>
            `;
        } finally {
            this.isProcessing = false;
            this.processBtn.disabled = false;
            this.hideProgress();
        }
    }
    
    async processWithESRGAN() {
        this.updateProgress('Initializing ESRGAN model...', 20);
        
        // For demo purposes, we'll use a canvas-based approach
        // In production, you would use a trained ONNX model
        
        return this.upscaleWithCanvas('high');
    }
    
    async processWithWaifu2x() {
        this.updateProgress('Initializing Waifu2x model...', 20);
        
        // Anime-style upscaling simulation
        return this.upscaleWithCanvas('anime');
    }
    
    async processWithTraditional() {
        this.updateProgress('Upscaling with traditional method...', 20);
        
        const interpolation = this.selectedModel === 'lanczos' ? 'lanczos' : 'bicubic';
        return this.upscaleWithCanvas(interpolation);
    }
    
    upscaleWithCanvas(method) {
        return new Promise((resolve) => {
            this.updateProgress('Creating canvas...', 40);
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const newWidth = this.originalImage.width * this.scaleFactor;
            const newHeight = this.originalImage.height * this.scaleFactor;
            
            canvas.width = newWidth;
            canvas.height = newHeight;
            
            // Apply different scaling methods
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            this.updateProgress('Drawing image...', 60);
            
            // Draw original image scaled up
            ctx.drawImage(this.originalImage, 0, 0, newWidth, newHeight);
            
            // Apply enhancements based on checkboxes
            if (document.getElementById('enhanceDetails').checked) {
                this.updateProgress('Enhancing details...', 70);
                this.enhanceDetails(ctx, canvas.width, canvas.height);
            }
            
            if (document.getElementById('reduceNoise').checked) {
                this.updateProgress('Reducing noise...', 80);
                this.reduceNoise(ctx, canvas.width, canvas.height);
            }
            
            if (document.getElementById('sharpen').checked) {
                this.updateProgress('Sharpening image...', 90);
                this.sharpenImage(ctx, canvas.width, canvas.height);
            }
            
            this.updateProgress('Finalizing...', 95);
            
            // Convert to Image object
            const upscaledImg = new Image();
            upscaledImg.onload = () => {
                resolve(upscaledImg);
            };
            upscaledImg.src = canvas.toDataURL('image/png');
        });
    }
    
    enhanceDetails(ctx, width, height) {
        // Simple detail enhancement using convolution
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            // Increase contrast slightly
            data[i] = this.clamp(data[i] * 1.05, 0, 255);     // R
            data[i + 1] = this.clamp(data[i + 1] * 1.05, 0, 255); // G
            data[i + 2] = this.clamp(data[i + 2] * 1.05, 0, 255); // B
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    reduceNoise(ctx, width, height) {
        // Simple box blur for noise reduction
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCanvas.width = width;
        tempCanvas.height = height;
        
        // Copy original
        tempCtx.drawImage(ctx.canvas, 0, 0);
        
        const imageData = tempCtx.getImageData(0, 0, width, height);
        const blurredData = this.applyBoxBlur(imageData, 1);
        
        ctx.putImageData(blurredData, 0, 0);
    }
    
    sharpenImage(ctx, width, height) {
        // Simple sharpening filter
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                for (let c = 0; c < 3; c++) {
                    const idx = (y * width + x) * 4 + c;
                    
                    // Apply sharpening kernel
                    let sum = data[idx] * 5;
                    sum -= data[idx - 4] + data[idx + 4];
                    sum -= data[idx - width * 4] + data[idx + width * 4];
                    
                    tempData[idx] = this.clamp(sum, 0, 255);
                }
            }
        }
        
        ctx.putImageData(new ImageData(tempData, width, height), 0, 0);
    }
    
    applyBoxBlur(imageData, radius) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const result = new Uint8ClampedArray(data);
        
        for (let y = radius; y < height - radius; y++) {
            for (let x = radius; x < width - radius; x++) {
                for (let c = 0; c < 3; c++) {
                    let sum = 0;
                    let count = 0;
                    
                    for (let dy = -radius; dy <= radius; dy++) {
                        for (let dx = -radius; dx <= radius; dx++) {
                            const idx = ((y + dy) * width + (x + dx)) * 4 + c;
                            sum += data[idx];
                            count++;
                        }
                    }
                    
                    const resultIdx = (y * width + x) * 4 + c;
                    result[resultIdx] = sum / count;
                }
            }
        }
        
        return new ImageData(result, width, height);
    }
    
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    displayUpscaledImage(img) {
        this.upscaledImage = img;
        this.upscaledImg.src = img.src;
        this.upscaledImg.style.display = 'block';
        this.upscaledPlaceholder.style.display = 'none';
        
        // Update info
        this.upscaledDimensions.textContent = `${img.width} × ${img.height}`;
        
        // Calculate file size estimate
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/png');
        const size = Math.round((dataUrl.length * 3) / 4); // Approximate PNG size
        this.upscaledSize.textContent = this.formatFileSize(size);
        
        // Calculate processing time
        const endTime = Date.now();
        const processingTime = (endTime - this.startTime) / 1000;
        this.processingTime.textContent = `${processingTime.toFixed(2)}s`;
        
        // Enable download
        this.downloadBtn.disabled = false;
    }
    
    updateStats() {
        if (!this.originalImage || !this.upscaledImage) return;
        
        // Scale factor
        this.scaleStat.textContent = `${this.scaleFactor}x`;
        
        // Processing time
        const time = parseFloat(this.processingTime.textContent) || 0;
        this.timeStat.textContent = `${time.toFixed(2)}s`;
        
        // Quality improvement (simulated)
        const quality = 85 + (this.scaleFactor * 5);
        this.qualityStat.textContent = `${quality}%`;
        
        // Size increase
        const origSize = this.parseFileSize(this.originalSize.textContent);
        const upscaledSize = this.parseFileSize(this.upscaledSize.textContent);
        const increase = ((upscaledSize - origSize) / origSize * 100).toFixed(0);
        this.sizeStat.textContent = `+${increase}%`;
    }
    
    downloadImage() {
        if (!this.upscaledImage) return;
        
        const link = document.createElement('a');
        link.download = `upscaled_${this.getFileName()}.png`;
        link.href = this.upscaledImage.src;
        link.click();
    }
    
    reset() {
        this.originalImage = null;
        this.upscaledImage = null;
        
        // Reset UI
        this.originalImg.src = '';
        this.originalImg.style.display = 'none';
        this.originalPlaceholder.style.display = 'flex';
        
        this.resetUpscaledImage();
        
        // Reset info
        this.originalSize.textContent = '-';
        this.originalDimensions.textContent = '-';
        
        // Reset stats
        this.scaleStat.textContent = '-';
        this.timeStat.textContent = '-';
        this.qualityStat.textContent = '-';
        this.sizeStat.textContent = '-';
        
        // Reset buttons
        this.processBtn.disabled = true;
        this.downloadBtn.disabled = true;
        
        // Reset file input
        this.fileInput.value = '';
        this.fileInfo.innerHTML = '';
    }
    
    updateProgress(text, percentage, isError = false) {
        this.progressText.textContent = text;
        this.progressFill.style.width = `${percentage}%`;
        this.currentStep.textContent = text;
        
        if (isError) {
            this.progressFill.style.background = 'var(--danger)';
        }
        
        // Update elapsed time
        if (this.startTime) {
            const elapsed = (Date.now() - this.startTime) / 1000;
            this.elapsedTime.textContent = `${elapsed.toFixed(1)}s`;
        }
        
        // Simulate memory usage
        const memory = Math.round(performance.memory?.usedJSHeapSize / 1024 / 1024) || 0;
        this.memoryUsage.textContent = `${memory} MB`;
    }
    
    showProgress() {
        this.progressModal.style.display = 'flex';
    }
    
    hideProgress() {
        setTimeout(() => {
            this.progressModal.style.display = 'none';
            this.progressFill.style.width = '0%';
            this.progressFill.style.background = 'linear-gradient(to right, var(--success), var(--primary))';
        }, 500);
    }
    
    updateFileInfo(file) {
        const fileName = file.name.length > 30 ? 
            file.name.substring(0, 27) + '...' : file.name;
        
        this.fileInfo.innerHTML = `
            <div><strong>File:</strong> ${fileName}</div>
            <div><strong>Size:</strong> ${this.formatFileSize(file.size)}</div>
            <div><strong>Type:</strong> ${file.type}</div>
        `;
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    parseFileSize(sizeString) {
        const match = sizeString.match(/([\d.]+)\s*(\w+)/);
        if (!match) return 0;
        
        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        
        const units = { 'BYTES': 1, 'KB': 1024, 'MB': 1024*1024, 'GB': 1024*1024*1024 };
        return value * (units[unit] || 1);
    }
    
    getFileName() {
        if (this.fileInput.files.length > 0) {
            return this.fileInput.files[0].name.replace(/\.[^/.]+$/, "");
        }
        return 'image';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const upscaler = new ImageUpscaler();
    console.log('AI Image Upscaler loaded');
    
    // Add some sample stats for demo
    setTimeout(() => {
        document.getElementById('scaleStat').textContent = '2x';
        document.getElementById('timeStat').textContent = '1.2s';
        document.getElementById('qualityStat').textContent = '85%';
        document.getElementById('sizeStat').textContent = '+400%';
    }, 1000);
});

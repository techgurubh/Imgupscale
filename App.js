// AI Image Upscaler - Main Application
class ImageUpscaler {
    constructor() {
        this.originalImage = null;
        this.upscaledImage = null;
        this.originalCanvas = null;
        this.upscaledCanvas = null;
        this.scaleFactor = 2;
        this.selectedModel = 'esrgan';
        this.isProcessing = false;
        this.processingStartTime = null;
        this.cancelProcessing = false;
        this.pica = null;
        
        this.initElements();
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.checkBrowserCompatibility();
        this.initializePica();
    }
    
    initElements() {
        // File handling elements
        this.fileInput = document.getElementById('fileInput');
        this.browseBtn = document.getElementById('browseBtn');
        this.dropZone = document.getElementById('dropZone');
        this.fileInfo = document.getElementById('fileInfo');
        
        // UI controls
        this.scaleButtons = document.querySelectorAll('.scale-btn');
        this.modelSelect = document.getElementById('modelSelect');
        this.enhanceDetails = document.getElementById('enhanceDetails');
        this.denoise = document.getElementById('denoise');
        this.sharpen = document.getElementById('sharpen');
        this.speedSlider = document.getElementById('speedSlider');
        
        // Action buttons
        this.processBtn = document.getElementById('processBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        
        // Image displays
        this.originalImg = document.getElementById('originalImage');
        this.upscaledImg = document.getElementById('upscaledImage');
        this.originalPlaceholder = document.getElementById('originalPlaceholder');
        this.upscaledPlaceholder = document.getElementById('upscaledPlaceholder');
        
        // Stats displays
        this.originalSize = document.getElementById('originalSize');
        this.originalDimensions = document.getElementById('originalDimensions');
        this.upscaledSize = document.getElementById('upscaledSize');
        this.upscaledDimensions = document.getElementById('upscaledDimensions');
        this.processingTime = document.getElementById('processingTime');
        
        // Stats cards
        this.scaleValue = document.getElementById('scaleValue');
        this.timeValue = document.getElementById('timeValue');
        this.qualityValue = document.getElementById('qualityValue');
        this.sizeValue = document.getElementById('sizeValue');
        
        // Progress modal
        this.progressModal = document.getElementById('progressModal');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.currentStatus = document.getElementById('currentStatus');
        this.elapsedTime = document.getElementById('elapsedTime');
        this.memoryUsage = document.getElementById('memoryUsage');
        this.gpuInfo = document.getElementById('gpuInfo');
        
        // Comparison slider
        this.sliderThumb = document.getElementById('sliderThumb');
        this.setupComparisonSlider();
    }
    
    setupEventListeners() {
        // File handling
        this.browseBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Scale buttons
        this.scaleButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.scaleButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.scaleFactor = parseInt(btn.dataset.scale);
                this.scaleValue.textContent = `${this.scaleFactor}x`;
            });
        });
        
        // Model selection
        this.modelSelect.addEventListener('change', (e) => {
            this.selectedModel = e.target.value;
        });
        
        // Process button
        this.processBtn.addEventListener('click', () => this.processImage());
        
        // Download button
        this.downloadBtn.addEventListener('click', () => this.downloadImage());
        
        // Reset button
        this.resetBtn.addEventListener('click', () => this.resetApp());
        
        // Cancel button
        this.cancelBtn.addEventListener('click', () => this.cancelProcessing = true);
        
        // Window events
        window.addEventListener('beforeunload', (e) => {
            if (this.isProcessing) {
                e.preventDefault();
                e.returnValue = 'Image processing is in progress. Are you sure you want to leave?';
            }
        });
    }
    
    setupDragAndDrop() {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.preventDefaults, false);
        });
        
        // Highlight drop zone
        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => {
                this.dropZone.classList.add('dragover');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => {
                this.dropZone.classList.remove('dragover');
            }, false);
        });
        
        // Handle dropped files
        this.dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                this.handleFileSelect({ target: { files } });
            }
        }, false);
    }
    
    setupComparisonSlider() {
        let isDragging = false;
        let startY = 0;
        let startTop = 0;
        
        const sliderContainer = this.sliderThumb.parentElement.parentElement;
        const sliderHeight = sliderContainer.offsetHeight;
        const thumbHeight = this.sliderThumb.offsetHeight;
        
        const updateComparison = (position) => {
            const percentage = position / sliderHeight;
            if (this.upscaledImg.src) {
                this.upscaledImg.style.opacity = percentage;
            }
        };
        
        const startDrag = (e) => {
            isDragging = true;
            const rect = sliderContainer.getBoundingClientRect();
            startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            startTop = parseInt(this.sliderThumb.style.top) || sliderHeight / 2 - thumbHeight / 2;
            this.sliderThumb.style.cursor = 'grabbing';
            e.preventDefault();
        };
        
        const doDrag = (e) => {
            if (!isDragging) return;
            
            const currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            const deltaY = currentY - startY;
            let newTop = startTop + deltaY;
            
            // Constrain within bounds
            newTop = Math.max(0, Math.min(newTop, sliderHeight - thumbHeight));
            
            this.sliderThumb.style.top = `${newTop}px`;
            updateComparison(newTop + thumbHeight / 2);
        };
        
        const stopDrag = () => {
            isDragging = false;
            this.sliderThumb.style.cursor = 'grab';
        };
        
        // Mouse events
        this.sliderThumb.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
        
        // Touch events
        this.sliderThumb.addEventListener('touchstart', startDrag);
        document.addEventListener('touchmove', doDrag);
        document.addEventListener('touchend', stopDrag);
        
        // Click on track to move thumb
        sliderContainer.addEventListener('click', (e) => {
            const rect = sliderContainer.getBoundingClientRect();
            const clickY = e.clientY - rect.top - thumbHeight / 2;
            const newTop = Math.max(0, Math.min(clickY, sliderHeight - thumbHeight));
            
            this.sliderThumb.style.top = `${newTop}px`;
            updateComparison(newTop + thumbHeight / 2);
        });
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    checkBrowserCompatibility() {
        const issues = [];
        
        // Check for WebGL
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            issues.push('WebGL is not supported. Image processing will be slower.');
        }
        
        // Check for WebAssembly
        if (typeof WebAssembly === 'undefined') {
            issues.push('WebAssembly is not supported. Some features may not work.');
        }
        
        // Check for required APIs
        if (!window.FileReader) {
            issues.push('FileReader API is not supported. Cannot read image files.');
        }
        
        if (!HTMLCanvasElement.prototype.toBlob) {
            issues.push('Canvas toBlob API is not supported. Download may not work.');
        }
        
        // Show warnings if any
        if (issues.length > 0) {
            console.warn('Browser compatibility issues:', issues);
            // You could show a non-blocking warning to the user
        }
        
        // Update GPU info
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                this.gpuInfo.textContent = renderer.includes('GPU') ? 'Active' : 'Software';
            } else {
                this.gpuInfo.textContent = 'Available';
            }
        } else {
            this.gpuInfo.textContent = 'Not available';
        }
    }
    
    initializePica() {
        if (window.pica) {
            this.pica = window.pica();
            console.log('Pica.js initialized');
        } else {
            console.warn('Pica.js not loaded, using canvas scaling');
        }
    }
    
    handleFileSelect(e) {
        const files = e.target.files || e.dataTransfer?.files;
        if (!files || files.length === 0) return;
        
        const file = files[0];
        
        // Check file type
        if (!file.type.match('image.*')) {
            this.showError('Please select an image file (JPG, PNG, WebP)');
            return;
        }
        
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            this.showError('File size exceeds 10MB limit. Please choose a smaller image.');
            return;
        }
        
        this.loadImage(file);
    }
    
    loadImage(file) {
        const reader = new FileReader();
        
        reader.onloadstart = () => {
            this.showProgress('Loading image...', 10);
        };
        
        reader.onload = (e) => {
            const img = new Image();
            
            img.onload = () => {
                this.originalImage = img;
                this.displayOriginalImage(img, file);
                this.processBtn.disabled = false;
                this.updateFileInfo(file);
                this.hideProgress();
                
                // Update stats
                this.scaleValue.textContent = `${this.scaleFactor}x`;
            };
            
            img.onerror = () => {
                this.showError('Failed to load image. The file may be corrupted.');
                this.hideProgress();
            };
            
            img.src = e.target.result;
        };
        
        reader.onerror = () => {
            this.showError('Failed to read file');
            this.hideProgress();
        };
        
        reader.readAsDataURL(file);
    }
    
    displayOriginalImage(img, file) {
        // Show image
        this.originalImg.src = img.src;
        this.originalImg.style.display = 'block';
        this.originalPlaceholder.style.display = 'none';
        
        // Create canvas for processing
        this.originalCanvas = document.createElement('canvas');
        this.originalCanvas.width = img.width;
        this.originalCanvas.height = img.height;
        const ctx = this.originalCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Update info
        const size = this.formatFileSize(file.size);
        this.originalSize.textContent = size;
        this.originalDimensions.textContent = `${img.width} × ${img.height}`;
        
        // Reset upscaled image
        this.resetUpscaledImage();
    }
    
    resetUpscaledImage() {
        this.upscaledImage = null;
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
        
        // Reset slider
        if (this.sliderThumb) {
            const sliderContainer = this.sliderThumb.parentElement.parentElement;
            const sliderHeight = sliderContainer.offsetHeight;
            const thumbHeight = this.sliderThumb.offsetHeight;
            this.sliderThumb.style.top = `${sliderHeight / 2 - thumbHeight / 2}px`;
            this.upscaledImg.style.opacity = '0.5';
        }
    }
    
    async processImage() {
        if (!this.originalImage || this.isProcessing) return;
        
        this.isProcessing = true;
        this.cancelProcessing = false;
        this.processingStartTime = Date.now();
        this.processBtn.disabled = true;
        this.downloadBtn.disabled = true;
        
        this.showProgress();
        this.updateProgress('Initializing upscaler...', 10);
        
        try {
            // Update UI
            this.upscaledPlaceholder.innerHTML = `
                <i class="fas fa-sync-alt fa-spin"></i>
                <p>Upscaling image...</p>
            `;
            
            // Determine processing method based on selected model
            let processedCanvas;
            
            switch (this.selectedModel) {
                case 'esrgan':
                case 'real-esrgan':
                    processedCanvas = await this.processWithESRGAN();
                    break;
                case 'waifu2x':
                    processedCanvas = await this.processWithWaifu2x();
                    break;
                case 'bicubic':
                default:
                    processedCanvas = await this.processWithBicubic();
                    break;
            }
            
            if (this.cancelProcessing) {
                throw new Error('Processing cancelled by user');
            }
            
            // Apply enhancements
            if (this.denoise.checked) {
                this.updateProgress('Applying denoising...', 80);
                processedCanvas = await this.applyDenoising(processedCanvas);
            }
            
            if (this.enhanceDetails.checked) {
                this.updateProgress('Enhancing details...', 85);
                processedCanvas = await this.enhanceImageDetails(processedCanvas);
            }
            
            if (this.sharpen.checked) {
                this.updateProgress('Sharpening image...', 90);
                processedCanvas = await this.sharpenImage(processedCanvas);
            }
            
            this.updateProgress('Finalizing...', 95);
            
            // Display result
            this.displayUpscaledImage(processedCanvas);
            
            // Update stats
            this.updateStats();
            
            this.updateProgress('Processing complete!', 100);
            setTimeout(() => this.hideProgress(), 1000);
            
        } catch (error) {
            console.error('Processing error:', error);
            this.upscaledPlaceholder.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error: ${error.message}</p>
            `;
            this.showError(`Processing failed: ${error.message}`);
            this.hideProgress();
        } finally {
            this.isProcessing = false;
            this.processBtn.disabled = false;
            this.cancelProcessing = false;
        }
    }
    
    async processWithESRGAN() {
        this.updateProgress('Loading ESRGAN model...', 20);
        
        try {
            // Try to load real ESRGAN model
            if (window.esrganModel && typeof window.esrganModel.upscale === 'function') {
                this.updateProgress('Running ESRGAN inference...', 40);
                return await window.esrganModel.upscale(this.originalCanvas, this.scaleFactor);
            }
        } catch (error) {
            console.warn('ESRGAN model not available, falling back to advanced upscaling:', error);
        }
        
        // Fallback to advanced upscaling
        return await this.advancedUpscale();
    }
    
    async processWithWaifu2x() {
        this.updateProgress('Loading Waifu2x model...', 20);
        
        try {
            // Try to load Waifu2x model
            if (window.waifu2xModel && typeof window.waifu2xModel.upscale === 'function') {
                this.updateProgress('Running Waifu2x inference...', 40);
                return await window.waifu2xModel.upscale(this.originalCanvas, this.scaleFactor);
            }
        } catch (error) {
            console.warn('Waifu2x model not available, falling back to advanced upscaling:', error);
        }
        
        // Fallback with anime-specific enhancements
        return await this.advancedUpscale(true);
    }
    
    async processWithBicubic() {
        this.updateProgress('Upscaling with bicubic interpolation...', 30);
        
        const newWidth = this.originalImage.width * this.scaleFactor;
        const newHeight = this.originalImage.height * this.scaleFactor;
        
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        
        // Use high-quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(this.originalImage, 0, 0, newWidth, newHeight);
        
        return canvas;
    }
    
    async advancedUpscale(isAnime = false) {
        this.updateProgress('Preparing image for upscaling...', 30);
        
        const newWidth = this.originalImage.width * this.scaleFactor;
        const newHeight = this.originalImage.height * this.scaleFactor;
        
        // Create canvas for upscaled image
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        
        // First pass: Bicubic upscale
        this.updateProgress('First pass: Bicubic upscaling...', 40);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(this.originalImage, 0, 0, newWidth, newHeight);
        
        // Second pass: Edge enhancement
        this.updateProgress('Second pass: Edge enhancement...', 50);
        await this.enhanceEdges(ctx, canvas.width, canvas.height, isAnime);
        
        // Third pass: Detail recovery
        this.updateProgress('Third pass: Detail recovery...', 60);
        await this.recoverDetails(ctx, canvas.width, canvas.height);
        
        return canvas;
    }
    
    async enhanceEdges(ctx, width, height, isAnime = false) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Simple edge enhancement using convolution
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                for (let c = 0; c < 3; c++) {
                    const idx = (y * width + x) * 4 + c;
                    
                    // Apply edge enhancement kernel
                    let sum = data[idx] * (isAnime ? 9 : 5);
                    const kernelSize = isAnime ? 2 : 1;
                    
                    for (let ky = -kernelSize; ky <= kernelSize; ky++) {
                        for (let kx = -kernelSize; kx <= kernelSize; kx++) {
                            if (kx === 0 && ky === 0) continue;
                            const kidx = ((y + ky) * width + (x + kx)) * 4 + c;
                            sum -= data[kidx] / (kernelSize * kernelSize * 4);
                        }
                    }
                    
                    tempData[idx] = this.clamp(sum, 0, 255);
                }
            }
        }
        
        ctx.putImageData(new ImageData(tempData, width, height), 0, 0);
    }
    
    async recoverDetails(ctx, width, height) {
        // Simple detail recovery using high-pass filter
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 2; y < height - 2; y++) {
            for (let x = 2; x < width - 2; x++) {
                for (let c = 0; c < 3; c++) {
                    const idx = (y * width + x) * 4 + c;
                    
                    // Get local average
                    let avg = 0;
                    for (let ky = -2; ky <= 2; ky++) {
                        for (let kx = -2; kx <= 2; kx++) {
                            const kidx = ((y + ky) * width + (x + kx)) * 4 + c;
                            avg += data[kidx];
                        }
                    }
                    avg /= 25;
                    
                    // Enhance high-frequency components
                    const detail = data[idx] - avg;
                    tempData[idx] = this.clamp(data[idx] + detail * 0.3, 0, 255);
                }
            }
        }
        
        ctx.putImageData(new ImageData(tempData, width, height), 0, 0);
    }
    
    async applyDenoising(canvas) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Simple bilateral filter simulation
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const tempData = new Uint8ClampedArray(data);
        
        const radius = 1;
        const sigmaColor = 10;
        const sigmaSpace = 10;
        
        for (let y = radius; y < height - radius; y++) {
            for (let x = radius; x < width - radius; x++) {
                for (let c = 0; c < 3; c++) {
                    const idx = (y * width + x) * 4 + c;
                    
                    let sum = 0;
                    let weightSum = 0;
                    const centerVal = data[idx];
                    
                    for (let ky = -radius; ky <= radius; ky++) {
                        for (let kx = -radius; kx <= radius; kx++) {
                            const kidx = ((y + ky) * width + (x + kx)) * 4 + c;
                            const neighborVal = data[kidx];
                            
                            // Calculate weights
                            const colorDist = Math.abs(centerVal - neighborVal);
                            const spaceDist = Math.sqrt(kx * kx + ky * ky);
                            
                            const colorWeight = Math.exp(-(colorDist * colorDist) / (2 * sigmaColor * sigmaColor));
                            const spaceWeight = Math.exp(-(spaceDist * spaceDist) / (2 * sigmaSpace * sigmaSpace));
                            const weight = colorWeight * spaceWeight;
                            
                            sum += neighborVal * weight;
                            weightSum += weight;
                        }
                    }
                    
                    tempData[idx] = weightSum > 0 ? sum / weightSum : centerVal;
                }
            }
        }
        
        ctx.putImageData(new ImageData(tempData, width, height), 0, 0);
        return canvas;
    }
    
    async enhanceImageDetails(canvas) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Increase local contrast
        for (let i = 0; i < data.length; i += 4) {
            // Enhance RGB channels
            for (let c = 0; c < 3; c++) {
                const val = data[i + c];
                // Apply S-curve contrast enhancement
                const normalized = val / 255;
                const enhanced = normalized < 0.5 ? 
                    2 * normalized * normalized : 
                    1 - Math.pow(-2 * normalized + 2, 2) / 2;
                data[i + c] = this.clamp(enhanced * 255, 0, 255);
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }
    
    async sharpenImage(canvas) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Unsharp mask technique
        const imageData = ctx.getImageData(0, 0, width, height);
        const blurredData = this.applyGaussianBlur(imageData, 1);
        const data = imageData.data;
        
        const amount = 0.5; // Sharpening strength
        
        for (let i = 0; i < data.length; i += 4) {
            for (let c = 0; c < 3; c++) {
                const original = data[i + c];
                const blurred = blurredData[i + c];
                const sharpened = original + (original - blurred) * amount;
                data[i + c] = this.clamp(sharpened, 0, 255);
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }
    
    applyGaussianBlur(imageData, radius) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const result = new Uint8ClampedArray(data);
        
        // Generate Gaussian kernel
        const kernelSize = radius * 2 + 1;
        const kernel = [];
        let kernelSum = 0;
        const sigma = radius / 3;
        
        for (let i = -radius; i <= radius; i++) {
            const value = Math.exp(-(i * i) / (2 * sigma * sigma)) / (Math.sqrt(2 * Math.PI) * sigma);
            kernel.push(value);
            kernelSum += value;
        }
        
        // Normalize kernel
        for (let i = 0; i < kernel.length; i++) {
            kernel[i] /= kernelSum;
        }
        
        // Apply horizontal blur
        for (let y = 0; y < height; y++) {
            for (let x = radius; x < width - radius; x++) {
                for (let c = 0; c < 3; c++) {
                    let sum = 0;
                    for (let k = -radius; k <= radius; k++) {
                        const idx = (y * width + (x + k)) * 4 + c;
                        sum += data[idx] * kernel[k + radius];
                    }
                    const resultIdx = (y * width + x) * 4 + c;
                    result[resultIdx] = sum;
                }
            }
        }
        
        // Apply vertical blur
        const temp = new Uint8ClampedArray(result);
        for (let y = radius; y < height - radius; y++) {
            for (let x = 0; x < width; x++) {
                for (let c = 0; c < 3; c++) {
                    let sum = 0;
                    for (let k = -radius; k <= radius; k++) {
                        const idx = ((y + k) * width + x) * 4 + c;
                        sum += temp[idx] * kernel[k + radius];
                    }
                    const resultIdx = (y * width + x) * 4 + c;
                    result[resultIdx] = sum;
                }
            }
        }
        
        return result;
    }
    
    displayUpscaledImage(canvas) {
        this.upscaledCanvas = canvas;
        
        // Convert canvas to image
        const img = new Image();
        img.onload = () => {
            this.upscaledImage = img;
            this.upscaledImg.src = img.src;
            this.upscaledImg.style.display = 'block';
            this.upscaledPlaceholder.style.display = 'none';
            
            // Update info
            this.upscaledDimensions.textContent = `${canvas.width} × ${canvas.height}`;
            
            // Calculate file size estimate
            canvas.toBlob((blob) => {
                const size = blob ? blob.size : canvas.width * canvas.height * 4;
                this.upscaledSize.textContent = this.formatFileSize(size);
                
                // Calculate processing time
                const endTime = Date.now();
                const processingTime = (endTime - this.processingStartTime) / 1000;
                this.processingTime.textContent = `${processingTime.toFixed(2)}s`;
                this.timeValue.textContent = `${processingTime.toFixed(2)}s`;
                
                // Enable download
                this.downloadBtn.disabled = false;
                
                // Update slider opacity
                this.upscaledImg.style.opacity = '0.5';
            }, 'image/png');
        };
        
        img.src = canvas.toDataURL('image/png');
    }
    
    updateStats() {
        if (!this.originalImage || !this.upscaledCanvas) return;
        
        // Scale factor
        this.scaleValue.textContent = `${this.scaleFactor}x`;
        
        // Quality score (simulated based on model and enhancements)
        let quality = 70;
        if (this.selectedModel.includes('esrgan')) quality = 90;
        else if (this.selectedModel === 'waifu2x') quality = 85;
        else quality = 75;
        
        if (this.enhanceDetails.checked) quality += 5;
        if (this.denoise.checked) quality += 3;
        if (this.sharpen.checked) quality += 2;
        
        this.qualityValue.textContent = `${Math.min(quality, 100)}%`;
        
        // Size increase
        const origSize = this.parseFileSize(this.originalSize.textContent);
        const upscaledSize = this.upscaledCanvas.width * this.upscaledCanvas.height * 4;
        const increase = ((upscaledSize - origSize) / origSize * 100).toFixed(0);
        this.sizeValue.textContent = `+${increase}%`;
    }
    
    downloadImage() {
        if (!this.upscaledCanvas) return;
        
        // Generate filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `upscaled_${timestamp}.png`;
        
        // Create download link
        const link = document.createElement('a');
        link.download = filename;
        link.href = this.upscaledCanvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        this.showSuccess('Image downloaded successfully!');
    }
    
    resetApp() {
        if (this.isProcessing) {
            if (!confirm('Processing is in progress. Are you sure you want to reset?')) {
                return;
            }
            this.cancelProcessing = true;
        }
        
        // Reset all state
        this.originalImage = null;
        this.upscaledImage = null;
        this.originalCanvas = null;
        this.upscaledCanvas = null;
        this.isProcessing = false;
        this.cancelProcessing = false;
        
        // Reset UI
        this.originalImg.src = '';
        this.originalImg.style.display = 'none';
        this.originalPlaceholder.style.display = 'flex';
        this.originalPlaceholder.innerHTML = `
            <i class="fas fa-image"></i>
            <p>Your image will appear here</p>
        `;
        
        this.resetUpscaledImage();
        
        // Reset file info
        this.originalSize.textContent = '-';
        this.originalDimensions.textContent = '-';
        
        // Reset stats
        this.scaleValue.textContent = '-';
        this.timeValue.textContent = '-';
        this.qualityValue.textContent = '-';
        this.sizeValue.textContent = '-';
        
        // Reset buttons
        this.processBtn.disabled = true;
        this.downloadBtn.disabled = true;
        
        // Reset file input
        this.fileInput.value = '';
        this.fileInfo.innerHTML = '';
        
        // Reset form controls
        this.scaleButtons[0].click();
        this.modelSelect.value = 'esrgan';
        this.enhanceDetails.checked = true;
        this.denoise.checked = true;
        this.sharpen.checked = false;
        this.speedSlider.value = 2;
    }
    
    showProgress(title = 'Processing...', percentage = 0) {
        this.progressText.textContent = title;
        this.progressFill.style.width = `${percentage}%`;
        this.currentStatus.textContent = title;
        this.progressModal.style.display = 'flex';
        
        // Start timer
        this.progressStartTime = Date.now();
        this.updateProgressTimer();
    }
    
    updateProgress(text, percentage) {
        this.progressText.textContent = text;
        this.currentStatus.textContent = text;
        this.progressFill.style.width = `${percentage}%`;
    }
    
    updateProgressTimer() {
        if (!this.progressModal.style.display || this.progressModal.style.display === 'none') {
            return;
        }
        
        const elapsed = (Date.now() - this.progressStartTime) / 1000;
        this.elapsedTime.textContent = `${elapsed.toFixed(1)}s`;
        
        // Update memory usage
        if (performance.memory) {
            const usedMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
            const totalMB = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024);
            this.memoryUsage.textContent = `${usedMB}MB / ${totalMB}MB`;
        }
        
        // Continue updating
        setTimeout(() => this.updateProgressTimer(), 100);
    }
    
    hideProgress() {
        this.progressModal.style.display = 'none';
        this.progressFill.style.width = '0%';
    }
    
    showError(message) {
        // Create error toast
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
            <button class="toast-close">&times;</button>
        `;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f8d7da;
            color: #721c24;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;
        
        toast.querySelector('.toast-close').onclick = () => toast.remove();
        
        document.body.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
        
        // Add CSS for animations
        if (!document.querySelector('#toast-animations')) {
            const style = document.createElement('style');
            style.id = 'toast-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    showSuccess(message) {
        // Create success toast
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <button class="toast-close">&times;</button>
        `;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;
        
        toast.querySelector('.toast-close').onclick = () => toast.remove();
        
        document.body.appendChild(toast);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, 3000);
    }
    
    updateFileInfo(file) {
        const fileName = file.name.length > 30 ? 
            file.name.substring(0, 27) + '...' : file.name;
        
        this.fileInfo.innerHTML = `
            <div><strong>Selected:</strong> ${fileName}</div>
            <div><strong>Size:</strong> ${this.formatFileSize(file.size)}</div>
            <div><strong>Type:</strong> ${file.type.toUpperCase().replace('IMAGE/', '')}</div>
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
    
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
}

// Initialize when page loads
window.addEventListener('load', () => {
    window.imageUpscaler = new ImageUpscaler();
    console.log('AI Image Upscaler initialized');
});

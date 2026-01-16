// models.js - AI Model implementations for browser-based upscaling

// Simple ESRGAN implementation using TensorFlow.js
class ESRGANModel {
    constructor() {
        this.model = null;
        this.isLoaded = false;
    }
    
    async load() {
        try {
            // Create a simple CNN model for demonstration
            // In production, you would load a pre-trained model
            
            this.model = tf.sequential();
            
            // Input layer
            this.model.add(tf.layers.conv2d({
                inputShape: [null, null, 3],
                filters: 64,
                kernelSize: 3,
                padding: 'same',
                activation: 'relu'
            }));
            
            // Residual blocks (simplified)
            for (let i = 0; i < 8; i++) {
                this.model.add(tf.layers.conv2d({
                    filters: 64,
                    kernelSize: 3,
                    padding: 'same',
                    activation: 'relu'
                }));
                
                this.model.add(tf.layers.conv2d({
                    filters: 64,
                    kernelSize: 3,
                    padding: 'same'
                }));
                
                // Skip connection
                const skip = this.model.layers[this.model.layers.length - 3].output;
                const residual = this.model.layers[this.model.layers.length - 1].output;
                this.model.add(tf.layers.add().apply([skip, residual]));
                this.model.add(tf.layers.activation({activation: 'relu'}));
            }
            
            // Upsampling layer
            this.model.add(tf.layers.conv2dTranspose({
                filters: 64,
                kernelSize: 3,
                strides: 2,
                padding: 'same',
                activation: 'relu'
            }));
            
            // Output layer
            this.model.add(tf.layers.conv2d({
                filters: 3,
                kernelSize: 3,
                padding: 'same'
            }));
            
            this.isLoaded = true;
            console.log('ESRGAN model initialized');
            
        } catch (error) {
            console.error('Failed to initialize ESRGAN model:', error);
            this.isLoaded = false;
        }
    }
    
    async upscale(canvas, scaleFactor = 2) {
        if (!this.isLoaded) {
            await this.load();
        }
        
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Convert to tensor
        const tensor = tf.browser.fromPixels(canvas);
        const normalized = tensor.div(255.0);
        const batched = normalized.expandDims(0);
        
        // Run inference
        const output = this.model.predict(batched);
        
        // Process output
        const upscaled = output.squeeze();
        const result = await tf.browser.toPixels(upscaled.mul(255.0));
        
        // Create output canvas
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = canvas.width * scaleFactor;
        outputCanvas.height = canvas.height * scaleFactor;
        const outputCtx = outputCanvas.getContext('2d');
        const outputImageData = new ImageData(result, outputCanvas.width, outputCanvas.height);
        outputCtx.putImageData(outputImageData, 0, 0);
        
        // Cleanup
        tensor.dispose();
        normalized.dispose();
        batched.dispose();
        output.dispose();
        upscaled.dispose();
        
        return outputCanvas;
    }
}

// Waifu2x model for anime-style upscaling
class Waifu2xModel {
    constructor() {
        this.model = null;
        this.isLoaded = false;
    }
    
    async load() {
        try {
            // Simplified CNN for anime upscaling
            this.model = tf.sequential();
            
            // First convolution
            this.model.add(tf.layers.conv2d({
                inputShape: [null, null, 3],
                filters: 32,
                kernelSize: 3,
                padding: 'same',
                activation: 'relu'
            }));
            
            // Deep network for anime features
            for (let i = 0; i < 4; i++) {
                this.model.add(tf.layers.conv2d({
                    filters: 32,
                    kernelSize: 3,
                    padding: 'same',
                    activation: 'relu'
                }));
                
                this.model.add(tf.layers.conv2d({
                    filters: 32,
                    kernelSize: 3,
                    padding: 'same'
                }));
                
                // Residual connection
                const skip = this.model.layers[this.model.layers.length - 3].output;
                const residual = this.model.layers[this.model.layers.length - 1].output;
                this.model.add(tf.layers.add().apply([skip, residual]));
            }
            
            // Upsampling for anime (maintains sharp lines)
            this.model.add(tf.layers.conv2dTranspose({
                filters: 32,
                kernelSize: 3,
                strides: 2,
                padding: 'same',
                activation: 'relu'
            }));
            
            // Final convolution for color correction
            this.model.add(tf.layers.conv2d({
                filters: 3,
                kernelSize: 3,
                padding: 'same'
            }));
            
            this.isLoaded = true;
            console.log('Waifu2x model initialized');
            
        } catch (error) {
            console.error('Failed to initialize Waifu2x model:', error);
            this.isLoaded = false;
        }
    }
    
    async upscale(canvas, scaleFactor = 2) {
        if (!this.isLoaded) {
            await this.load();
        }
        
        // Anime-specific preprocessing
        const processedCanvas = this.preprocessAnime(canvas);
        
        const tensor = tf.browser.fromPixels(processedCanvas);
        const normalized = tensor.div(255.0);
        const batched = normalized.expandDims(0);
        
        const output = this.model.predict(batched);
        const upscaled = output.squeeze();
        const result = await tf.browser.toPixels(upscaled.mul(255.0));
        
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = canvas.width * scaleFactor;
        outputCanvas.height = canvas.height * scaleFactor;
        const outputCtx = outputCanvas.getContext('2d');
        const outputImageData = new ImageData(result, outputCanvas.width, outputCanvas.height);
        outputCtx.putImageData(outputImageData, 0, 0);
        
        // Anime-specific postprocessing
        const finalCanvas = this.postprocessAnime(outputCanvas);
        
        // Cleanup
        tensor.dispose();
        normalized.dispose();
        batched.dispose();
        output.dispose();
        upscaled.dispose();
        
        return finalCanvas;
    }
    
    preprocessAnime(canvas) {
        // Enhance edges and colors for anime
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            // Boost saturation for anime
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;
            
            if (delta > 10) { // Not grayscale
                const factor = 1.2; // Saturation boost
                data[i] = this.clamp(r + (r - (r + g + b) / 3) * factor, 0, 255);
                data[i + 1] = this.clamp(g + (g - (r + g + b) / 3) * factor, 0, 255);
                data[i + 2] = this.clamp(b + (b - (r + g + b) / 3) * factor, 0, 255);
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }
    
    postprocessAnime(canvas) {
        // Sharpen edges for anime
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const tempData = new Uint8ClampedArray(data);
        
        // Edge sharpening kernel for anime
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                for (let c = 0; c < 3; c++) {
                    const idx = (y * width + x) * 4 + c;
                    
                    // Strong sharpening for anime
                    let sum = data[idx] * 9;
                    sum -= data[idx - 4] + data[idx + 4];
                    sum -= data[idx - width * 4] + data[idx + width * 4];
                    sum -= data[idx - 4 - width * 4] + data[idx + 4 - width * 4];
                    sum -= data[idx - 4 + width * 4] + data[idx + 4 + width * 4];
                    
                    tempData[idx] = this.clamp(sum, 0, 255);
                }
            }
        }
        
        ctx.putImageData(new ImageData(tempData, width, height), 0, 0);
        return canvas;
    }
    
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
}

// Export models to global scope
window.esrganModel = new ESRGANModel();
window.waifu2xModel = new Waifu2xModel();

// Preload models when page loads
window.addEventListener('load', async () => {
    console.log('Loading AI models...');
    
    // Load in background
    setTimeout(async () => {
        try {
            await window.esrganModel.load();
            await window.waifu2xModel.load();
            console.log('All AI models loaded successfully');
        } catch (error) {
            console.error('Failed to load AI models:', error);
        }
    }, 1000);
});

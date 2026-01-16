// worker.js - Web Worker for image processing

self.onmessage = function(e) {
    const { type, data } = e.data;
    
    switch (type) {
        case 'upscale':
            handleUpscale(data);
            break;
        case 'enhance':
            handleEnhance(data);
            break;
        case 'denoise':
            handleDenoise(data);
            break;
    }
};

function handleUpscale(data) {
    const { imageData, scaleFactor, method } = data;
    
    const width = imageData.width;
    const height = imageData.height;
    const newWidth = width * scaleFactor;
    const newHeight = height * scaleFactor;
    
    // Create output image data
    const outputData = new ImageData(newWidth, newHeight);
    
    // Simple nearest neighbor upscaling (for demo)
    // In production, implement better algorithms
    
    for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < newWidth; x++) {
            const srcX = Math.floor(x / scaleFactor);
            const srcY = Math.floor(y / scaleFactor);
            
            const srcIdx = (srcY * width + srcX) * 4;
            const dstIdx = (y * newWidth + x) * 4;
            
            outputData.data[dstIdx] = imageData.data[srcIdx];
            outputData.data[dstIdx + 1] = imageData.data[srcIdx + 1];
            outputData.data[dstIdx + 2] = imageData.data[srcIdx + 2];
            outputData.data[dstIdx + 3] = imageData.data[srcIdx + 3];
        }
    }
    
    self.postMessage({
        type: 'upscaleComplete',
        data: outputData
    });
}

function handleEnhance(data) {
    const { imageData } = data;
    
    // Simple enhancement logic
    const enhancedData = new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
    );
    
    // Increase contrast
    const dataArray = enhancedData.data;
    for (let i = 0; i < dataArray.length; i += 4) {
        // Simple contrast enhancement
        const factor = 1.2;
        dataArray[i] = clamp(dataArray[i] * factor, 0, 255);
        dataArray[i + 1] = clamp(dataArray[i + 1] * factor, 0, 255);
        dataArray[i + 2] = clamp(dataArray[i + 2] * factor, 0, 255);
    }
    
    self.postMessage({
        type: 'enhanceComplete',
        data: enhancedData
    });
}

function handleDenoise(data) {
    const { imageData, strength } = data;
    
    // Simple box blur denoising
    const denoisedData = new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
    );
    
    const radius = Math.floor(strength);
    const dataArray = denoisedData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    for (let y = radius; y < height - radius; y++) {
        for (let x = radius; x < width - radius; x++) {
            for (let c = 0; c < 3; c++) {
                let sum = 0;
                let count = 0;
                
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const idx = ((y + dy) * width + (x + dx)) * 4 + c;
                        sum += dataArray[idx];
                        count++;
                    }
                }
                
                const idx = (y * width + x) * 4 + c;
                dataArray[idx] = sum / count;
            }
        }
    }
    
    self.postMessage({
        type: 'denoiseComplete',
        data: denoisedData
    });
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

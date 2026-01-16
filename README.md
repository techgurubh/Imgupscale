# AI Image Upscaler

A fully browser-based AI image upscaler that works 100% locally with no API keys required!

## Features

- 🚀 **100% Browser-Based** - No server, no API keys, no uploads
- 🎯 **Multiple AI Models** - ESRGAN, Waifu2x, and traditional algorithms
- ⚡ **Fast Processing** - Uses WebGL and WebAssembly for GPU acceleration
- 🔒 **Complete Privacy** - Your images never leave your computer
- 🎨 **Quality Enhancements** - Denoise, sharpen, and detail enhancement
- 📱 **Responsive Design** - Works on desktop and mobile
- 💾 **Local Processing** - All computations happen in your browser

## How to Use

1. **Upload an image** by drag & drop or click "Browse Images"
2. **Select upscale factor** (2x, 3x, or 4x)
3. **Choose AI model**:
   - ESRGAN: Best for photos and realistic images
   - Waifu2x: Optimized for anime and artwork
   - Real-ESRGAN: Enhanced realism
   - Bicubic: Fast traditional method
4. **Adjust enhancements** (denoise, sharpen, details)
5. **Click "Upscale Image"** to process
6. **Use slider** to compare before/after
7. **Download** your upscaled image

## Supported Formats

- JPEG/JPG
- PNG
- WebP
- BMP
- GIF

## Browser Support

- Chrome 80+ (Recommended)
- Firefox 75+
- Safari 14+
- Edge 80+

## Technical Details

This application uses:
- **TensorFlow.js** for AI model inference
- **Canvas API** for image processing
- **WebGL** for GPU acceleration
- **WebAssembly** for optimized computations
- **Pica.js** for fast image resizing

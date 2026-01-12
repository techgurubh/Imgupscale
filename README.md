# AI Image Upscaler

A browser-based image upscaler using AI/ML algorithms. Upscale your images up to 4x directly in your browser with no server processing needed.

## Features

- 🚀 **Browser-based** - No server, no uploads, all processing happens locally
- 🎯 **Multiple AI Models** - ESRGAN, Waifu2x, and traditional algorithms
- 🖼️ **Drag & Drop Interface** - Simple and intuitive UI
- 🔄 **Real-time Comparison** - Slider to compare before/after
- 📊 **Performance Stats** - See processing time and quality improvements
- 📱 **Responsive Design** - Works on desktop and mobile
- 🔒 **Privacy First** - Your images never leave your computer

## Live Demo

Visit: [https://techgurubh.github.io/imgupscale](https://techgurubh.github.io/imgupscale)

## How to Use

1. **Upload an image** by dragging & dropping or clicking "Browse Images"
2. **Select upscale factor** (2x, 3x, or 4x)
3. **Choose AI model**:
   - ESRGAN: Best for photos and realistic images
   - Waifu2x: Optimized for anime/cartoon images
   - Traditional: Fast processing with bicubic or lanczos algorithms
4. **Click "Upscale Image"** to process
5. **Use the slider** to compare original vs upscaled
6. **Download** your upscaled image

## Supported Formats

- JPEG/JPG
- PNG
- WebP
- BMP

## Technical Details

This application uses:
- **TensorFlow.js** for AI model inference
- **ONNX Runtime Web** for optimized performance
- **Canvas API** for image processing
- **WebAssembly** for faster computations

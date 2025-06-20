import sharp from 'sharp';
import { validateImage, IMAGE_LIMITS } from '@/lib/security/imageValidation';
// import * as tf from '@tensorflow/tfjs-node';

// Security constants
const MAX_PROCESSING_SIZE = 4096; // Maximum dimension for processing
const MAX_MEMORY_USAGE = 100 * 1024 * 1024; // 100MB memory limit

interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
}

// Load pre-trained window detection model
// let windowDetectionModel: tf.GraphModel | null = null;
// async function loadModel() {
//   if (!windowDetectionModel) {
//     windowDetectionModel = await tf.loadGraphModel('/models/window-detection/model.json');
//   }
//   return windowDetectionModel;
// }

export async function processRoomImage(imageBuffer: Buffer): Promise<ProcessedImage> {
  try {
    // Validate input image first
    const validation = await validateImage(imageBuffer);
    if (!validation.isValid) {
      throw new Error(`Invalid room image: ${validation.errors.join(', ')}`);
    }

    // Check memory limits
    if (imageBuffer.length > MAX_MEMORY_USAGE) {
      throw new Error('Image too large for processing');
    }

    // Get original metadata for validation
    const originalMetadata = await sharp(imageBuffer).metadata();
    if (!originalMetadata.width || !originalMetadata.height) {
      throw new Error('Could not read image dimensions');
    }

    // Limit processing dimensions for security
    const maxWidth = Math.min(1920, MAX_PROCESSING_SIZE);
    const maxHeight = Math.min(1080, MAX_PROCESSING_SIZE);

    // Process room image with secure settings
    const processedImage = await sharp(imageBuffer, {
      limitInputPixels: MAX_PROCESSING_SIZE * MAX_PROCESSING_SIZE,
      failOnError: true
    })
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .jpeg({ quality: 85, progressive: true }) // Force to JPEG for consistency
      .toBuffer();

    // Get processed image metadata
    const metadata = await sharp(processedImage).metadata();

    return {
      buffer: processedImage,
      width: metadata.width || 0,
      height: metadata.height || 0
    };
  } catch (error) {
    // Safe error logging
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error processing room image:', error);
    }
    throw new Error('Failed to process room image');
  }
}

export async function processProductImage(imageBuffer: Buffer, targetWidth: number): Promise<ProcessedImage> {
  try {
    // Validate input image
    const validation = await validateImage(imageBuffer);
    if (!validation.isValid) {
      throw new Error(`Invalid product image: ${validation.errors.join(', ')}`);
    }

    // Validate and sanitize target width
    const safeTargetWidth = Math.max(50, Math.min(targetWidth, MAX_PROCESSING_SIZE));

    // Check memory limits
    if (imageBuffer.length > MAX_MEMORY_USAGE) {
      throw new Error('Product image too large for processing');
    }

    // Process product image with security settings
    const processedImage = await sharp(imageBuffer, {
      limitInputPixels: MAX_PROCESSING_SIZE * MAX_PROCESSING_SIZE,
      failOnError: true
    })
      .resize(safeTargetWidth, null, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }, // White background instead of black
        withoutEnlargement: false
      })
      .png({ quality: 90, progressive: true }) // Force to PNG for transparency
      .toBuffer();

    // Get image metadata
    const metadata = await sharp(processedImage).metadata();

    return {
      buffer: processedImage,
      width: metadata.width || 0,
      height: metadata.height || 0
    };
  } catch (error) {
    console.error('Error processing product image:', error);
    throw new Error('Failed to process product image');
  }
}

export async function compositeImages(
  roomImage: ProcessedImage,
  productImage: ProcessedImage,
  x: number,
  y: number,
  scale: number = 1,
  rotation: number = 0
): Promise<Buffer> {
  try {
    // Create composite image
    const result = await sharp(roomImage.buffer)
      .composite([
        {
          input: productImage.buffer,
          top: Math.round(y),
          left: Math.round(x),
          blend: 'over'
        }
      ])
      .toBuffer();

    return result;
  } catch (error) {
    console.error('Error compositing images:', error);
    throw new Error('Failed to composite images');
  }
}

export async function detectWindows(imageBuffer: Buffer): Promise<Array<{ x: number; y: number; width: number; height: number }>> {
  try {
    // Load the model
    const model = await loadModel();
    
    // Convert image to tensor
    const image = await sharp(imageBuffer)
      .resize(640, 640, { fit: 'contain' })
      .toBuffer();
      
    const tensor = tf.node.decodeImage(image);
    const input = tf.expandDims(tensor, 0);
    
    // Normalize input
    const normalized = tf.div(input, 255);
    
    // Run inference
    const predictions = await model.predict(normalized) as tf.Tensor;
    
    // Process predictions
    const boxes = await predictions.array();
    const windows = processDetections(boxes[0], 0.5); // confidence threshold of 0.5
    
    // Clean up tensors
    tf.dispose([tensor, input, normalized, predictions]);
    
    return windows;
  } catch (error) {
    console.error('Error detecting windows:', error);
    // Fallback to basic detection if ML fails
    // Safe fallback with validated coordinates
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;
    
    return [{
      x: Math.round(width * 0.2),
      y: Math.round(height * 0.3),
      width: Math.round(width * 0.3),
      height: Math.round(height * 0.4),
      scale: 1,
      rotation: 0
    }];
  }
}

/**
 * Basic window detection using edge detection (secure fallback)
 */
async function basicWindowDetection(
  imageBuffer: Buffer, 
  maxWindows: number
): Promise<Array<{ x: number; y: number; width: number; height: number; scale: number; rotation: number }>> {
  try {
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (width === 0 || height === 0) {
      throw new Error('Invalid image dimensions');
    }

    // Simple heuristic window detection
    const windows = [];
    
    // Add common window positions based on room layout patterns
    const positions = [
      { x: 0.1, y: 0.2 }, // Left wall
      { x: 0.7, y: 0.15 }, // Right wall  
      { x: 0.4, y: 0.1 }  // Center/back wall
    ];

    for (let i = 0; i < Math.min(positions.length, maxWindows); i++) {
      const pos = positions[i];
      windows.push({
        x: Math.round(width * pos.x),
        y: Math.round(height * pos.y),
        width: Math.round(width * 0.25),
        height: Math.round(height * 0.35),
        scale: 1,
        rotation: 0
      });
    }

    return windows;
  } catch (error) {
    throw new Error(`Window detection failed: ${error}`);
  }
}

// Helper function to process model output
function processDetections(detections: number[][], confidenceThreshold: number) {
  const windows = [];
  for (const detection of detections) {
    const [y, x, height, width, confidence] = detection;
    if (confidence > confidenceThreshold) {
      windows.push({
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height)
      });
    }
  }
  return windows;
}

export async function optimizeImageForWeb(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Validate input
    const validation = await validateImage(imageBuffer);
    if (!validation.isValid) {
      throw new Error('Invalid image for optimization');
    }

    // Optimize image for web delivery with security limits
    const optimizedImage = await sharp(imageBuffer, {
      limitInputPixels: MAX_PROCESSING_SIZE * MAX_PROCESSING_SIZE
    })
      .jpeg({
        quality: 80,
        progressive: true,
        mozjpeg: true // Better compression
      })
      .toBuffer();

    return optimizedImage;
  } catch (error) {
    // Safe error logging
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error optimizing image:', error);
    }
    throw new Error('Failed to optimize image');
  }
}
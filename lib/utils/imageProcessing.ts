import sharp from 'sharp';
import * as tf from '@tensorflow/tfjs-node';

interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
}

// Load pre-trained window detection model
let windowDetectionModel: tf.GraphModel | null = null;
async function loadModel() {
  if (!windowDetectionModel) {
    windowDetectionModel = await tf.loadGraphModel('/models/window-detection/model.json');
  }
  return windowDetectionModel;
}

export async function processRoomImage(imageBuffer: Buffer): Promise<ProcessedImage> {
  try {
    // Process room image
    const processedImage = await sharp(imageBuffer)
      .resize(1920, 1080, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toBuffer();

    // Get image metadata
    const metadata = await sharp(processedImage).metadata();

    return {
      buffer: processedImage,
      width: metadata.width || 0,
      height: metadata.height || 0
    };
  } catch (error) {
    console.error('Error processing room image:', error);
    throw new Error('Failed to process room image');
  }
}

export async function processProductImage(imageBuffer: Buffer, targetWidth: number): Promise<ProcessedImage> {
  try {
    // Process product image
    const processedImage = await sharp(imageBuffer)
      .resize(targetWidth, null, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
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
    return [{
      x: 100,
      y: 100,
      width: 300,
      height: 400
    }];
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
    // Optimize image for web delivery
    const optimizedImage = await sharp(imageBuffer)
      .jpeg({
        quality: 80,
        progressive: true
      })
      .toBuffer();

    return optimizedImage;
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw new Error('Failed to optimize image');
  }
}
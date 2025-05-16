import sharp from 'sharp';

interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
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
  // TODO: Implement window detection using ML model
  // This is a placeholder that returns a mock window detection
  return [{
    x: 100,
    y: 100,
    width: 300,
    height: 400
  }];
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
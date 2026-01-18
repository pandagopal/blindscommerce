/**
 * AI Service Handler
 * Handles AI-powered features: room analysis, window detection, blind recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { BaseHandler, ApiError } from '@/lib/api/v2/BaseHandler';
import { BlindRecommendationEngine } from '@/lib/ai/BlindRecommendationEngine';
import { ProductService } from '@/lib/services/ProductService';
import { getPool } from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

interface DetectedWindow {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  lightingCondition: 'bright' | 'normal' | 'dim';
  windowType?: 'standard' | 'wide' | 'patio_door' | 'bay';
  measurements?: {
    estimatedWidth: number;
    estimatedHeight: number;
    unit: 'inches' | 'cm';
  };
}

interface CalibrationData {
  method: 'reference-object' | 'known-dimension' | 'manual';
  pixelsPerInch: number;
  referenceWidth?: number;
  referenceHeight?: number;
}

export class AIHandler extends BaseHandler {
  protected serviceName = 'ai';

  async routeAction(req: NextRequest, action: string[]): Promise<NextResponse> {
    const actionName = action[0];
    const user = await this.getCurrentUser(req);

    switch (actionName) {
      case 'analyze-room':
        return this.analyzeRoom(req, user);

      case 'recommend-blinds':
        return this.recommendBlinds(req, user);

      case 'save-measurement':
        return this.saveMeasurement(req, user);

      case 'get-measurements':
        return this.getUserMeasurements(req, user);

      default:
        throw new ApiError(`Unknown action: ${actionName}`, 404);
    }
  }

  /**
   * POST /api/v2/ai/analyze-room
   * Analyze room image and provide window detection + recommendations
   */
  private async analyzeRoom(req: NextRequest, user: any) {
    try {
      const body = await req.json();
      const { imageData, roomType, calibrationData } = body;

      if (!imageData) {
        throw new ApiError('Image data is required', 400);
      }

      // Validate base64 image
      if (!imageData.startsWith('data:image/')) {
        throw new ApiError('Invalid image format', 400);
      }

      // In a real implementation, this would:
      // 1. Run TensorFlow.js COCO-SSD model
      // 2. Detect windows and doors
      // 3. Analyze lighting and colors
      // 4. Classify room type

      // For now, return a structured response that the frontend expects
      const response = {
        success: true,
        data: {
          message: 'Room analysis complete. Window detection is handled client-side by TensorFlow.js',
          note: 'Upload your room photo in the AI Room Visualizer to detect windows and get recommendations'
        }
      };

      return this.success(response);
    } catch (error) {
      console.error('Error analyzing room:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to analyze room', 500);
    }
  }

  /**
   * POST /api/v2/ai/recommend-blinds
   * Get blind recommendations for detected windows
   */
  private async recommendBlinds(req: NextRequest, user: any) {
    try {
      const body = await req.json();
      const { windows, roomType, budget, preferredStyles } = body;

      if (!windows || !Array.isArray(windows) || windows.length === 0) {
        throw new ApiError('Windows array is required', 400);
      }

      if (!roomType) {
        throw new ApiError('Room type is required', 400);
      }

      const productService = new ProductService();
      const recommendations: any[] = [];

      // Process each window
      for (let i = 0; i < windows.length; i++) {
        const window = windows[i] as DetectedWindow;

        if (!window.measurements) {
          continue; // Skip windows without measurements
        }

        // Get products that fit this window's dimensions
        const products = await productService.getRecommendedProducts({
          minWidth: window.measurements.estimatedWidth,
          maxWidth: window.measurements.estimatedWidth,
          minHeight: window.measurements.estimatedHeight,
          maxHeight: window.measurements.estimatedHeight,
          roomType,
          lightingCondition: window.lightingCondition,
          budget
        });

        // Score and rank products
        const windowRecs = BlindRecommendationEngine.recommendProducts(
          products,
          {
            window,
            roomType,
            budget,
            preferredStyles
          }
        );

        // Add window index to each recommendation
        windowRecs.forEach(rec => {
          rec.window_index = i;
        });

        recommendations.push(...windowRecs);
      }

      return this.success({
        recommendations,
        total: recommendations.length
      });
    } catch (error) {
      console.error('Error recommending blinds:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to generate recommendations', 500);
    }
  }

  /**
   * POST /api/v2/ai/save-measurement
   * Save window measurements for future reference
   */
  private async saveMeasurement(req: NextRequest, user: any) {
    if (!user) {
      throw new ApiError('Authentication required', 401);
    }

    try {
      const body = await req.json();
      const { roomName, windows, imageData } = body;

      if (!windows || !Array.isArray(windows) || windows.length === 0) {
        throw new ApiError('At least one window measurement is required', 400);
      }

      const pool = await getPool();
      const savedMeasurements: any[] = [];

      // Save each window measurement
      for (const window of windows) {
        const { width, height, location, notes, windowType, calibrationMethod, confidenceScore } = window;

        if (!width || !height) {
          continue;
        }

        const [result] = await pool.execute<ResultSetHeader>(
          `INSERT INTO saved_measurements
           (user_id, room_name, location_description, width, height, window_type, notes, image_data, calibration_method, confidence_score)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user.user_id,
            roomName || null,
            location || null,
            width,
            height,
            windowType || 'standard',
            notes || null,
            imageData || null,
            calibrationMethod || null,
            confidenceScore || null
          ]
        );

        savedMeasurements.push({
          measurement_id: result.insertId,
          width,
          height,
          windowType: windowType || 'standard'
        });
      }

      return this.success({
        message: `Saved ${savedMeasurements.length} window measurement(s)`,
        measurements: savedMeasurements
      });
    } catch (error) {
      console.error('Error saving measurements:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to save measurements', 500);
    }
  }

  /**
   * GET /api/v2/ai/get-measurements
   * Get user's saved measurements
   */
  private async getUserMeasurements(req: NextRequest, user: any) {
    if (!user) {
      throw new ApiError('Authentication required', 401);
    }

    try {
      const pool = await getPool();

      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT
           measurement_id,
           room_name,
           location_description,
           width,
           height,
           window_type,
           notes,
           created_at
         FROM saved_measurements
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 50`,
        [user.user_id]
      );

      return this.success({
        measurements: rows,
        total: rows.length
      });
    } catch (error) {
      console.error('Error fetching measurements:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch measurements', 500);
    }
  }
}

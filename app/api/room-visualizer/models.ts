import { z } from 'zod';

export const VisualizationRequestSchema = z.object({
  roomImage: z.string(),
  resultImage: z.string().optional(),
  productId: z.coerce.number(),
  userId: z.coerce.number(),
  placement: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    scale: z.number().default(1),
    rotation: z.number().default(0)
  }).optional()
});

export const VisualizationResponseSchema = z.object({
  id: z.string(),
  roomImage: z.string(),
  resultImage: z.string(),
  productId: z.number(),
  userId: z.number(),
  placement: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    scale: z.number(),
    rotation: z.number()
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type VisualizationRequest = z.infer<typeof VisualizationRequestSchema>;
export type VisualizationResponse = z.infer<typeof VisualizationResponseSchema>;

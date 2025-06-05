import { getPool } from '@/lib/db';
import type { VisualizationRequest } from './models';

interface PlacementData {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
}

export async function createRoomVisualization(
  userId: string,
  productId: string,
  roomImage: string,
  resultImage: string,
  placement: PlacementData
) {
  const pool = await getPool();
  
  const [result] = await pool.execute(
    `INSERT INTO room_visualizations 
     (user_id, product_id, room_image, result_image, placement) 
     VALUES (?, ?, ?, ?, ?)`,
    [userId, productId, roomImage, resultImage, JSON.stringify(placement)]
  );

  // Get the inserted visualization
  const [visualizations] = await pool.execute(
    `SELECT * FROM room_visualizations WHERE id = ?`,
    [(result as any).insertId]
  );

  return (visualizations as any[])[0];
}

export async function getRoomVisualizations(userId: string) {
  const pool = await getPool();
  
  const [visualizations] = await pool.execute(
    `SELECT * FROM room_visualizations WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );

  return visualizations as any[];
}

export async function getRoomVisualization(id: string) {
  const pool = await getPool();
  
  const [visualizations] = await pool.execute(
    `SELECT * FROM room_visualizations WHERE id = ?`,
    [id]
  );

  return (visualizations as any[])[0];
}

export async function deleteRoomVisualization(id: string, userId: string) {
  const pool = await getPool();
  
  await pool.execute(
    `DELETE FROM room_visualizations WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
}

export async function updateRoomVisualization(
  id: string,
  userId: string,
  data: Partial<VisualizationRequest>
) {
  const pool = await getPool();
  
  const updates: string[] = [];
  const values: any[] = [];

  if (data.placement) {
    updates.push('placement = ?');
    values.push(JSON.stringify(data.placement));
  }

  if (data.resultImage) {
    updates.push('result_image = ?');
    values.push(data.resultImage);
  }

  if (updates.length === 0) return;

  values.push(id, userId);

  await pool.execute(
    `UPDATE room_visualizations 
     SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ? AND user_id = ?`,
    values
  );

  return getRoomVisualization(id);
}

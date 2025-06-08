import { getPool } from '@/lib/db';
import type { VisualizationRequest } from './models';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

interface PlacementData {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
}

interface RoomVisualizationRow extends RowDataPacket {
  id: string;
  user_id: number;
  product_id: number;
  room_image: string;
  result_image: string;
  placement: string;
  created_at: Date;
  updated_at: Date;
}

export async function createRoomVisualization(
  userId: number,
  productId: number,
  roomImage: string,
  resultImage: string,
  placement: PlacementData
) {
  const pool = await getPool();
  
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO room_visualizations 
     (user_id, product_id, room_image, result_image, placement) 
     VALUES (?, ?, ?, ?, ?)`,
    [userId, productId, roomImage, resultImage, JSON.stringify(placement)]
  );

  // Get the inserted visualization
  const [visualizations] = await pool.execute<RoomVisualizationRow[]>(
    `SELECT * FROM room_visualizations WHERE id = ?`,
    [result.insertId]
  );

  return visualizations[0];
}

export async function getRoomVisualizations(userId: number) {
  const pool = await getPool();
  
  const [visualizations] = await pool.execute<RoomVisualizationRow[]>(
    `SELECT * FROM room_visualizations WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );

  return visualizations;
}

export async function getRoomVisualization(id: string) {
  const pool = await getPool();
  
  const [visualizations] = await pool.execute<RoomVisualizationRow[]>(
    `SELECT * FROM room_visualizations WHERE id = ?`,
    [id]
  );

  return visualizations[0];
}

export async function deleteRoomVisualization(id: string, userId: number) {
  const pool = await getPool();
  
  await pool.execute(
    `DELETE FROM room_visualizations WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
}

export async function updateRoomVisualization(
  id: string,
  userId: number,
  data: Partial<VisualizationRequest>
) {
  const pool = await getPool();
  
  const updates: string[] = [];
  const values: (string | number | PlacementData)[] = [];

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

-- Script to populate room_types table with default room types
-- Run this script to add the standard room types to the database

INSERT INTO room_types (name, description, is_active, created_at, updated_at) VALUES
('Living Room', 'Main living and entertainment area', 1, NOW(), NOW()),
('Bedroom', 'Private sleeping quarters', 1, NOW(), NOW()),
('Kitchen', 'Food preparation and dining area', 1, NOW(), NOW()),
('Bathroom', 'Personal hygiene and grooming space', 1, NOW(), NOW()),
('Dining Room', 'Formal dining area', 1, NOW(), NOW()),
('Home Office', 'Work from home space', 1, NOW(), NOW()),
('Media Room', 'Entertainment and media center', 1, NOW(), NOW()),
('Nursery', 'Baby or child room', 1, NOW(), NOW()),
('Sunroom', 'Light-filled indoor/outdoor space', 1, NOW(), NOW()),
('Basement', 'Lower level living space', 1, NOW(), NOW()),
('Garage', 'Vehicle storage and workshop area', 1, NOW(), NOW()),
('Patio/Outdoor', 'Outdoor living and entertainment space', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  description = VALUES(description),
  is_active = VALUES(is_active),
  updated_at = NOW();

-- Verify the insertion
SELECT * FROM room_types ORDER BY name;
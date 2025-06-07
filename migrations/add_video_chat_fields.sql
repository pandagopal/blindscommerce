-- Add video chat fields to consultations table
ALTER TABLE consultations
ADD COLUMN room_id VARCHAR(255) NULL,
ADD COLUMN meeting_link VARCHAR(255) NULL,
ADD COLUMN has_started BOOLEAN DEFAULT FALSE,
ADD COLUMN has_ended BOOLEAN DEFAULT FALSE,
ADD COLUMN actual_start_time TIMESTAMP NULL,
ADD COLUMN actual_end_time TIMESTAMP NULL;
-- Create consultation messages table
CREATE TABLE consultation_messages (
  message_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  consultation_id BIGINT NOT NULL,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (consultation_id) REFERENCES consultations(consultation_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Create consultation history table for tracking all actions
CREATE TABLE consultation_history (
  history_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  consultation_id BIGINT NOT NULL,
  user_id INT NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (consultation_id) REFERENCES consultations(consultation_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Add indexes for better query performance
CREATE INDEX idx_consultation_messages_consultation_id ON consultation_messages(consultation_id);
CREATE INDEX idx_consultation_history_consultation_id ON consultation_history(consultation_id);

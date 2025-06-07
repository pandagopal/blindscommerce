-- Create consultations table
CREATE TABLE IF NOT EXISTS consultations (
    consultation_id BIGINT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    consultant_id INT,
    status ENUM('pending', 'scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    consultation_type ENUM('measurement', 'installation', 'design', 'general') NOT NULL,
    preferred_date DATE,
    preferred_time_slot VARCHAR(50),
    timezone VARCHAR(50),
    consultation_mode ENUM('video', 'voice', 'chat', 'in_person') NOT NULL DEFAULT 'video',
    notes TEXT,
    duration_minutes INT DEFAULT 30,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    cancellation_reason TEXT,
    PRIMARY KEY (consultation_id),
    INDEX idx_user (user_id),
    INDEX idx_consultant (consultant_id),
    INDEX idx_status (status),
    INDEX idx_date (preferred_date),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (consultant_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create consultation_details table for storing specific consultation requirements
CREATE TABLE IF NOT EXISTS consultation_details (
    detail_id BIGINT NOT NULL AUTO_INCREMENT,
    consultation_id BIGINT NOT NULL,
    window_type VARCHAR(100),
    room_type VARCHAR(100),
    window_measurements JSON,
    product_interest JSON,
    design_preferences JSON,
    budget_range VARCHAR(50),
    property_type VARCHAR(100),
    measurement_photos JSON,
    room_photos JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (detail_id),
    FOREIGN KEY (consultation_id) REFERENCES consultations(consultation_id) ON DELETE CASCADE,
    INDEX idx_consultation (consultation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create consultation_notes table for tracking consultation progress
CREATE TABLE IF NOT EXISTS consultation_notes (
    note_id BIGINT NOT NULL AUTO_INCREMENT,
    consultation_id BIGINT NOT NULL,
    user_id INT NOT NULL,
    note_type ENUM('measurement', 'recommendation', 'follow_up', 'general') NOT NULL,
    content TEXT NOT NULL,
    attachments JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (note_id),
    FOREIGN KEY (consultation_id) REFERENCES consultations(consultation_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    INDEX idx_consultation (consultation_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create consultation_recommendations table
CREATE TABLE IF NOT EXISTS consultation_recommendations (
    recommendation_id BIGINT NOT NULL AUTO_INCREMENT,
    consultation_id BIGINT NOT NULL,
    consultant_id INT NOT NULL,
    product_id INT,
    recommendation_type ENUM('product', 'style', 'measurement', 'installation') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    specifications JSON,
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (recommendation_id),
    FOREIGN KEY (consultation_id) REFERENCES consultations(consultation_id) ON DELETE CASCADE,
    FOREIGN KEY (consultant_id) REFERENCES users(user_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    INDEX idx_consultation (consultation_id),
    INDEX idx_consultant (consultant_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create consultation_availability table
CREATE TABLE IF NOT EXISTS consultation_availability (
    availability_id BIGINT NOT NULL AUTO_INCREMENT,
    consultant_id INT NOT NULL,
    day_of_week TINYINT NOT NULL, -- 0 = Sunday, 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    consultation_type ENUM('measurement', 'installation', 'design', 'general') NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (availability_id),
    FOREIGN KEY (consultant_id) REFERENCES users(user_id),
    INDEX idx_consultant (consultant_id),
    INDEX idx_day_time (day_of_week, start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create consultation_ratings table
CREATE TABLE IF NOT EXISTS consultation_ratings (
    rating_id BIGINT NOT NULL AUTO_INCREMENT,
    consultation_id BIGINT NOT NULL,
    user_id INT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (rating_id),
    FOREIGN KEY (consultation_id) REFERENCES consultations(consultation_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    UNIQUE KEY unique_consultation_rating (consultation_id, user_id),
    INDEX idx_consultation (consultation_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
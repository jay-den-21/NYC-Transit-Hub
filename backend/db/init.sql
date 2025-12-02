-- Create database and tables for NYC_transit
CREATE DATABASE IF NOT EXISTS `NYC_transit` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `NYC_transit`;

-- Stores each vehicle observation from a feed snapshot
DROP TABLE IF EXISTS feed_vehicle_positions;
CREATE TABLE IF NOT EXISTS feed_vehicle_positions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  feed_id VARCHAR(20) NOT NULL,
  vehicle_id VARCHAR(64) NOT NULL,
  route_id VARCHAR(20),
  stop_id VARCHAR(64),
  stop_name VARCHAR(128),
  current_status VARCHAR(32),
  direction_id TINYINT,
  vehicle_timestamp DATETIME NULL,
  lat DOUBLE NULL,
  lon DOUBLE NULL,
  speed_mph DOUBLE NULL,
  label VARCHAR(128),
  is_estimated_position TINYINT(1) NOT NULL DEFAULT 0,
  captured_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_feed_captured (feed_id, captured_at),
  INDEX idx_feed_vehicle_time (feed_id, vehicle_id, vehicle_timestamp)
) ENGINE=InnoDB;

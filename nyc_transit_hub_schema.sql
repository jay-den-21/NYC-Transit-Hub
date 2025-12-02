-- =====================================================================
-- NYC Transit Hub  •  MySQL 8.0 schema
-- Engine: InnoDB, Charset: utf8mb4
-- =====================================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1) Reference tables
-- ---------------------------------------------------------------------
CREATE TABLE LANGUAGE (
  language_code   VARCHAR(8)  NOT NULL,   -- e.g. 'en', 'es', 'zh'
  name            VARCHAR(64) NOT NULL,
  PRIMARY KEY (language_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE USER (
  user_id         VARCHAR(64) NOT NULL,   -- Firebase UID
  email           VARCHAR(254) NULL,
  display_name    VARCHAR(100) NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 2) Network topology: stations, routes, trips, stops
-- ---------------------------------------------------------------------
CREATE TABLE STATION (
  station_id      VARCHAR(32) NOT NULL,
  name_default    VARCHAR(128) NOT NULL,
  borough         VARCHAR(32)  NULL,
  lat             DECIMAL(9,6) NOT NULL,
  lon             DECIMAL(9,6) NOT NULL,
  PRIMARY KEY (station_id),
  CHECK (lat BETWEEN -90 AND 90),
  CHECK (lon BETWEEN -180 AND 180)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ROUTE (
  route_id        VARCHAR(32) NOT NULL,
  mode            VARCHAR(16) NOT NULL,   -- subway|bus|rail (could switch to INT route_type later)
  short_name      VARCHAR(32) NULL,
  long_name       VARCHAR(128) NULL,
  active          BOOLEAN      NOT NULL DEFAULT TRUE,
  PRIMARY KEY (route_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE TRIP (
  trip_id         VARCHAR(64) NOT NULL,
  route_id        VARCHAR(32) NOT NULL,
  headsign        VARCHAR(128) NULL,
  start_time      TIME         NULL,
  end_time        TIME         NULL,
  PRIMARY KEY (trip_id),
  KEY idx_trip_route (route_id, start_time),
  CONSTRAINT fk_trip_route
    FOREIGN KEY (route_id) REFERENCES ROUTE(route_id)
      ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE STOP (
  stop_id         VARCHAR(32) NOT NULL,
  station_id      VARCHAR(32) NOT NULL,
  name            VARCHAR(128) NULL,
  lat             DECIMAL(9,6) NOT NULL,
  lon             DECIMAL(9,6) NOT NULL,
  PRIMARY KEY (stop_id),
  KEY idx_stop_station (station_id),
  CHECK (lat BETWEEN -90 AND 90),
  CHECK (lon BETWEEN -180 AND 180),
  CONSTRAINT fk_stop_station
    FOREIGN KEY (station_id) REFERENCES STATION(station_id)
      ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Trip timetable (sequence-based PK + unique per stop)
CREATE TABLE STOP_TIME (
  trip_id         VARCHAR(64) NOT NULL,
  stop_sequence   INT         NOT NULL,
  stop_id         VARCHAR(32) NOT NULL,
  arrival_time    TIME        NULL,
  departure_time  TIME        NULL,
  PRIMARY KEY (trip_id, stop_sequence),
  UNIQUE KEY uq_trip_stop (trip_id, stop_id),
  KEY idx_stop_time_by_stop (stop_id, arrival_time),
  CONSTRAINT fk_stoptime_trip
    FOREIGN KEY (trip_id) REFERENCES TRIP(trip_id)
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_stoptime_stop
    FOREIGN KEY (stop_id) REFERENCES STOP(stop_id)
      ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 3) Live layers: service status, alerts, vehicle (latest)
-- ---------------------------------------------------------------------
CREATE TABLE SERVICE_STATUS (
  status_id       VARCHAR(64) NOT NULL,
  route_id        VARCHAR(32) NOT NULL,
  status          VARCHAR(32) NOT NULL,   -- GOOD|DELAYS|PLANNED_WORK...
  description     TEXT        NULL,
  reported_at     DATETIME    NOT NULL,
  PRIMARY KEY (status_id),
  KEY idx_status_route_time (route_id, reported_at),
  CONSTRAINT fk_status_route
    FOREIGN KEY (route_id) REFERENCES ROUTE(route_id)
      ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ALERT (
  alert_id        VARCHAR(64) NOT NULL,
  route_id        VARCHAR(32) NULL,
  station_id      VARCHAR(32) NULL,
  header          VARCHAR(256) NULL,
  description     TEXT        NULL,
  starts_at       DATETIME    NULL,
  ends_at         DATETIME    NULL,
  PRIMARY KEY (alert_id),
  KEY idx_alert_route (route_id, starts_at),
  KEY idx_alert_station (station_id, starts_at),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at),
  CONSTRAINT fk_alert_route
    FOREIGN KEY (route_id) REFERENCES ROUTE(route_id)
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_alert_station
    FOREIGN KEY (station_id) REFERENCES STATION(station_id)
      ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE VEHICLE (
  vehicle_id      VARCHAR(64) NOT NULL,
  route_id        VARCHAR(32) NOT NULL,
  current_stop_id VARCHAR(32) NULL,
  lat             DECIMAL(9,6) NOT NULL,
  lon             DECIMAL(9,6) NOT NULL,
  occupancy_status VARCHAR(32) NULL, -- e.g., MANY_SEATS|FULL
  last_update_ts  DATETIME     NOT NULL,
  PRIMARY KEY (vehicle_id),
  KEY idx_vehicle_route (route_id),
  KEY idx_vehicle_stop (current_stop_id),
  CHECK (lat BETWEEN -90 AND 90),
  CHECK (lon BETWEEN -180 AND 180),
  CONSTRAINT fk_vehicle_route
    FOREIGN KEY (route_id) REFERENCES ROUTE(route_id)
      ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_vehicle_stop
    FOREIGN KEY (current_stop_id) REFERENCES STOP(stop_id)
      ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 4) Accessibility & i18n
-- ---------------------------------------------------------------------
CREATE TABLE STATION_ACCESSIBILITY (
  access_id       VARCHAR(64) NOT NULL,
  station_id      VARCHAR(32) NOT NULL,
  feature         VARCHAR(16) NOT NULL,   -- ELEVATOR|ESCALATOR
  status          VARCHAR(16) NOT NULL,   -- AVAILABLE|OUTAGE|UNKNOWN
  last_reported_at DATETIME    NOT NULL,
  PRIMARY KEY (access_id),
  KEY idx_access_station (station_id, last_reported_at),
  CONSTRAINT fk_access_station
    FOREIGN KEY (station_id) REFERENCES STATION(station_id)
      ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ROUTE_NAME_I18N (
  route_id        VARCHAR(32) NOT NULL,
  language_code   VARCHAR(8)  NOT NULL,
  localized_name  VARCHAR(128) NOT NULL,
  PRIMARY KEY (route_id, language_code),
  CONSTRAINT fk_routei18n_route
    FOREIGN KEY (route_id) REFERENCES ROUTE(route_id)
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_routei18n_lang
    FOREIGN KEY (language_code) REFERENCES LANGUAGE(language_code)
      ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE STATION_NAME_I18N (
  station_id      VARCHAR(32) NOT NULL,
  language_code   VARCHAR(8)  NOT NULL,
  localized_name  VARCHAR(128) NOT NULL,
  PRIMARY KEY (station_id, language_code),
  CONSTRAINT fk_stationi18n_station
    FOREIGN KEY (station_id) REFERENCES STATION(station_id)
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_stationi18n_lang
    FOREIGN KEY (language_code) REFERENCES LANGUAGE(language_code)
      ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 5) User preferences, favorites, alert subscriptions
-- ---------------------------------------------------------------------
CREATE TABLE USER_PREFERENCE (
  user_id             VARCHAR(64) NOT NULL,
  default_language_code VARCHAR(8) NULL,
  home_station_id     VARCHAR(32) NULL,
  time_format         VARCHAR(8)  NULL,   -- '12h'|'24h'
  units               VARCHAR(8)  NULL,   -- 'imperial'|'metric'
  receive_push        BOOLEAN     NOT NULL DEFAULT TRUE,
  receive_email       BOOLEAN     NOT NULL DEFAULT FALSE,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_pref_user
    FOREIGN KEY (user_id) REFERENCES USER(user_id)
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_pref_lang
    FOREIGN KEY (default_language_code) REFERENCES LANGUAGE(language_code)
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_pref_home_station
    FOREIGN KEY (home_station_id) REFERENCES STATION(station_id)
      ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Favorites: either a route OR a station (XOR enforced via CHECK)
CREATE TABLE USER_FAVORITE (
  favorite_id     VARCHAR(64) NOT NULL,
  user_id         VARCHAR(64) NOT NULL,
  fav_type        VARCHAR(16) NOT NULL,     -- 'ROUTE'|'STATION'
  route_id        VARCHAR(32) NULL,
  station_id      VARCHAR(32) NULL,
  created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (favorite_id),
  UNIQUE KEY uq_user_fav (user_id, fav_type, route_id, station_id),
  CHECK ( (route_id IS NOT NULL) <> (station_id IS NOT NULL) ),
  CONSTRAINT fk_fav_user
    FOREIGN KEY (user_id) REFERENCES USER(user_id)
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_fav_route
    FOREIGN KEY (route_id) REFERENCES ROUTE(route_id)
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_fav_station
    FOREIGN KEY (station_id) REFERENCES STATION(station_id)
      ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Alert subscriptions: route XOR station + preferred language
CREATE TABLE USER_ALERT_SUBSCRIPTION (
  subscription_id VARCHAR(64) NOT NULL,
  user_id         VARCHAR(64) NOT NULL,
  route_id        VARCHAR(32) NULL,
  station_id      VARCHAR(32) NULL,
  language_code   VARCHAR(8)  NULL,
  active          BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (subscription_id),
  UNIQUE KEY uq_user_sub (user_id, route_id, station_id, language_code),
  CHECK ( (route_id IS NOT NULL) <> (station_id IS NOT NULL) ),
  CONSTRAINT fk_sub_user
    FOREIGN KEY (user_id) REFERENCES USER(user_id)
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_sub_route
    FOREIGN KEY (route_id) REFERENCES ROUTE(route_id)
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_sub_station
    FOREIGN KEY (station_id) REFERENCES STATION(station_id)
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_sub_lang
    FOREIGN KEY (language_code) REFERENCES LANGUAGE(language_code)
      ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

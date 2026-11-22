CREATE TABLE households (
  id TEXT PRIMARY KEY,
  invite_code TEXT NOT NULL UNIQUE,
  created_by TEXT,
  settings TEXT NOT NULL,
  empty_since TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  household_id TEXT REFERENCES households(id),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX users_household ON users(household_id);

CREATE TABLE profiles (
  user_id TEXT PRIMARY KEY,
  data TEXT NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  user_agent TEXT
);
CREATE INDEX sessions_user ON sessions(user_id);

CREATE TABLE tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  payload TEXT,
  expires_at TEXT NOT NULL
);

CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL
);

CREATE TABLE recipes (
  household_id TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  starter_key TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (household_id, id)
);

CREATE TABLE plan (
  household_id TEXT NOT NULL,
  id TEXT NOT NULL,
  date TEXT NOT NULL,
  slot TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (household_id, id),
  UNIQUE (household_id, date, slot)
);

CREATE TABLE logs (
  household_id TEXT NOT NULL,
  id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (household_id, id)
);
CREATE INDEX logs_date ON logs(household_id, date);

CREATE TABLE pantry (
  household_id TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (household_id, id)
);

CREATE TABLE manual (
  household_id TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (household_id, id)
);

CREATE TABLE feedback (
  household_id TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (household_id, id)
);

CREATE TABLE push_subs (
  endpoint TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  household_id TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX push_user ON push_subs(user_id);

CREATE TABLE reminder_log (
  household_id TEXT NOT NULL,
  key TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  PRIMARY KEY (household_id, key)
);

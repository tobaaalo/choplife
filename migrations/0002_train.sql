CREATE TABLE train (
  household_id TEXT NOT NULL,
  id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  date TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (household_id, id)
);
CREATE INDEX train_user ON train(household_id, user_id, date);

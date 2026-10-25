-- Additive and idempotent. Never modify Contrail tables or OAuth namespaces.
CREATE TABLE IF NOT EXISTS blento_og_budget (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  used INTEGER NOT NULL,
  lease_token TEXT NOT NULL,
  lease_until INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS blento_og_actor_budget (
  actor TEXT PRIMARY KEY,
  next_allowed_at INTEGER NOT NULL
);

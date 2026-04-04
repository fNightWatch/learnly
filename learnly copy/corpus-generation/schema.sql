PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS agent_registry (
  role TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  prompt_file TEXT NOT NULL,
  agent_id TEXT,
  nickname TEXT,
  model TEXT NOT NULL,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS words (
  id TEXT PRIMARY KEY,
  lang TEXT NOT NULL,
  lemma TEXT NOT NULL,
  display_form TEXT NOT NULL,
  pos TEXT NOT NULL,
  rank INTEGER NOT NULL,
  pronunciation TEXT,
  primary_gloss TEXT NOT NULL,
  secondary_glosses_json TEXT NOT NULL,
  notes TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS examples (
  id TEXT PRIMARY KEY,
  word_id TEXT NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  sentence TEXT NOT NULL,
  translation TEXT NOT NULL,
  meaning_en TEXT NOT NULL DEFAULT '',
  difficulty INTEGER NOT NULL,
  source TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidate_logs (
  row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  source TEXT NOT NULL,
  sentence TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  naturalness INTEGER,
  clarity INTEGER,
  vocab_level INTEGER,
  memorability INTEGER,
  correctness INTEGER,
  final REAL,
  difficulty INTEGER,
  flag TEXT,
  rejected INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS batch_checkpoints (
  batch_number INTEGER PRIMARY KEY,
  batch_size INTEGER NOT NULL,
  last_rank INTEGER NOT NULL,
  completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS source_datasets (
  dataset_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lang TEXT NOT NULL,
  kind TEXT NOT NULL,
  source_file TEXT NOT NULL,
  worksheet_name TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS source_translation_seeds (
  dataset_id TEXT NOT NULL REFERENCES source_datasets(dataset_id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  display_form TEXT NOT NULL,
  pronunciation TEXT NOT NULL,
  pos TEXT NOT NULL,
  primary_gloss TEXT NOT NULL,
  secondary_glosses_json TEXT NOT NULL,
  notes TEXT NOT NULL,
  ready_for_generation INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (dataset_id, rank)
);

CREATE TABLE IF NOT EXISTS audit_runs (
  row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  dataset_id TEXT NOT NULL REFERENCES source_datasets(dataset_id) ON DELETE CASCADE,
  audit_name TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  seed_count INTEGER NOT NULL,
  word_count INTEGER NOT NULL,
  example_count INTEGER NOT NULL,
  issue_count INTEGER NOT NULL,
  bad_example_count_words INTEGER NOT NULL,
  bad_primary_count_words INTEGER NOT NULL,
  lexicon_failures INTEGER NOT NULL,
  missing_lemma INTEGER NOT NULL,
  same_word_duplicate_sentences INTEGER NOT NULL,
  same_word_duplicate_translations INTEGER NOT NULL,
  cross_word_duplicate_sentence_groups INTEGER NOT NULL,
  cross_word_duplicate_translation_groups INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_issues (
  row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_run_id INTEGER NOT NULL REFERENCES audit_runs(row_id) ON DELETE CASCADE,
  dataset_id TEXT NOT NULL REFERENCES source_datasets(dataset_id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL,
  word_id TEXT,
  example_id TEXT,
  rank INTEGER,
  sentence TEXT NOT NULL DEFAULT '',
  translation TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_words_rank ON words(rank);
CREATE INDEX IF NOT EXISTS idx_examples_word_id ON examples(word_id);
CREATE INDEX IF NOT EXISTS idx_candidate_logs_word_id ON candidate_logs(word_id);
CREATE INDEX IF NOT EXISTS idx_source_translation_seeds_display_form ON source_translation_seeds(display_form);
CREATE INDEX IF NOT EXISTS idx_audit_runs_dataset_created_at ON audit_runs(dataset_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_issues_audit_run_id ON audit_issues(audit_run_id);
CREATE INDEX IF NOT EXISTS idx_audit_issues_dataset_issue_type ON audit_issues(dataset_id, issue_type);

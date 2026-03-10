-- 单表单行设计：全量 JSON 存储，适合小型个人应用
CREATE TABLE IF NOT EXISTS app_data (
  id         INTEGER PRIMARY KEY DEFAULT 1,
  payload    TEXT    NOT NULL,
  updated_at TEXT    NOT NULL
);

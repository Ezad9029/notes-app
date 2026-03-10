import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("notes.db");

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  pinned: number; // 1 = pinned, 0 = not pinned (SQLite has no boolean)
}

// Call once on app start — adds pinned column safely if upgrading from old version
export const initDatabase = (): void => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      pinned INTEGER DEFAULT 0
    );
  `);

  // Safely add pinned column for existing users who already have the DB
  try {
    db.execSync(`ALTER TABLE notes ADD COLUMN pinned INTEGER DEFAULT 0;`);
  } catch (_) {
    // Column already exists — safe to ignore
  }
};

// Fetch all notes — pinned first, then by updatedAt
export const getNotes = (): Note[] => {
  return db.getAllSync<Note>(
    "SELECT * FROM notes ORDER BY pinned DESC, updatedAt DESC;"
  );
};

export const addNote = (title: string, content: string): void => {
  const now = new Date().toISOString();
  const id = now + Math.random().toString(36).slice(2);
  db.runSync(
    "INSERT INTO notes (id, title, content, createdAt, updatedAt, pinned) VALUES (?, ?, ?, ?, ?, 0);",
    [id, title, content, now, now]
  );
};

export const updateNote = (id: string, title: string, content: string): void => {
  const now = new Date().toISOString();
  db.runSync(
    "UPDATE notes SET title = ?, content = ?, updatedAt = ? WHERE id = ?;",
    [title, content, now, id]
  );
};

export const togglePin = (id: string, currentlyPinned: number): void => {
  db.runSync("UPDATE notes SET pinned = ? WHERE id = ?;", [
    currentlyPinned ? 0 : 1,
    id,
  ]);
};

export const deleteNote = (id: string): void => {
  db.runSync("DELETE FROM notes WHERE id = ?;", [id]);
};
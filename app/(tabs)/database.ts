import * as SQLite from "expo-sqlite";

// Open (or create) the database
const db = SQLite.openDatabaseSync("notes.db");

// Note interface - same as your existing one
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Call this once when the app starts to create the table if it doesn't exist
export const initDatabase = (): void => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
};

// Fetch all notes, newest first
export const getNotes = (): Note[] => {
  return db.getAllSync<Note>(
    "SELECT * FROM notes ORDER BY updatedAt DESC;"
  );
};

// Add a new note
export const addNote = (title: string, content: string): void => {
  const now = new Date().toISOString();
  const id = now + Math.random().toString(36).slice(2); // simple unique id
  db.runSync(
    "INSERT INTO notes (id, title, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?);",
    [id, title, content, now, now]
  );
};

// Update an existing note
export const updateNote = (id: string, title: string, content: string): void => {
  const now = new Date().toISOString();
  db.runSync(
    "UPDATE notes SET title = ?, content = ?, updatedAt = ? WHERE id = ?;",
    [title, content, now, id]
  );
};

// Delete a note
export const deleteNote = (id: string): void => {
  db.runSync("DELETE FROM notes WHERE id = ?;", [id]);
};
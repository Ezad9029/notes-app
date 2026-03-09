import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
  StatusBar,
} from "react-native";
import {
  Note,
  initDatabase,
  getNotes,
  addNote,
  updateNote,
  deleteNote,
} from "./database"; // adjust path if needed e.g. "../database"

export default function Index() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const systemTheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemTheme === "dark");

  // Initialize DB and load notes on first render
  useEffect(() => {
    initDatabase();
    loadNotes();
  }, []);

  const loadNotes = () => {
    const data = getNotes();
    setNotes(data);
  };

  const saveNote = () => {
    if (!title.trim() || !content.trim()) return;

    if (editingNote) {
      updateNote(editingNote.id, title, content);
    } else {
      addNote(title, content);
    }

    loadNotes(); // refresh the list
    setModalVisible(false);
    setTitle("");
    setContent("");
    setEditingNote(null);
  };

  const openAddModal = () => {
    setEditingNote(null);
    setTitle("");
    setContent("");
    setModalVisible(true);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteNote(id);
    loadNotes();
    setModalVisible(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const theme = {
    background: isDark ? "#121212" : "#f5f5f5",
    card: isDark ? "#1e1e1e" : "#ffffff",
    text: isDark ? "#ffffff" : "#000000",
    subText: isDark ? "#aaaaaa" : "#666666",
    border: isDark ? "#333333" : "#dddddd",
    primary: "#6200ee",
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.card, borderBottomColor: theme.border },
        ]}
      >
        <TouchableOpacity style={styles.iconButton}>
          <Text style={{ fontSize: 22, color: theme.text }}>☰</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          My Notes
        </Text>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setIsDark(!isDark)}
        >
          <Text style={{ fontSize: 20 }}>{isDark ? "☀️" : "🌙"}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.noteCard, { backgroundColor: theme.card }]}
            onPress={() => openEditModal(item)}
          >
            <Text style={[styles.noteTitle, { color: theme.text }]}>
              {item.title}
            </Text>
            <Text
              style={[styles.noteContent, { color: theme.subText }]}
              numberOfLines={2}
            >
              {item.content}
            </Text>
            <Text style={[styles.dateText, { color: theme.subText }]}>
              {item.updatedAt !== item.createdAt
                ? `${formatDate(item.updatedAt)} `
                : formatDate(item.createdAt)}
              {item.updatedAt !== item.createdAt && (
                <Text style={styles.editedText}> (edited)</Text>
              )}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Floating Button */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingNote ? "Edit Note" : "Add Note"}
            </Text>

            <TextInput
              style={[
                styles.input,
                { borderColor: theme.border, color: theme.text },
              ]}
              placeholder="Title"
              placeholderTextColor={theme.subText}
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={[
                styles.input,
                {
                  height: 100,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="Write your note..."
              placeholderTextColor={theme.subText}
              value={content}
              onChangeText={setContent}
              multiline
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              {editingNote && (
                <TouchableOpacity
                  style={[styles.button, styles.deleteButton]}
                  onPress={() => handleDelete(editingNote.id)}
                >
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={saveNote}
              >
                <Text style={styles.buttonText}>
                  {editingNote ? "Update" : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  iconButton: {
    width: 40,
    alignItems: "center",
  },
  noteCard: {
    padding: 18,
    borderRadius: 14,
    marginBottom: 18,
    elevation: 3,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  noteContent: {
    fontSize: 14,
  },
  dateText: {
    fontSize: 11,
    marginTop: 4,
  },
  editedText: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#6200ee",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },
  fabText: {
    color: "white",
    fontSize: 28,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    padding: 12,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 4,
  },
  saveButton: {
    backgroundColor: "#6200ee",
  },
  deleteButton: {
    backgroundColor: "#e53935",
  },
  cancelButton: {
    backgroundColor: "#888",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

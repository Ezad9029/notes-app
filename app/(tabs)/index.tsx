import React, { useEffect, useState, useMemo } from "react";
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
} from "./database";

export default function Index() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const systemTheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemTheme === "dark");

  useEffect(() => {
    initDatabase();
    loadNotes();
  }, []);

  const loadNotes = () => {
    const data = getNotes();
    setNotes(data);
  };

  // Filter notes in real-time as user types — no extra DB calls needed
  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return notes;
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
    );
  }, [searchQuery, notes]);

  const saveNote = () => {
    if (!title.trim() || !content.trim()) return;
    if (editingNote) {
      updateNote(editingNote.id, title, content);
    } else {
      addNote(title, content);
    }
    loadNotes();
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

  const handleCancelSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
  };

  // Highlights matching text inside note cards
  const HighlightText = ({
    text,
    query,
    style,
    numberOfLines,
  }: {
    text: string;
    query: string;
    style: any;
    numberOfLines?: number;
  }) => {
    if (!query.trim()) {
      return (
        <Text style={style} numberOfLines={numberOfLines}>
          {text}
        </Text>
      );
    }
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <Text key={i} style={[style, styles.highlight]}>
              {part}
            </Text>
          ) : (
            <Text key={i}>{part}</Text>
          )
        )}
      </Text>
    );
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
    searchBg: isDark ? "#2a2a2a" : "#efefef",
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
        {isSearching ? (
          // Search mode — replaces entire header
          <>
            <TextInput
              style={[
                styles.searchInput,
                { backgroundColor: theme.searchBg, color: theme.text },
              ]}
              placeholder="Search notes..."
              placeholderTextColor={theme.subText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity
              style={styles.cancelSearchBtn}
              onPress={handleCancelSearch}
            >
              <Text style={{ color: theme.primary, fontWeight: "600" }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          // Normal header
          <>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={{ fontSize: 22, color: theme.text }}>☰</Text>
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { color: theme.text }]}>
              My Notes
            </Text>

            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setIsSearching(true)}
              >
                <Text style={{ fontSize: 20 }}>🔍</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setIsDark(!isDark)}
              >
                <Text style={{ fontSize: 20 }}>{isDark ? "☀️" : "🌙"}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Result count — only shown while actively searching */}
      {isSearching && searchQuery.trim().length > 0 && (
        <Text style={[styles.resultCount, { color: theme.subText }]}>
          {filteredNotes.length === 0
            ? "No notes found"
            : `${filteredNotes.length} note${filteredNotes.length !== 1 ? "s" : ""} found`}
        </Text>
      )}

      {/* Notes List */}
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.subText }]}>
              {isSearching
                ? "😕 No matching notes"
                : "📝 No notes yet. Tap + to create one!"}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.noteCard, { backgroundColor: theme.card }]}
            onPress={() => openEditModal(item)}
          >
            <HighlightText
              text={item.title}
              query={searchQuery}
              style={[styles.noteTitle, { color: theme.text }]}
            />
            <HighlightText
              text={item.content}
              query={searchQuery}
              style={[styles.noteContent, { color: theme.subText }]}
              numberOfLines={2}
            />
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

      {/* FAB hidden while searching so it doesn't get in the way */}
      {!isSearching && (
        <TouchableOpacity style={styles.fab} onPress={openAddModal}>
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>
      )}

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
                { height: 100, borderColor: theme.border, color: theme.text },
              ]}
              placeholder="Write your note..."
              placeholderTextColor={theme.subText}
              value={content}
              onChangeText={setContent}
              multiline
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelBtnModal]}
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
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    width: 40,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  cancelSearchBtn: {
    marginLeft: 10,
    paddingHorizontal: 4,
  },
  resultCount: {
    fontSize: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  highlight: {
    backgroundColor: "#f0d000",
    color: "#000000",
    borderRadius: 3,
  },
  emptyContainer: {
    marginTop: 80,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
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
  cancelBtnModal: {
    backgroundColor: "#888",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  Animated,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  Dimensions,
} from "react-native";
import {
  Note,
  initDatabase,
  getNotes,
  addNote,
  updateNote,
  deleteNote,
} from "./database";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Theme ────────────────────────────────────────────────────────────────────
const THEME = {
  bg: "#0a0a0f",
  surface: "#111118",
  card: "#16161f",
  cardBorder: "#1e1e2e",
  accent: "#7c6af7",        // violet
  accentDim: "#2a2040",
  accentGlow: "rgba(124,106,247,0.15)",
  green: "#4ade80",
  red: "#f87171",
  text: "#e8e8f0",
  textDim: "#6b6b80",
  textMuted: "#3a3a50",
  inputBg: "#0e0e16",
};

// ─── Animated Note Card ───────────────────────────────────────────────────────
const NoteCard = ({
  item,
  index,
  onPress,
  searchQuery,
}: {
  item: Note;
  index: number;
  onPress: (note: Note) => void;
  searchQuery: string;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Staggered fade + slide in on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay: index * 60,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const HighlightText = ({
    text,
    style,
    numberOfLines,
  }: {
    text: string;
    style: any;
    numberOfLines?: number;
  }) => {
    if (!searchQuery.trim()) {
      return (
        <Text style={style} numberOfLines={numberOfLines}>
          {text}
        </Text>
      );
    }
    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {parts.map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <Text key={i} style={styles.highlight}>
              {part}
            </Text>
          ) : (
            <Text key={i}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  const isEdited = item.updatedAt !== item.createdAt;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      <Pressable
        onPress={() => onPress(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.noteCard}>
          {/* Left accent bar */}
          <View style={styles.noteAccentBar} />

          <View style={styles.noteBody}>
            <HighlightText
              text={item.title}
              style={styles.noteTitle}
            />
            <HighlightText
              text={item.content}
              style={styles.noteContent}
              numberOfLines={2}
            />
            <View style={styles.noteMeta}>
              <Text style={styles.dateText}>
                {formatDate(isEdited ? item.updatedAt : item.createdAt)}
              </Text>
              {isEdited && (
                <View style={styles.editedBadge}>
                  <Text style={styles.editedBadgeText}>edited</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function Index() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Modal slide animation
  const modalSlide = useRef(new Animated.Value(600)).current;
  const modalBgOpacity = useRef(new Animated.Value(0)).current;

  // FAB animation
  const fabScale = useRef(new Animated.Value(1)).current;

  // Search bar width animation
  const searchWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initDatabase();
    loadNotes();
  }, []);

  const loadNotes = () => {
    setNotes(getNotes());
  };

  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query)
    );
  }, [searchQuery, notes]);

  // ── Modal open/close ────────────────────────────────────────────────────────
  const openModal = () => {
    setModalVisible(true);
    Animated.parallel([
      Animated.timing(modalSlide, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.back(1.6)),
        useNativeDriver: true,
      }),
      Animated.timing(modalBgOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(modalSlide, {
        toValue: 600,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(modalBgOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      modalSlide.setValue(600);
      callback?.();
    });
  };

  const openAddModal = () => {
    setEditingNote(null);
    setTitle("");
    setContent("");
    openModal();
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    openModal();
  };

  const saveNote = () => {
    if (!title.trim() || !content.trim()) return;
    if (editingNote) {
      updateNote(editingNote.id, title, content);
    } else {
      addNote(title, content);
    }
    closeModal(() => {
      loadNotes();
      setTitle("");
      setContent("");
      setEditingNote(null);
    });
  };

  const handleDelete = () => {
    if (!editingNote) return;
    deleteNote(editingNote.id);
    closeModal(() => {
      loadNotes();
      setEditingNote(null);
    });
  };

  // ── Search toggle ───────────────────────────────────────────────────────────
  const openSearch = () => {
    setIsSearching(true);
    Animated.timing(searchWidth, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const closeSearch = () => {
    Animated.timing(searchWidth, {
      toValue: 0,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      setIsSearching(false);
      setSearchQuery("");
    });
  };

  const searchBarWidth = searchWidth.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_WIDTH - 110],
  });

  // ── FAB press ───────────────────────────────────────────────────────────────
  const handleFabPress = () => {
    Animated.sequence([
      Animated.timing(fabScale, {
        toValue: 0.88,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(fabScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 40,
        bounciness: 12,
      }),
    ]).start();
    openAddModal();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {!isSearching && (
            <>
              <View style={styles.logoMark} />
              <Text style={styles.headerTitle}>notes<Text style={styles.headerDot}>.</Text></Text>
            </>
          )}
        </View>

        <View style={styles.headerRight}>
          {/* Animated search bar */}
          {isSearching && (
            <Animated.View style={[styles.searchBarWrap, { width: searchBarWidth }]}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="search notes..."
                placeholderTextColor={THEME.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Text style={styles.clearBtn}>✕</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          )}

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={isSearching ? closeSearch : openSearch}
          >
            <Text style={[styles.headerBtnText, isSearching && { color: THEME.accent }]}>
              {isSearching ? "x" : "⌕"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search result count */}
      {isSearching && searchQuery.trim().length > 0 && (
        <Text style={styles.resultCount}>
          {filteredNotes.length === 0
            ? "no results"
            : `${filteredNotes.length} result${filteredNotes.length !== 1 ? "s" : ""}`}
        </Text>
      )}

      {/* ── Notes list ─────────────────────────────────────────────────────── */}
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>{isSearching ? "∅" : "◈"}</Text>
            <Text style={styles.emptyTitle}>
              {isSearching ? "nothing found" : "no notes yet"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isSearching
                ? `no notes match "${searchQuery}"`
                : "tap + to create your first note"}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <NoteCard
            item={item}
            index={index}
            onPress={openEditModal}
            searchQuery={searchQuery}
          />
        )}
      />

      {/* ── FAB ────────────────────────────────────────────────────────────── */}
      {!isSearching && (
        <Animated.View style={[styles.fabWrap, { transform: [{ scale: fabScale }] }]}>
          <TouchableOpacity style={styles.fab} onPress={handleFabPress} activeOpacity={1}>
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      <Modal visible={modalVisible} transparent statusBarTranslucent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Backdrop */}
          <Animated.View style={[styles.modalBackdrop, { opacity: modalBgOpacity }]}>
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={() => closeModal()}
            />
          </Animated.View>

          {/* Sheet */}
          <Animated.View
            style={[
              styles.modalSheet,
              { transform: [{ translateY: modalSlide }] },
            ]}
          >
            {/* Handle bar */}
            <View style={styles.sheetHandle} />

            <Text style={styles.modalTitle}>
              {editingNote ? "edit note" : "new note"}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="title"
              placeholderTextColor={THEME.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="write something..."
              placeholderTextColor={THEME.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              {editingNote && (
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                  <Text style={styles.deleteBtnText}>delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  (!title.trim() || !content.trim()) && styles.saveBtnDisabled,
                ]}
                onPress={saveNote}
                disabled={!title.trim() || !content.trim()}
              >
                <Text style={styles.saveBtnText}>
                  {editingNote ? "update" : "save"}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.cardBorder,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoMark: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: THEME.accent,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: THEME.text,
    letterSpacing: 1,
  },
  headerDot: {
    color: THEME.accent,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  headerBtnText: {
    color: THEME.textDim,
    fontSize: 16,
    fontWeight: "500",
  },

  // Search
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.accent,
    paddingHorizontal: 10,
    height: 36,
    overflow: "hidden",
  },
  searchIcon: {
    color: THEME.accent,
    fontSize: 16,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: THEME.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearBtn: {
    color: THEME.textDim,
    fontSize: 12,
    paddingLeft: 6,
  },
  resultCount: {
    color: THEME.textDim,
    fontSize: 11,
    paddingHorizontal: 20,
    paddingTop: 10,
    letterSpacing: 0.5,
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Note card
  noteCard: {
    flexDirection: "row",
    backgroundColor: THEME.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    overflow: "hidden",
  },
  noteAccentBar: {
    width: 3,
    backgroundColor: THEME.accent,
    opacity: 0.6,
  },
  noteBody: {
    flex: 1,
    padding: 14,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.text,
    marginBottom: 5,
    letterSpacing: 0.2,
  },
  noteContent: {
    fontSize: 13,
    color: THEME.textDim,
    lineHeight: 19,
    marginBottom: 10,
  },
  noteMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    fontSize: 10,
    color: THEME.textMuted,
    letterSpacing: 0.3,
  },
  editedBadge: {
    backgroundColor: THEME.accentDim,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  editedBadgeText: {
    fontSize: 9,
    color: THEME.accent,
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  highlight: {
    backgroundColor: "#f0d000",
    color: "#000",
    borderRadius: 2,
  },

  // Empty state
  emptyContainer: {
    alignItems: "center",
    paddingTop: 100,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 36,
    color: THEME.textMuted,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.textDim,
    letterSpacing: 0.5,
  },
  emptySubtitle: {
    fontSize: 13,
    color: THEME.textMuted,
    letterSpacing: 0.3,
  },

  // FAB
  fabWrap: {
    position: "absolute",
    bottom: 32,
    right: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: THEME.accent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 32,
  },

  // Modal
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalSheet: {
    backgroundColor: THEME.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: THEME.cardBorder,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.textMuted,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.text,
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: THEME.inputBg,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    borderRadius: 10,
    padding: 14,
    color: THEME.text,
    fontSize: 15,
    marginBottom: 12,
  },
  modalTextArea: {
    height: 120,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: THEME.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnDisabled: {
    opacity: 0.35,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  deleteBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "rgba(248,113,113,0.12)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.25)",
    alignItems: "center",
  },
  deleteBtnText: {
    color: THEME.red,
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
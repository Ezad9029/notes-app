import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  Dimensions,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";
import {
  Note,
  initDatabase,
  getNotes,
  addNote,
  updateNote,
  deleteNote,
  togglePin,
} from "./database";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = -80; // how far left to trigger delete reveal

// ─── Theme ────────────────────────────────────────────────────────────────────
const THEME = {
  bg: "#0a0a0f",
  surface: "#111118",
  card: "#16161f",
  cardBorder: "#1e1e2e",
  accent: "#7c6af7",
  accentDim: "#2a2040",
  green: "#4ade80",
  red: "#f87171",
  text: "#e8e8f0",
  textDim: "#6b6b80",
  textMuted: "#3a3a50",
  inputBg: "#0e0e16",
};

type SortOption = "newest" | "oldest" | "alphabetical";

// ─── Swipeable Note Card ──────────────────────────────────────────────────────
const NoteCard = ({
  item,
  index,
  onPress,
  onDelete,
  onTogglePin,
  searchQuery,
}: {
  item: Note;
  index: number;
  onPress: (note: Note) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, pinned: number) => void;
  searchQuery: string;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const swipeX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 55,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay: index * 55,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Swipe pan responder
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dy) < 20,
      onPanResponderMove: (_, g) => {
        // Only allow left swipe
        if (g.dx > 0) return;
        swipeX.setValue(g.dx);
        // Fade in delete action as user swipes
        deleteOpacity.setValue(Math.min(1, Math.abs(g.dx) / 80));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < SWIPE_THRESHOLD) {
          // Snap open to reveal delete
          Animated.spring(swipeX, {
            toValue: SWIPE_THRESHOLD,
            useNativeDriver: true,
            speed: 20,
            bounciness: 0,
          }).start();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
          // Snap back
          Animated.spring(swipeX, {
            toValue: 0,
            useNativeDriver: true,
            speed: 20,
            bounciness: 4,
          }).start();
          deleteOpacity.setValue(0);
        }
      },
    })
  ).current;

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

  const resetSwipe = () => {
    Animated.spring(swipeX, {
      toValue: 0,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
    deleteOpacity.setValue(0);
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel", onPress: resetSwipe },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onDelete(item.id);
        },
      },
    ]);
  };

  const handlePin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onTogglePin(item.id, item.pinned);
    resetSwipe();
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
      return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;
    }
    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {parts.map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <Text key={i} style={styles.highlight}>{part}</Text>
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
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      {/* Swipe action buttons revealed behind card */}
      <Animated.View style={[styles.swipeActions, { opacity: deleteOpacity }]}>
        <TouchableOpacity style={styles.pinAction} onPress={handlePin}>
          <Text style={styles.swipeActionIcon}>{item.pinned ? "📌" : "📍"}</Text>
          <Text style={styles.swipeActionLabel}>{item.pinned ? "unpin" : "pin"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteAction} onPress={handleDelete}>
          <Text style={styles.swipeActionIcon}>🗑</Text>
          <Text style={styles.swipeActionLabel}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* The card itself */}
      <Animated.View
        style={{ transform: [{ translateX: swipeX }, { scale: scaleAnim }] }}
        {...panResponder.panHandlers}
      >
        <Pressable
          onPress={() => {
            resetSwipe();
            onPress(item);
          }}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View style={[styles.noteCard, item.pinned === 1 && styles.noteCardPinned]}>
            {/* Left accent bar — gold if pinned, violet otherwise */}
            <View
              style={[
                styles.noteAccentBar,
                item.pinned === 1 && { backgroundColor: "#f59e0b" },
              ]}
            />
            <View style={styles.noteBody}>
              <View style={styles.noteTitleRow}>
                <HighlightText
                  text={item.title}
                  style={styles.noteTitle}
                />
                {item.pinned === 1 && (
                  <Text style={styles.pinIcon}>📌</Text>
                )}
              </View>
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
    </Animated.View>
  );
};

// ─── Sort Pill ────────────────────────────────────────────────────────────────
const SortPill = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.sortPill, active && styles.sortPillActive]}
    onPress={onPress}
  >
    <Text style={[styles.sortPillText, active && styles.sortPillTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function Index() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSort, setShowSort] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const modalSlide = useRef(new Animated.Value(600)).current;
  const modalBgOpacity = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(1)).current;
  const searchWidth = useRef(new Animated.Value(0)).current;
  const sortBarHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initDatabase();
    loadNotes();
  }, []);

  const loadNotes = () => setNotes(getNotes());

  // ── Sorting + filtering ─────────────────────────────────────────────────────
  const processedNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    let result = query
      ? notes.filter(
          (n) =>
            n.title.toLowerCase().includes(query) ||
            n.content.toLowerCase().includes(query)
        )
      : [...notes];

    // Pinned notes always float to top regardless of sort
    const pinned = result.filter((n) => n.pinned === 1);
    const unpinned = result.filter((n) => n.pinned === 0);

    const sort = (arr: Note[]) => {
      switch (sortBy) {
        case "newest":
          return arr.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        case "oldest":
          return arr.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "alphabetical":
          return arr.sort((a, b) => a.title.localeCompare(b.title));
      }
    };

    return [...sort(pinned), ...sort(unpinned)];
  }, [searchQuery, notes, sortBy]);

  // ── Modal ───────────────────────────────────────────────────────────────────
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteNote(editingNote.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          closeModal(() => {
            loadNotes();
            setEditingNote(null);
          });
        },
      },
    ]);
  };

  const handleTogglePin = (id: string, pinned: number) => {
    togglePin(id, pinned);
    loadNotes();
  };

  const handleDeleteFromSwipe = (id: string) => {
    deleteNote(id);
    loadNotes();
  };

  // ── Search ──────────────────────────────────────────────────────────────────
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

  // ── Sort bar toggle ─────────────────────────────────────────────────────────
  const toggleSort = () => {
    const next = !showSort;
    setShowSort(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(sortBarHeight, {
      toValue: next ? 48 : 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const handleSortSelect = (option: SortOption) => {
    setSortBy(option);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // ── FAB ─────────────────────────────────────────────────────────────────────
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    openAddModal();
  };

  const pinnedCount = notes.filter((n) => n.pinned === 1).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {!isSearching && (
            <>
              <View style={styles.logoMark} />
              <View>
                <Text style={styles.headerTitle}>
                  Notes<Text style={styles.headerDot}>.</Text>
                </Text>
                {/* Note count */}
                <Text style={styles.noteCount}>
                  {notes.length === 0
                    ? "empty"
                    : `${notes.length} note${notes.length !== 1 ? "s" : ""}${
                        pinnedCount > 0 ? ` · ${pinnedCount} pinned` : ""
                      }`}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.headerRight}>
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

          {!isSearching && (
            <TouchableOpacity style={styles.headerBtn} onPress={toggleSort}>
              <Text style={[styles.headerBtnText, showSort && { color: THEME.accent }]}>
                ⇅
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={isSearching ? closeSearch : openSearch}
          >
            <Text style={[styles.headerBtnText, isSearching && { color: THEME.accent }]}>
              {isSearching ? "Done" : "⌕"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Sort bar ───────────────────────────────────────────────────────── */}
      <Animated.View style={[styles.sortBar, { height: sortBarHeight, overflow: "hidden" }]}>
        <SortPill
          label="Newest"
          active={sortBy === "newest"}
          onPress={() => handleSortSelect("newest")}
        />
        <SortPill
          label="Oldest"
          active={sortBy === "oldest"}
          onPress={() => handleSortSelect("oldest")}
        />
        <SortPill
          label="A → Z"
          active={sortBy === "alphabetical"}
          onPress={() => handleSortSelect("alphabetical")}
        />
      </Animated.View>

      {/* Search result count */}
      {isSearching && searchQuery.trim().length > 0 && (
        <Text style={styles.resultCount}>
          {processedNotes.length === 0
            ? "no results"
            : `${processedNotes.length} result${processedNotes.length !== 1 ? "s" : ""}`}
        </Text>
      )}

      {/* ── Notes list ─────────────────────────────────────────────────────── */}
      <FlatList
        data={processedNotes}
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
            onDelete={handleDeleteFromSwipe}
            onTogglePin={handleTogglePin}
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
          <Animated.View style={[styles.modalBackdrop, { opacity: modalBgOpacity }]}>
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={() => closeModal()}
            />
          </Animated.View>

          <Animated.View
            style={[styles.modalSheet, { transform: [{ translateY: modalSlide }] }]}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>
              {editingNote ? "Edit Note" : "New Note"}
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

            {/* Pin toggle inside modal for editing */}
            {editingNote && (
              <TouchableOpacity
                style={styles.pinToggleRow}
                onPress={() => {
                  handleTogglePin(editingNote.id, editingNote.pinned);
                  setEditingNote({
                    ...editingNote,
                    pinned: editingNote.pinned ? 0 : 1,
                  });
                }}
              >
                <Text style={styles.pinToggleIcon}>
                  {editingNote.pinned ? "📌" : "📍"}
                </Text>
                <Text style={styles.pinToggleText}>
                  {editingNote.pinned ? "Unpin" : "Pin"}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.modalActions}>
              {editingNote && (
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
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
                  {editingNote ? "Update" : "Save"}
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
  container: { flex: 1, backgroundColor: THEME.bg },

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
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoMark: { width: 8, height: 8, borderRadius: 2, backgroundColor: THEME.accent },
  headerTitle: { fontSize: 22, fontWeight: "700", color: THEME.text, letterSpacing: 1 },
  headerDot: { color: THEME.accent },
  noteCount: { fontSize: 11, color: THEME.textDim, letterSpacing: 0.4, marginTop: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  headerBtnText: { color: THEME.textDim, fontSize: 16, fontWeight: "500" },

  // Sort bar
  sortBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.cardBorder,
  },
  sortPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  sortPillActive: {
    backgroundColor: THEME.accentDim,
    borderColor: THEME.accent,
  },
  sortPillText: { fontSize: 12, color: THEME.textDim, letterSpacing: 0.3 },
  sortPillTextActive: { color: THEME.accent, fontWeight: "600" },

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
  searchIcon: { color: THEME.accent, fontSize: 16, marginRight: 6 },
  searchInput: { flex: 1, color: THEME.text, fontSize: 14, paddingVertical: 0 },
  clearBtn: { color: THEME.textDim, fontSize: 12, paddingLeft: 6 },
  resultCount: {
    color: THEME.textDim,
    fontSize: 11,
    paddingHorizontal: 20,
    paddingTop: 10,
    letterSpacing: 0.5,
  },

  // List
  listContent: { padding: 16, paddingBottom: 100 },

  // Swipe actions
  swipeActions: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 12,
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
  },
  pinAction: {
    width: 72,
    backgroundColor: THEME.accentDim,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  deleteAction: {
    width: 72,
    backgroundColor: "rgba(248,113,113,0.15)",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  swipeActionIcon: { fontSize: 18 },
  swipeActionLabel: { fontSize: 10, color: THEME.textDim, letterSpacing: 0.3 },

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
  noteCardPinned: {
    borderColor: "rgba(245,158,11,0.3)",
  },
  noteAccentBar: { width: 3, backgroundColor: THEME.accent, opacity: 0.6 },
  noteBody: { flex: 1, padding: 14 },
  noteTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  noteTitle: { fontSize: 15, fontWeight: "700", color: THEME.text, letterSpacing: 0.2, flex: 1 },
  pinIcon: { fontSize: 13, marginLeft: 6 },
  noteContent: { fontSize: 13, color: THEME.textDim, lineHeight: 19, marginBottom: 10 },
  noteMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  dateText: { fontSize: 10, color: THEME.textMuted, letterSpacing: 0.3 },
  editedBadge: {
    backgroundColor: THEME.accentDim,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  editedBadgeText: { fontSize: 9, color: THEME.accent, letterSpacing: 0.5, fontWeight: "600" },
  highlight: { backgroundColor: "#f0d000", color: "#000", borderRadius: 2 },

  // Empty state
  emptyContainer: { alignItems: "center", paddingTop: 100, gap: 8 },
  emptyIcon: { fontSize: 36, color: THEME.textMuted, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: THEME.textDim, letterSpacing: 0.5 },
  emptySubtitle: { fontSize: 13, color: THEME.textMuted, letterSpacing: 0.3 },

  // FAB
  fabWrap: { position: "absolute", bottom: 32, right: 20 },
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
  fabText: { color: "#fff", fontSize: 28, fontWeight: "300", lineHeight: 32 },

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
  modalTextArea: { height: 120, lineHeight: 22 },
  pinToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  pinToggleIcon: { fontSize: 16 },
  pinToggleText: { fontSize: 14, color: THEME.textDim, letterSpacing: 0.3 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  saveBtn: {
    flex: 1,
    backgroundColor: THEME.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.35 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15, letterSpacing: 0.5 },
  deleteBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "rgba(248,113,113,0.12)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.25)",
    alignItems: "center",
  },
  deleteBtnText: { color: THEME.red, fontWeight: "600", fontSize: 15, letterSpacing: 0.5 },
});
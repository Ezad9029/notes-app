import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TextInput,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { DrawerActions } from "@react-navigation/native";
import { useTheme } from "@/app/context/ThemeContext";

interface AppHeaderProps {
  noteCount?: number | null;
  pinnedCount?: number;
  isSearching: boolean;
  searchQuery: string;
  searchBarWidth: Animated.AnimatedInterpolation<string | number>;
  onSearchOpen: () => void;
  onSearchClose: () => void;
  onSearchChange: (text: string) => void;
  onSearchClear: () => void;
  showSortBtn?: boolean;
  sortActive?: boolean;
  onSortToggle?: () => void;
  title?: string;
}

export default function AppHeader({
  noteCount = null,
  pinnedCount = 0,
  isSearching,
  searchQuery,
  searchBarWidth,
  onSearchOpen,
  onSearchClose,
  onSearchChange,
  onSearchClear,
  showSortBtn = false,
  sortActive = false,
  onSortToggle,
  title = "notes",
}: AppHeaderProps) {
  const navigation = useNavigation();
  const { theme } = useTheme(); // ← pulls from global context

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const countLabel =
    noteCount === null
      ? null
      : noteCount === 0
      ? "empty"
      : `${noteCount} note${noteCount !== 1 ? "s" : ""}${
          pinnedCount > 0 ? ` · ${pinnedCount} pinned` : ""
        }`;

  return (
    <>
      <StatusBar
        barStyle={theme.statusBar}
        backgroundColor={theme.bg}
      />
      <View style={[styles.header, { backgroundColor: theme.bg, borderBottomColor: theme.cardBorder }]}>
        {/* Left side */}
        <View style={styles.headerLeft}>
          {!isSearching && (
            <>
              {/* Burger button — opens drawer */}
              <TouchableOpacity style={styles.burgerBtn} onPress={openDrawer}>
                <View style={[styles.burgerLine, { backgroundColor: theme.textDim }]} />
                <View style={[styles.burgerLine, { width: 14, backgroundColor: theme.textDim }]} />
                <View style={[styles.burgerLine, { backgroundColor: theme.textDim }]} />
              </TouchableOpacity>

              <View>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                  {title}
                  <Text style={{ color: theme.accent }}>.</Text>
                </Text>
                {countLabel !== null && (
                  <Text style={[styles.noteCount, { color: theme.textDim }]}>
                    {countLabel}
                  </Text>
                )}
              </View>
            </>
          )}
        </View>

        {/* Right side */}
        <View style={styles.headerRight}>
          {isSearching && (
            <Animated.View
              style={[
                styles.searchBarWrap,
                {
                  width: searchBarWidth,
                  backgroundColor: theme.inputBg,
                  borderColor: theme.accent,
                },
              ]}
            >
              <Text style={[styles.searchIcon, { color: theme.accent }]}>⌕</Text>
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="search notes..."
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={onSearchChange}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={onSearchClear}>
                  <Text style={[styles.clearBtn, { color: theme.textDim }]}>✕</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          )}

          {showSortBtn && !isSearching && (
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
              onPress={onSortToggle}
            >
              <Text style={[styles.headerBtnText, { color: sortActive ? theme.accent : theme.textDim }]}>
                ⇅
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
            onPress={isSearching ? onSearchClose : onSearchOpen}
          >
            <Text style={[styles.headerBtnText, { color: isSearching ? theme.accent : theme.textDim }]}>
              {isSearching ? "done" : "⌕"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  burgerBtn: {
    gap: 5,
    paddingVertical: 4,
    paddingRight: 4,
    justifyContent: "center",
  },
  burgerLine: {
    width: 20,
    height: 2,
    borderRadius: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1,
  },
  noteCount: {
    fontSize: 11,
    letterSpacing: 0.4,
    marginTop: 1,
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
    borderWidth: 1,
  },
  headerBtnText: {
    fontSize: 16,
    fontWeight: "500",
  },
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 36,
    overflow: "hidden",
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearBtn: {
    fontSize: 12,
    paddingLeft: 6,
  },
});
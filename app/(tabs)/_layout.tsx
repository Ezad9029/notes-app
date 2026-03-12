import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { ThemeProvider, useTheme } from "@/app/context/ThemeContext";

// ─── Nav items — add new screens here ────────────────────────────────────────
const NAV_ITEMS = [
  { label: "Home", route: "/", icon: "◈" },
  { label: "Explore", route: "/explore", icon: "◎" },
  // To add a new screen:
  // 1. Create app/yourscreen.tsx
  // 2. Add { label: "Name", route: "/yourscreen", icon: "◉" } here
  // 3. Add <Drawer.Screen name="yourscreen" /> in DrawerLayout below
];

// ─── Custom Drawer Content ────────────────────────────────────────────────────
function CustomDrawer(props: any) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <DrawerContentScrollView
      {...props}
      scrollEnabled={false}
      contentContainerStyle={[
        styles.drawerContainer,
        { backgroundColor: theme.surface },
      ]}
    >
      {/* Sidebar header */}
      <View style={styles.drawerHeader}>
        <View style={[styles.logoMark, { backgroundColor: theme.accent }]} />
        <Text style={[styles.drawerTitle, { color: theme.text }]}>
          notes<Text style={{ color: theme.accent }}>.</Text>
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

      {/* Nav items */}
      <View style={styles.navItems}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.route ||
            (item.route === "/" && pathname === "/index");

          return (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.navItem,
                isActive && { backgroundColor: theme.accentDim },
              ]}
              onPress={() => {
                router.push(item.route as any);
                props.navigation.closeDrawer();
              }}
            >
              <Text
                style={[
                  styles.navIcon,
                  { color: isActive ? theme.accent : theme.textDim },
                ]}
              >
                {item.icon}
              </Text>
              <Text
                style={[
                  styles.navLabel,
                  {
                    color: isActive ? theme.text : theme.textDim,
                    fontWeight: isActive ? "700" : "500",
                  },
                ]}
              >
                {item.label}
              </Text>
              {isActive && (
                <View style={[styles.activeIndicator, { backgroundColor: theme.accent }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Dark mode toggle inside sidebar */}
      <View style={[styles.divider, { backgroundColor: theme.cardBorder, marginTop: 16 }]} />
      <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
        <Text style={[styles.navIcon, { color: theme.textDim }]}>
          {isDark ? "☀️" : "🌙"}
        </Text>
        <Text style={[styles.navLabel, { color: theme.textDim }]}>
          {isDark ? "Light Mode" : "Dark Mode"}
        </Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.drawerFooter}>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>
          notes app · v1.0
        </Text>
      </View>
    </DrawerContentScrollView>
  );
}

// ─── Inner layout (has access to ThemeProvider) ───────────────────────────────
function DrawerLayout() {
  const { theme } = useTheme();

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: theme.surface,
          width: 260,
          borderRightWidth: 1,
          borderRightColor: theme.cardBorder,
        },
        overlayColor: "rgba(0,0,0,0.6)",
        swipeEdgeWidth: 40,
      }}
    >
      <Drawer.Screen name="index" />
      <Drawer.Screen name="explore" />
    </Drawer>
  );
}

// ─── Root layout — ThemeProvider wraps everything ─────────────────────────────
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <DrawerLayout />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    paddingTop: 0,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 24,
  },
  logoMark: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  drawerTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  navItems: {
    paddingHorizontal: 12,
    gap: 4,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 14,
  },
  navIcon: {
    fontSize: 16,
  },
  navLabel: {
    fontSize: 15,
    letterSpacing: 0.3,
    flex: 1,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  themeToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 14,
  },
  drawerFooter: {
    position: "absolute",
    bottom: 32,
    left: 20,
  },
  footerText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
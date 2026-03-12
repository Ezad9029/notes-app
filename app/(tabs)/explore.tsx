import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
  StatusBar,
} from "react-native";
import { Feather, AntDesign } from "@expo/vector-icons";
import { useTheme } from "@/app/context/ThemeContext";

export default function ExplorePage() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={theme.statusBar}
        backgroundColor={theme.bg}
      />

      <Text style={[styles.title, { color: theme.text }]}>
        Explore My Profiles
      </Text>

      {/* LinkedIn */}
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.cardBorder },
        ]}
        onPress={() =>
          Linking.openURL("https://www.linkedin.com/in/ezad-sayyed-9b9b69209/")
        }
      >
        <AntDesign name="linkedin" size={24} color={theme.accent} />
        <Text style={[styles.text, { color: theme.text }]}>LinkedIn</Text>
      </TouchableOpacity>

      {/* GitHub */}
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.cardBorder },
        ]}
        onPress={() => Linking.openURL("https://github.com/Ezad9029")}
      >
        <Feather name="github" size={24} color={theme.accent} />
        <Text style={[styles.text, { color: theme.text }]}>GitHub</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 30,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: 18,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 3,
  },
  text: {
    fontSize: 16,
    fontWeight: "500",
  },
});
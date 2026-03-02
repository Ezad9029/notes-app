import React from "react";
import { View, Text, TouchableOpacity, Linking, StyleSheet } from "react-native";
import { Feather, AntDesign } from "@expo/vector-icons";

export default function ExplorePage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explore My Profiles</Text>

      {/* LinkedIn */}
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          Linking.openURL(
            "https://www.linkedin.com/in/ezad-sayyed-9b9b69209/"
          )
        }
      >
        <AntDesign name="linkedin" size={24} />
        <Text style={styles.text}>LinkedIn</Text>
      </TouchableOpacity>
      
      {/* GitHub */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => Linking.openURL("https://github.com/Ezad9029")}
      >
        <Feather name="github" size={24} />
        <Text style={styles.text}>GitHub</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
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
    backgroundColor: "white",
    padding: 18,
    borderRadius: 14,
    marginBottom: 16,
    elevation: 3,
  },
  text: {
    fontSize: 16,
    fontWeight: "500",
  },
});
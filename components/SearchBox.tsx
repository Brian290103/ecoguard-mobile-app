import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/lib/colors";

interface SearchBoxProps {
  onSearch: (query: string) => void;
  searching: boolean;
}

export default function SearchBox({ onSearch, searching }: SearchBoxProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <View style={styles.searchContainer}>
      <Ionicons name="search-outline" size={24} color={Colors.gray} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search by title, description, or ID..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <TouchableOpacity
        style={[
          styles.searchButton,
          (!searchQuery || searching) && styles.disabledButton,
        ]}
        onPress={() => onSearch(searchQuery)}
        disabled={!searchQuery || searching}
      >
        {searching ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.searchButtonText}>Search</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    elevation: 0.5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    minWidth: 80,
    alignItems: "center",
  },
  searchButtonText: {
    color: "#fff",
  },
  disabledButton: {
    backgroundColor: Colors.gray,
  },
});

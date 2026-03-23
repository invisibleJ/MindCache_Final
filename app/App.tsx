import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Note: You'll need to run: npx expo install lucide-react-native
// import { Search, Plus, Moon, Sun } from 'lucide-react-native';

export default function App() {
  // 1. All state must live INSIDE the component
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // 2. The return statement must contain ALL your UI elements
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>📝</Text>
          </View>
          <View>
            <Text style={styles.title}>MindCache</Text>
            <Text style={styles.subtitle}>PERSONAL KNOWLEDGE BASE</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Text>🌓</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, styles.primaryButton]}>
            <Text style={{ color: 'white' }}>➕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search notes..."
          placeholderTextColor="#71717A"
          value={searchQuery}
          onChangeText={setSearchQuery} // Note: onChangeText instead of onChange
        />
      </View>

      {/* Note List Area */}
      <ScrollView style={styles.scrollArea}>
        {/* We will map your notes here later! */}
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Ready to build the notes list!</Text>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

// 3. Standard React Native Styling (if not using NativeWind)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B', // Dark mode background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 40,
    height: 40,
    backgroundColor: '#6366F1',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 20,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    backgroundColor: '#27272A',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#6366F1',
  },
  searchContainer: {
    padding: 20,
  },
  searchInput: {
    height: 44,
    backgroundColor: '#18181B',
    borderColor: '#27272A',
    borderWidth: 1,
    borderRadius: 12,
    color: 'white',
    paddingHorizontal: 16,
  },
  scrollArea: {
    flex: 1,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#71717A',
  }
});
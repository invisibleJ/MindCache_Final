import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Button,
  Chip, Icon, Input, Overlay, ThemeProvider, createTheme
} from '@rneui/themed';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList, Image, Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View
} from 'react-native'; // Ensure Image is imported from react-native

type NoteType = string;
type ViewMode = 'active' | 'archived' | 'trash';
type ThemeMode = 'dark' | 'light';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  lastModified: number;
  createdAt: number;
  isPinned: boolean;
  isArchived: boolean;
  isDeleted?: boolean;
  type: NoteType;
}

const APP_CATEGORIES = ['Personal', 'Work', 'Diary', 'Ideas', 'Drafts', 'Urgent', 'Random', 'Debt', 'Secret'];
const DISPLAY_CATEGORIES = ['All', ...APP_CATEGORIES];

const formatDateTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const getTimeAgo = (timestamp: number) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
};

export default function Index() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState('Personal');
  const [isPinned, setIsPinned] = useState(false);

  const isDark = themeMode === 'dark';

  const colors = {
    accent: '#6366F1',
    brandNavy: '#1E293B',
    bg: isDark ? '#0F172A' : '#FDFCFB',
    card: isDark ? '#1E293B' : '#FFFFFF',
    text: isDark ? '#F1F5F9' : '#1E293B',
    subtext: isDark ? '#94A3B8' : '#64748B',
    border: isDark ? '#334155' : '#E2E8F0',
  };

  const theme = createTheme({
    mode: themeMode,
    lightColors: { primary: colors.accent, background: colors.bg },
    darkColors: { primary: colors.accent, background: colors.bg },
  });

  useEffect(() => { loadNotes(); }, []);

  const loadNotes = async () => {
    const saved = await AsyncStorage.getItem('mindcache_notes');
    if (saved) setNotes(JSON.parse(saved));
  };

  const saveNotes = async (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    await AsyncStorage.setItem('mindcache_notes', JSON.stringify(updatedNotes));
  };

  const handleOpenEditor = (note?: Note) => {
    if (note) {
      setActiveNote(note);
      setTitle(note.title);
      setContent(note.content);
      setNoteType(note.type || 'Personal');
      setIsPinned(note.isPinned);
    } else {
      setActiveNote(null);
      setTitle('');
      setContent('');
      setNoteType(selectedCategory === 'All' ? 'Personal' : selectedCategory);
      setIsPinned(false);
    }
    setIsEditing(true);
  };

  const handleSaveNote = () => {
    if (!title.trim() && !content.trim()) {
      setIsEditing(false);
      return;
    }
    const now = Date.now();
    const noteData: Note = {
      id: activeNote?.id || now.toString(),
      title: title || 'Untitled Entry',
      content,
      type: noteType,
      isPinned,
      isArchived: activeNote?.isArchived || false,
      isDeleted: activeNote?.isDeleted || false,
      tags: [noteType],
      lastModified: now,
      createdAt: activeNote?.createdAt || now,
    };
    const updated = activeNote ? notes.map(n => n.id === activeNote.id ? noteData : n) : [noteData, ...notes];
    saveNotes(updated);
    setIsEditing(false);
  };

  const handleRestore = (id: string) => {
    const updated = notes.map(n =>
      n.id === id ? { ...n, isDeleted: false, isArchived: false, isPinned: false, lastModified: Date.now() } : n
    );
    saveNotes(updated);
    Alert.alert("Success", "Note restored to active entries.");
  };

  const handleDelete = (id: string) => {
    const updated = notes.map(n =>
      n.id === id ? { ...n, isDeleted: true, isArchived: false, isPinned: false, lastModified: Date.now() } : n
    );
    saveNotes(updated);
    if (isEditing) setIsEditing(false);
  };

  const toggleArchive = (id: string) => {
    const updated = notes.map(n =>
      n.id === id ? { ...n, isArchived: !n.isArchived, isDeleted: false, isPinned: false, lastModified: Date.now() } : n
    );
    saveNotes(updated);
  };

  const togglePin = (id: string) => {
    Vibration.vibrate(50);
    const updated = notes.map(n =>
      n.id === id ? { ...n, isPinned: !n.isPinned, lastModified: Date.now() } : n
    );
    saveNotes(updated);
  };

  const filteredNotes = useMemo(() => {
    return notes
      .filter(n => {
        if (viewMode === 'trash') return n.isDeleted === true;
        if (viewMode === 'archived') return n.isArchived === true && !n.isDeleted;
        return !n.isArchived && !n.isDeleted;
      })
      .filter(n => selectedCategory === 'All' ? true : n.type === selectedCategory)
      .filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (a.isPinned === b.isPinned ? b.lastModified - a.lastModified : a.isPinned ? -1 : 1));
  }, [notes, viewMode, selectedCategory, searchQuery]);

  return (
    <ThemeProvider theme={theme}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <StatusBar style={isDark ? "light" : "dark"} />

        <View style={styles.backgroundFooter}>
          <View style={[styles.footerLine, { backgroundColor: colors.accent }]} />
          <Text style={[styles.footerText, { color: colors.subtext }]}>
            MINDCACHE <Text style={{ color: colors.accent }}>@2026</Text> // SAVED FROM THE SILENCE -J;)
          </Text>
        </View>

        <View style={styles.headerBranding}>
          <View style={styles.logoRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {/* INSERT THE LOGO HERE */}
              <Image
                source={require('../assets/images/logo.jpg')}
                style={styles.logoImage}
              />
              <View>
                <Text style={[styles.brandName, { color: isDark ? '#FFFFFF' : colors.brandNavy }]}>MindCache</Text>
                <Text style={[styles.brandTagline, { color: colors.accent }]}>A SANCTUARY FOR YOUR SILENT THOUGHTS</Text>
              </View>
            </View>
            <Pressable onPress={() => setThemeMode(isDark ? 'light' : 'dark')} style={[styles.themeToggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Icon name={isDark ? "sunny" : "moon"} type="ionicon" color={isDark ? "#FBBF24" : colors.accent} size={18} />
            </Pressable>
          </View>

          <Input
            placeholder="Search entries..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Icon name="search-outline" type="ionicon" color={colors.subtext} size={18} />}
            containerStyle={styles.searchContainer}
            inputContainerStyle={[styles.searchInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
            inputStyle={{ color: colors.text, fontSize: 14 }}
          />

          <View style={[styles.toggleWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {(['active', 'archived', 'trash'] as ViewMode[]).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => setViewMode(mode)}
                style={[styles.toggleBtn, viewMode === mode && { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}
              >
                <Text style={[styles.toggleLabel, { color: viewMode === mode ? colors.accent : colors.subtext }]}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.categoryGrid}>
          {DISPLAY_CATEGORIES.map(cat => (
            <Chip
              key={cat}
              title={cat}
              type={selectedCategory === cat ? 'solid' : 'outline'}
              onPress={() => setSelectedCategory(cat)}
              containerStyle={styles.chipContainer}
              buttonStyle={selectedCategory === cat ? { backgroundColor: colors.accent } : { borderColor: colors.border }}
              titleStyle={{ fontSize: 9, fontWeight: '800', color: selectedCategory === cat ? 'white' : colors.subtext }}
            />
          ))}
        </View>

        <FlatList
          data={filteredNotes}
          contentContainerStyle={styles.listContent}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleOpenEditor(item)}
              onLongPress={() => togglePin(item.id)}
              style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.cardIndicator, { backgroundColor: item.isPinned ? '#F59E0B' : colors.accent }]} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.noteTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                  {item.isPinned && <Icon name="push-pin" type="material" size={14} color="#F59E0B" style={{ marginLeft: 5 }} />}
                </View>
                <Text style={[styles.noteSnippet, { color: colors.subtext }]} numberOfLines={1}>{item.content}</Text>
                <Text style={{ fontSize: 8, color: colors.subtext, marginTop: 4, fontWeight: '600' }}>
                  CREATED: {formatDateTime(item.createdAt)}
                </Text>
              </View>
              <View style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <Text style={[styles.timestampSmall, { color: colors.subtext }]}>{getTimeAgo(item.lastModified)}</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {viewMode !== 'trash' && (
                    <Icon
                      name={item.isArchived ? "refresh-outline" : "archive-outline"}
                      type="ionicon"
                      size={18}
                      color={colors.subtext}
                      onPress={() => toggleArchive(item.id)}
                    />
                  )}
                  <Icon
                    name={viewMode === 'trash' ? "refresh-outline" : "trash-outline"}
                    type="ionicon"
                    size={18}
                    color={viewMode === 'trash' ? colors.accent : "#EF4444"}
                    onPress={() => viewMode === 'trash' ? handleRestore(item.id) : handleDelete(item.id)}
                  />
                </View>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: '800' }}>NO NOTES FOUND, MAKE ONE. ;)</Text>
            </View>
          }
        />

        <Pressable style={[styles.fab, { backgroundColor: colors.accent }]} onPress={() => handleOpenEditor()}>
          <Icon name="add" type="ionicon" color="white" size={30} />
        </Pressable>

        <Overlay isVisible={isEditing} fullScreen overlayStyle={{ backgroundColor: colors.bg }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.editorHeader}>
              <Icon name="close-outline" type="ionicon" color={colors.text} size={30} onPress={() => setIsEditing(false)} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
                {activeNote && (
                  <Icon name="trash-outline" type="ionicon" color="#EF4444" size={22} onPress={() => handleDelete(activeNote.id)} />
                )}
                <Icon name={isPinned ? "push-pin" : "push-pin-outline"} type="material" color={isPinned ? "#F59E0B" : colors.subtext} onPress={() => setIsPinned(!isPinned)} />
                <Button title="Save" onPress={handleSaveNote} buttonStyle={[styles.saveBtn, { backgroundColor: colors.accent }]} />
              </View>
            </View>

            {/* CATEGORIES RESTORED INSIDE EDITOR */}
            <View style={{ paddingHorizontal: 25, marginBottom: 15 }}>
              <Text style={{ color: colors.subtext, fontSize: 10, fontWeight: '900', marginBottom: 10, letterSpacing: 1 }}>
                SELECT CATEGORY:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {APP_CATEGORIES.map(cat => (
                  <Chip
                    key={cat}
                    title={cat}
                    type={noteType === cat ? 'solid' : 'outline'}
                    onPress={() => setNoteType(cat)}
                    containerStyle={{ marginRight: 8 }}
                    buttonStyle={noteType === cat ? { backgroundColor: colors.accent } : { borderColor: colors.border }}
                    titleStyle={{ fontSize: 10, fontWeight: '700', color: noteType === cat ? 'white' : colors.subtext }}
                  />
                ))}
              </ScrollView>
            </View>

            <ScrollView style={{ paddingHorizontal: 25 }}>
              <TextInput placeholder="Entry Title" placeholderTextColor={colors.subtext} style={[styles.titleInput, { color: colors.text }]} value={title} onChangeText={setTitle} />
              <TextInput placeholder="Start typing..." placeholderTextColor={colors.subtext} multiline style={[styles.contentInput, { color: colors.text }]} value={content} onChangeText={setContent} />
            </ScrollView>
          </SafeAreaView>
        </Overlay>
      </SafeAreaView>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBranding: { marginHorizontal: 20, paddingTop: 40, zIndex: 10 },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  logoImage: {
    width: 44,
    height: 44,
    borderRadius: 12, // Changed from 22 to 12 for a slightly rounded square look
    marginRight: 12   // Space between logo and text
  },
  brandName: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  brandTagline: { fontSize: 8, fontWeight: '900', letterSpacing: 1, marginTop: -2 },
  themeToggle: { padding: 8, borderRadius: 10, borderWidth: 1 },
  // ADJUSTED: Added more height to search for better spacing
  searchContainer: { paddingHorizontal: 0, height: 50 },
  searchInputContainer: { borderBottomWidth: 0, borderRadius: 12, paddingHorizontal: 10, borderWidth: 1 },
  // ADJUSTED: Increased marginTop to separate search from toggles
  toggleWrapper: { flexDirection: 'row', borderRadius: 12, padding: 3, marginTop: 15, borderWidth: 1 },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  toggleLabel: { fontWeight: '800', fontSize: 12 },
  // ADJUSTED: Increased vertical margin for better chip breathing room
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 20, marginVertical: 15, zIndex: 10 },
  chipContainer: { marginRight: 6, marginBottom: 6 },
  // ADJUSTED: Higher paddingTop for spacing before first note
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120 // Reduced from 280 so it doesn't overlap the footer area as much
  },
  // ADJUSTED: Increased marginBottom for space between individual cards
  noteCard: { marginBottom: 15, padding: 15, borderRadius: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  cardIndicator: { width: 3, height: '60%', borderRadius: 2, marginRight: 12 },
  noteTitle: { fontSize: 15, fontWeight: '800' },
  noteSnippet: { fontSize: 12, marginTop: 2, opacity: 0.7 },
  timestampSmall: { fontSize: 9, marginBottom: 4, fontWeight: '700' },
  fab: {
    position: 'absolute',
    bottom: 80, // Moved up slightly so it doesn't block the footer text
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    zIndex: 20
  },
  backgroundFooter: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    alignItems: 'center',
    // REMOVE: zIndex: -1 (This was burying the footer)
    // REMOVE: opacity: 0.6 (This was making everything see-through)
  },
  footerLine: {
    width: 40,
    height: 2,
    marginBottom: 8,
    borderRadius: 1,
    // Ensure background color is set in the JS or use solid value
  },

  footerText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    // These will inherit the full opacity from the component below.
  },
  editorHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  saveBtn: { borderRadius: 12, paddingHorizontal: 20 },
  titleInput: { fontSize: 32, fontWeight: '900', marginVertical: 10, lineHeight: 40, minHeight: 90 },
  contentInput: { fontSize: 16, lineHeight: 24, textAlignVertical: 'top', minHeight: 400 },
});
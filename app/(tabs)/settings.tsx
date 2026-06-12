import { useState, useRef } from 'react';
import { ScrollView, Switch, TouchableOpacity, TextInput, Linking, View, Text, StyleSheet } from 'react-native';
import {
  Zap, Volume2, Sun, Moon, Smartphone, Check, Pencil, FileText, Shield, ChevronRight, User, Mail,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { FadeInView } from '../../src/components/ui/AnimatedElements';
import { FontFamily, FontSize, Spacing, type ThemeMode } from '../../src/constants/theme';
import { Eyebrow, SectionHeading, MutedText, AnvilCard, Pill } from '../../src/components/ui/anvil';

export default function ProfileScreen() {
  const { progress, settings, updateSettings, userName, setUserName, isPremium } = useStore();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);
  const nameInputRef = useRef<TextInput>(null);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) setUserName(trimmed);
    else setNameInput(userName);
    setEditingName(false);
  };

  const handleEditName = () => {
    setNameInput(userName);
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const themeModes: { mode: ThemeMode; label: string; icon: React.ComponentType<any> }[] = [
    { mode: 'light',  label: 'Light',  icon: Sun },
    { mode: 'dark',   label: 'Dark',   icon: Moon },
    { mode: 'system', label: 'System', icon: Smartphone },
  ];

  const trimmedName = userName?.trim() ?? '';
  const initial = trimmedName.length > 0 ? trimmedName[0].toUpperCase() : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: Spacing.xl,
        }}
      >
        {/* Header */}
        <FadeInView delay={0}>
          <Eyebrow>Profile</Eyebrow>
          <SectionHeading size="lg">Settings.</SectionHeading>
          <View style={{ height: 8 }} />
          <MutedText size="md">
            Tweak how Brainlock looks, sounds, and feels.
          </MutedText>
        </FadeInView>

        <View style={{ height: Spacing.xl }} />

        {/* Identity card */}
        <FadeInView delay={60}>
          <AnvilCard padding="lg">
            <View style={styles.identityRow}>
              {/* Avatar - hairline circle, monochrome. Initial when set, neutral icon otherwise. */}
              <View style={[styles.avatar, { borderColor: colors.border }]}>
                {initial
                  ? <Text style={[styles.avatarLetter, { color: colors.text }]}>{initial}</Text>
                  : <User size={20} color={colors.muted} strokeWidth={1.6} />}
              </View>

              <View style={{ flex: 1 }}>
                {editingName ? (
                  <TextInput
                    ref={nameInputRef}
                    value={nameInput}
                    onChangeText={setNameInput}
                    onBlur={handleSaveName}
                    onSubmitEditing={handleSaveName}
                    returnKeyType="done"
                    maxLength={24}
                    autoFocus
                    style={[styles.nameInput, { color: colors.text, borderBottomColor: colors.accent }]}
                    placeholderTextColor={colors.muted}
                    placeholder="Your name"
                  />
                ) : (
                  <TouchableOpacity onPress={handleEditName} activeOpacity={0.6} style={styles.nameRow}>
                    <Text style={[styles.name, { color: colors.text }]}>
                      {userName || 'Tap to set name'}
                    </Text>
                    <Pencil size={13} color={colors.muted} strokeWidth={2} />
                  </TouchableOpacity>
                )}
                <Text style={[styles.identityMeta, { color: colors.muted }]}>
                  {progress.gamesWon} {progress.gamesWon === 1 ? 'test passed' : 'tests passed'}
                </Text>
              </View>

              {isPremium && <Pill tone="accent">PREMIUM</Pill>}
            </View>
          </AnvilCard>
        </FadeInView>

        {/* Appearance */}
        <FadeInView delay={180}>
          <View style={styles.sectionLabelRow}>
            <Eyebrow style={{ marginBottom: 0 }}>Appearance</Eyebrow>
          </View>
          <AnvilCard padding="md">
            {themeModes.map(({ mode, label, icon: Icon }, i) => {
              const active = (settings.theme ?? 'system') === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  activeOpacity={0.6}
                  onPress={() => updateSettings({ theme: mode })}
                  style={[
                    styles.row,
                    {
                      paddingVertical: 12,
                      borderBottomWidth: i < themeModes.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <Icon size={18} color={active ? colors.accent : colors.muted} strokeWidth={1.8} />
                  <Text style={[styles.rowTitle, {
                    color: colors.text,
                    flex: 1,
                  }]}>
                    {label}
                  </Text>
                  {active && <Check size={16} color={colors.accent} strokeWidth={2} />}
                </TouchableOpacity>
              );
            })}
          </AnvilCard>
        </FadeInView>

        {/* Preferences */}
        <FadeInView delay={240}>
          <View style={styles.sectionLabelRow}>
            <Eyebrow style={{ marginBottom: 0 }}>Preferences</Eyebrow>
          </View>
          <AnvilCard padding="md">
            <View
              style={[
                styles.row,
                { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <Zap size={18} color={colors.muted} strokeWidth={1.8} />
              <Text style={[styles.rowTitle, { color: colors.text, flex: 1 }]}>Haptic feedback</Text>
              <Switch
                value={settings.hapticFeedback}
                onValueChange={(v) => updateSettings({ hapticFeedback: v })}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={colors.border}
              />
            </View>
            <View style={[styles.row, { paddingVertical: 8 }]}>
              <Volume2 size={18} color={colors.muted} strokeWidth={1.8} />
              <Text style={[styles.rowTitle, { color: colors.text, flex: 1 }]}>Sound effects</Text>
              <Switch
                value={settings.soundEnabled}
                onValueChange={(v) => updateSettings({ soundEnabled: v })}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={colors.border}
              />
            </View>
          </AnvilCard>
        </FadeInView>

        {/* Legal */}
        <FadeInView delay={300}>
          <View style={styles.sectionLabelRow}>
            <Eyebrow style={{ marginBottom: 0 }}>Legal</Eyebrow>
          </View>
          <AnvilCard padding="md">
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => Linking.openURL('https://plbtk.com#terms')}
              style={[
                styles.row,
                { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <FileText size={18} color={colors.muted} strokeWidth={1.8} />
              <Text style={[styles.rowTitle, { color: colors.text, flex: 1 }]}>Terms of use</Text>
              <ChevronRight size={16} color={colors.muted} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => Linking.openURL('https://plbtk.com#privacy')}
              style={[styles.row, { paddingVertical: 12 }]}
            >
              <Shield size={18} color={colors.muted} strokeWidth={1.8} />
              <Text style={[styles.rowTitle, { color: colors.text, flex: 1 }]}>Privacy policy</Text>
              <ChevronRight size={16} color={colors.muted} strokeWidth={2} />
            </TouchableOpacity>
          </AnvilCard>
        </FadeInView>

        {/* Contact */}
        <FadeInView delay={360}>
          <View style={styles.sectionLabelRow}>
            <Eyebrow style={{ marginBottom: 0 }}>Support</Eyebrow>
          </View>
          <AnvilCard padding="md">
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => Linking.openURL('mailto:contact@pltbk.com')}
              style={[styles.row, { paddingVertical: 12 }]}
            >
              <Mail size={18} color={colors.muted} strokeWidth={1.8} />
              <Text style={[styles.rowTitle, { color: colors.text, flex: 1 }]}>Contact us</Text>
              <ChevronRight size={16} color={colors.muted} strokeWidth={2} />
            </TouchableOpacity>
          </AnvilCard>
        </FadeInView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Section label rows
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },

  // Identity card
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.3,
  },
  nameInput: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.3,
    paddingVertical: 2,
    borderBottomWidth: 1.5,
  },
  identityMeta: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },

  // Shared row layout
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.1,
  },
  rowDescription: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
});

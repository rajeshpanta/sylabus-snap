import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSession } from '@/app/_layout';
import { useAppStore, findCurrentSemester } from '@/store/appStore';
import { useSemesters, useCourses, useTaskStats } from '@/lib/queries';
import { signOut } from '@/lib/auth';
import { COLORS } from '@/lib/constants';
import { useEffect } from 'react';

export default function MeScreen() {
  const { session } = useSession();
  const email = session?.user?.email ?? '';
  const name = email.split('@')[0] || 'User';
  const initial = (name[0] ?? '?').toUpperCase();

  const selectedSemesterId = useAppStore((s) => s.selectedSemesterId);
  const setSelectedSemester = useAppStore((s) => s.setSelectedSemester);
  const { data: semesters = [] } = useSemesters();
  const { data: courses = [] } = useCourses(selectedSemesterId);
  const { data: stats } = useTaskStats(selectedSemesterId);

  useEffect(() => {
    if (!selectedSemesterId && semesters.length > 0) setSelectedSemester(findCurrentSemester(semesters));
  }, [semesters, selectedSemesterId]);

  const activeSemester = semesters.find((s) => s.id === selectedSemesterId);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <View style={styles.profileRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileSub}>{activeSemester?.name ?? 'No semester'}</Text>
          </View>
        </View>

        {/* Premium upsell */}
        <View style={styles.proCard}>
          <View style={styles.proGlow} />
          <View style={{ position: 'relative' }}>
            <View style={styles.proLabel}>
              <FontAwesome name="star" size={11} color={COLORS.brand100} />
              <Text style={styles.proLabelText}>SYLLABUSSNAP PRO</Text>
            </View>
            <Text style={styles.proTitle}>Unlimited scans, smart plans, grade forecasts.</Text>
            <View style={styles.proPrice}>
              <Text style={styles.proPriceAmount}>$24.99</Text>
              <Text style={styles.proPricePeriod}>/year · cancel any time</Text>
            </View>
            <TouchableOpacity style={styles.proButton} activeOpacity={0.8}>
              <Text style={styles.proButtonText}>Try 7 days free</Text>
            </TouchableOpacity>
            <Text style={styles.proAlt}>Or $3.99/month · restore purchase</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: COLORS.brand }]}>{courses.length}</Text>
            <Text style={styles.statLabel}>COURSES</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{stats?.completed ?? 0}</Text>
            <Text style={styles.statLabel}>DONE</Text>
          </View>
          <View style={styles.statCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Text style={[styles.statNum, { color: COLORS.coral }]}>{stats?.pending ?? 0}</Text>
            </View>
            <Text style={styles.statLabel}>PENDING</Text>
          </View>
        </View>

        {/* Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.settingsCard}>
          <SettingsRow icon="bell" label="Notifications" value="1 day, 3 days" onPress={() => Alert.alert('Notifications', 'Reminders are sent 1 day and 3 days before due dates. Customize in a future update.')} />
          <SettingsRow icon="calendar" label="Calendar sync" pro />
          <SettingsRow icon="sun-o" label="Appearance" value="System" onPress={() => Alert.alert('Appearance', 'Theme follows your system setting. Dark mode customization coming soon.')} />
          <SettingsRow icon="th-large" label="Widgets" pro last />
        </View>

        {/* Support */}
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.settingsCard}>
          <SettingsRow icon="question-circle-o" label="Help & FAQ" onPress={() => Alert.alert('Help', 'For support, email help@syllabussnap.com')} />
          <SettingsRow icon="star-o" label="Rate SyllabusSnap" last onPress={() => Alert.alert('Rate Us', 'Rating will be available once the app is on the App Store.')} />
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={signOut} activeOpacity={0.7}>
          <FontAwesome name="sign-out" size={14} color={COLORS.coral} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>SyllabusSnap 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({ icon, label, value, pro, last, onPress }: { icon: string; label: string; value?: string; pro?: boolean; last?: boolean; onPress?: () => void }) {
  const handlePress = () => {
    if (pro) {
      Alert.alert('SyllabusSnap Pro', 'This feature is available with Pro. Coming soon!');
    } else if (onPress) {
      onPress();
    }
  };
  return (
    <TouchableOpacity style={[styles.settingsRow, !last && styles.settingsRowBorder]} activeOpacity={0.7} onPress={handlePress}>
      <FontAwesome name={icon as any} size={16} color={COLORS.ink2} />
      <Text style={styles.settingsLabel}>{label}</Text>
      {value && <Text style={styles.settingsValue}>{value}</Text>}
      {pro && <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>}
      <FontAwesome name="chevron-right" size={11} color={COLORS.ink3} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.paper },
  content: { padding: 20, paddingBottom: 120 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8, marginBottom: 20 },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: COLORS.brand, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '600' },
  profileName: { fontSize: 19, fontWeight: '600', color: COLORS.ink },
  profileSub: { fontSize: 14, color: COLORS.ink3, marginTop: 2 },
  // Pro card
  proCard: { backgroundColor: COLORS.ink, borderRadius: 22, padding: 18, marginBottom: 20, overflow: 'hidden' },
  proGlow: { position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.brand, opacity: 0.35 },
  proLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  proLabelText: { fontSize: 14, fontWeight: '600', letterSpacing: 1, color: COLORS.brand100 },
  proTitle: { fontSize: 19, fontWeight: '600', color: '#fff', lineHeight: 24, maxWidth: 220 },
  proPrice: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 14 },
  proPriceAmount: { fontSize: 22, fontWeight: '600', color: '#fff' },
  proPricePeriod: { fontSize: 14, color: 'rgba(255,255,255,0.65)' },
  proButton: { backgroundColor: '#fff', borderRadius: 12, padding: 10, alignItems: 'center', marginTop: 12 },
  proButtonText: { fontSize: 14, fontWeight: '500', color: COLORS.ink },
  proAlt: { fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 8 },
  // Stats
  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 18, padding: 12, alignItems: 'center', borderWidth: 0.5, borderColor: COLORS.line },
  statNum: { fontSize: 22, fontWeight: '600', color: COLORS.ink },
  statLabel: { fontSize: 14, color: COLORS.ink3, fontWeight: '500', letterSpacing: 0.5, marginTop: 2 },
  // Settings
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.ink2, marginBottom: 10 },
  settingsCard: { backgroundColor: COLORS.card, borderRadius: 18, paddingHorizontal: 14, marginBottom: 20, borderWidth: 0.5, borderColor: COLORS.line },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  settingsRowBorder: { borderBottomWidth: 0.5, borderBottomColor: COLORS.line },
  settingsLabel: { flex: 1, fontSize: 14, color: COLORS.ink },
  settingsValue: { fontSize: 14, color: COLORS.ink3 },
  proBadge: { backgroundColor: COLORS.brand50, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  proBadgeText: { fontSize: 14, fontWeight: '600', color: COLORS.brand },
  // Sign out
  signOutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.card, borderWidth: 0.5, borderColor: COLORS.line, marginBottom: 16 },
  signOutText: { fontSize: 14, fontWeight: '500', color: COLORS.coral },
  version: { textAlign: 'center', fontSize: 14, color: COLORS.ink3 },
});

import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';
import { useSemesters, useUpdateSemester, useDeleteSemester } from '@/lib/queries';
import { COLORS } from '@/lib/constants';
import { useAppStore } from '@/store/appStore';
import { DatePicker } from '@/components/DatePicker';

export default function SemesterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: semesters = [], isLoading } = useSemesters();
  const updateSemester = useUpdateSemester();
  const deleteSemester = useDeleteSemester();
  const setSelectedSemester = useAppStore((s) => s.setSelectedSemester);

  const semester = semesters.find((s) => s.id === id);

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    if (semester) {
      setName(semester.name);
      setStartDate(semester.start_date ? new Date(semester.start_date + 'T00:00:00') : null);
      setEndDate(semester.end_date ? new Date(semester.end_date + 'T00:00:00') : null);
    }
  }, [semester]);

  if (isLoading || !semester) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#6B46C1" /></View>;
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a semester name.');
      return;
    }
    try {
      await updateSemester.mutateAsync({
        id: semester.id,
        name: name.trim(),
        start_date: startDate ? startDate.toISOString().split('T')[0] : null,
        end_date: endDate ? endDate.toISOString().split('T')[0] : null,
      });
      Keyboard.dismiss();
      if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Semester', 'This will delete all courses and tasks in this semester.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteSemester.mutateAsync(semester.id);
          setSelectedSemester(null);
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="always">
        <View style={styles.card}>
          <View style={styles.iconRow}>
            <View style={styles.iconCircle}>
              <FontAwesome name="graduation-cap" size={22} color="#6B46C1" />
            </View>
          </View>

          <Text style={styles.label}>Semester Name *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Fall 2026" placeholderTextColor="#c0c0cc" />

          <Text style={styles.label}>Start Date</Text>
          <DatePicker value={startDate} onChange={setStartDate} placeholder="Select start date" />

          <Text style={styles.label}>End Date</Text>
          <DatePicker value={endDate} onChange={setEndDate} placeholder="Select end date" />

          <TouchableOpacity
            style={[styles.button, updateSemester.isPending && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={updateSemester.isPending}
            activeOpacity={0.8}
          >
            {updateSemester.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <FontAwesome name="check" size={14} color="#fff" />
                <Text style={styles.buttonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.7}>
            <FontAwesome name="trash-o" size={14} color="#ef4444" />
            <Text style={styles.deleteText}>Delete Semester</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.paper },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#edf0f7' },
  iconRow: { alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 16 },
  input: { height: 48, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fafafa', paddingHorizontal: 16, fontSize: 15, color: '#111' },
  button: { flexDirection: 'row', height: 50, backgroundColor: COLORS.brand, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#fee2e2', backgroundColor: '#fef2f2' },
  deleteText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
});

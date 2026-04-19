import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';
import { useCreateSemester } from '@/lib/queries';
import { COLORS } from '@/lib/constants';
import { useAppStore } from '@/store/appStore';
import { DatePicker } from '@/components/DatePicker';

export default function NewSemesterScreen() {
  const router = useRouter();
  const createSemester = useCreateSemester();
  const setSelectedSemester = useAppStore((s) => s.setSelectedSemester);

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a semester name.');
      return;
    }

    try {
      const result = await createSemester.mutateAsync({
        name: name.trim(),
        start_date: startDate ? startDate.toISOString().split('T')[0] : null,
        end_date: endDate ? endDate.toISOString().split('T')[0] : null,
      });
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Keyboard.dismiss();
      setSelectedSemester(result.id);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create semester.');
    }
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
          <TextInput
            style={styles.input}
            placeholder="e.g. Fall 2026"
            placeholderTextColor="#c0c0cc"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Start Date</Text>
          <DatePicker value={startDate} onChange={setStartDate} placeholder="Optional" />

          <Text style={styles.label}>End Date</Text>
          <DatePicker value={endDate} onChange={setEndDate} placeholder="Optional" />

          <TouchableOpacity
            style={[styles.button, createSemester.isPending && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={createSemester.isPending}
            activeOpacity={0.8}
          >
            {createSemester.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <FontAwesome name="plus" size={14} color="#fff" />
                <Text style={styles.buttonText}>Create Semester</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.paper },
  content: { padding: 20, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#edf0f7' },
  iconRow: { alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 16 },
  input: { height: 48, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fafafa', paddingHorizontal: 16, fontSize: 15, color: '#111' },
  button: { flexDirection: 'row', height: 50, backgroundColor: COLORS.brand, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

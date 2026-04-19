import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';
import { useCreateTask, useCourses } from '@/lib/queries';
import { useAppStore } from '@/store/appStore';
import { TASK_TYPES, TASK_TYPE_LABELS, COLORS, type TaskType } from '@/lib/constants';
import { DatePicker } from '@/components/DatePicker';

export default function NewTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ courseId?: string }>();
  const createTask = useCreateTask();
  const selectedSemesterId = useAppStore((s) => s.selectedSemesterId);
  const { data: courses = [] } = useCourses(selectedSemesterId);

  const [courseId, setCourseId] = useState(params.courseId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TaskType>('assignment');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [dueTime, setDueTime] = useState<Date | null>(null);
  const [weight, setWeight] = useState('');
  const [isExtraCredit, setIsExtraCredit] = useState(false);

  const selectedCourse = courses.find((c) => c.id === courseId);

  const handleSubmit = async () => {
    if (!courseId) {
      Alert.alert('Required', 'Please select a course.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title.');
      return;
    }
    if (!dueDate) {
      Alert.alert('Required', 'Please select a due date.');
      return;
    }

    try {
      await createTask.mutateAsync({
        course_id: courseId,
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        due_date: dueDate.toISOString().split('T')[0],
        due_time: dueTime
          ? `${String(dueTime.getHours()).padStart(2, '0')}:${String(dueTime.getMinutes()).padStart(2, '0')}:00`
          : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        is_extra_credit: isExtraCredit,
        _courseName: selectedCourse?.name,
      } as any);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Keyboard.dismiss();
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create task.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="always">
        <View style={styles.card}>
          {/* Course picker */}
          <Text style={styles.label}>Course *</Text>
          {courses.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.courseRow}>
                {courses.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.courseChip,
                      courseId === c.id && { backgroundColor: c.color, borderColor: c.color },
                    ]}
                    onPress={() => setCourseId(c.id)}
                    activeOpacity={0.7}
                  >
                    <FontAwesome
                      name={c.icon as any}
                      size={12}
                      color={courseId === c.id ? '#fff' : c.color}
                    />
                    <Text
                      style={[styles.courseChipText, courseId === c.id && { color: '#fff' }]}
                      numberOfLines={1}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          ) : (
            <Text style={styles.hint}>Add a course first</Text>
          )}

          {/* Title */}
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Homework 3"
            placeholderTextColor="#c0c0cc"
            value={title}
            onChangeText={setTitle}
          />

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add notes..."
            placeholderTextColor="#c0c0cc"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Type */}
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            {TASK_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, type === t && styles.typeChipActive]}
                onPress={() => setType(t)}
                activeOpacity={0.7}
              >
                <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>
                  {TASK_TYPE_LABELS[t]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Due Date & Time */}
          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Due Date *</Text>
              <DatePicker value={dueDate} onChange={setDueDate} mode="date" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Time</Text>
              <DatePicker value={dueTime} onChange={setDueTime} mode="time" placeholder="Optional" />
            </View>
          </View>

          {/* Weight */}
          <Text style={styles.label}>Weight (%)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 10"
            placeholderTextColor="#c0c0cc"
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
          />

          {/* Extra Credit */}
          <TouchableOpacity
            style={styles.ecRow}
            onPress={() => setIsExtraCredit(!isExtraCredit)}
            activeOpacity={0.7}
          >
            <View style={[styles.ecCheck, isExtraCredit && styles.ecCheckActive]}>
              {isExtraCredit && <FontAwesome name="check" size={11} color="#fff" />}
            </View>
            <Text style={styles.ecLabel}>Extra Credit</Text>
            <Text style={styles.ecHint}>Won't count against total weight</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              selectedCourse && { backgroundColor: selectedCourse.color },
              createTask.isPending && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={createTask.isPending}
            activeOpacity={0.8}
          >
            {createTask.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <FontAwesome name="plus" size={14} color="#fff" />
                <Text style={styles.buttonText}>Add Task</Text>
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
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 16 },
  hint: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic' },
  input: { height: 48, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fafafa', paddingHorizontal: 16, fontSize: 15, color: '#111' },
  textArea: { height: 80, paddingTop: 12 },
  courseRow: { flexDirection: 'row', gap: 8 },
  courseChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fafafa' },
  courseChipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f1f5f9' },
  typeChipActive: { backgroundColor: COLORS.brand },
  typeChipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  typeChipTextActive: { color: '#fff' },
  dateRow: { flexDirection: 'row', gap: 12 },
  ecRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingVertical: 4 },
  ecCheck: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#d1d5db', justifyContent: 'center', alignItems: 'center' },
  ecCheckActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  ecLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  ecHint: { flex: 1, fontSize: 11, color: '#94a3b8', textAlign: 'right' },
  button: { flexDirection: 'row', height: 50, backgroundColor: COLORS.brand, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

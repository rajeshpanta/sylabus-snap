import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppStore, findCurrentSemester } from '@/store/appStore';
import { useSemesters, useCourses, useTasks, useDeleteSemester } from '@/lib/queries';
import { COLORS, calculateGrade, DEFAULT_GRADE_SCALE } from '@/lib/constants';
import { SemesterPicker } from '@/components/SemesterPicker';
import { differenceInDays, isToday, isPast, addDays, format } from 'date-fns';
import type { GradeThreshold } from '@/types/database';
import type { TaskWithCourse } from '@/lib/queries';

type CourseFilter = 'all' | 'thisWeek' | 'upcoming';

export default function CoursesScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<CourseFilter>('all');

  const selectedSemesterId = useAppStore((s) => s.selectedSemesterId);
  const setSelectedSemester = useAppStore((s) => s.setSelectedSemester);

  const { data: semesters = [], isLoading: semestersLoading } = useSemesters();
  const deleteSemester = useDeleteSemester();
  const { data: courses = [] } = useCourses(selectedSemesterId);
  const { data: tasks = [] } = useTasks(selectedSemesterId ? { semesterId: selectedSemesterId } : { semesterId: null });

  useEffect(() => {
    if (semesters.length === 0) return;
    if (!selectedSemesterId || !semesters.some((s) => s.id === selectedSemesterId)) setSelectedSemester(findCurrentSemester(semesters));
  }, [semesters, selectedSemesterId]);

  const activeSemester = semesters.find((s) => s.id === selectedSemesterId);

  const handleNav = (route: string) => {
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  const handleFilter = (f: CourseFilter) => {
    setFilter(f);
    if (Platform.OS === 'ios') Haptics.selectionAsync();
  };

  // Helpers per course
  const getCourseTasks = (courseId: string) => tasks.filter((t) => t.course_id === courseId);
  const getNextTask = (courseId: string) => {
    const ct = getCourseTasks(courseId).filter((t) => !t.is_completed);
    ct.sort((a, b) => a.due_date.localeCompare(b.due_date));
    return ct[0] || null;
  };
  const getPendingCount = (courseId: string) => getCourseTasks(courseId).filter((t) => !t.is_completed).length;

  // Filter courses based on selected filter
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekEnd = format(addDays(new Date(), 7), 'yyyy-MM-dd');

  const filteredCourses = courses.filter((course) => {
    if (filter === 'all') return true;
    const courseTasks = getCourseTasks(course.id).filter((t) => !t.is_completed);
    if (filter === 'thisWeek') {
      return courseTasks.some((t) => t.due_date >= today && t.due_date <= weekEnd);
    }
    if (filter === 'upcoming') {
      return courseTasks.some((t) => t.due_date > today);
    }
    return true;
  });

  function getDueLabel(task: TaskWithCourse): { text: string; urgent: boolean } {
    const due = new Date(task.due_date + 'T00:00:00');
    const now = new Date();
    if (isToday(due)) return { text: task.due_time ? `due ${task.due_time.slice(0, 5)}` : 'due today', urgent: true };
    if (isPast(due)) return { text: 'overdue', urgent: true };
    const days = differenceInDays(due, now);
    if (days === 1) return { text: 'tomorrow', urgent: true };
    if (days <= 3) return { text: `${days} days`, urgent: true };
    return { text: `in ${days} days`, urgent: false };
  }

  if (semestersLoading && semesters.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Courses</Text>
            <Text style={styles.subtitle}>
              {courses.length} active{activeSemester ? ` · ${activeSemester.name}` : ''}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {activeSemester && (
              <>
                <TouchableOpacity onPress={() => router.push(`/semester/${activeSemester.id}` as any)} hitSlop={8} style={styles.headerIconBtn}>
                  <FontAwesome name="pencil" size={14} color={COLORS.ink3} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      'Delete Semester',
                      `Delete "${activeSemester.name}" and all its courses and tasks?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              await deleteSemester.mutateAsync(activeSemester.id);
                              setSelectedSemester(null);
                            } catch (err: any) {
                              Alert.alert('Delete Failed', err.message ?? 'Something went wrong. Please try again.');
                            }
                          },
                        },
                      ],
                    );
                  }}
                  hitSlop={8}
                  style={styles.headerIconBtn}
                >
                  <FontAwesome name="trash-o" size={14} color={COLORS.coral} />
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.addBtn} onPress={() => handleNav('/course/new')} activeOpacity={0.8}>
              <FontAwesome name="plus" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Semester picker */}
        {semesters.length > 1 && (
          <View style={{ marginBottom: 16 }}>
            <SemesterPicker semesters={semesters} selectedId={selectedSemesterId} onSelect={setSelectedSemester} />
          </View>
        )}

        {/* Filter pills */}
        <View style={styles.pills}>
          <TouchableOpacity style={[styles.pill, filter === 'all' && styles.pillActive]} onPress={() => handleFilter('all')} activeOpacity={0.7}>
            <Text style={filter === 'all' ? styles.pillTextActive : styles.pillText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pill, filter === 'thisWeek' && styles.pillActive]} onPress={() => handleFilter('thisWeek')} activeOpacity={0.7}>
            <Text style={filter === 'thisWeek' ? styles.pillTextActive : styles.pillText}>This week</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pill, filter === 'upcoming' && styles.pillActive]} onPress={() => handleFilter('upcoming')} activeOpacity={0.7}>
            <Text style={filter === 'upcoming' ? styles.pillTextActive : styles.pillText}>Upcoming</Text>
          </TouchableOpacity>
        </View>

        {/* Course cards */}
        {filteredCourses.length > 0 ? (
          <View style={styles.courseList}>
            {filteredCourses.map((course) => {
              const courseTasks = getCourseTasks(course.id);
              const nextTask = getNextTask(course.id);
              const pendingCount = getPendingCount(course.id);
              const scale = (course.grade_scale || DEFAULT_GRADE_SCALE) as GradeThreshold[];
              const gradeTasks = courseTasks.map((t) => ({ weight: t.weight, score: t.score, is_extra_credit: t.is_extra_credit }));
              const { percentage } = calculateGrade(gradeTasks, scale);
              const dueInfo = nextTask ? getDueLabel(nextTask) : null;

              return (
                <TouchableOpacity
                  key={course.id}
                  style={styles.courseCard}
                  onPress={() => router.push(`/course/${course.id}` as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.colorStrip, { backgroundColor: course.color }]} />
                  <View style={styles.courseTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.courseCode, { color: course.color }]}>{course.name}</Text>
                      {course.instructor && <Text style={styles.courseInstructor}>{course.instructor}</Text>}
                    </View>
                    <View style={[styles.upNextBadge, { backgroundColor: course.color + '15' }]}>
                      <Text style={[styles.upNextText, { color: course.color }]}>{pendingCount} UP NEXT</Text>
                    </View>
                  </View>
                  {nextTask && (
                    <View style={styles.nextRow}>
                      <FontAwesome
                        name={nextTask.type === 'exam' ? 'exclamation-circle' : 'clock-o'}
                        size={13}
                        color={dueInfo?.urgent ? COLORS.coral : COLORS.ink3}
                      />
                      <Text style={styles.nextTitle} numberOfLines={1}>
                        <Text style={{ fontWeight: '500' }}>{nextTask.title}</Text>
                        {nextTask.due_time ? <Text style={{ color: COLORS.ink3 }}> · {nextTask.due_time.slice(0, 5)}</Text> : null}
                      </Text>
                      <Text style={[styles.nextDue, dueInfo?.urgent && { color: COLORS.coral, fontWeight: '600' }]}>
                        {dueInfo?.text}
                      </Text>
                    </View>
                  )}
                  {percentage !== null && (
                    <View style={styles.progressRow}>
                      <View style={styles.progressBg}>
                        <View style={[styles.progressFill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: course.color }]} />
                      </View>
                      <Text style={styles.progressText}>{percentage}%</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : courses.length > 0 && filter !== 'all' ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No courses match this filter</Text>
            <Text style={styles.emptyText}>Try switching to "All"</Text>
          </View>
        ) : selectedSemesterId ? (
          <TouchableOpacity style={styles.emptyCard} onPress={() => handleNav('/course/new')} activeOpacity={0.7}>
            <FontAwesome name="book" size={24} color={COLORS.ink3} />
            <Text style={styles.emptyTitle}>No courses yet</Text>
            <Text style={styles.emptyText}>Tap to add your first course</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.emptyCard} onPress={() => handleNav('/semester/new')} activeOpacity={0.7}>
            <FontAwesome name="graduation-cap" size={24} color={COLORS.ink3} />
            <Text style={styles.emptyTitle}>No semester</Text>
            <Text style={styles.emptyText}>Create a semester to get started</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.paper },
  content: { padding: 18, paddingBottom: 120 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 },
  title: { fontSize: 26, fontWeight: '600', color: COLORS.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: COLORS.ink3, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.card, borderWidth: 0.5, borderColor: COLORS.line, justifyContent: 'center', alignItems: 'center' },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.brand, justifyContent: 'center', alignItems: 'center' },
  pills: { flexDirection: 'row', gap: 6, marginVertical: 14 },
  pill: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 6, backgroundColor: COLORS.card, borderWidth: 0.5, borderColor: COLORS.line },
  pillActive: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  pillText: { fontSize: 14, fontWeight: '600', color: COLORS.ink2 },
  pillTextActive: { fontSize: 14, fontWeight: '600', color: '#fff' },
  courseList: { gap: 10 },
  courseCard: { backgroundColor: COLORS.card, borderRadius: 18, padding: 14, borderWidth: 0.5, borderColor: COLORS.line, position: 'relative', overflow: 'hidden' },
  colorStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  courseTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  courseCode: { fontSize: 15, fontWeight: '500', marginTop: 1 },
  courseInstructor: { fontSize: 14, color: COLORS.ink3, marginTop: 3 },
  upNextBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  upNextText: { fontSize: 14, fontWeight: '600' },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, marginTop: 10, borderTopWidth: 0.5, borderTopColor: COLORS.line },
  nextTitle: { flex: 1, fontSize: 14, color: COLORS.ink },
  nextDue: { fontSize: 14, color: COLORS.ink3, fontWeight: '500' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  progressBg: { flex: 1, height: 4, backgroundColor: COLORS.line, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  progressText: { fontSize: 14, color: COLORS.ink3, fontWeight: '500' },
  emptyCard: { backgroundColor: COLORS.card, borderRadius: 18, padding: 32, alignItems: 'center', gap: 6, borderWidth: 0.5, borderColor: COLORS.line },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.ink },
  emptyText: { fontSize: 14, color: COLORS.ink3 },
});

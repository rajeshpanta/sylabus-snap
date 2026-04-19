import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import type { Course } from '@/types/database';

interface CourseItemProps {
  course: Course;
  taskCount: number;
  onPress: () => void;
}

export function CourseItem({ course, taskCount, onPress }: CourseItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.colorStrip, { backgroundColor: course.color }]} />
      <View style={[styles.iconCircle, { backgroundColor: course.color + '18' }]}>
        <FontAwesome name={course.icon as any} size={16} color={course.color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{course.name}</Text>
        {course.instructor && (
          <Text style={styles.instructor} numberOfLines={1}>{course.instructor}</Text>
        )}
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{taskCount}</Text>
      </View>
      <FontAwesome name="chevron-right" size={11} color="#d1d5db" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#edf0f7',
    gap: 10,
  },
  colorStrip: {
    width: 4,
    height: 36,
    borderRadius: 2,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  instructor: { fontSize: 14, color: '#94a3b8', marginTop: 2 },
  badge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 28,
    alignItems: 'center',
  },
  badgeText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
});

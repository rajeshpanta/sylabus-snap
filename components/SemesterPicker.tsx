import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import type { Semester } from '@/types/database';

interface SemesterPickerProps {
  semesters: Semester[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function SemesterPicker({ semesters, selectedId, onSelect }: SemesterPickerProps) {
  if (semesters.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {semesters.map((s) => {
        const active = s.id === selectedId;
        return (
          <TouchableOpacity
            key={s.id}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(s.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {s.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipActive: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  chipTextActive: {
    color: '#fff',
  },
});

import * as FileSystem from 'expo-file-system/legacy';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;

export interface ExtractedItem {
  title: string;
  type: 'assignment' | 'quiz' | 'exam' | 'project' | 'reading' | 'other';
  due_date: string;
  due_time: string | null;
  weight: number | null;
  description: string | null;
  confidence: number;
}

export interface GradeScaleEntry {
  letter: string;
  min: number;
}

export interface SyllabusExtraction {
  course_name: string;
  course_code: string | null;
  instructor: string | null;
  meeting_time: string | null;
  office_hours: string | null;
  semester_name: string | null;
  semester_start: string | null;
  semester_end: string | null;
  grade_scale: GradeScaleEntry[] | null;
  items: ExtractedItem[];
}

const EXTRACTION_PROMPT = `You are analyzing a course syllabus document. Extract the course information AND all deadlines.

Return a single JSON object with this structure:
{
  "course_name": "Introduction to Computer Science" (the full course name),
  "course_code": "CS 101" (short code if visible, or null),
  "instructor": "Prof. Smith" (instructor name if visible, or null),
  "meeting_time": "MWF 10:00-10:50 AM, Room 320" (class meeting days/times/location if visible, or null),
  "office_hours": "Tue/Thu 2:00-3:30 PM, Office 412" (professor office hours if visible, or null),
  "semester_name": "Fall 2026" (semester/term name if visible, or null),
  "semester_start": "2026-08-25" (semester start date in YYYY-MM-DD if visible, or null),
  "semester_end": "2026-12-15" (semester end date in YYYY-MM-DD if visible, or null),
  "grade_scale": [{"letter":"A","min":93},{"letter":"A-","min":90},{"letter":"B+","min":87},{"letter":"B","min":83},...] (the grading scale/letter grade cutoffs if listed in the syllabus, sorted highest to lowest. Include plus/minus grades if specified. Return null if no grading scale is found),
  "items": [
    {
      "title": "Homework 1",
      "type": "assignment|quiz|exam|project|reading|other",
      "due_date": "2026-09-15" (YYYY-MM-DD format, if year not specified assume current/next academic year),
      "due_time": "23:59" (HH:MM 24hr format, or null),
      "weight": 5 (percentage of final grade, or null),
      "description": "Problems 1-20 from Chapter 2" (or null),
      "confidence": 0.95 (0-1 how confident you are)
    }
  ]
}

Extract ALL assignments, exams, quizzes, projects, readings, and deadlines you can find.
For course_name, use the course code + full name if both are available (e.g., "CS 101 - Intro to Computer Science").
Return ONLY valid JSON. No markdown, no explanation.`;

export async function extractFromFile(
  fileUri: string,
  mimeType: string,
): Promise<SyllabusExtraction> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: 'base64',
  });

  const body = {
    contents: [
      {
        parts: [
          { text: EXTRACTION_PROMPT },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
    },
  };

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} — ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from Gemini');
  }

  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let result: any;
  try {
    result = JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse Gemini response as JSON');
  }

  const items: ExtractedItem[] = (result.items || [])
    .filter((item: any) => item.title && item.due_date && /^\d{4}-\d{2}-\d{2}$/.test(item.due_date))
    .map((item: any) => ({
      title: item.title,
      type: ['assignment', 'quiz', 'exam', 'project', 'reading', 'other'].includes(item.type) ? item.type : 'other',
      due_date: item.due_date,
      due_time: item.due_time && /^\d{2}:\d{2}$/.test(item.due_time) ? item.due_time : null,
      weight: typeof item.weight === 'number' ? item.weight : null,
      description: item.description || null,
      confidence: typeof item.confidence === 'number' ? Math.min(Math.max(item.confidence, 0), 1) : 0.5,
    }));

  return {
    course_name: result.course_name || 'Unknown Course',
    course_code: result.course_code || null,
    instructor: result.instructor || null,
    meeting_time: result.meeting_time || null,
    office_hours: result.office_hours || null,
    semester_name: result.semester_name || null,
    semester_start: result.semester_start || null,
    semester_end: result.semester_end || null,
    grade_scale: Array.isArray(result.grade_scale) && result.grade_scale.length > 0
      ? result.grade_scale
          .filter((g: any) => g.letter && typeof g.min === 'number')
          .sort((a: any, b: any) => b.min - a.min)
      : null,
    items,
  };
}

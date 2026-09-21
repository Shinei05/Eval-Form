/**
 * Determines the School Level Category based on the student's grade.
 * Rules:
 * - Grade 1 - 6: Elementary
 * - Grade 7 - 10: Junior High School
 * - Grade 11 - 12: Senior High School
 * 
 * @param {string|number} grade 
 * @returns {string|null} 'Elementary' | 'Junior High School' | 'Senior High School' | null
 */
export function getSchoolLevelCategory(grade) {
  if (grade === null || grade === undefined || grade === '') return null;

  const str = String(grade).trim();
  const num = parseInt(str.replace(/\D/g, ''), 10);

  if (!isNaN(num)) {
    if (num >= 1 && num <= 6) return 'Elementary';
    if (num >= 7 && num <= 10) return 'Junior High School';
    if (num >= 11 && num <= 12) return 'Senior High School';
  }

  const lower = str.toLowerCase();
  if (lower.includes('elem') || lower.includes('primary')) return 'Elementary';
  if (lower.includes('jhs') || lower.includes('junior')) return 'Junior High School';
  if (lower.includes('shs') || lower.includes('senior')) return 'Senior High School';

  return null;
}

/**
 * Formats Grade and Section for display.
 * e.g., Grade 10 • Section A
 * 
 * @param {string|number} grade 
 * @param {string} section 
 * @returns {string}
 */
export function formatGradeSection(grade, section) {
  const g = grade
    ? (String(grade).toLowerCase().startsWith('grade') ? String(grade).trim() : `Grade ${String(grade).trim()}`)
    : '';

  let s = '';
  if (section) {
    const secStr = String(section).trim();
    if (secStr.toLowerCase().startsWith('section')) {
      s = secStr;
    } else {
      s = `Section ${secStr}`;
    }
  }

  if (g && s) return `${g} • ${s}`;
  if (g) return g;
  if (s) return s;
  return '';
}

/**
 * Formats Teacher Assigned Grade Levels for display.
 * 
 * @param {boolean} isElementary 
 * @param {boolean} isJhs 
 * @returns {string|null}
 */
export function formatTeacherAssignedGrade(isElementary, isJhs) {
  if (isElementary && isJhs) return 'Elementary & Junior High';
  if (isElementary) return 'Elementary (Grades 4–6)';
  if (isJhs) return 'Junior High (Grades 7–10)';
  return null;
}

/**
 * Formats Teacher Active Term label for display.
 * 
 * @param {number|string} quarter 
 * @param {number|string} year 
 * @returns {string|null}
 */
export function formatActiveTerm(quarter, year) {
  if (!quarter && !year) return null;
  const q = quarter ? `Q${quarter}` : '';
  const y = year ? `SY ${year}` : '';
  if (q && y) return `${q} | ${y}`;
  return q || y;
}

const ELEMENTARY_GRADES = new Set(['1', '2', '3', '4', '5', '6']);
const JHS_GRADES = new Set(['7', '8', '9', '10']);
const SHS_GRADES = new Set(['11', '12']);

export const GRADE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Grades & Levels' },
  { value: 'elementary', label: 'Elementary (Grades 4–6)' },
  { value: 'jhs', label: 'Junior High (Grades 7–10)' },
  { value: '4', label: 'Grade 4' },
  { value: '5', label: 'Grade 5' },
  { value: '6', label: 'Grade 6' },
  { value: '7', label: 'Grade 7' },
  { value: '8', label: 'Grade 8' },
  { value: '9', label: 'Grade 9' },
  { value: '10', label: 'Grade 10' },
];

/**
 * Checks if a teacher teaches the specified grade or grade category.
 *
 * @param {Object} teacher - Teacher object with is_elementary, is_jhs, isElementary, isJhs, grades, or grade properties.
 * @param {string} filterGrade - Filter value ('all', 'elementary', 'jhs', 'shs', '4', '5', '6', '7', '8', '9', '10', '11', '12')
 * @returns {boolean}
 */
export function matchesGradeFilter(teacher, filterGrade) {
  if (!filterGrade || filterGrade === 'all' || filterGrade === '') return true;
  if (!teacher) return false;

  const isElem = Boolean(teacher.is_elementary || teacher.isElementary);
  const isJhs = Boolean(teacher.is_jhs || teacher.isJhs);

  // Normalize filter string
  const filter = String(filterGrade).trim().toLowerCase();

  // Category filters
  if (filter === 'elementary' || filter === 'elem') {
    if (isElem) return true;
    if (teacher.grade && getSchoolLevelCategory(teacher.grade) === 'Elementary') return true;
    if (Array.isArray(teacher.grades) && teacher.grades.some(g => ELEMENTARY_GRADES.has(String(g).replace(/\D/g, '')))) return true;
    return false;
  }

  if (filter === 'jhs' || filter === 'junior' || filter === 'junior high' || filter === 'junior high school') {
    if (isJhs) return true;
    if (teacher.grade && getSchoolLevelCategory(teacher.grade) === 'Junior High School') return true;
    if (Array.isArray(teacher.grades) && teacher.grades.some(g => JHS_GRADES.has(String(g).replace(/\D/g, '')))) return true;
    return false;
  }

  if (filter === 'shs' || filter === 'senior' || filter === 'senior high' || filter === 'senior high school') {
    if (teacher.grade && getSchoolLevelCategory(teacher.grade) === 'Senior High School') return true;
    if (Array.isArray(teacher.grades) && teacher.grades.some(g => SHS_GRADES.has(String(g).replace(/\D/g, '')))) return true;
    return false;
  }

  // Specific numeric grade filter (e.g. '4', '7', 'Grade 7')
  const numMatch = filter.replace(/\D/g, '');
  if (numMatch) {
    if (teacher.grade && String(teacher.grade).replace(/\D/g, '') === numMatch) {
      return true;
    }
    if (Array.isArray(teacher.grades) && teacher.grades.some(g => String(g).replace(/\D/g, '') === numMatch)) {
      return true;
    }

    // Fall back to level flags if grade falls in that level range
    const num = parseInt(numMatch, 10);
    if (num >= 4 && num <= 6 && isElem) return true;
    if (num >= 7 && num <= 10 && isJhs) return true;
  }

  return false;
}

/**
 * Returns a concise grade label/badge for a teacher.
 *
 * @param {Object} teacher
 * @returns {string|null}
 */
export function getTeacherGradeBadge(teacher) {
  if (!teacher) return null;
  const isElem = Boolean(teacher.is_elementary || teacher.isElementary);
  const isJhs = Boolean(teacher.is_jhs || teacher.isJhs);

  if (isElem && isJhs) return 'Elem & JHS';
  if (isElem) return 'Elementary (Grades 4–6)';
  if (isJhs) return 'Junior High (Grades 7–10)';
  if (teacher.grade) {
    const formatted = formatGradeSection(teacher.grade, '');
    return formatted || null;
  }
  return null;
}


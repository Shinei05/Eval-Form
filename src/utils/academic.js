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

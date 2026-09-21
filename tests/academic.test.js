import { describe, it, expect } from "vitest";
import {
  getSchoolLevelCategory,
  formatGradeSection,
  formatTeacherAssignedGrade,
  formatActiveTerm,
  matchesGradeFilter,
  getTeacherGradeBadge,
  GRADE_FILTER_OPTIONS,
} from "../src/utils/academic.js";

describe("academic utility helpers", () => {
  describe("getSchoolLevelCategory", () => {
    it("categorizes Grades 1 to 6 as Elementary", () => {
      expect(getSchoolLevelCategory("1")).toBe("Elementary");
      expect(getSchoolLevelCategory("5")).toBe("Elementary");
      expect(getSchoolLevelCategory(6)).toBe("Elementary");
      expect(getSchoolLevelCategory("Grade 4")).toBe("Elementary");
    });

    it("categorizes Grades 7 to 10 as Junior High School", () => {
      expect(getSchoolLevelCategory("7")).toBe("Junior High School");
      expect(getSchoolLevelCategory("9")).toBe("Junior High School");
      expect(getSchoolLevelCategory(10)).toBe("Junior High School");
      expect(getSchoolLevelCategory("Grade 8")).toBe("Junior High School");
    });

    it("categorizes Grades 11 to 12 as Senior High School", () => {
      expect(getSchoolLevelCategory("11")).toBe("Senior High School");
      expect(getSchoolLevelCategory(12)).toBe("Senior High School");
      expect(getSchoolLevelCategory("Grade 12")).toBe("Senior High School");
    });

    it("handles text keywords for elementary, JHS, and SHS", () => {
      expect(getSchoolLevelCategory("Elementary School")).toBe("Elementary");
      expect(getSchoolLevelCategory("JHS")).toBe("Junior High School");
      expect(getSchoolLevelCategory("SHS Track")).toBe("Senior High School");
    });

    it("returns null for invalid or missing inputs", () => {
      expect(getSchoolLevelCategory("")).toBeNull();
      expect(getSchoolLevelCategory(null)).toBeNull();
      expect(getSchoolLevelCategory(undefined)).toBeNull();
      expect(getSchoolLevelCategory("College")).toBeNull();
    });
  });

  describe("formatGradeSection", () => {
    it("formats both grade and section when available", () => {
      expect(formatGradeSection("10", "A")).toBe("Grade 10 • Section A");
      expect(formatGradeSection("5", "Section A")).toBe("Grade 5 • Section A");
    });

    it("formats grade only when section is missing", () => {
      expect(formatGradeSection("5", "")).toBe("Grade 5");
    });

    it("formats section only when grade is missing", () => {
      expect(formatGradeSection("", "B")).toBe("Section B");
    });

    it("returns empty string when both are missing", () => {
      expect(formatGradeSection("", "")).toBe("");
    });
  });

  describe("formatTeacherAssignedGrade", () => {
    it("formats elementary and JHS combinations correctly", () => {
      expect(formatTeacherAssignedGrade(true, true)).toBe("Elementary & Junior High");
      expect(formatTeacherAssignedGrade(true, false)).toBe("Elementary (Grades 4–6)");
      expect(formatTeacherAssignedGrade(false, true)).toBe("Junior High (Grades 7–10)");
      expect(formatTeacherAssignedGrade(false, false)).toBeNull();
    });
  });

  describe("formatActiveTerm", () => {
    it("formats quarter and year combinations", () => {
      expect(formatActiveTerm(1, 2026)).toBe("Q1 | SY 2026");
      expect(formatActiveTerm(2, "2025-2026")).toBe("Q2 | SY 2025-2026");
      expect(formatActiveTerm(3, null)).toBe("Q3");
      expect(formatActiveTerm(null, 2025)).toBe("SY 2025");
      expect(formatActiveTerm(null, null)).toBeNull();
    });
  });

  describe("matchesGradeFilter", () => {
    const elemTeacher = { firstname: "Maria", lastname: "Santos", is_elementary: true, is_jhs: false };
    const jhsTeacher = { firstname: "Juan", lastname: "Cruz", is_elementary: false, is_jhs: true };
    const bothTeacher = { firstname: "Ana", lastname: "Reyes", is_elementary: true, is_jhs: true };
    const specificGradeTeacher = { firstname: "Pedro", lastname: "Gomez", grade: "8", is_elementary: false, is_jhs: false };

    it("returns true for 'all' or empty filter", () => {
      expect(matchesGradeFilter(elemTeacher, "all")).toBe(true);
      expect(matchesGradeFilter(jhsTeacher, "")).toBe(true);
      expect(matchesGradeFilter(bothTeacher, null)).toBe(true);
    });

    it("filters elementary teachers correctly", () => {
      expect(matchesGradeFilter(elemTeacher, "elementary")).toBe(true);
      expect(matchesGradeFilter(jhsTeacher, "elementary")).toBe(false);
      expect(matchesGradeFilter(bothTeacher, "elementary")).toBe(true);
    });

    it("filters JHS teachers correctly", () => {
      expect(matchesGradeFilter(elemTeacher, "jhs")).toBe(false);
      expect(matchesGradeFilter(jhsTeacher, "jhs")).toBe(true);
      expect(matchesGradeFilter(bothTeacher, "jhs")).toBe(true);
    });

    it("filters specific grades correctly", () => {
      expect(matchesGradeFilter(elemTeacher, "4")).toBe(true);
      expect(matchesGradeFilter(elemTeacher, "5")).toBe(true);
      expect(matchesGradeFilter(elemTeacher, "7")).toBe(false);

      expect(matchesGradeFilter(jhsTeacher, "7")).toBe(true);
      expect(matchesGradeFilter(jhsTeacher, "8")).toBe(true);
      expect(matchesGradeFilter(jhsTeacher, "10")).toBe(true);
      expect(matchesGradeFilter(jhsTeacher, "5")).toBe(false);

      expect(matchesGradeFilter(specificGradeTeacher, "8")).toBe(true);
      expect(matchesGradeFilter(specificGradeTeacher, "9")).toBe(false);
    });
  });

  describe("getTeacherGradeBadge", () => {
    it("returns correct badge text based on teacher level", () => {
      expect(getTeacherGradeBadge({ is_elementary: true, is_jhs: false })).toBe("Elementary (Grades 4–6)");
      expect(getTeacherGradeBadge({ is_elementary: false, is_jhs: true })).toBe("Junior High (Grades 7–10)");
      expect(getTeacherGradeBadge({ is_elementary: true, is_jhs: true })).toBe("Elem & JHS");
      expect(getTeacherGradeBadge({ grade: "10" })).toBe("Grade 10");
      expect(getTeacherGradeBadge({})).toBeNull();
      expect(getTeacherGradeBadge(null)).toBeNull();
    });
  });

  describe("GRADE_FILTER_OPTIONS", () => {
    it("has valid filter options array", () => {
      expect(Array.isArray(GRADE_FILTER_OPTIONS)).toBe(true);
      expect(GRADE_FILTER_OPTIONS.length).toBeGreaterThan(5);
      expect(GRADE_FILTER_OPTIONS[0].value).toBe("all");
    });
  });
});


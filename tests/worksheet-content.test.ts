import { describe, expect, it } from "vitest";
import {
  calculateWorksheetScore,
  didPassWorksheet,
  getWorksheetMaxScore,
  getWorksheetPassingScore,
  validateWorksheetContent,
  type WorksheetContent,
} from "@/lib/worksheet-content";

const validWorksheet: WorksheetContent = {
  title: "Basic grammar",
  questions: [
    {
      id: "q1",
      prompt: "Choose the correct article.",
      type: "single_choice",
      options: [
        { id: "a", label: "a apple" },
        { id: "b", label: "an apple" },
      ],
      correctOptionId: "b",
    },
    {
      id: "q2",
      prompt: "Choose the correct verb.",
      type: "single_choice",
      options: [
        { id: "a", label: "She go" },
        { id: "b", label: "She goes" },
      ],
      correctOptionId: "b",
    },
  ],
};

describe("validateWorksheetContent", () => {
  it("accepts a valid single choice worksheet", () => {
    expect(validateWorksheetContent(validWorksheet)).toEqual({ valid: true });
  });

  it("rejects content without a title", () => {
    const result = validateWorksheetContent({
      ...validWorksheet,
      title: "",
    });

    expect(result).toEqual({
      valid: false,
      error: "contentJson.title must be a non-empty string",
    });
  });

  it("rejects duplicate question ids", () => {
    const result = validateWorksheetContent({
      ...validWorksheet,
      questions: [
        validWorksheet.questions[0],
        { ...validWorksheet.questions[1], id: "q1" },
      ],
    });

    expect(result).toEqual({
      valid: false,
      error: "Duplicate question id: q1",
    });
  });

  it("rejects questions with a correct option that does not exist", () => {
    const result = validateWorksheetContent({
      ...validWorksheet,
      questions: [
        {
          ...validWorksheet.questions[0],
          correctOptionId: "missing",
        },
      ],
    });

    expect(result).toEqual({
      valid: false,
      error: "question q1: correctOptionId is required and must match one option.id",
    });
  });
});

describe("calculateWorksheetScore", () => {
  it("calculates the score for correct and incorrect answers", () => {
    expect(
      calculateWorksheetScore(validWorksheet, {
        q1: "b",
        q2: "a",
      })
    ).toEqual({
      score: 1,
      maxScore: 2,
      correctAnswers: 1,
      totalQuestions: 2,
    });
  });

  it("counts unanswered questions as incorrect", () => {
    expect(calculateWorksheetScore(validWorksheet, { q1: "b" }).score).toBe(1);
  });
});

describe("worksheet score helpers", () => {
  it("uses the number of questions as max score", () => {
    expect(getWorksheetMaxScore(validWorksheet)).toBe(2);
  });

  it("sets the default passing score to 1 when the worksheet has questions", () => {
    expect(getWorksheetPassingScore(2)).toBe(1);
  });

  it("returns whether a student passed when a passing score exists", () => {
    expect(didPassWorksheet(1, 1)).toBe(true);
    expect(didPassWorksheet(0, 1)).toBe(false);
  });

  it("returns null when no passing score exists", () => {
    expect(didPassWorksheet(1, null)).toBeNull();
  });
});

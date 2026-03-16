export type WorksheetQuestionOption = {
  id: string;
  label: string;
};

export type WorksheetQuestion = {
  id: string;
  prompt: string;
  type: "single_choice";
  options: WorksheetQuestionOption[];
  correctOptionId?: string;
};

export type WorksheetContent = {
  title: string;
  questions: WorksheetQuestion[];
};

export function getWorksheetMaxScore(content: WorksheetContent) {
  return content.questions.length;
}

export function getWorksheetPassingScore(maxScore: number) {
  return maxScore > 0 ? 1 : 0;
}

export function didPassWorksheet(score: number, passingScore: number | null) {
  return passingScore !== null ? score >= passingScore : null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateWorksheetContent(value: unknown): { valid: true } | { valid: false; error: string } {
  if (!isObject(value)) {
    return { valid: false, error: "contentJson must be an object" };
  }

  if (typeof value.title !== "string" || value.title.trim().length === 0) {
    return { valid: false, error: "contentJson.title must be a non-empty string" };
  }

  if (!Array.isArray(value.questions) || value.questions.length === 0) {
    return { valid: false, error: "contentJson.questions must be a non-empty array" };
  }

  const questionIds = new Set<string>();

  for (const question of value.questions) {
    if (!isObject(question)) {
      return { valid: false, error: "Each question must be an object" };
    }

    if (typeof question.id !== "string" || question.id.trim().length === 0) {
      return { valid: false, error: "Each question.id must be a non-empty string" };
    }
    if (questionIds.has(question.id)) {
      return { valid: false, error: `Duplicate question id: ${question.id}` };
    }
    questionIds.add(question.id);

    if (typeof question.prompt !== "string" || question.prompt.trim().length === 0) {
      return { valid: false, error: `question ${question.id}: prompt is required` };
    }

    if (question.type !== "single_choice") {
      return { valid: false, error: `question ${question.id}: only single_choice is supported` };
    }

    if (!Array.isArray(question.options) || question.options.length < 2) {
      return { valid: false, error: `question ${question.id}: options must have at least 2 items` };
    }

    const optionIds = new Set<string>();
    for (const option of question.options) {
      if (!isObject(option)) {
        return { valid: false, error: `question ${question.id}: invalid option format` };
      }
      if (typeof option.id !== "string" || option.id.trim().length === 0) {
        return { valid: false, error: `question ${question.id}: option.id is required` };
      }
      if (optionIds.has(option.id)) {
        return { valid: false, error: `question ${question.id}: duplicate option id ${option.id}` };
      }
      optionIds.add(option.id);

      if (typeof option.label !== "string" || option.label.trim().length === 0) {
        return { valid: false, error: `question ${question.id}: option.label is required` };
      }
    }

    if (
      typeof question.correctOptionId !== "string" ||
      !optionIds.has(question.correctOptionId)
    ) {
      return {
        valid: false,
        error: `question ${question.id}: correctOptionId is required and must match one option.id`,
      };
    }
  }

  return { valid: true };
}

export function calculateWorksheetScore(content: WorksheetContent, answers: Record<string, string>) {
  const totalQuestions = getWorksheetMaxScore(content);
  let correctAnswers = 0;

  for (const question of content.questions) {
    if (answers[question.id] === question.correctOptionId) {
      correctAnswers += 1;
    }
  }

  return {
    score: correctAnswers,
    maxScore: totalQuestions,
    correctAnswers,
    totalQuestions,
  };
}

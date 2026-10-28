/**
 * Question Validator Service
 * Analyzes structured questions and computes true verification metrics.
 * Flags missing answers, missing options, missing explanations, and formatting anomalies.
 */

/**
 * Validate an array of parsed questions
 * Returns statistical breakdown and individual issue flags.
 */
export function validateQuestions(questions = []) {
  if (!Array.isArray(questions)) {
    return {
      totalDetected: 0,
      validCount: 0,
      needsReviewCount: 0,
      missingAnswerCount: 0,
      missingExplanationCount: 0,
      formattingIssuesCount: 0,
      items: [],
    }
  }

  let validCount = 0
  let missingAnswerCount = 0
  let missingExplanationCount = 0
  let formattingIssuesCount = 0

  const items = questions.map((q, idx) => {
    const issues = []

    // 1. Check Question Text
    if (!q.question || q.question.trim().length < 5) {
      issues.push({ code: 'EMPTY_QUESTION', message: 'Question prompt is missing or too short.' })
    }

    // 2. Check Options
    const options = Array.isArray(q.options) ? q.options : []
    if (options.length < 2) {
      issues.push({ code: 'INSUFFICIENT_OPTIONS', message: 'Fewer than 2 options detected.' })
      formattingIssuesCount++
    } else {
      const hasEmptyOption = options.some((opt) => !opt.text || opt.text.trim().length === 0)
      if (hasEmptyOption) {
        issues.push({ code: 'EMPTY_OPTION_TEXT', message: 'One or more options have empty text.' })
        formattingIssuesCount++
      }
    }

    // 3. Check Correct Answer
    if (!q.correctOption) {
      issues.push({ code: 'MISSING_ANSWER', message: 'Correct answer is missing.' })
      missingAnswerCount++
    } else {
      const optionIds = options.map((o) => o.id.toUpperCase())
      if (!optionIds.includes(q.correctOption.toUpperCase())) {
        issues.push({
          code: 'ANSWER_MISMATCH',
          message: `Correct answer (${q.correctOption}) does not match any available option (${optionIds.join(', ')}).`,
        })
        missingAnswerCount++
      }
    }

    // 4. Check Explanation
    if (!q.explanation || q.explanation.trim().length < 5) {
      issues.push({ code: 'MISSING_EXPLANATION', message: 'Explanation is missing or empty.' })
      missingExplanationCount++
    }

    const isValid = issues.length === 0
    if (isValid) {
      validCount++
    }

    return {
      ...q,
      originalIndex: idx,
      isValid,
      issues,
    }
  })

  const needsReviewCount = questions.length - validCount

  return {
    totalDetected: questions.length,
    validCount,
    needsReviewCount,
    missingAnswerCount,
    missingExplanationCount,
    formattingIssuesCount,
    items,
  }
}

/**
 * Quiz Utilities
 * Handles Fisher-Yates array shuffling and stable option randomization.
 * Ensures the correct answer mapping is never corrupted when options are shuffled.
 */

/**
 * Pure Fisher-Yates shuffle that returns a new array
 */
export function shuffleArray(arr) {
  if (!Array.isArray(arr)) return []
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Prepares questions for a student quiz attempt based on question bank settings.
 * - Randomizes question order (if enabled).
 * - Slices question count (if questionsPerAttempt is specified).
 * - Randomizes option order while preserving stable option IDs (if enabled).
 */
export function prepareQuizQuestions(questions = [], settings = {}) {
  if (!Array.isArray(questions) || questions.length === 0) return []

  let pool = [...questions]

  // 1. Shuffle question order if configured
  if (settings.randomizeQuestions !== false) {
    pool = shuffleArray(pool)
  }

  // 2. Limit question count if configured
  if (settings.questionsPerAttempt && Number(settings.questionsPerAttempt) > 0) {
    pool = pool.slice(0, Number(settings.questionsPerAttempt))
  }

  // 3. Shuffle options per question if configured
  return pool.map((q) => {
    let preparedOptions = Array.isArray(q.options) ? [...q.options] : []
    if (settings.randomizeOptions !== false && preparedOptions.length > 1) {
      preparedOptions = shuffleArray(preparedOptions)
    }

    return {
      ...q,
      options: preparedOptions,
    }
  })
}

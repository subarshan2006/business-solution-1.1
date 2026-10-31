/**
 * Question Bank Storage Service
 * Manages persistent storage of question banks and questions in browser storage.
 * Direct email-based access control with zero dependency on sensitive Google Classroom scopes.
 */

import unit1QuizData from '../../../data/unit1_chemistry_of_life_quiz.json'
import { purgeAllEphemeralImages } from './ephemeralImageService'

const STORAGE_KEY = 'nxtstep_question_banks'
const DELETED_BANKS_KEY = 'nxtstep_deleted_question_banks'

export function getDeletedBankIds() {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    const raw = localStorage.getItem(DELETED_BANKS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function recordDeletedBankId(id) {
  if (!id || typeof window === 'undefined' || !window.localStorage) return
  try {
    const deleted = getDeletedBankIds()
    if (!deleted.includes(id)) {
      deleted.push(id)
      localStorage.setItem(DELETED_BANKS_KEY, JSON.stringify(deleted))
    }
  } catch (err) {
    console.warn('Failed to record deleted bank ID:', err)
  }
}

// Initial seed question bank for immediate demonstration & testing
export const INITIAL_QUESTION_BANKS = [
  unit1QuizData,
  {
    id: 'qb_ap_bio_cells',
    title: 'AP Biology — Cellular Energetics & Organelles',
    description: 'Targeted high-yield MCQs covering ATP synthase, oxidative phosphorylation, and cellular structure.',
    subject: 'AP Biology',
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorizedStudents: [
      'student1@gmail.com',
      'demo@jivanauttestprep.com',
    ],
    settings: {
      randomizeQuestions: true,
      randomizeOptions: true,
      oneAttempt: true,
      showExplanation: true,
      questionsPerAttempt: null, // all questions
      timeLimitMinutes: 20,
      quizEndingHours: 3,
    },
    questions: [
      {
        id: 'Q001',
        question: 'Refer to the cellular organelle schematic below. Which labeled region represents the mitochondrial matrix where the Krebs (Citric Acid) Cycle enzymes reside?',
        image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 220" width="100%" height="220"><rect width="540" height="220" fill="%231a1a24" rx="16"/><ellipse cx="270" cy="110" rx="220" ry="85" fill="none" stroke="%23ff5c5c" stroke-width="4"/><path d="M 80,110 C 100,50 140,50 160,110 C 180,170 220,170 240,110 C 260,50 300,50 320,110 C 340,170 380,170 400,110 C 420,50 460,50 480,110" fill="none" stroke="%2360a5fa" stroke-width="3" stroke-dasharray="6,4"/><text x="270" y="32" fill="%23ffffff" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">Figure 1: Mitochondrial Structural Architecture</text><circle cx="120" cy="110" r="14" fill="%23ef4444"/><text x="120" y="115" fill="%23ffffff" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">A</text><circle cx="270" cy="110" r="14" fill="%2310b981"/><text x="270" y="115" fill="%23ffffff" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">B</text><circle cx="420" cy="110" r="14" fill="%23f59e0b"/><text x="420" y="115" fill="%23ffffff" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">C</text><text x="270" y="200" fill="%23a1a1aa" font-family="sans-serif" font-size="11" text-anchor="middle">Label B indicates the internal lumen (Matrix); Label A points to Cristae.</text></svg>',
        options: [
          { id: 'A', text: 'Region A (Outer mitochondrial membrane)' },
          { id: 'B', text: 'Region B (Mitochondrial Matrix lumen)' },
          { id: 'C', text: 'Region C (Inner membrane folding/Cristae)' },
          { id: 'D', text: 'Region D (Intermembrane space)' },
        ],
        correctOption: 'B',
        explanation: 'Region B marks the mitochondrial matrix lumen. Acetyl-CoA is oxidized within this aqueous internal compartment, generating CO2, ATP, and the electron carriers NADH and FADH2.',
      },
      {
        id: 'Q002',
        question: 'A scientist treats cell culture with an uncoupling agent that dissipates the proton gradient across the inner mitochondrial membrane. What is the most immediate effect on ATP synthesis?',
        options: [
          { id: 'A', text: 'Electron transport halts immediately' },
          { id: 'B', text: 'Oxygen consumption completely stops' },
          { id: 'C', text: 'ATP synthesis via ATP synthase drops drastically while electron transport continues' },
          { id: 'D', text: 'Glycolytic phosphorylation increases to double normal rates' },
        ],
        correctOption: 'C',
        explanation: 'Uncoupling agents (like DNP) allow protons to leak across the inner mitochondrial membrane, bypassing ATP synthase. This collapses the proton motive force needed for chemiosmotic ATP generation, while electron transport and oxygen consumption often continue or accelerate with energy released as heat.',
      },
      {
        id: 'Q003',
        question: 'Which organelle is characterized by hydrolytic enzymes that function optimally in an acidic luminal pH maintained by proton pumps?',
        options: [
          { id: 'A', text: 'Peroxisome' },
          { id: 'B', text: 'Lysosome' },
          { id: 'C', text: 'Rough endoplasmic reticulum' },
          { id: 'D', text: 'Golgi cisternae' },
        ],
        correctOption: 'B',
        explanation: 'Lysosomes are membrane-bound digestive vesicles containing acid hydrolases. V-type proton ATPases actively pump H+ into the lysosome to maintain an acidic luminal pH (~4.5–5.0), protecting the rest of the cell should a lysosome rupture.',
      },
      {
        id: 'Q004',
        question: 'During non-cyclic photophosphorylation in chloroplasts, what is the ultimate source of electrons that replaces those excited in Photosystem II (P680)?',
        options: [
          { id: 'A', text: 'NADPH' },
          { id: 'B', text: 'Water (H2O)' },
          { id: 'C', text: 'Carbon dioxide (CO2)' },
          { id: 'D', text: 'Photosystem I (P700)' },
        ],
        correctOption: 'B',
        explanation: 'The oxygen-evolving complex of Photosystem II photolyzes water molecules (2 H2O → 4 H+ + 4 e- + O2). The extracted electrons fill the electron holes in P680+ reaction centers, releasing oxygen as a byproduct.',
      },
      {
        id: 'Q005',
        question: 'Which of the following best describes competitive enzyme inhibition?',
        options: [
          { id: 'A', text: 'The inhibitor binds covalently to an allosteric site, decreasing Vmax.' },
          { id: 'B', text: 'The inhibitor binds reversibly to the active site, increasing apparent Km without altering Vmax.' },
          { id: 'C', text: 'The inhibitor binds exclusively to the enzyme-substrate complex, reducing both Km and Vmax.' },
          { id: 'D', text: 'The inhibitor permanently denatures the enzyme quaternary structure.' },
        ],
        correctOption: 'B',
        explanation: 'In competitive inhibition, the inhibitor competes directly with the substrate for the active site. Increasing substrate concentration can outcompete the inhibitor, so Vmax remains attainable, but a higher substrate concentration is required to reach 1/2 Vmax (Km increases).',
      },
    ],
  },
]

/**
 * Retrieve all question banks from storage (or seed if empty)
 */
export function getQuestionBanks() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return INITIAL_QUESTION_BANKS
  }
  try {
    const deletedIds = getDeletedBankIds()
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const initial = INITIAL_QUESTION_BANKS.filter((b) => !deletedIds.includes(b.id))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
      return initial
    }
    const banks = JSON.parse(raw)
    if (!Array.isArray(banks)) {
      const initial = INITIAL_QUESTION_BANKS.filter((b) => !deletedIds.includes(b.id))
      return initial
    }

    // Ensure preloaded Unit 1 bank exists in list with latest in-memory data ONLY IF NOT DELETED
    const unit1Idx = banks.findIndex((b) => b.id === unit1QuizData.id)
    if (unit1Idx === -1 && !deletedIds.includes(unit1QuizData.id)) {
      banks.unshift(unit1QuizData)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(banks))
    } else if (unit1Idx !== -1 && banks[unit1Idx]?.questions?.[0]?.image?.includes('assets/quiz-images/')) {
      // Upgrade legacy static image bank to dynamic in-memory data
      banks[unit1Idx] = unit1QuizData
      localStorage.setItem(STORAGE_KEY, JSON.stringify(banks))
    }

    // Ensure deleted banks never leak into list
    const sanitized = banks.filter((b) => !deletedIds.includes(b.id))
    if (sanitized.length !== banks.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized))
    }
    return sanitized
  } catch (err) {
    console.error('Failed to load question banks from localStorage:', err)
    return INITIAL_QUESTION_BANKS
  }
}

/**
 * Get single question bank by ID
 */
export function getQuestionBankById(id) {
  if (!id) return null
  const banks = getQuestionBanks()
  return banks.find((b) => b.id === id) || null
}

/**
 * Save / Update a question bank
 */
export function saveQuestionBank(bank) {
  if (!bank || !bank.id) return null
  const banks = getQuestionBanks()
  const now = new Date().toISOString()
  const cleanBank = {
    ...bank,
    updatedAt: now,
  }

  const index = banks.findIndex((b) => b.id === bank.id)
  let updated
  if (index >= 0) {
    updated = [...banks]
    updated[index] = cleanBank
  } else {
    cleanBank.createdAt = cleanBank.createdAt || now
    updated = [cleanBank, ...banks]
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save question bank to localStorage:', err)
  }
  return cleanBank
}

/**
 * Delete a question bank by ID
 */
export function deleteQuestionBank(id) {
  if (!id) return false
  recordDeletedBankId(id)
  const banks = getQuestionBanks()
  const filtered = banks.filter((b) => b.id !== id)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (err) {
    console.error('Failed to delete question bank:', err)
    return false
  }
}

/**
 * Factory to create a new Question Bank with defaults
 */
export function createQuestionBank({
  title = 'Untitled Question Bank',
  description = '',
  subject = 'AP Biology',
  questions = [],
  authorizedStudents = [],
  settings = {},
  published = false,
} = {}) {
  const id = `qb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const now = new Date().toISOString()

  return {
    id,
    title: title.trim(),
    description: description.trim(),
    subject: subject.trim(),
    questions,
    authorizedStudents: normalizeEmailList(authorizedStudents),
    published,
    createdAt: now,
    updatedAt: now,
    settings: {
      randomizeQuestions: true,
      randomizeOptions: true,
      oneAttempt: true,
      showExplanation: true,
      questionsPerAttempt: null,
      timeLimitMinutes: 20,
      quizEndingHours: 3,
      ...settings,
    },
  }
}

/**
 * Calculate the expiry ending timestamp (in ms) for a question bank.
 * Default: 3 hours from creation/publication.
 */
export function getQuizEndingTimestamp(bank) {
  if (!bank) return null
  const endingHours = Number(bank.settings?.quizEndingHours) || 3
  const baseTime = bank.publishedAt || bank.createdAt || new Date().toISOString()
  const baseMs = new Date(baseTime).getTime()
  return baseMs + (endingHours * 60 * 60 * 1000)
}

/**
 * Check if the quiz ending time has elapsed
 */
export function isQuizExpired(bank) {
  if (!bank) return false
  if (bank.isExpired) return true
  const expiryMs = getQuizEndingTimestamp(bank)
  if (!expiryMs) return false
  return Date.now() >= expiryMs
}

/**
 * Permanently shred all question screenshots and diagrams when quiz ending time is reached
 */
export function purgeExpiredQuizAssets(bankId) {
  if (!bankId) return false
  const banks = getQuestionBanks()
  const bank = banks.find((b) => b.id === bankId)
  if (!bank) return false

  let shreddedCount = 0
  const cleanedQuestions = (bank.questions || []).map((q) => {
    if (q.image) {
      shreddedCount++
      return {
        ...q,
        image: null,
        isPurged: true,
        purgedAt: new Date().toISOString(),
      }
    }
    return q
  })

  const updatedBank = {
    ...bank,
    isExpired: true,
    assetsPurgedAt: new Date().toISOString(),
    questions: cleanedQuestions,
  }

  saveQuestionBank(updatedBank)
  purgeAllEphemeralImages()
  console.info(`[AutoDelete] Shredded ${shreddedCount} proprietary question screenshots/diagrams for expired bank: ${bankId}`)
  return true
}

/**
 * Normalize and clean an array or string of emails
 */
export function normalizeEmailList(input) {
  if (!input) return []
  let emails = []
  if (Array.isArray(input)) {
    emails = input
  } else if (typeof input === 'string') {
    emails = input.split(/[\n,;]+/)
  }
  return Array.from(
    new Set(
      emails
        .map((e) => String(e).trim().toLowerCase())
        .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    )
  )
}

/**
 * Check if a student's Google email is authorized for a bank
 */
export function isStudentAuthorized(bank, studentEmail) {
  if (!bank || !studentEmail) return false
  const cleanEmail = String(studentEmail).trim().toLowerCase()
  const list = Array.isArray(bank.authorizedStudents)
    ? bank.authorizedStudents.map((e) => String(e).trim().toLowerCase())
    : []
  return list.includes(cleanEmail)
}

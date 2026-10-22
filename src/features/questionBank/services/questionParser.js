/**
 * Question Parser Service
 * Converts raw text, PDFs, JSON, or CSV into structured questions.
 * Designed to handle multi-page question banks without requiring a custom backend.
 */

/**
 * Main parser entry point: parses raw text or structured string into questions array
 */
export function parseQuestionsFromText(rawText) {
  if (!rawText || typeof rawText !== 'string') return []

  const trimmed = rawText.trim()

  // 1. Check if input is JSON
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed)
      const list = Array.isArray(parsed) ? parsed : parsed.questions || []
      return list.map((q, idx) => normalizeQuestionObject(q, idx + 1))
    } catch {
      // Not valid JSON, continue to text parsing
    }
  }

  // 2. Text Parser using intelligent chunking
  return parseRawTextBlocks(trimmed)
}

/**
 * Normalizes an already-structured question object to match schema
 */
export function normalizeQuestionObject(q, fallbackIndex = 1) {
  const id = q.id || `Q${String(fallbackIndex).padStart(3, '0')}`
  const question = String(q.question || q.prompt || q.text || '').trim()

  let options = []
  if (Array.isArray(q.options)) {
    options = q.options.map((opt, idx) => {
      if (typeof opt === 'string') {
        const letter = String.fromCharCode(65 + idx)
        return { id: letter, text: opt.trim() }
      }
      return {
        id: String(opt.id || String.fromCharCode(65 + idx)).toUpperCase(),
        text: String(opt.text || opt.label || '').trim(),
      }
    })
  } else if (typeof q.options === 'object' && q.options !== null) {
    options = Object.entries(q.options).map(([key, val]) => ({
      id: key.toUpperCase(),
      text: String(val).trim(),
    }))
  }

  let correctOption = String(
    q.correctOption || q.correctAnswer || q.answer || q.key || ''
  ).trim().toUpperCase()

  // If correctOption is full text rather than letter, find matching option ID
  if (correctOption.length > 2) {
    const match = options.find((o) => o.text.toLowerCase() === correctOption.toLowerCase())
    if (match) correctOption = match.id
  }

  const explanation = String(q.explanation || q.rationale || q.reason || '').trim()

  return {
    id,
    question,
    options,
    correctOption,
    explanation,
  }
}

/**
 * Parses raw text containing numbered questions, options (A-D), answers, and explanations
 */
function parseRawTextBlocks(text) {
  // Normalize line breaks
  const clean = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Split into chunks by question boundary:
  // Matches e.g. "\n1.", "\nQuestion 1:", "\nQ1.", "\n[1]"
  const questionSplitRegex = /(?:^|\n+)(?=(?:Question\s*\d+|Q\d+|\d+[.)]\s+|\[\d+\]))/i
  const rawBlocks = clean.split(questionSplitRegex).filter((b) => b && b.trim().length > 10)

  const parsedQuestions = []

  rawBlocks.forEach((block, idx) => {
    const parsed = parseSingleBlock(block, idx + 1)
    if (parsed) {
      parsedQuestions.push(parsed)
    }
  })

  return parsedQuestions
}

/**
 * Parses a single text block into a Question object
 */
function parseSingleBlock(block, fallbackIndex) {
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return null

  let questionId = `Q${String(fallbackIndex).padStart(3, '0')}`
  let questionText = ''
  let options = []
  let correctOption = ''
  let explanation = ''

  let currentMode = 'question' // 'question' | 'option' | 'explanation'
  let currentOptionId = ''
  let currentOptionText = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detect Answer line: e.g. "Answer: B", "Ans: C", "Correct: A", "Key: D"
    const ansMatch = line.match(/^(?:Answer|Ans|Correct\s*Answer|Key|Correct)\s*[:.-]\s*\(?([A-E])\)?/i)
    if (ansMatch) {
      if (currentMode === 'option' && currentOptionId) {
        options.push({ id: currentOptionId, text: currentOptionText.trim() })
        currentOptionId = ''
        currentOptionText = ''
      }
      correctOption = ansMatch[1].toUpperCase()
      currentMode = 'after_answer'
      continue
    }

    // Detect Explanation line: e.g. "Explanation: ...", "Rationale: ..."
    const expMatch = line.match(/^(?:Explanation|Rationale|Reason|Solution|Feedback)\s*[:.-]\s*(.*)$/i)
    if (expMatch) {
      if (currentMode === 'option' && currentOptionId) {
        options.push({ id: currentOptionId, text: currentOptionText.trim() })
        currentOptionId = ''
        currentOptionText = ''
      }
      currentMode = 'explanation'
      explanation = expMatch[1] ? expMatch[1].trim() : ''
      continue
    }

    // Detect Option line: e.g. "A. Option text", "A) Option text", "(A) Option text"
    const optMatch = line.match(/^[([]?([A-E])[.)\]]\s+(.*)$/i)
    if (optMatch && currentMode !== 'explanation') {
      if (currentMode === 'option' && currentOptionId) {
        options.push({ id: currentOptionId, text: currentOptionText.trim() })
      }
      currentMode = 'option'
      currentOptionId = optMatch[1].toUpperCase()
      currentOptionText = optMatch[2] ? optMatch[2].trim() : ''
      continue
    }

    // Accumulate lines based on current mode
    if (currentMode === 'explanation') {
      explanation += (explanation ? ' ' : '') + line
    } else if (currentMode === 'option') {
      currentOptionText += ' ' + line
    } else if (currentMode === 'question') {
      // If first line has question numbering, extract number and strip prefix
      if (!questionText) {
        const numMatch = line.match(/^(?:Question\s*|Q)?(\d+)[.:)]?\s*(.*)$/i)
        if (numMatch) {
          questionId = `Q${String(numMatch[1]).padStart(3, '0')}`
          questionText = numMatch[2] ? numMatch[2].trim() : ''
        } else {
          questionText = line
        }
      } else {
        questionText += ' ' + line
      }
    }
  }

  // Push final option if still pending
  if (currentMode === 'option' && currentOptionId) {
    options.push({ id: currentOptionId, text: currentOptionText.trim() })
  }

  // Fallback: if no question text extracted
  if (!questionText) {
    questionText = lines[0] || 'Untitled Question'
  }

  return {
    id: questionId,
    question: questionText.trim(),
    options,
    correctOption,
    explanation: explanation.trim(),
  }
}

/**
 * Extracts plain text from a client-uploaded PDF file using PDF.js via CDN
 */
export async function extractTextFromPdf(file) {
  if (!file) throw new Error('No PDF file provided')

  // Load PDF.js dynamically if not already loaded in the window
  if (!window.pdfjsLib) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.async = true
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
          resolve()
        } else {
          reject(new Error('PDF.js failed to initialize'))
        }
      }
      script.onerror = () => reject(new Error('Network error loading PDF reader'))
      document.head.appendChild(script)
    })
  }

  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer })
  const pdfDoc = await loadingTask.promise

  let fullText = ''
  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum)
    const textContent = await page.getTextContent()
    const pageString = textContent.items.map((item) => item.str).join(' ')
    fullText += `\n\n--- Page ${pageNum} ---\n\n` + pageString
  }

  return fullText
}

/**
 * Parses questions from CSV text
 * Expected CSV columns: Question, Option A, Option B, Option C, Option D, Correct Answer, Explanation
 */
export function parseQuestionsFromCsv(csvText) {
  if (!csvText) return []
  const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  // Simple CSV parser supporting quotes
  const parseCsvLine = (line) => {
    const result = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        inQuotes = !inQuotes
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim())
        cur = ''
      } else {
        cur += c
      }
    }
    result.push(cur.trim())
    return result
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase())
  const qIdx = header.findIndex((h) => h.includes('question'))
  const ansIdx = header.findIndex((h) => h.includes('answer') || h.includes('correct'))
  const expIdx = header.findIndex((h) => h.includes('explanation') || h.includes('reason'))

  const questions = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    if (cols.length < 3) continue

    const prompt = qIdx >= 0 ? cols[qIdx] : cols[0]
    const correctOption = ansIdx >= 0 ? cols[ansIdx].toUpperCase().slice(0, 1) : 'A'
    const explanation = expIdx >= 0 ? cols[expIdx] : ''

    const options = []
    ;['a', 'b', 'c', 'd', 'e'].forEach((letter) => {
      const idx = header.findIndex((h) => h.includes(`option ${letter}`) || h === letter)
      if (idx >= 0 && cols[idx]) {
        options.push({ id: letter.toUpperCase(), text: cols[idx] })
      }
    })

    // If options not found by header, take columns 1 through 4
    if (options.length === 0) {
      if (cols[1]) options.push({ id: 'A', text: cols[1] })
      if (cols[2]) options.push({ id: 'B', text: cols[2] })
      if (cols[3]) options.push({ id: 'C', text: cols[3] })
      if (cols[4]) options.push({ id: 'D', text: cols[4] })
    }

    questions.push({
      id: `Q${String(i).padStart(3, '0')}`,
      question: prompt,
      options,
      correctOption,
      explanation,
    })
  }

  return questions
}

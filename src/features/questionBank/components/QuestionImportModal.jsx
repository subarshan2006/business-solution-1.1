import { useState, useEffect } from 'react'
import {
  parseQuestionsFromText,
  parseQuestionsFromCsv,
  extractTextFromPdf,
} from '../services/questionParser'
import { validateQuestions } from '../services/questionValidator'
import { saveQuestionBank } from '../services/questionBankStorage'

const SAMPLE_TEXT_TO_IMPORT = `1. What is the primary role of RuBisCO in the Calvin cycle of photosynthesis?

A. Splitting water molecules in Photosystem II
B. Catalyzing the fixation of atmospheric CO2 onto ribulose-1,5-bisphosphate (RuBP)
C. Generating ATP via substrate-level phosphorylation
D. Transporting electrons through plastoquinone to cytochrome b6f

Answer: B

Explanation:
RuBisCO (ribulose-1,5-bisphosphate carboxylase-oxygenase) is the primary carboxylating enzyme in the stroma of chloroplasts that catalyzes the fixation of carbon dioxide to RuBP, forming 3-phosphoglycerate (3-PGA).

2. In eukaryotic cellular respiration, where is the enzyme ATP synthase structurally located?

A. Outer mitochondrial membrane
B. Inner mitochondrial membrane (cristae)
C. Mitochondrial matrix
D. Cytosol

Answer: B

Explanation:
ATP synthase complexes are embedded in the inner mitochondrial membrane (cristae), utilizing the proton motive force generated across the intermembrane space to synthesize ATP from ADP and Pi.

3. Which of the following best describes an allosteric inhibitor?

A. An inhibitor that binds irreversibly to the catalytic active site
B. An inhibitor that binds to a non-active regulatory site, altering active site conformation
C. A substrate analogue that competes with the natural substrate for active site binding
D. A coenzyme required for optimal holoenzyme stability

Answer: B

Explanation:
Allosteric inhibitors bind to allosteric (regulatory) sites distinct from the active site. This induces an allosteric conformational shift that reduces the enzyme affinity for substrate or lowers catalytic turnover without competing directly for the active site.`

function QuestionImportModal({ bank, onClose, onImported }) {
  const [importMode, setImportMode] = useState('text') // 'pdf' | 'text' | 'file'
  const [rawText, setRawText] = useState('')
  const [loading, setLoading] = useState(false)
  const [progressMsg, setProgressMsg] = useState('')
  const [error, setError] = useState('')

  const [validationResult, setValidationResult] = useState(null)
  const [appendMode, setAppendMode] = useState(true)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, loading])

  // Handle PDF file selection
  const handlePdfFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setLoading(true)
    setProgressMsg('Extracting text from PDF (client-side in browser memory)...')

    try {
      const extractedText = await extractTextFromPdf(file)
      if (!extractedText || extractedText.trim().length < 20) {
        throw new Error(
          'Could not extract text from this PDF. It may be a scanned image PDF. Please paste questions or use JSON/CSV import.'
        )
      }
      setRawText(extractedText)
      handleParse(extractedText)
      setImportMode('text')
    } catch (err) {
      console.error('PDF extraction failed:', err)
      setError(err.message || 'Failed to extract text from PDF.')
    } finally {
      setLoading(false)
      setProgressMsg('')
    }
  }

  // Handle JSON / CSV file selection
  const handleStructuredFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setLoading(true)
    setProgressMsg(`Reading ${file.name}...`)

    try {
      const text = await file.text()
      if (file.name.endsWith('.csv')) {
        const questions = parseQuestionsFromCsv(text)
        const validated = validateQuestions(questions)
        setValidationResult(validated)
      } else if (file.name.endsWith('.json')) {
        try {
          const parsedJson = JSON.parse(text)
          let questions = []
          if (Array.isArray(parsedJson)) {
            questions = parsedJson
          } else if (Array.isArray(parsedJson.questions)) {
            questions = parsedJson.questions
          } else {
            throw new Error('JSON file must contain an array of questions or a "questions" property.')
          }

          const validated = validateQuestions(questions)
          setValidationResult(validated)
          setProgressMsg(`Successfully loaded ${questions.length} questions from ${file.name}.`)
        } catch (jsonErr) {
          throw new Error(`Invalid JSON format: ${jsonErr.message}`)
        }
      } else {
        setRawText(text)
        handleParse(text)
      }
    } catch (err) {
      console.error('File parsing failed:', err)
      setError(err.message || 'Failed to parse file.')
    } finally {
      setLoading(false)
    }
  }

  // Parse and validate questions
  const handleParse = (textToParse = rawText) => {
    setError('')
    if (!textToParse.trim()) {
      setError('Please provide questions text or select a file to import.')
      return
    }

    try {
      const parsed = parseQuestionsFromText(textToParse)
      if (parsed.length === 0) {
        setError(
          'No questions could be detected. Please verify question numbering (e.g. "1. What is..."), options (A-D), and "Answer: X".'
        )
        setValidationResult(null)
        return
      }

      const validated = validateQuestions(parsed)
      setValidationResult(validated)
    } catch (err) {
      setError(err.message || 'Error occurred while parsing questions.')
    }
  }

  // Load sample demo text
  const handleLoadSample = () => {
    setRawText(SAMPLE_TEXT_TO_IMPORT)
    handleParse(SAMPLE_TEXT_TO_IMPORT)
  }

  // Final Commit to Bank
  const handleConfirmImport = () => {
    if (!validationResult || validationResult.items.length === 0) return

    const newQuestions = validationResult.items.map(
      ({ issues: _issues, isValid: _isValid, originalIndex: _idx, ...q }) => q
    )

    const existingQuestions = Array.isArray(bank.questions) ? bank.questions : []
    const combined = appendMode ? [...existingQuestions, ...newQuestions] : newQuestions

    const hasScreenshots = combined.some((q) => q.image || q.imageUrl)

    const updated = saveQuestionBank({
      ...bank,
      isSlideDeck: bank.isSlideDeck || hasScreenshots,
      questions: combined,
    })

    onImported(updated, newQuestions.length)
  }

  return (
    <div className="qb-modal-backdrop" onClick={loading ? null : onClose}>
      <div className="qb-modal-card qb-modal-card-lg" onClick={(e) => e.stopPropagation()}>
        <div className="qb-modal-header">
          <div>
            <h3 className="qb-modal-title">Import Questions</h3>
            <p className="qb-modal-subtitle">
              Import into &ldquo;{bank.title}&rdquo; via PDF, direct text paste, JSON, or CSV.
            </p>
          </div>
          <button
            type="button"
            className="qb-modal-close-btn"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            <ion-icon name="close-outline"></ion-icon>
          </button>
        </div>

        <div className="qb-modal-body">
          {error && <div className="qb-alert-error">{error}</div>}
          {progressMsg && <div className="qb-alert-info">{progressMsg}</div>}

          {/* Mode Tabs */}
          <div className="qb-import-tabs">
            <button
              type="button"
              className={`qb-import-tab ${importMode === 'text' ? 'active' : ''}`}
              onClick={() => setImportMode('text')}
            >
              <ion-icon name="document-text-outline"></ion-icon>
              <span>Paste Text / Quick Demo</span>
            </button>
            <button
              type="button"
              className={`qb-import-tab ${importMode === 'pdf' ? 'active' : ''}`}
              onClick={() => setImportMode('pdf')}
            >
              <ion-icon name="document-outline"></ion-icon>
              <span>PDF Extraction (Browser-Side)</span>
            </button>
            <button
              type="button"
              className={`qb-import-tab ${importMode === 'file' ? 'active' : ''}`}
              onClick={() => setImportMode('file')}
            >
              <ion-icon name="code-slash-outline"></ion-icon>
              <span>Upload JSON / CSV</span>
            </button>
          </div>

          {/* Tab 1: Text Paste */}
          {importMode === 'text' && (
            <div className="qb-import-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="qb-form-label" style={{ margin: 0 }}>
                  Paste Question Text:
                </label>
                <button
                  type="button"
                  className="qb-text-btn-sample"
                  onClick={handleLoadSample}
                >
                  ⚡ Load 3 Sample AP Questions
                </button>
              </div>

              <textarea
                rows="10"
                className="qb-form-textarea font-mono"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="1. What is the function of the cell membrane?&#10;&#10;A. Protein synthesis&#10;B. Selective permeability&#10;C. Energy storage&#10;D. DNA replication&#10;&#10;Answer: B&#10;&#10;Explanation:&#10;The plasma membrane maintains homeostasis by regulating what enters and leaves the cell."
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleParse(rawText)}
                  disabled={loading || !rawText.trim()}
                >
                  Parse & Validate Text
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: PDF Upload */}
          {importMode === 'pdf' && (
            <div className="qb-import-content">
              <div className="qb-dropzone">
                <ion-icon name="cloud-upload-outline" class="qb-dropzone-icon"></ion-icon>
                <h4>Upload Question Bank PDF</h4>
                <p>The PDF is processed entirely inside your browser. No files are uploaded to any public server.</p>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfFile}
                  disabled={loading}
                  style={{ marginTop: '14px' }}
                />
              </div>
              <p className="qb-hint-text">
                Note: Supports standard text-based PDFs. If your PDF is a scanned image, use the Paste Text or JSON/CSV tab.
              </p>
            </div>
          )}

          {/* Tab 3: JSON / CSV */}
          {importMode === 'file' && (
            <div className="qb-import-content">
              <div className="qb-dropzone">
                <ion-icon name="document-attach-outline" class="qb-dropzone-icon"></ion-icon>
                <h4>Upload JSON or CSV File</h4>
                <p>Upload a structured question list (.json or .csv)</p>
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={handleStructuredFile}
                  disabled={loading}
                  style={{ marginTop: '14px' }}
                />
              </div>
            </div>
          )}

          {/* Validation Metrics Report */}
          {validationResult && (
            <div className="qb-validation-report">
              <div className="qb-report-header">
                <h4>Import Validation Summary</h4>
                <span className="qb-detected-tag">
                  {validationResult.totalDetected} Questions Detected
                </span>
              </div>

              <div className="qb-stats-metrics-grid">
                <div className="qb-metric-box valid">
                  <div className="qb-metric-num">✓ {validationResult.validCount}</div>
                  <div className="qb-metric-label">Valid Ready</div>
                </div>

                <div className={`qb-metric-box ${validationResult.needsReviewCount > 0 ? 'warning' : 'ok'}`}>
                  <div className="qb-metric-num">⚠ {validationResult.needsReviewCount}</div>
                  <div className="qb-metric-label">Needs Review</div>
                </div>

                <div className={`qb-metric-box ${validationResult.missingAnswerCount > 0 ? 'warning' : 'ok'}`}>
                  <div className="qb-metric-num">{validationResult.missingAnswerCount}</div>
                  <div className="qb-metric-label">Missing Answer</div>
                </div>

                <div className={`qb-metric-box ${validationResult.missingExplanationCount > 0 ? 'warning' : 'ok'}`}>
                  <div className="qb-metric-num">{validationResult.missingExplanationCount}</div>
                  <div className="qb-metric-label">Missing Explanation</div>
                </div>
              </div>

              {/* Append vs Replace Choice */}
              <div className="qb-import-mode-toggle">
                <label className="qb-radio-label">
                  <input
                    type="radio"
                    name="importModeRadio"
                    checked={appendMode}
                    onChange={() => setAppendMode(true)}
                  />
                  <span>Append to existing questions ({Array.isArray(bank.questions) ? bank.questions.length : 0} current)</span>
                </label>
                <label className="qb-radio-label">
                  <input
                    type="radio"
                    name="importModeRadio"
                    checked={!appendMode}
                    onChange={() => setAppendMode(false)}
                  />
                  <span>Replace existing questions</span>
                </label>
              </div>
            </div>
          )}

          <div className="qb-modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirmImport}
              disabled={!validationResult || validationResult.items.length === 0 || loading}
            >
              Confirm & Save {validationResult ? `${validationResult.totalDetected} Questions` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionImportModal

import { useState, useId, useMemo, useEffect, useCallback } from 'react'
import {
  createCourseAnnouncement,
  fetchClassroomSessionContext,
} from '../services/classroomApi'
import { saveClassroomOverride } from '../data/classroomDirectory.js'

/**
 * Helper to get ordinal suffix for date (1st, 2nd, 3rd, 4th...)
 */
function getOrdinalSuffix(day) {
  if (day > 3 && day < 21) return `${day}th`
  switch (day % 10) {
    case 1:
      return `${day}st`
    case 2:
      return `${day}nd`
    case 3:
      return `${day}rd`
    default:
      return `${day}th`
  }
}

/**
 * Format a Date object to "October 5th"
 */
function formatDateWithOrdinal(date) {
  const month = date.toLocaleString('en-US', { month: 'long' })
  const day = date.getDate()
  return `${month} ${getOrdinalSuffix(day)}`
}

export default function SessionAnnouncementGenerator({
  courses = [],
  selectedCourse = null,
  auth = null,
  defaultTeacherName = 'Steena',
}) {
  const formId = useId()
  const today = useMemo(() => new Date(), [])
  const tomorrow = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d
  }, [])

  // Active target course ID
  const [courseId, setCourseId] = useState(
    () => selectedCourse?.id || courses[0]?.id || ''
  )

  // Form State
  const [subjectTitle, setSubjectTitle] = useState('AP Biology')
  const [sessionNumber, setSessionNumber] = useState('3')
  const [pstDateStr, setPstDateStr] = useState(() => formatDateWithOrdinal(today))
  const [istDateStr, setIstDateStr] = useState(() => formatDateWithOrdinal(tomorrow))
  const [parentName, setParentName] = useState('Ms. Sambhrama')
  const [studentName, setStudentName] = useState('Samyuktha')
  const [topicsCovered, setTopicsCovered] = useState(
    'Unit 2 :- Cell organelles - Cytoskeleton, peroxisomes, ECM and cell junctions.'
  )
  const [hwAssigned, setHwAssigned] = useState('Unit 2 workbook page numbers 7 through 20')
  const [hwStatus, setHwStatus] = useState('Not submitted')
  const [remarks, setRemarks] = useState(
    'Revised the concepts from the last classes and completed the concepts on cell organelles. Did practice MCQ on the same.'
  )
  const [teacherName, setTeacherName] = useState(
    auth?.user?.name && auth.user.name.includes('Steena') ? 'Steena' : defaultTeacherName
  )

  // Dynamic context data loaded from Classroom API
  const [availableTopics, setAvailableTopics] = useState([])
  const [recentCourseWork, setRecentCourseWork] = useState([])
  const [syncMeta, setSyncMeta] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Status & UI State
  const [posting, setPosting] = useState(false)
  const [postSuccess, setPostSuccess] = useState('')
  const [postError, setPostError] = useState('')
  const [copied, setCopied] = useState(false)
  const [savedAnnouncements, setSavedAnnouncements] = useState(() => {
    try {
      const saved = localStorage.getItem('nxtstep_saved_announcements')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Synchronize when selectedCourse prop changes externally (e.g., clicking "Update" from course list)
  useEffect(() => {
    if (selectedCourse?.id && selectedCourse.id !== courseId) {
      setCourseId(selectedCourse.id)
    }
  }, [selectedCourse, courseId])

  // Fetch and auto-populate classroom-specific details whenever courseId changes
  const syncClassroomDetails = useCallback(
    async (targetId) => {
      if (!targetId) return
      setSyncing(true)
      try {
        const activeCourse = courses.find((c) => c.id === targetId) || selectedCourse
        const ctx = await fetchClassroomSessionContext(
          targetId,
          auth?.accessToken || null,
          activeCourse
        )

        if (ctx) {
          if (ctx.studentName) setStudentName(ctx.studentName)
          if (ctx.parentName) setParentName(ctx.parentName)
          if (ctx.subjectTitle) setSubjectTitle(ctx.subjectTitle)
          if (ctx.sessionNumber) setSessionNumber(ctx.sessionNumber)
          if (ctx.topicsCovered) setTopicsCovered(ctx.topicsCovered)
          if (ctx.hwAssigned) setHwAssigned(ctx.hwAssigned)
          if (ctx.hwStatus) setHwStatus(ctx.hwStatus)
          if (ctx.remarks) setRemarks(ctx.remarks)
          setAvailableTopics(ctx.availableTopics || [])
          setRecentCourseWork(ctx.recentCourseWork || [])
          setSyncMeta(ctx.meta || null)
        }
      } catch (err) {
        console.warn('Could not auto-sync classroom context:', err)
      } finally {
        setSyncing(false)
      }
    },
    [courses, selectedCourse, auth]
  )

  useEffect(() => {
    if (courseId) {
      syncClassroomDetails(courseId)
    }
  }, [courseId, syncClassroomDetails])

  // Build the exact announcement text matching requested format
  const announcementText = useMemo(() => {
    return `${subjectTitle}-session ${sessionNumber} - ${pstDateStr} PST (${istDateStr} IST)

Hi ${parentName},


Please find the session updates for the last class below:-


Topics covered:- ${topicsCovered}

HW assigned:- ${hwAssigned}

HW status/score:- ${hwStatus}

Remarks:- ${remarks}

Kindly check the google classroom for the materials and HW.

Regards and thanks, ${teacherName}`
  }, [
    subjectTitle,
    sessionNumber,
    pstDateStr,
    istDateStr,
    parentName,
    topicsCovered,
    hwAssigned,
    hwStatus,
    remarks,
    teacherName,
  ])

  // Handle Course dropdown change
  const handleCourseChange = (e) => {
    const selectedId = e.target.value
    setCourseId(selectedId)
  }

  // Handle selecting a recent coursework item
  const handleSelectRecentHw = (cw) => {
    if (!cw) return
    setHwAssigned(cw.title)
    if (cw.status) {
      setHwStatus(cw.status)
    }
  }

  // Quick Preset Handlers
  const handlePresetHwStatus = (status) => {
    setHwStatus(status)
  }

  // Save manual overrides for this specific classroom
  const handleSaveClassroomOverrides = () => {
    if (!courseId) return
    saveClassroomOverride(courseId, {
      studentName,
      parentName,
      subject: subjectTitle,
    })
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2800)
  }

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(announcementText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Post to Google Classroom
  const handlePostToClassroom = async () => {
    if (!auth?.accessToken) {
      setPostError('Please connect your Google Classroom account to publish announcements.')
      return
    }

    if (auth.isMock) {
      setPosting(true)
      setPostError('')
      setTimeout(() => {
        setPosting(false)
        setPostSuccess('✓ Announcement posted successfully to Google Classroom (Preview Mode)!')
        saveToHistory()
      }, 900)
      return
    }

    if (!courseId) {
      setPostError('Please select a classroom first.')
      return
    }

    setPosting(true)
    setPostError('')
    setPostSuccess('')

    try {
      await createCourseAnnouncement(courseId, announcementText, auth.accessToken)
      setPostSuccess('✓ Successfully posted announcement to Google Classroom stream!')
      saveToHistory()
    } catch (err) {
      console.error('Error posting announcement:', err)
      setPostError(
        err.message || 'Failed to post announcement. Make sure you have permission to post announcements in this classroom.'
      )
    } finally {
      setPosting(false)
    }
  }

  // Save to local history
  const saveToHistory = () => {
    const newItem = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      subject: subjectTitle,
      session: sessionNumber,
      student: studentName,
      text: announcementText,
    }
    const updated = [newItem, ...savedAnnouncements.slice(0, 9)]
    setSavedAnnouncements(updated)
    try {
      localStorage.setItem('nxtstep_saved_announcements', JSON.stringify(updated))
    } catch (e) {
      console.warn('Could not save to localStorage:', e)
    }
  }

  // WhatsApp Share URL
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(announcementText)}`

  // Email Share URL
  const emailUrl = `mailto:?subject=${encodeURIComponent(
    `${subjectTitle} - Session ${sessionNumber} Updates`
  )}&body=${encodeURIComponent(announcementText)}`

  return (
    <div className="session-announcement-generator">
      {/* Header Banner */}
      <div className="announcement-header-card">
        <div className="announcement-header-left">
          <div className="announcement-icon-badge">
            <ion-icon name="megaphone-outline"></ion-icon>
          </div>
          <div>
            <div className="announcement-badge-row">
              <span className="announcement-type-pill">SESSION REPORT BUILDER</span>
              <span className="sub-badge">Google Classroom Auto-Post</span>
              {syncMeta && (
                <span className="api-sync-badge" title={syncMeta.parentSource}>
                  <ion-icon name="flash-outline"></ion-icon>
                  <span>Auto-Synced: {studentName}</span>
                </span>
              )}
            </div>
            <h3 className="h3 announcement-title">Class Session Announcement Generator</h3>
            <p className="announcement-subtitle">
              Draft structured class updates with auto-extracted student, parent, homework, and session details directly from Google Classroom.
            </p>
          </div>
        </div>

        <div className="announcement-header-actions">
          <button
            type="button"
            className="announcement-action-btn refresh-sync-btn"
            onClick={() => syncClassroomDetails(courseId)}
            disabled={syncing}
            title="Refresh student, parent, and homework details from Google Classroom"
          >
            <ion-icon name={syncing ? 'sync-outline' : 'refresh-outline'} className={syncing ? 'spin-icon' : ''}></ion-icon>
            <span>{syncing ? 'Syncing...' : 'Sync from Classroom'}</span>
          </button>

          <button
            type="button"
            className={`announcement-action-btn copy-btn${copied ? ' copied' : ''}`}
            onClick={handleCopy}
            title="Copy announcement text to clipboard"
          >
            <ion-icon name={copied ? 'checkmark-outline' : 'copy-outline'}></ion-icon>
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Formatted Text'}</span>
          </button>

          <button
            type="button"
            className="announcement-action-btn post-btn"
            onClick={handlePostToClassroom}
            disabled={posting}
            title="Post announcement directly to Google Classroom stream"
          >
            <ion-icon name="paper-plane-outline"></ion-icon>
            <span>{posting ? 'Posting to Classroom...' : 'Post to Classroom'}</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncMeta && (
        <div className="announcement-sync-banner">
          <div className="sync-banner-content">
            <div className="sync-banner-icon">
              <ion-icon name="checkmark-done-circle-outline"></ion-icon>
            </div>
            <div className="sync-banner-text">
              <strong>Classroom Synced:</strong> Enrolled Student: <em>{studentName}</em> • Parent (Option A): <em>{parentName}</em> • Session: <em>#{sessionNumber}</em>
              {syncMeta.parentSource && (
                <span className="sync-source-tag">Source: {syncMeta.parentSource}</span>
              )}
            </div>
          </div>
          {saveSuccess ? (
            <span className="saved-confirm-pill">
              <ion-icon name="checkmark-circle"></ion-icon> Saved for this classroom!
            </span>
          ) : (
            <button
              type="button"
              className="save-classroom-btn"
              onClick={handleSaveClassroomOverrides}
              title="Save current Student and Parent names for this classroom"
            >
              <ion-icon name="save-outline"></ion-icon>
              <span>Remember Details</span>
            </button>
          )}
        </div>
      )}

      {/* Notifications */}
      {postSuccess && (
        <div className="announcement-alert success">
          <ion-icon name="checkmark-circle-outline"></ion-icon>
          <span>{postSuccess}</span>
          <button type="button" className="close-alert-btn" onClick={() => setPostSuccess('')}>
            ✕
          </button>
        </div>
      )}

      {postError && (
        <div className="announcement-alert error">
          <ion-icon name="alert-circle-outline"></ion-icon>
          <span>{postError}</span>
          <button type="button" className="close-alert-btn" onClick={() => setPostError('')}>
            ✕
          </button>
        </div>
      )}

      {/* Two Column Layout: Editor Form on Left, Live Preview on Right */}
      <div className="announcement-builder-grid">
        {/* LEFT COLUMN: Input Form */}
        <div className="announcement-form-pane">
          <div className="pane-card">
            <div className="pane-title-row">
              <h4 className="h4 pane-title">
                <ion-icon name="create-outline"></ion-icon>
                <span>Session Details</span>
              </h4>
              {syncing && <span className="syncing-indicator">Auto-fetching details...</span>}
            </div>

            {/* Target Classroom */}
            {courses.length > 0 && (
              <div className="form-group highlight-classroom-select">
                <label htmlFor={`${formId}-course`} className="form-label">
                  Target Classroom (1-on-1 Tutoring):
                </label>
                <select
                  id={`${formId}-course`}
                  className="form-select classroom-dropdown"
                  value={courseId}
                  onChange={handleCourseChange}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.section ? `(${c.section})` : ''}
                    </option>
                  ))}
                </select>
                <span className="form-helper-text">
                  Selecting a classroom automatically loads its enrolled student, parent (Option A), session number, and homework.
                </span>
              </div>
            )}

            {/* Header Row: Subject & Session */}
            <div className="form-row two-col">
              <div className="form-group">
                <label htmlFor={`${formId}-subject`} className="form-label">
                  Course / Subject:
                </label>
                <input
                  id={`${formId}-subject`}
                  type="text"
                  className="form-input"
                  value={subjectTitle}
                  onChange={(e) => setSubjectTitle(e.target.value)}
                  placeholder="e.g. AP Biology"
                />
              </div>

              <div className="form-group">
                <label htmlFor={`${formId}-session`} className="form-label">
                  Session Number:
                </label>
                <div className="session-number-control">
                  <input
                    id={`${formId}-session`}
                    type="number"
                    min="1"
                    className="form-input"
                    value={sessionNumber}
                    onChange={(e) => setSessionNumber(e.target.value)}
                    placeholder="3"
                  />
                  <div className="stepper-btns">
                    <button
                      type="button"
                      onClick={() => setSessionNumber((prev) => String(Math.max(1, (parseInt(prev, 10) || 1) - 1)))}
                      className="stepper-btn"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => setSessionNumber((prev) => String((parseInt(prev, 10) || 1) + 1))}
                      className="stepper-btn"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Dates: PST and IST */}
            <div className="form-row two-col">
              <div className="form-group">
                <label htmlFor={`${formId}-pst-date`} className="form-label">
                  PST Date:
                </label>
                <input
                  id={`${formId}-pst-date`}
                  type="text"
                  className="form-input"
                  value={pstDateStr}
                  onChange={(e) => setPstDateStr(e.target.value)}
                  placeholder="e.g. October 5th"
                />
              </div>

              <div className="form-group">
                <label htmlFor={`${formId}-ist-date`} className="form-label">
                  IST Date (India):
                </label>
                <input
                  id={`${formId}-ist-date`}
                  type="text"
                  className="form-input"
                  value={istDateStr}
                  onChange={(e) => setIstDateStr(e.target.value)}
                  placeholder="e.g. October 6th"
                />
              </div>
            </div>

            {/* Parent & Student Names */}
            <div className="form-row two-col">
              <div className="form-group">
                <div className="label-with-presets">
                  <label htmlFor={`${formId}-parent`} className="form-label">
                    Parent / Guardian Name:
                  </label>
                  <span className="field-source-pill" title="Extracted from prior announcement or directory">
                    Option A Auto-Extracted
                  </span>
                </div>
                <input
                  id={`${formId}-parent`}
                  type="text"
                  className="form-input"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="e.g. Ms. Sambhrama"
                />
              </div>

              <div className="form-group">
                <div className="label-with-presets">
                  <label htmlFor={`${formId}-student`} className="form-label">
                    Student Name:
                  </label>
                  <span className="field-source-pill" title="Synced from Google Classroom roster">
                    Classroom Roster
                  </span>
                </div>
                <input
                  id={`${formId}-student`}
                  type="text"
                  className="form-input"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Samyuktha"
                />
              </div>
            </div>

            {/* Topics Covered */}
            <div className="form-group">
              <div className="label-with-presets">
                <label htmlFor={`${formId}-topics`} className="form-label">
                  Topics covered:-
                </label>
                {availableTopics.length > 0 && (
                  <div className="quick-chips">
                    {availableTopics.map((top, idx) => {
                      const shortLabel = top.split(':-')?.[1]?.trim()?.split('-')?.[0]?.trim() || top.slice(0, 22)
                      return (
                        <span
                          key={idx}
                          className="chip-btn"
                          onClick={() => setTopicsCovered(top)}
                          title={top}
                        >
                          {shortLabel}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
              <textarea
                id={`${formId}-topics`}
                className="form-textarea"
                rows="2"
                value={topicsCovered}
                onChange={(e) => setTopicsCovered(e.target.value)}
                placeholder="Unit 2 :- Cell organelles..."
              />
            </div>

            {/* HW Assigned */}
            <div className="form-group">
              <div className="label-with-presets">
                <label htmlFor={`${formId}-hw-assigned`} className="form-label">
                  HW assigned:-
                </label>
                {recentCourseWork.length > 0 && (
                  <div className="quick-chips">
                    {recentCourseWork.map((cw) => (
                      <span
                        key={cw.id}
                        className="chip-btn"
                        onClick={() => handleSelectRecentHw(cw)}
                        title={`Select from Classroom: ${cw.title}`}
                      >
                        {cw.title.slice(0, 22)}...
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <input
                id={`${formId}-hw-assigned`}
                type="text"
                className="form-input"
                value={hwAssigned}
                onChange={(e) => setHwAssigned(e.target.value)}
                placeholder="Unit 2 workbook page numbers 7 through 20"
              />
            </div>

            {/* HW Status / Score */}
            <div className="form-group">
              <div className="label-with-presets">
                <label htmlFor={`${formId}-hw-status`} className="form-label">
                  HW status/score:-
                </label>
                <div className="quick-chips">
                  {['Not submitted', 'Submitted', '18/20', '19/20', '20/20', 'Awaiting review'].map((st) => (
                    <span
                      key={st}
                      className={`chip-btn${hwStatus === st ? ' active' : ''}`}
                      onClick={() => handlePresetHwStatus(st)}
                    >
                      {st}
                    </span>
                  ))}
                </div>
              </div>
              <input
                id={`${formId}-hw-status`}
                type="text"
                className="form-input"
                value={hwStatus}
                onChange={(e) => setHwStatus(e.target.value)}
                placeholder="Not submitted"
              />
            </div>

            {/* Remarks */}
            <div className="form-group">
              <label htmlFor={`${formId}-remarks`} className="form-label">
                Remarks:-
              </label>
              <textarea
                id={`${formId}-remarks`}
                className="form-textarea"
                rows="3"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Revised the concepts from the last classes..."
              />
            </div>

            {/* Teacher Sign-off */}
            <div className="form-row two-col">
              <div className="form-group">
                <label htmlFor={`${formId}-teacher`} className="form-label">
                  Teacher Name (Sign-off):
                </label>
                <input
                  id={`${formId}-teacher`}
                  type="text"
                  className="form-input"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Steena"
                />
              </div>

              <div className="form-group share-actions-box">
                <label className="form-label">Quick Share Shortcuts:</label>
                <div className="share-buttons-row">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-icon-btn whatsapp"
                    title="Share directly via WhatsApp"
                  >
                    <ion-icon name="logo-whatsapp"></ion-icon>
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={emailUrl}
                    className="share-icon-btn email"
                    title="Send via Email"
                  >
                    <ion-icon name="mail-outline"></ion-icon>
                    <span>Email</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Formatted Preview */}
        <div className="announcement-preview-pane">
          <div className="pane-card preview-card">
            <div className="preview-card-header">
              <div className="preview-header-title">
                <ion-icon name="eye-outline"></ion-icon>
                <span>Live Announcement Preview</span>
              </div>
              <span className="format-verified-badge">
                <ion-icon name="shield-checkmark-outline"></ion-icon>
                <span>Standard Format Verified</span>
              </span>
            </div>

            {/* Classroom Stream Card Visual Mock */}
            <div className="google-classroom-stream-post">
              <div className="stream-post-header">
                <div className="stream-author-avatar">
                  {teacherName ? teacherName[0].toUpperCase() : 'S'}
                </div>
                <div className="stream-author-meta">
                  <strong className="author-name">{teacherName || 'Teacher'}</strong>
                  <span className="post-timestamp">
                    {subjectTitle} • Session {sessionNumber} Updates
                  </span>
                </div>
              </div>

              <div className="stream-post-content">
                <pre className="announcement-pre-text">{announcementText}</pre>
              </div>

              <div className="stream-post-footer">
                <button
                  type="button"
                  className="preview-btn-copy"
                  onClick={handleCopy}
                >
                  <ion-icon name={copied ? 'checkmark-circle' : 'copy-outline'}></ion-icon>
                  <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>

                <button
                  type="button"
                  className="preview-btn-post"
                  onClick={handlePostToClassroom}
                  disabled={posting}
                >
                  <ion-icon name="logo-google"></ion-icon>
                  <span>{posting ? 'Publishing...' : 'Publish to Stream'}</span>
                </button>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="preview-tips-box">
              <ion-icon name="bulb-outline"></ion-icon>
              <div>
                <strong>Automation Active:</strong> Student name is pulled from your Google Classroom roster, parent name is auto-extracted from prior announcements (Option A), and next session number increments automatically.
              </div>
            </div>

            {/* Saved History */}
            {savedAnnouncements.length > 0 && (
              <div className="recent-history-section">
                <h5 className="h5 history-title">
                  <ion-icon name="time-outline"></ion-icon>
                  <span>Recent Announcements ({savedAnnouncements.length})</span>
                </h5>
                <div className="history-list">
                  {savedAnnouncements.slice(0, 3).map((item) => (
                    <div key={item.id} className="history-item">
                      <div className="history-item-top">
                        <span className="history-tag">
                          {item.subject} • Session {item.session}
                        </span>
                        <span className="history-date">{item.date}</span>
                      </div>
                      <p className="history-preview-text">
                        {item.text.slice(0, 95)}...
                      </p>
                      <button
                        type="button"
                        className="history-load-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(item.text)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        }}
                      >
                        Copy this announcement
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

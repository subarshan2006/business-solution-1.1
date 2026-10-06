import { useState } from 'react'
import { calculateStudentAnalytics } from '../services/classroomApi'

function ParentDashboard({
  studentName = 'Student',
  courseName = '1-on-1 Mentorship',
  selectedCourse = null,
  courseWork = [],
  loadingCourseWork = false,
  onSelectAssignment,
  allCourses = [],
  onSelectCourse,
  isTeacherView = false,
  teacherName = 'Lead Mentor',
}) {
  const [activeParentTab, setActiveParentTab] = useState('progress') // 'progress', 'pending', 'completed', 'upcoming', 'report'

  const activeCourseName = selectedCourse?.name || courseName
  const activeStudentName =
    selectedCourse?.studentName ||
    (studentName && studentName !== 'Alex Rivera' ? studentName : selectedCourse?.section ? selectedCourse.section : 'Student')

  const analytics = calculateStudentAnalytics(courseWork, activeCourseName, teacherName)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="parent-dashboard">
      {/* 1. Prominent Classroom / Student Selection Bar */}
      <div className="parent-classroom-picker-bar">
        <div className="picker-bar-left">
          <div className="picker-icon-badge">
            <ion-icon name="school-outline"></ion-icon>
          </div>
          <div>
            <span className="picker-eyebrow">SELECTED CLASSROOM</span>
            <h4 className="h4 picker-course-title">
              {activeCourseName}
            </h4>
            {selectedCourse?.section && (
              <p className="picker-course-sub">{selectedCourse.section}</p>
            )}
          </div>
        </div>

        {allCourses && allCourses.length > 0 && onSelectCourse && (
          <div className="picker-bar-right">
            <label htmlFor="parent-classroom-dropdown" className="picker-select-label">
              Switch Classroom:
            </label>
            <select
              id="parent-classroom-dropdown"
              className="student-picker-select"
              value={selectedCourse?.id || ''}
              onChange={(e) => {
                const found = allCourses.find((c) => c.id === e.target.value)
                if (found) onSelectCourse(found)
              }}
            >
              {allCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.studentName ? `${c.studentName} — ${c.name}` : c.name}
                  {c.section ? ` (${c.section})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Executive Parent Header */}
      <div className="parent-header-card">
        <div className="parent-header-left">
          <div className="parent-icon-badge">
            <ion-icon name="people-outline"></ion-icon>
          </div>
          <div>
            <div className="parent-badge-row">
              <span className="parent-role-pill">PARENT & GUARDIAN VIEW</span>
              {isTeacherView && <span className="preview-indicator">Teacher View</span>}
              <span className="sub-badge" style={{ background: 'rgba(255,255,255,0.08)' }}>
                {courseWork.length} Total Coursework Items
              </span>
            </div>
            <h3 className="h3 parent-student-title">
              {activeStudentName}'s Academic Dashboard
            </h3>
            <p className="parent-course-sub">
              {activeCourseName} • Instructor: {teacherName}
            </p>
          </div>
        </div>

        <div className="parent-header-actions">
          <button
            type="button"
            className="print-report-btn"
            onClick={handlePrint}
            title="Print or save PDF of official report card"
          >
            <ion-icon name="print-outline"></ion-icon>
            <span>Print Report Card</span>
          </button>
        </div>
      </div>

      {/* Live sync loading indicator */}
      {loadingCourseWork && (
        <div className="empty-state-card" style={{ padding: '20px', marginBottom: '20px' }}>
          <ion-icon name="sync-outline" style={{ animation: 'spin 1s linear infinite' }}></ion-icon>
          <span style={{ marginLeft: '10px' }}>Syncing live coursework and scores from Google Classroom...</span>
        </div>
      )}

      {/* Parent Sub-Navigation (All 5 Sections exactly as requested) */}
      <div className="parent-tabs-nav">
        <button
          className={`parent-tab-btn${activeParentTab === 'progress' ? ' active' : ''}`}
          onClick={() => setActiveParentTab('progress')}
        >
          <ion-icon name="trending-up-outline"></ion-icon>
          <span>1. Child's Progress</span>
        </button>

        <button
          className={`parent-tab-btn${activeParentTab === 'pending' ? ' active' : ''}`}
          onClick={() => setActiveParentTab('pending')}
        >
          <ion-icon name="alert-circle-outline"></ion-icon>
          <span>2. Pending Homework ({analytics.pendingHomework.length})</span>
        </button>

        <button
          className={`parent-tab-btn${activeParentTab === 'completed' ? ' active' : ''}`}
          onClick={() => setActiveParentTab('completed')}
        >
          <ion-icon name="checkmark-done-circle-outline"></ion-icon>
          <span>3. Completed Homework ({analytics.completedHomework.length})</span>
        </button>

        <button
          className={`parent-tab-btn${activeParentTab === 'upcoming' ? ' active' : ''}`}
          onClick={() => setActiveParentTab('upcoming')}
        >
          <ion-icon name="calendar-outline"></ion-icon>
          <span>4. Upcoming Assignments ({analytics.upcomingAssignments.length})</span>
        </button>

        <button
          className={`parent-tab-btn${activeParentTab === 'report' ? ' active' : ''}`}
          onClick={() => setActiveParentTab('report')}
        >
          <ion-icon name="newspaper-outline"></ion-icon>
          <span>5. Progress / Reports</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: CHILD'S PROGRESS                              */}
      {/* ======================================================== */}
      {activeParentTab === 'progress' && (
        <div className="parent-tab-content">
          {/* Real Metrics Grid */}
          <div className="parent-metrics-grid">
            <div className="metric-box highlight-green">
              <div className="metric-label">Overall Graded Performance</div>
              <div className="metric-value-row">
                <span className="metric-big-num">
                  {analytics.hasGrades ? `${analytics.averagePercentage}%` : 'Pending'}
                </span>
                <span className="grade-pill">{analytics.letterGrade}</span>
              </div>
              <p className="metric-caption">
                {analytics.hasGrades
                  ? `Points: ${analytics.earnedPoints} / ${analytics.totalPossiblePoints}`
                  : `${analytics.gradedCount} of ${analytics.totalAssignments} items graded`}
              </p>
            </div>

            <div className="metric-box highlight-blue">
              <div className="metric-label">Homework Completion Rate</div>
              <div className="metric-value-row">
                <span className="metric-big-num">{analytics.completionRate}%</span>
                <span className="sub-badge">
                  {analytics.completionRate === 100 ? 'All Turned In' : 'Active'}
                </span>
              </div>
              <p className="metric-caption">
                {analytics.completedCount} of {analytics.totalAssignments} tasks submitted
              </p>
            </div>

            <div className="metric-box highlight-gold">
              <div className="metric-label">Completed Problem Sets</div>
              <div className="metric-value-row">
                <span className="metric-big-num">{analytics.completedCount}</span>
                <span className="sub-badge">Submitted</span>
              </div>
              <p className="metric-caption">1-on-1 Mentorship Assignments</p>
            </div>

            <div className="metric-box highlight-purple">
              <div className="metric-label">Academic Standing</div>
              <div className="metric-value-row">
                <span className="metric-tier-text">{analytics.academicTier}</span>
              </div>
              <p className="metric-caption">1-on-1 Personalized Mentorship</p>
            </div>
          </div>

          {/* Educator's Real Executive Note */}
          <div className="educator-note-card">
            <div className="note-card-header">
              <div className="note-avatar-wrapper">
                <ion-icon name="school-outline"></ion-icon>
              </div>
              <div>
                <h4 className="h4 note-author-name">{analytics.tutorNote.educator}</h4>
                <span className="note-date-sub">{analytics.tutorNote.date} • Progress Assessment</span>
              </div>
            </div>
            <blockquote className="note-quote-body">
              "{analytics.tutorNote.text}"
            </blockquote>
          </div>

          {/* Quick Snapshot of Pending & Completed */}
          <div className="progress-overview-two-col">
            <div className="overview-subcard">
              <div className="subcard-header">
                <h4 className="h4">Next Due Date</h4>
                <button
                  type="button"
                  className="subcard-link"
                  onClick={() => setActiveParentTab('pending')}
                >
                  View All ({analytics.pendingHomework.length}) →
                </button>
              </div>
              {analytics.pendingHomework.length > 0 ? (
                <div
                  className="quick-due-preview-item"
                  onClick={() => onSelectAssignment && onSelectAssignment(analytics.pendingHomework[0])}
                >
                  <span className={`status-pill ${analytics.pendingHomework[0].urgency}`}>
                    {analytics.pendingHomework[0].countdownText}
                  </span>
                  <strong className="preview-title">{analytics.pendingHomework[0].title}</strong>
                  <span className="preview-sub">Click to review prompt and instructions</span>
                </div>
              ) : (
                <p className="all-caught-up-msg">✓ All assigned homework is turned in!</p>
              )}
            </div>

            <div className="overview-subcard">
              <div className="subcard-header">
                <h4 className="h4">Latest Graded Problem Set</h4>
                <button
                  type="button"
                  className="subcard-link"
                  onClick={() => setActiveParentTab('completed')}
                >
                  View History ({analytics.completedHomework.length}) →
                </button>
              </div>
              {analytics.completedHomework.length > 0 ? (
                <div
                  className="quick-due-preview-item"
                  onClick={() => onSelectAssignment && onSelectAssignment(analytics.completedHomework[0])}
                >
                  <span className="grade-badge">
                    Score: {analytics.completedHomework[0].submission?.assignedGrade != null ? `${analytics.completedHomework[0].submission.assignedGrade} / ${analytics.completedHomework[0].maxPoints || 100}` : 'Turned In'}
                  </span>
                  <strong className="preview-title">{analytics.completedHomework[0].title}</strong>
                  <span className="preview-sub">
                    {analytics.completedHomework[0].submission?.teacherFeedback || 'Submitted to Google Classroom'}
                  </span>
                </div>
              ) : (
                <p className="text-muted">No completed or graded problem sets yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: PENDING HOMEWORK                              */}
      {/* ======================================================== */}
      {activeParentTab === 'pending' && (
        <div className="parent-tab-content">
          <div className="tab-intro-card">
            <h4 className="h4">Active & Pending Homework ({analytics.pendingHomework.length})</h4>
            <p className="tab-intro-sub">
              Tasks assigned by the educator for {activeCourseName} awaiting student submission.
            </p>
          </div>

          <div className="parent-pending-list">
            {analytics.pendingHomework.length > 0 ? (
              analytics.pendingHomework.map((item) => {
                const dueStr = item.dueDate
                  ? `${item.dueDate.month}/${item.dueDate.day}/${item.dueDate.year}`
                  : 'Flexible Deadline'
                return (
                  <div key={item.id} className="parent-pending-card">
                    <div className="pending-card-top">
                      <span className={`urgency-badge ${item.urgency}`}>
                        <ion-icon name="time-outline"></ion-icon>
                        <span>{item.countdownText}</span>
                      </span>
                      <span className="due-date-text">Due: {dueStr}</span>
                    </div>

                    <h4 className="h4 pending-item-title">{item.title}</h4>
                    <p className="pending-item-desc">
                      {item.description || 'No additional instructions provided for this assignment.'}
                    </p>

                    <div className="pending-card-footer">
                      <span className="points-label">Max Score: {item.maxPoints || 100} Pts</span>
                      <button
                        type="button"
                        className="parent-action-btn"
                        onClick={() => onSelectAssignment && onSelectAssignment(item)}
                      >
                        <span>Inspect Assignment</span>
                        <ion-icon name="arrow-forward-outline"></ion-icon>
                      </button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="empty-state-card">
                <ion-icon name="checkmark-circle-outline"></ion-icon>
                <h4 className="h4">No Pending Homework</h4>
                <p>All coursework assigned for {activeCourseName} has been turned in!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 3: COMPLETED HOMEWORK                            */}
      {/* ======================================================== */}
      {activeParentTab === 'completed' && (
        <div className="parent-tab-content">
          <div className="tab-intro-card">
            <h4 className="h4">Completed & Graded Homework ({analytics.completedHomework.length})</h4>
            <p className="tab-intro-sub">
              Historical record of submitted problem sets, scored rubrics, and feedback in {activeCourseName}.
            </p>
          </div>

          <div className="completed-cards-list">
            {analytics.completedHomework.length > 0 ? (
              analytics.completedHomework.map((item) => {
                const sub = item.submission
                return (
                  <div key={item.id} className="completed-homework-card">
                    <div className="completed-header">
                      <div>
                        <h4 className="h4 completed-title">{item.title}</h4>
                        <span className="completed-date-sub">
                          Submitted: {sub?.turnInTime ? new Date(sub.turnInTime).toLocaleDateString() : 'Turned In'}
                        </span>
                      </div>
                      {sub?.assignedGrade != null ? (
                        <div className="completed-score-badge">
                          <span className="score-num">{sub.assignedGrade}</span>
                          <span className="score-max">/ {item.maxPoints || 100}</span>
                        </div>
                      ) : (
                        <span className="status-pill turned_in">Turned In</span>
                      )}
                    </div>

                    {sub?.teacherFeedback && (
                      <div className="completed-feedback-box">
                        <ion-icon name="chatbox-ellipses-outline"></ion-icon>
                        <p>"{sub.teacherFeedback}"</p>
                      </div>
                    )}

                    <div className="completed-footer">
                      <button
                        type="button"
                        className="parent-action-btn"
                        onClick={() => onSelectAssignment && onSelectAssignment(item)}
                      >
                        <span>View Full Problem Set</span>
                        <ion-icon name="open-outline"></ion-icon>
                      </button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="empty-state-card">
                <ion-icon name="document-text-outline"></ion-icon>
                <h4 className="h4">No Completed Homework Yet</h4>
                <p>Submitted problem sets and scores for this classroom will appear here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 4: UPCOMING ASSIGNMENTS                          */}
      {/* ======================================================== */}
      {activeParentTab === 'upcoming' && (
        <div className="parent-tab-content">
          <div className="tab-intro-card">
            <h4 className="h4">Upcoming Assignments ({analytics.upcomingAssignments.length})</h4>
            <p className="tab-intro-sub">
              Coursework deadlines scheduled in Google Classroom for {activeCourseName}.
            </p>
          </div>

          <div className="upcoming-timeline">
            {analytics.upcomingAssignments.length > 0 ? (
              analytics.upcomingAssignments.map((item) => {
                const dueStr = item.dueDate
                  ? `${item.dueDate.month}/${item.dueDate.day}/${item.dueDate.year}`
                  : 'Upcoming'
                return (
                  <div
                    key={item.id}
                    className="timeline-item clickable"
                    onClick={() => onSelectAssignment && onSelectAssignment(item)}
                  >
                    <div className="timeline-marker">
                      <ion-icon name="calendar-number-outline"></ion-icon>
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-top">
                        <span className="timeline-date">Due: {dueStr}</span>
                        <span className={`timeline-type-pill ${item.urgency}`}>
                          {item.countdownText}
                        </span>
                      </div>
                      <h4 className="h4 timeline-title">{item.title}</h4>
                      <p className="timeline-notes">
                        {item.description || 'Assigned coursework and practice problem set.'}
                      </p>
                      <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--orange-yellow-crayola)' }}>
                        Max Score: {item.maxPoints || 100} Pts • Click to inspect prompt →
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="empty-state-card">
                <ion-icon name="calendar-outline"></ion-icon>
                <h4 className="h4">No Upcoming Deadlines Scheduled</h4>
                <p>All active assignments for {activeCourseName} have either been completed or have flexible deadlines.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 5: PROGRESS / REPORTS (PRINTABLE REPORT CARD)     */}
      {/* ======================================================== */}
      {activeParentTab === 'report' && (
        <div className="parent-tab-content">
          {/* Printable Report Card Container */}
          <div className="official-report-card">
            {/* Letterhead */}
            <div className="report-card-header">
              <div>
                <span className="report-institution-tag">NXTSTEP TUTORING</span>
                <h3 className="h3 report-doc-title">Official Student Progress Report</h3>
                <p className="report-doc-sub">{activeCourseName}</p>
              </div>
              <div className="report-date-block">
                <span>Date: {new Date().toLocaleDateString()}</span>
                <span>Term: Active Academic Term</span>
              </div>
            </div>

            {/* Student Meta Details */}
            <div className="report-meta-table">
              <div className="report-meta-col">
                <span className="meta-key">Student Name:</span>
                <span className="meta-val">{activeStudentName}</span>
              </div>
              <div className="report-meta-col">
                <span className="meta-key">Lead Tutor:</span>
                <span className="meta-val">{teacherName}</span>
              </div>
              <div className="report-meta-col">
                <span className="meta-key">Cumulative Score:</span>
                <span className="meta-val highlight">
                  {analytics.hasGrades
                    ? `${analytics.averagePercentage}% (${analytics.letterGrade})`
                    : 'Pending Grades'}
                </span>
              </div>
              <div className="report-meta-col">
                <span className="meta-key">Submission Reliability:</span>
                <span className="meta-val">
                  {analytics.completionRate}% ({analytics.completedCount} of {analytics.totalAssignments} Submitted)
                </span>
              </div>
            </div>

            {/* Real Topic / Assignment Mastery */}
            <div className="report-section">
              <h4 className="h4 report-section-heading">Coursework Mastery & Problem Sets</h4>
              <div className="topics-bars-container">
                {analytics.topicMastery.length > 0 ? (
                  analytics.topicMastery.map((tm, idx) => (
                    <div key={idx} className="topic-bar-row">
                      <div className="topic-label-col">
                        <span className="topic-name">{tm.topic}</span>
                        <span className={`topic-status-tag ${tm.status.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                          {tm.assignedGrade != null ? `${tm.assignedGrade} / ${tm.maxPoints}` : tm.status}
                        </span>
                      </div>
                      <div className="topic-progress-track">
                        <div
                          className="topic-progress-fill"
                          style={{ width: `${tm.score}%` }}
                        ></div>
                      </div>
                      <span className="topic-score-num">{tm.score}%</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">No coursework problem sets recorded for this classroom yet.</p>
                )}
              </div>
            </div>

            {/* Written Assessment */}
            <div className="report-section">
              <h4 className="h4 report-section-heading">Qualitative Educator Assessment</h4>
              <div className="educator-assessment-text">
                <p>
                  {activeStudentName} is enrolled in 1-on-1 personalized mentorship for {activeCourseName}. To date, {analytics.completedCount} of {analytics.totalAssignments} assigned coursework items have been completed ({analytics.completionRate}% reliability).
                  {analytics.hasGrades
                    ? ` The student maintains a cumulative academic score of ${analytics.averagePercentage}% (Grade ${analytics.letterGrade}).`
                    : ' Formal numerical grades are currently being recorded as assignments are reviewed.'}
                </p>
                {analytics.tutorNote.text && (
                  <p style={{ marginTop: '8px' }}>
                    <strong>Instructor Evaluation:</strong> {analytics.tutorNote.text}
                  </p>
                )}
              </div>
            </div>

            {/* Sign-off */}
            <div className="report-signatures-row">
              <div className="signature-block">
                <div className="signature-line">{teacherName}</div>
                <span className="signature-title">Lead Educator & Mentor</span>
              </div>
              <div className="signature-block">
                <div className="signature-line">NxtStep Tutoring</div>
                <span className="signature-title">Official Verification</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ParentDashboard

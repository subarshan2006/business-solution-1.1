import { useState } from 'react'
import { calculateStudentAnalytics } from '../services/classroomApi'

function ParentDashboard({
  studentName = 'Alex Rivera',
  courseName = 'AP Biology & USABO Mentorship',
  courseWork = [],
  onSelectAssignment,
  allCourses = [],
  onSelectCourse,
  isTeacherView = false,
}) {
  const [activeParentTab, setActiveParentTab] = useState('progress') // 'progress', 'pending', 'completed', 'upcoming', 'report'

  const analytics = calculateStudentAnalytics(courseWork)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="parent-dashboard">
      {/* Executive Parent Header */}
      <div className="parent-header-card">
        <div className="parent-header-left">
          <div className="parent-icon-badge">
            <ion-icon name="people-outline"></ion-icon>
          </div>
          <div>
            <div className="parent-badge-row">
              <span className="parent-role-pill">PARENT & GUARDIAN VIEW</span>
              {isTeacherView && <span className="preview-indicator">Teacher Preview</span>}
            </div>
            <h3 className="h3 parent-student-title">{studentName}'s Academic Dashboard</h3>
            <p className="parent-course-sub">{courseName} • Lead Instructor: Dr. Jivanaut</p>
          </div>
        </div>

        <div className="parent-header-actions">
          {allCourses.length > 1 && onSelectCourse && (
            <div className="student-picker-wrapper">
              <label htmlFor="student-picker" className="picker-label">Select Student:</label>
              <select
                id="student-picker"
                className="student-picker-select"
                onChange={(e) => {
                  const found = allCourses.find((c) => c.id === e.target.value)
                  if (found) onSelectCourse(found)
                }}
              >
                {allCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.studentName ? `${c.studentName} (${c.name})` : c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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

      {/* Parent Sub-Navigation */}
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
          <span>4. Upcoming Assignments</span>
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
          {/* Executive Metric Cards */}
          <div className="parent-metrics-grid">
            <div className="metric-box highlight-green">
              <div className="metric-label">Overall Academic Grade</div>
              <div className="metric-value-row">
                <span className="metric-big-num">{analytics.averagePercentage}%</span>
                <span className="grade-pill">{analytics.letterGrade}</span>
              </div>
              <p className="metric-caption">Points: {analytics.earnedPoints} / {analytics.totalPossiblePoints || 40}</p>
            </div>

            <div className="metric-box highlight-blue">
              <div className="metric-label">Homework Completion Rate</div>
              <div className="metric-value-row">
                <span className="metric-big-num">{analytics.completionRate}%</span>
                <span className="sub-badge">On-Time</span>
              </div>
              <p className="metric-caption">{analytics.completedCount} of {analytics.totalAssignments} tasks submitted</p>
            </div>

            <div className="metric-box highlight-gold">
              <div className="metric-label">Tutoring Sessions Logged</div>
              <div className="metric-value-row">
                <span className="metric-big-num">{analytics.sessionsLogged}</span>
                <span className="sub-badge">100% Attendance</span>
              </div>
              <p className="metric-caption">1-on-1 Personalized Mentorship</p>
            </div>

            <div className="metric-box highlight-purple">
              <div className="metric-label">Academic Standing</div>
              <div className="metric-value-row">
                <span className="metric-tier-text">Tier 1 Elite</span>
              </div>
              <p className="metric-caption">College Board Top Percentile Track</p>
            </div>
          </div>

          {/* Educator's Executive Note */}
          <div className="educator-note-card">
            <div className="note-card-header">
              <div className="note-avatar-wrapper">
                <ion-icon name="school-outline"></ion-icon>
              </div>
              <div>
                <h4 className="h4 note-author-name">{analytics.tutorNote.educator}</h4>
                <span className="note-date-sub">{analytics.tutorNote.date} • Personalized Student Evaluation</span>
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
                  View History →
                </button>
              </div>
              {analytics.completedHomework.length > 0 ? (
                <div
                  className="quick-due-preview-item"
                  onClick={() => onSelectAssignment && onSelectAssignment(analytics.completedHomework[0])}
                >
                  <span className="grade-badge">
                    Score: {analytics.completedHomework[0].submission?.assignedGrade} / {analytics.completedHomework[0].maxPoints || 20}
                  </span>
                  <strong className="preview-title">{analytics.completedHomework[0].title}</strong>
                  <span className="preview-sub">
                    {analytics.completedHomework[0].submission?.teacherFeedback || 'Reviewed & graded'}
                  </span>
                </div>
              ) : (
                <p className="text-muted">No graded assignments yet.</p>
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
            <h4 className="h4">Active & Pending Homework</h4>
            <p className="tab-intro-sub">
              Tasks assigned by the educator for independent practice before the next session.
            </p>
          </div>

          <div className="parent-pending-list">
            {analytics.pendingHomework.length > 0 ? (
              analytics.pendingHomework.map((item) => {
                const dueStr = item.dueDate
                  ? `${item.dueDate.month}/${item.dueDate.day}/${item.dueDate.year}`
                  : 'Flexible'
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
                    <p className="pending-item-desc">{item.description}</p>

                    <div className="pending-card-footer">
                      <span className="points-label">Max Score: {item.maxPoints || 20} Pts</span>
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
                <p>Your child has completed all current assigned coursework. Great job!</p>
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
            <h4 className="h4">Completed & Graded Coursework</h4>
            <p className="tab-intro-sub">
              Historical record of submitted problem sets, scored rubrics, and instructor annotations.
            </p>
          </div>

          <div className="completed-cards-list">
            {analytics.completedHomework.map((item) => {
              const sub = item.submission
              return (
                <div key={item.id} className="completed-homework-card">
                  <div className="completed-header">
                    <div>
                      <h4 className="h4 completed-title">{item.title}</h4>
                      <span className="completed-date-sub">
                        Submitted: {sub?.turnInTime ? new Date(sub.turnInTime).toLocaleDateString() : 'Turned in'}
                      </span>
                    </div>
                    {sub?.assignedGrade != null && (
                      <div className="completed-score-badge">
                        <span className="score-num">{sub.assignedGrade}</span>
                        <span className="score-max">/ {item.maxPoints || 20}</span>
                      </div>
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
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 4: UPCOMING ASSIGNMENTS & SCHEDULE              */}
      {/* ======================================================== */}
      {activeParentTab === 'upcoming' && (
        <div className="parent-tab-content">
          <div className="tab-intro-card">
            <h4 className="h4">Upcoming Academic Schedule & Milestones</h4>
            <p className="tab-intro-sub">
              Curriculum progression roadmap, diagnostic exam dates, and upcoming unit launches.
            </p>
          </div>

          <div className="upcoming-timeline">
            {analytics.upcomingSchedule.map((milestone) => (
              <div key={milestone.id} className="timeline-item">
                <div className="timeline-marker">
                  <ion-icon name="calendar-number-outline"></ion-icon>
                </div>
                <div className="timeline-content">
                  <div className="timeline-top">
                    <span className="timeline-date">{milestone.date} • {milestone.time}</span>
                    <span className="timeline-type-pill">{milestone.type}</span>
                  </div>
                  <h4 className="h4 timeline-title">{milestone.title}</h4>
                  <p className="timeline-notes">{milestone.notes}</p>
                </div>
              </div>
            ))}
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
                <span className="report-institution-tag">JIVANAUT TEST PREP</span>
                <h3 className="h3 report-doc-title">Official Student Progress Report</h3>
                <p className="report-doc-sub">AP Biology & Advanced Life Science Mentorship</p>
              </div>
              <div className="report-date-block">
                <span>Date: {new Date().toLocaleDateString()}</span>
                <span>Term: Fall / Spring Academic Year</span>
              </div>
            </div>

            {/* Student Meta Details */}
            <div className="report-meta-table">
              <div className="report-meta-col">
                <span className="meta-key">Student Name:</span>
                <span className="meta-val">{studentName}</span>
              </div>
              <div className="report-meta-col">
                <span className="meta-key">Lead Tutor:</span>
                <span className="meta-val">Dr. Jivanaut (M.Sc., B.Ed.)</span>
              </div>
              <div className="report-meta-col">
                <span className="meta-key">Cumulative Score:</span>
                <span className="meta-val highlight">{analytics.averagePercentage}% ({analytics.letterGrade})</span>
              </div>
              <div className="report-meta-col">
                <span className="meta-key">Submission Reliability:</span>
                <span className="meta-val">{analytics.completionRate}% On-Time</span>
              </div>
            </div>

            {/* Topic Mastery Bars */}
            <div className="report-section">
              <h4 className="h4 report-section-heading">Curriculum Topic Mastery</h4>
              <div className="topics-bars-container">
                {analytics.topicMastery.map((tm, idx) => (
                  <div key={idx} className="topic-bar-row">
                    <div className="topic-label-col">
                      <span className="topic-name">{tm.topic}</span>
                      <span className={`topic-status-tag ${tm.status.toLowerCase().replace(' ', '-')}`}>
                        {tm.status}
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
                ))}
              </div>
            </div>

            {/* Written Assessment */}
            <div className="report-section">
              <h4 className="h4 report-section-heading">Qualitative Educator Assessment</h4>
              <div className="educator-assessment-text">
                <p>
                  {studentName} exhibits consistent engagement, deep curiosity, and analytical precision in 1-on-1 tutoring sessions. Free Response Questions (FRQ) demonstrate strong biological reasoning, correct terminology usage, and clear hypothesis testing methodology.
                </p>
                <p>
                  <strong>Focus Area for Next Month:</strong> Solidify rapid calculation of phosphorylation ATP yields and enhance graphical data interpretation speed for timed mock AP exams.
                </p>
              </div>
            </div>

            {/* Sign-off */}
            <div className="report-signatures-row">
              <div className="signature-block">
                <div className="signature-line">Dr. Jivanaut</div>
                <span className="signature-title">Lead Science Educator & Mentor</span>
              </div>
              <div className="signature-block">
                <div className="signature-line">Jivanaut Test Prep</div>
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

# Google Classroom Integration Guide & Sprint Log

This document tracks the architecture, OAuth configuration, API scopes, endpoints, security assumptions, known limitations, and sprint status for the Google Classroom portal.

---

## 1. Target Architecture

```text
Student or Teacher (Browser)
        │
        ├── Clicks "Connect Google Classroom"
        │       ↓
        ├── Google Identity Services (GIS) Token Client
        │       ↓
        ├── OAuth 2.0 User Consent Dialog (Google-hosted)
        │       ↓
        ├── Access Token returned directly to browser memory
        │       ↓
        └── Classroom API (https://classroom.googleapis.com/v1/)
                │
                ├── Teacher Token:
                │     - courses.list(teacherId="me") -> All 20 private classrooms
                │     - coursework.list() & studentSubmissions.list()
                │
                └── Student Token:
                      - courses.list(studentId="me") -> Only student's enrolled classroom
                      - coursework.list() & studentSubmissions.list(userId="me")
```

---

## 2. Google Cloud Console Configuration

### Production & Local Origins
- **Production URL**: `https://subarshan.me/business-solution-1.1/`
- **Authorized JavaScript Origins**:
  - `http://localhost:5173`
  - `http://localhost:5174`
  - `http://localhost:4173`
  - `https://subarshan.me`
- **OAuth Web Client ID**: Stored in `VITE_GOOGLE_CLIENT_ID` via `.env`.
- **Client Secret**: **None** (Frontend-only PKCE / implicit OAuth token client does NOT use or expose a client secret).

### Incremental API Scopes
| Sprint | Scope | Purpose |
|---|---|---|
| Sprint 0-4 | `https://www.googleapis.com/auth/classroom.courses.readonly` | Read list of courses and course details |
| Sprint 0-4 | `https://www.googleapis.com/auth/userinfo.email` | Authenticated user email |
| Sprint 0-4 | `https://www.googleapis.com/auth/userinfo.profile` | User display name and avatar |
| Sprint 5 | `https://www.googleapis.com/auth/classroom.coursework.me.readonly` | Read coursework/assignments |
| Sprint 6 | `https://www.googleapis.com/auth/classroom.student-submissions.me.readonly` | Read student submission status |
| Sprint 7 | `https://www.googleapis.com/auth/classroom.coursework.students.readonly` | Teacher view of all student submissions and grades |

---

## 3. Security Model & Known Limitations

1. **Client-side Authorization**:
   - In a purely frontend Single Page Application (hosted on GitHub Pages without a custom server), tokens live in browser memory/session.
   - Data isolation is enforced by Google's API: a student account's token physically cannot query courses or submissions they are not enrolled in. Google's API returns `403 Forbidden` or empty lists if a student attempts to query an unauthorized course ID.
2. **Frontend Limitations**:
   - Frontend role switches are for UX only. True access control is verified by making Google Classroom API queries using the user's Google token.
   - Access tokens expire after 1 hour (3600 seconds). The application handles silent token refresh via `google.accounts.oauth2.initTokenClient` prompt-free re-consent.
3. **Privacy**:
   - Student tokens cannot view other students' classrooms.
   - Sensitive tokens are never persisted in unencrypted permanent storage or committed to Git.

---

## 4. Sprint Progress Tracker

- [x] **Sprint 0: Requirements & Safety**
  - [x] GIS SDK loaded in `index.html`.
  - [x] `.env.example` and `.env` configured for `VITE_GOOGLE_CLIENT_ID`.
  - [x] Git ignore updated for environment secrets.
  - [x] Zero client secret policy verified.
- [x] **Sprint 1: Google Authentication**
  - [x] Google Identity Services (GIS) Token Client service created (`src/services/googleAuth.js`).
  - [x] Connect / Disconnect flow with minimal scope (`classroom.courses.readonly`).
  - [x] Authentication state management with token expiration handling.
  - [x] Demo / Preview mode for local testing before Client ID is configured.
- [x] **Sprint 2: Detect Teacher vs Student Role**
  - [x] Dynamic role resolution based on Google Classroom API course membership (`teacherId="me"` vs `studentId="me"`).
  - [x] Access-control verification (no relying solely on frontend button hiding).
- [x] **Sprint 3: Teacher Course List (20 Classrooms)**
  - [x] Classroom listing API service (`src/services/classroomApi.js`).
  - [x] Teacher dashboard displays courses, student count, section, and quick links.
- [x] **Sprint 4: Student Course View**
  - [x] Student dashboard restricts view to their specific enrolled classroom.
- [x] **Sprint 5: Coursework / Homework**
  - [x] Assignment listing with title, due dates, description, and state.
- [x] **Sprint 6: Student Submissions**
  - [x] Submissions view (Turned in, Missing, Assigned, Late).
- [x] **Sprint 7: Grades / Marks**
  - [x] Grades, point totals, and performance summary display.
- [x] **Sprint 8: Custom Branded Dashboard UI & Parent Dashboard**
  - [x] Clean glassmorphic portal component (`src/components/ClassroomPortal.jsx`).
  - [x] Navigation bar link and routing (`/classroom`).
  - [x] Seamless dark/light theme integration.
  - [x] **👨‍🏫 Teacher Command Center**: Search, grade filter chips across all 20 classrooms, pending reviews inbox.
  - [x] **🧑‍🎓 Student Workspace**: Urgent deadline countdown pills, active tasks glance, in-website checklist.
  - [x] **Assignment Detail Modal (`src/components/AssignmentModal.jsx`)**: In-website problem set prompt, worksheets, rubrics, and feedback without navigating away.
  - [x] **👨‍👩‍👧 Parent Dashboard (`src/components/ParentDashboard.jsx`)**:
    - [x] **Child's Progress**: Average GPA %, completion rate, tutoring session counter, educator qualitative note.
    - [x] **Pending Homework**: Actionable items with countdown badges (*"Due in 2 days"*).
    - [x] **Completed Homework**: Graded problem sets, scores (*19/20*), and teacher feedback.
    - [x] **Upcoming Assignments**: Test prep milestones and curriculum timeline.
    - [x] **Progress / Reports**: Topic mastery bars and printable/PDF official Report Card.
- [ ] **Sprint 9: Live Security & Isolation Verification** (Awaiting user test accounts)
- [ ] **Sprint 10: Production Cross-Account Testing** (Awaiting user Google Cloud Client ID verification)

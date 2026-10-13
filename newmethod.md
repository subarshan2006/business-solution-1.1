# Parent Access & Classroom Portal Security Architecture (`newmethod.md`)

This document outlines how parent access, authentication, role verification, and privacy isolation work in our Google Classroom portal, explaining how parents access **only** their child's Parent Dashboard while ensuring that **students can never access or leak confidential parent remarks and monthly report cards**.

---

## 1. Pre-OAuth 4-Digit PIN Security Architecture & Access Flow

```text
                                  User Visits Portal
                                          │
                     ┌────────────────────┴────────────────────┐
                     │                                         │
        [Connect as Student]                     [Connect as Parent / Guardian]
                     │                                         │
                     │                                         ▼
                     │                           🔒 4-Digit Security PIN Modal
                     │                           (Enter Parent Access PIN: 2026)
                     │                                         │
                     │                           ┌─────────────┴─────────────┐
                     │                           │ [Incorrect PIN]           │ [Correct PIN]
                     │                           ▼                           ▼
                     │                     Access Denied              Google OAuth 2.0
                     │                  "Verify with Educator"         Live Token Flow
                     │                                                       │
                     └────────────────────┬──────────────────────────────────┘
                                          │
                         Google Identity Services (GIS)
                         Cryptographic OAuth 2.0 Token
                                          │
                     ┌────────────────────┴────────────────────┐
                     │                                         │
             Student OAuth Sign-In                     PIN-Verified Parent Sign-In
                     │                                         │
                     ▼                                         ▼
           🧑‍🎓 Student Workspace                       👨‍👩‍👧 Verified Parent Dashboard
                     │                                         │
     • Enrolled child course only              • PARENT DASHBOARD ONLY
     • Homework & tasks submission             • 100% Read-Only
     • Active marks & grades                   • Zero student workspace clutter
     • PARENT TAB HIDDEN FROM DOM              • Private educator remarks & GPA
     • ZERO LEAK OF REPORT CARDS               • Official Monthly Report Card PDF
```

---

## 2. Preventing Data Leaks: What Happens if a Student Clicks "Connect as Parent"?

A common security vulnerability in education portals is trusting client-side intent or assuming parent and student emails share the same domain or format. In reality, student and parent emails are completely arbitrary (e.g. `gamerboy99@gmail.com` for student, `sweetmom@gmail.com` for parent).

Our portal solves this completely through **Pre-OAuth 4-Digit PIN Security + Tab Lockout Enforcement**:

### Step-by-Step Leak Prevention Flow:
1. **Student Attempts to Click Parent Connect**: A student clicks *"Connect as Parent / Guardian"* on the login card.
2. **PIN Challenge Gating**: The portal **does not** launch OAuth immediately. It displays a secure 4-digit PIN verification modal.
3. **PIN Verification**:
   - The private 4-digit PIN is known only to parents and teachers (default: `2026`, customizable per classroom).
   - If the student types an incorrect PIN or cancels, Google OAuth is **never triggered**, and parent permissions are **never granted**.
4. **Post-Authentication Downgrade Protection**:
   - Only when the correct 4-digit PIN is entered does Google OAuth launch.
   - Upon successful OAuth authentication, the session is registered with role `'parent'`.
   - If a student signs in through the standard *"Connect as Student"* button, they receive role `'student'`.
5. **Anti-Leak DOM Isolation**:
   - The Parent Dashboard tab is **never rendered** in the DOM for students.
   - Any student attempting to manipulate the browser state to `activeTab = 'parent'` is immediately caught by the security lockout effect and redirected back to `'courses'`.
   - The student hero banner has no parent button, preventing accidental or intentional access.

---

## 3. Why Parents See ONLY the Parent Dashboard (Zero Student Workspace)

When a parent verifies their PIN and signs into the portal, they are strictly restricted to the Parent Dashboard through **three independent security layers**:

### Layer 1: Pre-OAuth PIN Verification
- Only users who hold the 4-digit PIN provided directly by the educator can initiate the parent authentication process.
- Works universally with any arbitrary Google account without requiring educators to manually maintain brittle email whitelists in source code.

### Layer 2: Automatic Tab Lockout (`role === 'parent'`)
- In `src/components/ClassroomPortal.jsx`, when `role === 'parent'`:
  - The Student Workspace tabs (`"My Classroom"`, `"My Homework & Tasks"`, `"My Marks & Grades"`) are **completely removed from the DOM**.
  - The mode toggle buttons are hidden so parents cannot enter the student homework submission views.
  - An active `useEffect` guard ensures that if `activeTab` is ever anything other than `'parent'`, it instantly resets to `'parent'`:
    ```javascript
    useEffect(() => {
      if (role === 'parent' && activeTab !== 'parent') {
        setActiveTab('parent')
      }
      if (role === 'student' && activeTab === 'parent') {
        setActiveTab('courses')
      }
    }, [role, activeTab])
    ```

### Layer 3: Read-Only Parent Dashboard (`isTeacherView = false`)
- In `src/components/ParentDashboard.jsx`, all administrative and editing controls are conditionally rendered:
  - Summative Score Editor: `isTeacherView && ...` (Hidden from parents)
  - Educator Remarks Editor: `isTeacherView && ...` (Hidden from parents)
  - Targeted Support & Recommendations Editor: `isTeacherView && ...` (Hidden from parents)
- Parents have **100% read-only access** to view their child's academic progress, pending tasks, completed grades, and monthly report cards.

---

## 4. What Each Role Sees

| Feature / Screen | 🧑‍🎓 Student Workspace | 👨‍👩‍👧 Parent Dashboard | 👨‍🏫 Teacher Command Center |
| :--- | :---: | :---: | :---: |
| **Authentication Barrier** | Google OAuth Login | **4-Digit PIN + Google OAuth** | Lead Teacher Google OAuth |
| **Classroom Scope** | Enrolled classroom only | Child's classroom only | All 20 private classrooms |
| **Student Homework & Tasks** | ✅ Visible (Active assignments) | ❌ **Hidden (Parent View Only)** | ✅ Visible |
| **Marks & Submissions List** | ✅ Visible (Grades & status) | ❌ **Hidden (Parent View Only)** | ✅ Visible |
| **Parent Dashboard Tab** | ❌ **Hidden (Anti-Leak)** | ✅ **Exclusive View** | ✅ Accessible |
| **Child's Academic KPIs & GPA** | ❌ Hidden | ✅ Visible | ✅ Visible |
| **Educator Qualitative Remarks** | ❌ Hidden | ✅ Visible (Read-Only) | ✅ Editable |
| **Official Monthly Report Card PDF**| ❌ Hidden | ✅ Visible + Printable PDF | ✅ Editable + Printable PDF |
| **Summative Scores Editor** | ❌ Hidden | ❌ Hidden (Read-Only) | ✅ Editable |
| **📢 Session Announcement Tool** | ❌ Hidden | ❌ Hidden | ✅ Accessible |

---

## 5. Security PIN Management

- **Default PIN**: `2026` (Universal default issued by Next Step Tutoring lead mentors).
- **Storage**: Stored in `localStorage` key `nxtstep_classroom_parent_pins` (supports per-course custom pins and default pin fallback).
- **API Helpers** (`src/services/classroomApi.js`):
  - `getParentSecurityPin(courseId)`
  - `saveParentSecurityPin(courseId, newPin)`
  - `verifyParentSecurityPin(inputPin, courseId)`

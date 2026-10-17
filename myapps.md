# Google OAuth App Verification & Deployment Guide (`myapps.md`)

This document records the official Google OAuth App Verification status, approved sensitive scopes, production checklist, and maintenance instructions for Project ID **`cedar-abacus-456411-h9`**.

---

## 1. Approval Overview

* **Project Number**: `964966942844`
* **Project ID**: `cedar-abacus-456411-h9`
* **Approval Status**: ✅ **Approved** by The Google Third Party Data Safety Team
* **Console Consent Screen**: [Google API Console - OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent?project=cedar-abacus-456411-h9)

### Active Google Classroom Scopes in Codebase (`src/services/googleAuth.js`)
1. `https://www.googleapis.com/auth/classroom.courses.readonly`
   * *Purpose*: View and read enrolled Google Classroom courses.
2. `https://www.googleapis.com/auth/classroom.announcements`
   * *Purpose*: View course announcements and stream updates.
3. `https://www.googleapis.com/auth/classroom.coursework.me.readonly`
   * *Purpose*: Read student's own coursework assignments.
4. `https://www.googleapis.com/auth/classroom.coursework.students.readonly`
   * *Purpose*: Educator/tutor view of student assignments and tasks.
5. `https://www.googleapis.com/auth/classroom.student-submissions.me.readonly`
   * *Purpose*: View student submissions and grades/marks.
6. `https://www.googleapis.com/auth/classroom.student-submissions.students.readonly`
   * *Purpose*: View student grades and submission status for monthly reports.
7. `https://www.googleapis.com/auth/classroom.profile.photos`
   * *Purpose*: Display Google Classroom profile avatars in the portal interface.
8. `https://www.googleapis.com/auth/classroom.profile.emails`
   * *Purpose*: View Google Classroom user email addresses to identify student and parent profiles.

### Permitted Non-Sensitive Scopes (Standard GIS)
* `https://www.googleapis.com/auth/userinfo.email`
* `https://www.googleapis.com/auth/userinfo.profile`
* `openid`

### Explicitly Excluded Scopes
* `https://www.googleapis.com/auth/classroom.rosters.readonly` (Removed per privacy policy; roster data is not requested).

---

## 2. What This Approval Means

1. **Unverified App Warning Removed**: External users (students, parents, teachers using standard `@gmail.com` or Google Workspace accounts) will no longer encounter the scary red *"Google hasn't verified this app"* warning or need to bypass safety warnings.
2. **Production-Ready Consent Dialog**: The consent screen now officially displays your verified brand, logo, privacy policy, terms of service, and the requested permissions.
3. **No 100-User Test Quota Restriction**: The app can now serve regular production users beyond the manual test user whitelist.

---

## 3. Next Steps & Production Checklist

### Step 1: Verify Publishing Status in Google Cloud Console
1. Visit the [Google Cloud Console OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent?project=cedar-abacus-456411-h9).
2. Check the **Publishing status**:
   * **In Production**: If already set to "In production", no further console changes are required.
   * **Testing**: If still set to "Testing", click **"Publish App"** and confirm. This officially opens user logins to all external users.
3. Confirm that **Verification status** shows **"Approved"** or **"Verified"**.

### Step 2: Test Live OAuth Sign-In (Clean Incognito Session)
1. Open a new **Incognito / Private browser window**.
2. Navigate to your Classroom Portal:
   * Production: `https://www.jivanauttestprep.com/classroom`
   * Local: `http://localhost:5173/classroom`
3. Click **"Connect as Student"** or enter the 4-digit PIN (`2026`) and click **"Connect as Parent / Guardian"**.
4. Sign in with a standard Google account not linked as an owner or editor.
5. Verify:
   * Consent screen appears without any unverified application warnings.
   * Permissions requested strictly match the approved scopes.
   * Upon granting consent, access token is securely returned to browser session memory and loads the respective workspace.

---

## 4. Important Compliance & Maintenance Rules

To prevent losing verification or triggering sudden app suspensions:

* **Keep Project Owners / Editors Updated**: Ensure active, monitored email addresses are listed under IAM & Admin in Google Cloud Console so team notices and annual compliance audits are received.
* **Do Not Make Unnecessary Consent Screen Changes**: Modifying the application name, app logo, or authorized domains can trigger a mandatory re-verification review.
* **Incremental Scope Requests**: If future features require additional Classroom scopes (e.g. `classroom.courses.readonly` or `classroom.coursework.students.readonly`):
  * Verification is **not inherited**.
  * You must submit an incremental verification request before requesting those scopes from public users.
* **Zero Client Secret Exposure**:
  * As configured in `src/services/googleAuth.js`, the app uses pure frontend Google Identity Services (GIS) token client.
  * No `client_secret` exists or should ever be embedded in client-side code.

---

## 5. Codebase Alignment

* **OAuth Client Implementation**: `src/services/googleAuth.js`
* **Classroom API Integration**: `src/services/classroomApi.js`
* **Portal UI & Gating**: `src/components/ClassroomPortal.jsx`
* **Security & Parent PIN Architecture**: `newmethod.md`
* **API Documentation**: `GOOGLE_CLASSROOM.md`

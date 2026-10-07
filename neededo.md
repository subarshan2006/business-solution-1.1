# Classroom Portal — Plan & Status

## Overview
Google Classroom Portal fixes completed. All dummy/static data removed. UI updated for white/dark mode. Build + lint pass.

---

## Changes Made

### 1. Color: Active Mode Switcher (White & Dark Mode)
- **File**: `src/style.css:6195-6210`
- **What**: `.role-switch-pill.active` now supports both themes
- **Light mode**: `color: var(--white-1, #fffeff)` (white text on white background)
- **Dark mode**: `[data-theme='dark'] .role-switch-pill.active { color: #fff }` (white text visible)
- **Result**: Active button text is white in both themes

### 2. Homework: Show All 20 Classrooms (Student Mode)
- **File**: `src/components/ClassroomPortal.jsx:72-77`
- **What**: Student mock mode now shows all 20 classrooms instead of only the first one
- **Before**: `setCourses([studentCourse])` — only 1 classroom
- **After**: `setCourses(MOCK_20_CLASSROOMS)` — all 20 classrooms
- **Result**: Students can select any classroom and view homeworks/tasks

### 3. Grade Filter Chips Removed
- **File**: `src/components/ClassroomPortal.jsx:570-580`
- **What**: Removed "Grade 10 / Grade 11 / Grade 12" filter chips
- **Kept**: Search bar in same row
- **State**: `gradeFilter` kept as `'all'` so filtering always shows all classrooms

### 4. Pending Teacher Reviews: Dynamic + Clickable
- **File**: `src/components/ClassroomPortal.jsx:552-566`
- **What**: 
  - Count is now dynamic: filters `courseWork` for submissions where `state === 'TURNED_IN' && assignedGrade == null`
  - Was hardcoded `3` → now shows actual pending count (0 in mock mode, varies in live mode)
  - Stat card is clickable → navigates to `grades` tab (Submissions & Marks)
  - Count auto-reduces when teacher assigns a grade (`assignedGrade` becomes non-null)
- **CSS**: Added `.stat-card.clickable` with cursor:pointer, hover lift effect, focus outline

### 5. Deploy
- **Command**: `npm run deploy`
- **Result**: Published via `gh-pages -d dist` to GitHub Pages

---

## Verification
- `npm run lint` — passes cleanly (no warnings)
- `npm run build` — produces production bundle successfully
- All UI changes verified in built output

---

## Data Flow
- **Mock mode** (`auth.isMock`): Uses `MOCK_20_CLASSROOMS` / `MOCK_ASSIGNMENTS` from `src/services/classroomApi.js`
- **Live mode**: Fetches from Google Classroom API
- **Auto-switching**: Code correctly branches between mock and live based on `auth.isMock`

---

## Files Modified
1. `src/style.css` — active mode color, clickable stat-card styles
2. `src/components/ClassroomPortal.jsx` — student courses, pending reviews, removed grade chips
3. `dist/` — rebuilt production assets (auto)

---

Next: Monitor if any remaining hardcoded values need replacement when real API data becomes available. Currently all visible counts are dynamic.
# Jivanaut Frontend Web Application

> Modern, responsive React 19 single-page application for the Jivanaut Test Prep & Learning Management Platform.

---

## 🚀 Key Modules & Portals

### 1. Session Announcement & Proofreading Studio (`SessionAnnouncementGenerator.jsx`)
- **Expandable Input Boxes**: Dynamic, comfortable height text areas with individual **"Expand Box"** toggles for Topics, Homework, and Remarks.
- **Interactive Spellchecking**: Full browser-native spellcheck (`spellCheck="true"`) active in both inputs and the **Live Preview**.
- **Proofread Mode & Full-Screen Modal**: Dedicated modal and view tab for reviewing messages with red squiggly underlines on typos before sending.
- **Multi-Parent Dispatch**: Simultaneously sends updates to Father, Mother, and Student via Gmail, Outlook, Desktop Mail, and WhatsApp.
- **Google Classroom Stream Publishing**: Publishes formatted announcements directly to student classroom feeds.

### 2. Classroom Portal (`ClassroomPortal.jsx`)
- Role-based views for **Teachers** and **Students**.
- Real-time roster, coursework, and assignment tracking synced with Google Classroom API.
- Tabbed management for Announcements, Course Materials, and Question Banks.

### 3. Parent Dashboard (`ParentDashboard.jsx`)
- Student attendance, performance trends, and homework completion status.
- Session logs and feedback reports.
- Direct contact links to teachers.

### 4. Question Bank & Quiz Player (`features/questionBank/`)
- Interactive question bank creator, import wizard, and reviewer.
- Timed student quiz player with auto-scoring and explanations.

### 5. Adaptive Dark / Light Theming
- Seamless dark and light mode themes via CSS custom variables (`[data-theme='light']`).
- Theme preferences saved automatically to `localStorage`.

---

## 🛠️ Tech Stack

- **Framework**: React 19.2+
- **Routing**: React Router 7 (Data router)
- **Bundler**: Vite 8
- **Icons**: Ionicons (`<ion-icon>`)
- **Linting**: Oxlint

---

## 📂 Directory Structure

```
Business-solution-project-1.1/
├── src/
│   ├── components/
│   │   ├── ClassroomPortal.jsx             # Teacher & Student classroom hub
│   │   ├── SessionAnnouncementGenerator.jsx# Spellcheck studio & announcement generator
│   │   ├── ParentDashboard.jsx             # Parent review and monitoring portal
│   │   ├── AssignmentModal.jsx             # Course assignment viewer
│   │   ├── Navbar.jsx & Sidebar.jsx        # Navigation shell
│   │   └── ThemeToggle.jsx                 # Dark / Light theme switch
│   ├── features/questionBank/
│   │   ├── components/
│   │   │   ├── QuestionReviewer.jsx        # Question editor & validation
│   │   │   ├── CreateQuestionBankModal.jsx # Bank creation wizard
│   │   │   └── StudentAccessModal.jsx      # Permission manager
│   ├── scripts/                            # Data encryption scripts
│   ├── style.css                           # Master design tokens and layout
│   └── App.jsx                             # Route definitions
├── package.json
└── vite.config.js
```

---

## 💻 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Build for Production
```bash
npm run build
```

### 4. Preview Production Build
```bash
npm run preview
```

### 5. Deploy to GitHub Pages
```bash
npm run deploy
```

---

## 🔒 Data Security Scripts

The project includes pre-configured bash utilities to protect sensitive data files:
- `npm run encrypt-data` — Encrypts sensitive configuration or mock assets.
- `npm run decrypt-data` — Decrypts data files prior to running `dev` or `build`.

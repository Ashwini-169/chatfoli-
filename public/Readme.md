# ChatFolio

ChatFolio is a free, open-source AI-powered resume builder based on the OpenResume project, customized with:

- An integrated AI chat assistant for guided resume creation
- OpenRouter + Gemini backend integration
- Modern, theme-aware UI
- Local-first data (resume stored in browser/Redux + localStorage)

## Features

- **AI Resume Assistant**  
  Chat-style interface that asks questions and fills your resume sections (profile, work experience, education, skills, projects).

- **Resume Builder**  
  Form-based editor backed by Redux, with autosave to `localStorage` and live preview.

- **Live Resume Preview**  
  Resume preview updates as you type (ready for PDF export).

- **Model Switching**  
  Choose between Gemini and multiple OpenRouter models (including `openai/gpt-oss-20b:free`).

- **Persistent Chat**  
  Chat history saved in `localStorage` with:
  - Save (download chat as JSON)
  - Clear (chat only)
  - Clear All (chat + resume state reset)

- **Themes**  
  Light, Dark, and Dark-Sepia modes using semantic CSS variables.

## Tech Stack

- **Frontend**: Next.js 13 (App Router), React 18, TypeScript, Tailwind CSS  
- **State Management**: Redux Toolkit  
- **Backend**: FastAPI (Python) with Gemini and OpenRouter clients  
- **Storage**: Redux + `localStorage` (no external DB)

## Project Structure (simplified)

```text
.
├── backend/                     # FastAPI backend (Gemini / OpenRouter)
│   ├── main.py                  # API endpoints (/api/chat, /api/openrouter, etc.)
│   ├── gemini_client.py         # Gemini client wrapper
│   ├── opairtclient.py          # OpenRouter/OpenAI client
│   └── requirements.txt
├── public/                      # Static assets (fonts, example resumes, logo)
├── src/app/
│   ├── [layout.tsx](http://_vscodecontentref_/1)               # App shell & metadata
│   ├── [page.tsx](http://_vscodecontentref_/2)                 # Landing page
│   ├── resume-builder/
│   │   └── [page.tsx](http://_vscodecontentref_/3)             # Main builder page (chat + form + preview)
│   ├── resume-import/           # PDF import flow
│   ├── resume-parser/           # Parser playground (currently hidden in nav)
│   ├── components/
│   │   ├── [AIChatbox.tsx](http://_vscodecontentref_/4)        # AI chat UI, model switcher, persistence
│   │   ├── ResumeForm/          # Form components for each resume section
│   │   ├── Resume/              # Preview components
│   │   ├── [TopNavBar.tsx](http://_vscodecontentref_/5)        # Top navigation + theme switcher
│   │   └── [ResumeDropzone.tsx](http://_vscodecontentref_/6)   # Drag-and-drop PDF import
│   └── lib/
│       ├── redux/               # Slices, store, types, hooks, local-storage
│       ├── parse-resume-from-pdf/ # Client-side parser helpers
│       └── ...
├── [REDUX_STATE_SPEC.md](http://_vscodecontentref_/7)          # Redux store + backend wiring spec
├── [package.json](http://_vscodecontentref_/8)
└── [tsconfig.json](http://_vscodecontentref_/9)
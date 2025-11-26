# Redux State Specification — OpenResume

This document describes how the application's shared Redux store is structured, how it is persisted to localStorage, and how frontend AI chat and backend APIs should read/write data to make integration and debugging straightforward.

## Location & Persistence

- Local storage key: `chatfolio-state`
  - The entire Redux root state is saved under this key by the `useSaveStateToLocalStorageOnChange()` hook.
  - On app start the `useSetInitialStore()` hook reads this key and merges saved values into the store using `deepMerge` (this preserves new fields added to the initial state while keeping persisted values).
- Chat messages are stored separately by the Chat UI under: `chatfolio-ai-chat-v1` (this is UI-only — not part of Redux root state).

Files to inspect:
- `src/app/lib/redux/local-storage.ts` — load/save helpers
- `src/app/lib/redux/hooks.tsx` — `useSetInitialStore()` & `useSaveStateToLocalStorageOnChange()`
- `src/app/lib/redux/resumeSlice.ts` — resume actions & initialResumeState

## RootState (high level)

RootState has at least these slices relevant to resumes and UI:

- `resume` — the user's resume data (primary data model)
- `settings` — UI preferences and form ordering

Example (TypeScript-like) shape:

```ts
type RootState = {
  resume: ResumeState;
  settings: SettingsState;
  // ...other slices (auth, ui, etc.)
}

type ResumeState = {
  profile: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
  };
  workExperiences: Array<{
    company?: string;
    jobTitle?: string;
    date?: string;
    descriptions?: string[]; // bullets
  }>;
  educations: Array<{
    school?: string;
    degree?: string;
    date?: string;
    gpa?: string;
  }>;
  projects: Array<{
    project?: string;
    date?: string;
    descriptions?: string[];
  }>;
  skills: {
    featuredSkills?: Array<{ skill: string; rating?: number }>;
    descriptions?: string[]; // soft skills or summary
  };
  custom: {
    descriptions?: string[];
  };
}

type SettingsState = {
  theme?: string; // e.g. 'light' | 'dark' | 'dark-sepia'
  formsOrder?: string[]; // order of forms in ResumeForm
  // other UI flags
}
```

Note: the canonical TypeScript interfaces are defined in `src/app/lib/redux/types.ts`; the shapes above are a concise reference.

## Key Redux Actions / Selectors

- Resume actions (in `resumeSlice.ts`):
  - `changeProfile({ field, value })` — update a single profile field
  - `changeWorkExperiences({ idx, field, value })` — update a field within a work experience
  - `changeEducations({ idx, field, value })`
  - `changeProjects({ idx, field, value })`
  - `changeSkills({ field, value, idx?, skill?, rating? })`
  - `changeCustom({ field, value })`
  - `setResume(completeResumeObject)` — replace/merge the resume slice (used for bulk updates)

- Settings actions (in `settingsSlice.ts`):
  - `setSettings(...)` — set UI settings

- Selectors:
  - `selectResume` — returns `state.resume`
  - Other selectors for sub-parts (e.g., `selectFormsOrder`) are in the settings slice.

## How the AI Chatbox and Resume Form share data

- The AI chat UI dispatches the same Redux actions as the Resume form. For example:
  - When the backend returns a parsed `extractedData` for `profile`, the chat code runs `dispatch(changeProfile({ field: 'name', value: aiName }))` for each field.
  - For bulk responses from the backend (full resume), the chat can call `dispatch(setResume(parsedResume))` to set all fields at once.
- Because `useSaveStateToLocalStorageOnChange()` subscribes to the store and writes changes to `chatfolio-state`, both UI areas remain in sync and persist automatically.

## Expected backend → frontend payloads

The system supports two common patterns from AI/backends. Your backend can return either partial `extractedData` (section + fields) or a full resume object.

1) Partial extraction (recommended per-turn):

```json
{
  "extractedData": {
    "section": "profile",
    "fields": { "name": "Jane Doe", "email": "jane@example.com" }
  },
  "nextQuestion": "Great — what's your most recent job title?"
}
```

Frontend handling:
- Parse JSON
- Dispatch per-field actions (e.g., `changeProfile`) or call `setResume()` with a small merged object

2) Full resume (bulk update):

```json
{
  "action": "setResume",
  "resume": {
    "profile": { "name": "Jane Doe", "email": "jane@example.com" },
    "workExperiences": [ { "company": "Acme", "jobTitle": "Engineer", "date": "2020-2024", "descriptions": ["Built X"] } ],
    "educations": [ { "school": "State U", "degree": "BSc", "date": "2019" } ],
    "skills": { "featuredSkills": [{ "skill": "React", "rating": 5 }], "descriptions": ["Teamwork"] }
  }
}
```

Frontend handling:
- If `action === 'setResume'` simply call `dispatch(setResume(payload.resume))` which will merge/replace the resume slice.

Notes on content types:
- Fields that are lists in Redux (e.g., `descriptions`, `workExperiences`) should be arrays. If backend returns strings, convert them to arrays before dispatching.

## Recommended wiring for backend endpoints

- `/api/chat` (Gemini style): Accepts conversation history and returns an object with `assistantMessage` (string) and optionally `resumeData` or `extractedData`.
- `/api/openrouter` (OpenRouter/OpenAI style): Accepts `messages` + `model`, returns `assistantMessage` and, optionally, `resumeData` (parsed JSON object). The frontend already detects model types and picks the endpoint.

Frontend contract (summary):
- If backend returns `resumeData.extractedData` → structure is `{ section: string, fields: { ... } }` → call per-field dispatchers.
- If backend returns `resumeData` as a full resume → call `dispatch(setResume(resume))`.

## Examples — Frontend dispatch snippets

Dispatch per-field from `extractedData`:

```ts
// Example: extractedData = { section: 'profile', fields: { name: 'Jane' } }
Object.entries(extractedData.fields).forEach(([field, value]) => {
  dispatch(changeProfile({ field: field as any, value }));
});
```

Dispatch full resume:

```ts
dispatch(setResume(parsedResume));
```

## Debugging & Dev tips

- Inspect current persisted state in browser console:
  - `JSON.parse(localStorage.getItem('chatfolio-state') || '{}')`
- Reset storage manually:
  - `localStorage.removeItem('chatfolio-state'); localStorage.removeItem('chatfolio-ai-chat-v1');` Then refresh.
- Use Redux DevTools to inspect actions and state changes in real time.
- Add console logs in `AIChatbox` to show incoming `resumeData` and dispatched actions — the code already has helpful logs like `console.log('🔍 [AIChatbox] Raw AI Response:', ...)`.
- When wiring backend, test with both partial and full payloads and check that arrays vs strings are normalized to the Redux shapes.

## Quick checklist when integrating a new backend

1. Ensure backend returns JSON (not plain text that contains JSON). If it returns text, the frontend will try to parse and may fallback to plain text.
2. Prefer returning `resumeData` as structured JSON to avoid fragile string parsing on the frontend.
3. Provide clear `action` or `extractedData` objects so the frontend can decide to `setResume` (bulk) or per-field dispatch (incremental).
4. Validate payloads: ensure arrays are arrays (descriptions, workExperiences) and dates/strings are strings.
5. Run manual end-to-end test: chat → backend → response → check Redux state and localStorage

## Where to change this contract

- Frontend parsing and dispatch logic lives in `src/app/components/AIChatbox.tsx` (functions `parseAIResponse` and `extractAndDispatchData`).
- The canonical resume TypeScript types are in `src/app/lib/redux/types.ts`.
- Backend endpoints are in `backend/` (see `main.py` and `gemini_client.py` / `opairtclient.py`).

---

If you want, I can also:
- Add a small JSON schema (AJV) for the resume shape to validate backend responses.
- Add a short integration test (unit test) that mocks the backend response and asserts that the correct Redux actions are dispatched.

Created on: 2025-11-13

# OpenResume Copilot Instructions

## Project Overview

**OpenResume** is a client-first resume builder and parser using Next.js 13, React, and Redux Toolkit. Key principle: **all data stays local in the browser** with no backend required (except for new AI features).

**Tech Stack**: TypeScript, React 18, Redux Toolkit, Next.js 13 (App Router), Tailwind CSS, React-PDF, PDF.js

---

## Architecture Essentials

### 1. Redux State Management Pattern

Resume data flows through a centralized Redux store (`src/app/lib/redux/`):

**Key files**:
- `resumeSlice.ts` - Actions to modify resume sections (profile, workExperiences, educations, projects, skills, custom)
- `types.ts` - Resume TypeScript interfaces (see `Resume`, `ResumeProfile`, `ResumeWorkExperience`, etc.)
- `hooks.tsx` - Redux hooks (`useAppDispatch`, `useAppSelector`)

**Action Pattern**:
```typescript
// All mutations use Redux actions:
dispatch(changeProfile({ field: 'name', value: 'John Doe' }));
dispatch(changeWorkExperiences({ idx: 0, field: 'company', value: 'Google' }));
dispatch(setResume(completeResumeObject)); // Bulk update from Gemini
```

**For AI Integration**: Use `setResume()` to bulk-populate the Redux store from Gemini JSON output.

---

### 2. Form Component Pattern

Forms are located in `src/app/components/ResumeForm/`:

**Structure**:
- `index.tsx` - Main form container, maps form types to components
- `ProfileForm.tsx` - Example form component using Redux selectors
- `Form/InputGroup.tsx` - Reusable Input/Textarea components with onChange handlers

**Component Pattern**:
```typescript
// Forms always follow this pattern:
1. Select data from Redux: `useAppSelector(selectProfile)`
2. Get dispatch: `useAppDispatch()`
3. Handle change: `dispatch(changeProfile({ field, value }))`
4. Render with Input/Textarea components
```

**For AI Integration**: Forms must remain **fully editable**—AI only pre-fills via Redux actions, never disables inputs.

---

### 3. Local Storage Persistence

Redux state auto-syncs to localStorage:
- Hook: `useSaveStateToLocalStorageOnChange()` (in ResumeForm)
- Initial state loaded via `useSetInitialStore()` hook
- Key: Data persists even after browser reload

---

### 4. Client-Side Only (Current Architecture)

- **NO backend API routes exist** in the current codebase
- **Data never leaves browser** except for download/import
- Resume PDF generation happens client-side using `react-pdf`

---

## Gemini AI Integration Architecture

### Phase 1: API Route Setup

Create `src/app/api/chat/route.ts` for server-side Gemini API communication:

```typescript
// src/app/api/chat/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  const { conversationHistory, userMessage } = await request.json();
  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  
  // Use Gemini multimodal LLM for conversation
  const model = client.getGenerativeModel({ model: "gemini-pro" });
  
  // Return: { assistantMessage, structuredData? (partial JSON) }
}
```

**Why separate API route?**
- Never expose Gemini API key to client
- Handle rate limiting server-side
- Process conversation context server-side

---

### Phase 2: Chatbox Component (`src/app/components/AIChatbox.tsx`)

**Responsibilities**:
1. Display chat messages (user + AI responses)
2. Track multi-turn conversation history
3. Send user messages to `/api/chat` endpoint
4. Extract structured resume data from AI responses
5. **Trigger Redux actions** to pre-fill forms

**Architecture**:
```typescript
// AIChatbox.tsx
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIChatbox = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const dispatch = useAppDispatch();
  
  const handleSendMessage = async (text: string) => {
    // 1. Add user message to state
    // 2. POST to /api/chat
    // 3. Parse AI response for resume JSON
    // 4. dispatch(changeProfile(...)) or dispatch(setResume(...))
  };
};
```

**Key Design**: Chatbox state (messages) is separate from Redux (resume data).

---

### Phase 3: System Prompt Engineering

Design a system prompt that guides Gemini to:

1. **Ask intelligent questions** in logical order:
   ```
   Order: Contact → Professional Summary → Work History → Education → Skills
   ```

2. **Gather context before asking**: "What industry are you in?" → Then ask relevant questions.

3. **Extract data progressively**: Each turn collects one resume section.

4. **Output structured JSON** after gathering each section:
   ```json
   {
     "action": "updateSection",
     "section": "profile",
     "data": {
       "name": "John Doe",
       "email": "john@example.com",
       "phone": "(555) 123-4567",
       "location": "San Francisco, CA",
       "summary": "..."
     }
   }
   ```

5. **Ask confirmation**: "Does this look correct? Any edits?" before moving to next section.

---

### Phase 4: Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  AIChatbox Component (Client)                           │
│  - Display chat messages                                │
│  - Capture user input                                   │
└──────────────┬──────────────────────────────────────────┘
               │ POST /api/chat
               │ { conversationHistory, userMessage }
               ▼
┌─────────────────────────────────────────────────────────┐
│  /api/chat Endpoint (Server)                            │
│  - Call Gemini API with conversation context            │
│  - Generate response + structured JSON                  │
│  - Return: { message, resumeData? }                     │
└──────────────┬──────────────────────────────────────────┘
               │ Response JSON
               ▼
┌─────────────────────────────────────────────────────────┐
│  AIChatbox (Client) - Parse Response                    │
│  - Display AI message                                   │
│  - Extract resumeData from response                     │
│  - dispatch(setResume(...)) OR                          │
│    dispatch(changeProfile(...)) etc.                    │
└──────────────┬──────────────────────────────────────────┘
               │ Redux Actions
               ▼
┌─────────────────────────────────────────────────────────┐
│  Redux Store (resumeSlice)                              │
│  - Resume state updated                                 │
│  - Auto-synced to localStorage                          │
└──────────────┬──────────────────────────────────────────┘
               │ Selector updates
               ▼
┌─────────────────────────────────────────────────────────┐
│  ResumeForm Components                                  │
│  - Input fields show pre-filled data (user editable)    │
│  - Users can edit any field as normal                   │
└─────────────────────────────────────────────────────────┘
```

---

### Phase 5: Environment Configuration

**`.env.local`**:
```
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key  # ⚠️ Only if client-side, not secure
GEMINI_API_KEY=your_api_key              # ✅ Server-side only (recommended)
```

---

## Integration Checklist

### Step 1: Backend API Route
- [ ] Create `/api/chat/route.ts` with Gemini client initialization
- [ ] Handle conversation history (stateless on server, sent by client)
- [ ] Error handling for API failures

### Step 2: Chatbox Component
- [ ] Create `src/app/components/AIChatbox.tsx`
- [ ] Implement message state (user + assistant messages)
- [ ] Build message send handler with API call
- [ ] Parse AI responses for structured resume data
- [ ] Dispatch Redux actions to update resume

### Step 3: Resume-Builder Page Integration
- [ ] Import `AIChatbox` component into `src/app/resume-builder/page.tsx`
- [ ] Add as collapsible panel or side drawer
- [ ] Ensure form fields remain editable alongside chatbox

### Step 4: System Prompt & Testing
- [ ] Craft detailed system prompt for question ordering
- [ ] Test multi-turn conversation flow
- [ ] Validate JSON extraction accuracy
- [ ] Add error boundaries for failed API calls

---

## Key Implementation Patterns

### Redux Action Usage
```typescript
// Single field update
dispatch(changeProfile({ field: 'name', value: aiExtractedName }));

// Bulk update (recommended for Gemini responses)
dispatch(setResume({
  ...currentResume,
  profile: { ...currentResume.profile, ...aiExtractedProfileData }
}));
```

### Input Component Interface
```typescript
// ResumeForm/Form/InputGroup.tsx uses this pattern:
<Input
  label="Name"
  name="name"
  value={name}
  onChange={(field, value) => dispatch(changeProfile({ field, value }))}
/>
```

### Error Handling
- Wrap API calls in try-catch
- Show error toast on Gemini failures
- Allow users to retry or continue editing manually

---

## File Structure (After Integration)

```
src/app/
├── api/
│   └── chat/
│       └── route.ts                    # NEW: Gemini API endpoint
├── components/
│   ├── AIChatbox.tsx                   # NEW: Chat UI
│   ├── ResumeForm/
│   │   ├── index.tsx                   # (unchanged, stays editable)
│   │   └── ...
│   └── ...
├── resume-builder/
│   └── page.tsx                        # MODIFIED: Import AIChatbox
└── ...
```

---

## Important Constraints

1. **User Editable**: All pre-filled form fields must remain editable
2. **No Breaking Changes**: Keep existing form component APIs unchanged
3. **Local First**: Resume data stored locally + localStorage, optional server sync for chat context only
4. **Progressive**: Start simple (profile section), expand to other sections
5. **API Key Security**: Never expose Gemini API key to browser; always use server-side routes

---

## Testing Checklist

- [ ] Chatbox sends message → receives AI response
- [ ] AI response updates Redux store
- [ ] Form fields show pre-filled data
- [ ] Form fields remain editable
- [ ] Data persists in localStorage
- [ ] Multi-turn conversation maintains context
- [ ] Handles Gemini API errors gracefully
- [ ] Resume PDF export includes chatbox-generated data

---

## References

- Redux Slice: `src/app/lib/redux/resumeSlice.ts` (action definitions)
- Redux Types: `src/app/lib/redux/types.ts` (Resume interface)
- Form Pattern: `src/app/components/ResumeForm/ProfileForm.tsx` (form component example)
- Resume Builder Page: `src/app/resume-builder/page.tsx` (where to integrate chatbox)

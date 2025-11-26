# Gemini AI Chatbox Integration Architecture

## Overview

This document provides a detailed technical architecture for integrating Gemini AI with the ChatFolio resume builder. The chatbox will intelligently ask questions and pre-fill the resume form while keeping all fields user-editable.

---

## System Components

### 1. Frontend: AIChatbox Component
**Location**: `src/app/components/AIChatbox.tsx`

**Responsibilities**:
- Render chat interface (messages + input)
- Manage conversation state locally
- Call `/api/chat` endpoint
- Parse structured data from AI responses
- Dispatch Redux actions to pre-fill forms

**State Management**:
```typescript
interface ChatState {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  loading: boolean;
  error: string | null;
  currentSection: 'profile' | 'workExperience' | 'education' | 'skills' | null;
}
```

---

### 2. Backend: Gemini API Route
**Location**: `src/app/api/chat/route.ts`

**Responsibilities**:
- Receive conversation history from client
- Send to Gemini API with system prompt
- Extract structured resume JSON from response
- Return both natural language response + structured data

**Request/Response**:
```typescript
// Request
POST /api/chat
{
  conversationHistory: Message[],
  userMessage: string,
  context?: { currentSection: string }
}

// Response
{
  assistantMessage: string,
  resumeData?: {
    section: 'profile' | 'workExperience' | ...;
    data: Partial<ResumeSection>;
    confidence: 'high' | 'medium' | 'low';
  },
  nextAction?: 'requestConfirmation' | 'moveToNextSection'
}
```

---

### 3. Redux Store Integration
**Location**: `src/app/lib/redux/resumeSlice.ts`

**Actions Used**:
- `setResume(completeResume)` - Bulk update (recommended for Gemini output)
- `changeProfile(...)` - Update profile fields
- `changeWorkExperiences(...)` - Update work experience
- `changeEducations(...)` - Update education
- And so on for each section

**Flow**:
```
Gemini Response → Parse JSON → Redux Action → Store Update → Form Pre-fill
```

---

## Conversation Flow Diagram

```
┌─ START ─────────────────────────────────────────────────────────┐
│                                                                  │
│  AI: "Hi! I'll help you build your resume. What's your name?"   │
│                                                                  │
│  User: "John Doe"                                                │
│  ↓                                                                │
│  API extracts: { section: 'profile', data: { name: 'John Doe' } }
│  ↓                                                                │
│  Redux: dispatch(changeProfile({ field: 'name', value: '...' }))
│  ↓                                                                │
│  Form pre-fills: <Input value="John Doe" onChange={...} />      │
│  (User can still edit!)                                          │
│                                                                  │
│  AI: "Got it, John! What's your professional email?"            │
│                                                                  │
│  [Conversation continues through each section]                  │
│                                                                  │
│  END: "Great! Your resume is pre-filled. Edit any section."     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## System Prompt Engineering

**Key Principles**:

1. **Sequential Question Ordering**
   ```
   Profile (name, email, phone, location, summary)
       ↓
   Work Experience (1 entry or multiple)
       ↓
   Education
       ↓
   Skills
   ```

2. **Contextual Awareness**
   - Ask: "What industry are you in?" early
   - Then ask role-specific follow-ups
   - Example: Software Engineer → ask about programming languages

3. **Structured Output Format**
   ```json
   {
     "extractedData": {
       "section": "profile",
       "fields": {
         "name": "John Doe",
         "email": "john@example.com"
       }
     },
     "nextQuestion": "What's your current job title?"
   }
   ```

4. **Confirmation Pattern**
   ```
   AI: "So you worked as a Senior Engineer at Google for 5 years. Correct?"
   User: "Yes" / "No, let me clarify..."
   ```

---

## Integration with Resume Builder Page

**Current Structure** (`src/app/resume-builder/page.tsx`):
```
┌─────────────────────────────────────────────────────────┐
│  Resume Builder Page                                    │
├─────────────────┬───────────────────────────────────────┤
│                 │                                       │
│  ResumeForm     │        Resume PDF Preview            │
│  (Left)         │        (Right)                        │
│                 │                                       │
└─────────────────┴───────────────────────────────────────┘
```

**After Integration**:
```
┌──────────────────────────────────────────────────────────────────┐
│  Resume Builder Page                                             │
├──────────────────┬──────────────────────┬──────────────────────┤
│                  │                      │                      │
│  ResumeForm      │  AIChatbox (NEW)     │  Resume PDF Preview  │
│  (Left)          │  Collapsible Panel   │  (Right)             │
│  Fully Editable  │  (Right Drawer)      │                      │
│                  │                      │                      │
└──────────────────┴──────────────────────┴──────────────────────┘
```

**Layout Options**:
- Option A: Right-side drawer (modal-like)
- Option B: Bottom panel (below form)
- Option C: Tab-based (Resume Form / AI Assistant tabs)

---

## Data Flow Sequence

```
1. User opens Resume Builder
   ↓
2. User clicks "Start AI Chat" or "Chat with AI Assistant"
   ↓
3. AIChatbox component mounts
   ↓
4. AI sends opening message: "What's your name?"
   ↓
5. User types response
   ↓
6. POST /api/chat with:
   - conversationHistory: [{ role: 'user', content: ... }]
   - userMessage: "John Doe"
   - context: { currentSection: 'profile' }
   ↓
7. Server-side API route:
   - Calls Gemini API with system prompt
   - Gemini analyzes message
   - Extracts structured JSON
   ↓
8. Server returns:
   {
     assistantMessage: "Great, John! What's your email?",
     resumeData: {
       section: 'profile',
       data: { name: 'John Doe' },
       confidence: 'high'
     }
   }
   ↓
9. Client receives response:
   - Display AI message in chat
   - Parse resumeData
   - dispatch(changeProfile({ field: 'name', value: 'John Doe' }))
   ↓
10. Redux updates store
    ↓
11. ResumeForm re-renders:
    - Input value changes to "John Doe"
    - User can edit if needed
    ↓
12. Loop back to step 5 for next question
```

---

## Error Handling Strategy

| Scenario | Handling |
|----------|----------|
| **Gemini API Failure** | Show error message, allow user to retry or continue manually |
| **Invalid JSON in Response** | Log error, skip data extraction, show AI message only |
| **Network Timeout** | Retry logic with exponential backoff |
| **Rate Limiting** | Queue requests client-side, show "Please wait..." |
| **User Clarification Needed** | AI asks for confirmation: "Did you mean...?" |

---

## Security Considerations

### ✅ DO:
- Store Gemini API key in `GEMINI_API_KEY` (server-side environment variable)
- Use `/api/chat` route to proxy all API calls
- Validate user input before sending to Gemini
- Implement rate limiting on server-side

### ❌ DON'T:
- Expose Gemini API key to browser/client
- Store conversation history on server (stateless design)
- Send sensitive user data beyond what's necessary
- Skip input validation

---

## Multi-Role Support Architecture

### HR Professional
**Prompt variant**: Emphasize ATS compatibility, keyword optimization, achievement metrics

**Questions**:
- Quantifiable achievements: "How many team members did you manage?"
- Impact metrics: "What was the revenue impact?"
- Industry keywords: "What technologies did you use?"

### Educator
**Prompt variant**: Emphasize teaching philosophy, student outcomes, research/publications

**Questions**:
- Teaching approach: "What's your teaching methodology?"
- Student success: "How do you measure student learning?"
- Continuous improvement: "Professional development?"

### AI Chat Assistant (Default)
**Prompt variant**: General-purpose, adaptable to any role

**Questions**:
- Balanced approach across all sections
- Adaptive follow-ups based on responses
- Highlight skills relevant to current job market

**Implementation**:
```typescript
// src/app/api/chat/route.ts
const rolePrompts = {
  'hr': `You are an HR expert helping craft a resume...`,
  'educator': `You are an education expert helping craft a resume...`,
  'general': `You are a professional resume assistant...`,
};

const systemPrompt = rolePrompts[userRole] || rolePrompts['general'];
```

---

## Implementation Phases

### Phase 1 (MVP - 1 week)
- [ ] Create `/api/chat` endpoint
- [ ] Create `AIChatbox` component with basic UI
- [ ] Implement profile section conversation
- [ ] Parse name, email, phone from responses
- [ ] Test end-to-end flow

### Phase 2 (2-3 weeks)
- [ ] Expand to work experience section
- [ ] Handle multiple work entries
- [ ] Improve system prompt with better questions
- [ ] Add confirmation pattern

### Phase 3 (3-4 weeks)
- [ ] Add education and skills sections
- [ ] Role-based prompt variants
- [ ] Error recovery flows
- [ ] User feedback mechanism

### Phase 4 (Optional)
- [ ] Export/import chat history
- [ ] Multi-language support
- [ ] Advanced analytics (which fields take longest, etc.)

---

## Testing Strategy

```typescript
// Mock Gemini responses
const mockGeminiResponse = {
  assistantMessage: "Great! What's your email?",
  resumeData: {
    section: 'profile',
    data: { name: 'John Doe' },
    confidence: 'high'
  }
};

// Test scenarios:
1. User sends message → API called → Response displayed
2. Response parsed → Redux dispatch → Form updates
3. Form value remains editable
4. Multi-turn conversation maintains context
5. Error in response → graceful fallback
6. Offline mode → show cached response
```

---

## File Structure Summary

```
src/app/
├── api/
│   └── chat/
│       └── route.ts                 # NEW: Gemini API wrapper
├── components/
│   ├── AIChatbox.tsx                # NEW: Chat UI component
│   ├── AIChatbox/
│   │   ├── ChatMessage.tsx           # Display single message
│   │   ├── ChatInput.tsx             # Input field
│   │   └── ChatContainer.tsx         # Layout wrapper
│   └── ResumeForm/                   # UNCHANGED
│       └── ... (stays fully editable)
└── resume-builder/
    └── page.tsx                      # MODIFIED: Import AIChatbox
```

---

## Environment Setup

```bash
# .env.local
GEMINI_API_KEY=your_gemini_api_key_here

# package.json - add dependency
npm install @google/generative-ai
```

---

## Success Criteria

✅ Chatbox can ask questions and receive responses
✅ Responses parsed into structured resume JSON
✅ Redux store updated with extracted data
✅ Form fields pre-filled with conversation data
✅ All form fields remain user-editable
✅ Multi-turn conversation maintains context
✅ Data persists in localStorage
✅ No breaking changes to existing UI
✅ Errors handled gracefully
✅ Works across all resume sections

---

## References

- Gemini API: https://ai.google.dev/tutorials/rest_quickstart
- Redux Slice Actions: `src/app/lib/redux/resumeSlice.ts`
- Form Component Pattern: `src/app/components/ResumeForm/ProfileForm.tsx`
- Resume Types: `src/app/lib/redux/types.ts`

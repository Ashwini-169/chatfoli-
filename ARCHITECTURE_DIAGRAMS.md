# Visual Architecture & Data Flow Diagrams

## 1. System Architecture (High Level)

```
┌──────────────────────────────────────────────────────────────────┐
│                      OpenResume Application                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Resume Builder Page (src/app/resume-builder/page.tsx)    │ │
│  │                                                            │ │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌────────────┐  │ │
│  │  │  ResumeForm     │  │  AIChatbox   │  │   Resume   │  │ │
│  │  │  (Left Panel)   │  │  (Right      │  │    PDF     │  │ │
│  │  │                 │  │  Drawer)     │  │  (Preview) │  │ │
│  │  │ - ProfileForm   │  │              │  │            │  │ │
│  │  │ - WorkExpForm   │  │ - Messages   │  │  Live      │  │ │
│  │  │ - EducForm      │  │ - Input      │  │  Update    │  │ │
│  │  │ - SkillsForm    │  │ - Send Btn   │  │            │  │ │
│  │  │                 │  │              │  │            │  │ │
│  │  └────────┬────────┘  └───────┬──────┘  └────────────┘  │ │
│  │           │                   │                          │ │
│  └───────────┼───────────────────┼──────────────────────────┘ │
│              │                   │                             │
│              └─────────┬─────────┘                             │
│                        │                                       │
│                        ▼                                       │
│              ┌──────────────────────┐                         │
│              │   Redux Store        │                         │
│              │   (resumeSlice)      │                         │
│              │                      │                         │
│              │ - profile            │                         │
│              │ - workExperiences[]  │                         │
│              │ - educations[]       │                         │
│              │ - projects[]         │                         │
│              │ - skills             │                         │
│              │                      │                         │
│              └──────────┬───────────┘                         │
│                         │                                     │
│                         ▼                                     │
│              ┌──────────────────────┐                         │
│              │   localStorage       │                         │
│              │   Persistence        │                         │
│              │                      │                         │
│              │ Auto-sync on change  │                         │
│              └──────────────────────┘                         │
│                                                                │
└──────────────────────────────────────────────────────────────────┘

                              ⬇️ API Call

┌──────────────────────────────────────────────────────────────────┐
│                    Backend API Layer                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  /api/chat/route.ts                                        │ │
│  │  (Next.js API Endpoint - Server-side)                     │ │
│  │                                                            │ │
│  │  1. Receive: { conversationHistory, userMessage, role }   │ │
│  │  2. Get system prompt for role                            │ │
│  │  3. Initialize Gemini API client                          │ │
│  │  4. Call Gemini with:                                     │ │
│  │     - System prompt (role-based)                          │ │
│  │     - Conversation history                                │ │
│  │     - User message                                        │ │
│  │  5. Receive response from Gemini                          │ │
│  │  6. Extract JSON from response text                       │ │
│  │  7. Return: { assistantMessage, resumeData }             │ │
│  │                                                            │ │
│  └──────────────────┬─────────────────────────────────────────┘ │
│                     │                                            │
│                     ▼                                            │
│         ┌─────────────────────────────┐                         │
│         │  Gemini Pro API (Google)    │                         │
│         │  (External Service)         │                         │
│         │                             │                         │
│         │ - Process natural language  │                         │
│         │ - Extract structured data   │                         │
│         │ - Generate next question    │                         │
│         │ - Return JSON + message     │                         │
│         │                             │                         │
│         └─────────────────────────────┘                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Interaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Action Flow                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ User Opens  │
│ Resume      │
│ Builder     │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│ ResumeForm Renders           │
│ - Initialize Redux from      │
│   localStorage               │
│ - Display form fields        │
│ - Fields empty or            │
│   pre-populated from cache   │
└──────────────┬───────────────┘
       │
       ▼
┌──────────────────────────────┐
│ User clicks "AI Assistant"   │
│ or AIChatbox auto-mounts     │
└──────────────┬───────────────┘
       │
       ▼
┌──────────────────────────────┐
│ AIChatbox Component Renders  │
│ - Shows opening message      │
│ - Input field ready          │
└──────────────┬───────────────┘
       │
       ▼
┌──────────────────────────────┐
│ User Types Response          │
│ e.g., "John Doe"            │
└──────────────┬───────────────┘
       │
       ▼
┌──────────────────────────────┐
│ User Presses Send            │
│ Button or Enter Key          │
└──────────────┬───────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│ AIChatbox.handleSendMessage()                │
│                                              │
│ 1. Add user message to local state           │
│ 2. Clear input field                         │
│ 3. Set loading=true                          │
│ 4. POST to /api/chat with:                   │
│    - conversationHistory: Message[]          │
│    - userMessage: "John Doe"                 │
│    - role: "general" | "hr" | "educator"    │
└──────────────┬───────────────────────────────┘
       │
       ▼ (Network Request)
┌──────────────────────────────────────────────┐
│ /api/chat Route Handler (Server-side)        │
│                                              │
│ 1. Validate request                          │
│ 2. Get system prompt for role                │
│ 3. Build message history                     │
│ 4. Initialize Gemini client                  │
│ 5. Call Gemini API with:                     │
│    - systemInstruction: system prompt        │
│    - history: conversation history           │
│    - message: "John Doe"                     │
│ 6. Wait for response                         │
└──────────────┬───────────────────────────────┘
       │
       ▼ (Gemini Cloud)
┌──────────────────────────────────────────────┐
│ Gemini Pro LLM                               │
│                                              │
│ 1. Process: system prompt + history + msg    │
│ 2. Generate response with:                   │
│    - Natural language next question          │
│    - JSON extraction of data                 │
│ 3. Return full response                      │
└──────────────┬───────────────────────────────┘
       │
       ▼ (Response)
┌──────────────────────────────────────────────┐
│ /api/chat Route - Process Response           │
│                                              │
│ 1. Extract assistant message                 │
│ 2. Find JSON block in response               │
│ 3. Parse JSON to get extractedData           │
│ 4. Remove JSON from display message          │
│ 5. Return:                                   │
│    {                                         │
│      assistantMessage: string,               │
│      resumeData: { extractedData: {...} }    │
│    }                                         │
└──────────────┬───────────────────────────────┘
       │
       ▼ (Network Response)
┌──────────────────────────────────────────────┐
│ AIChatbox - Receive Response                 │
│                                              │
│ 1. Parse JSON response                       │
│ 2. Add assistant message to state            │
│ 3. Set loading=false                         │
│ 4. Extract resumeData if present             │
└──────────────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│ Process extractedData                        │
│                                              │
│ for each field in extractedData.fields:      │
│   if field has value:                        │
│     dispatch Redux action                    │
│     e.g., changeProfile({                    │
│       field: "name",                         │
│       value: "John Doe"                      │
│     })                                       │
└──────────────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│ Redux Store Updates                          │
│                                              │
│ resumeSlice reducer processes action         │
│ Store state changes:                         │
│   profile.name = "John Doe"                  │
└──────────────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│ ResumeForm Re-renders                        │
│                                              │
│ Components subscribed to Redux:              │
│ - ProfileForm re-renders                     │
│ - Input value changes to "John Doe"          │
│ - Still has onChange handler                 │
│ - User can edit                              │
└──────────────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│ Resume PDF Preview Updates                   │
│                                              │
│ ResumePDF component re-renders               │
│ Shows live preview with new data             │
└──────────────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│ localStorage Auto-syncs                      │
│                                              │
│ useSaveStateToLocalStorageOnChange hook      │
│ Saves updated resume state to localStorage   │
└──────────────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│ Chat Message Displayed                       │
│                                              │
│ AIChatbox state re-renders with:             │
│ - New assistant message visible              │
│ - Chat scrolls to bottom                     │
│ - Next question displayed                    │
│ - Input field ready for next response        │
└──────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│ User Sees:                                   │
│                                              │
│ 1. Form field "Name" filled with            │
│    "John Doe" ✓                              │
│ 2. Resume PDF updated ✓                      │
│ 3. Next AI question ready ✓                  │
│ 4. Can edit any field ✓                      │
│                                              │
│ Ready for next interaction!                  │
└──────────────────────────────────────────────┘
```

---

## 3. Redux Data Flow

```
┌────────────────────────────────────────────┐
│          Redux State Tree                  │
├────────────────────────────────────────────┤
│                                            │
│  {                                         │
│    resume: {                               │
│      profile: {                            │
│        name: "John Doe" ◄── From AI       │
│        email: "john@...",                  │
│        phone: "(555)...",                  │
│        location: "San Francisco",          │
│        summary: "...",                     │
│        url: "..."                          │
│      },                                    │
│      workExperiences: [                    │
│        {                                   │
│          company: "Google" ◄── From AI    │
│          jobTitle: "Senior Engineer",      │
│          date: "2020-2023",                │
│          descriptions: [...]               │
│        }                                   │
│      ],                                    │
│      educations: [...],                    │
│      projects: [...],                      │
│      skills: {                             │
│        featuredSkills: [...],              │
│        descriptions: [...]                 │
│      },                                    │
│      custom: { descriptions: [...] }       │
│    }                                       │
│  }                                         │
│                                            │
└────────────────────────────────────────────┘

                    ⬆️ ⬇️ (Update/Select)

┌────────────────────────────────────────────┐
│      Redux Actions (resumeSlice)           │
├────────────────────────────────────────────┤
│                                            │
│  changeProfile({                           │
│    field: "name",                          │
│    value: "John Doe"                       │
│  })                                        │
│                                            │
│  changeWorkExperiences({                   │
│    idx: 0,                                 │
│    field: "company",                       │
│    value: "Google"                         │
│  })                                        │
│                                            │
│  setResume(completeResumeObject)           │
│  // Bulk update from Gemini               │
│                                            │
│  changeEducations({...})                   │
│  changeSkills({...})                       │
│  etc.                                      │
│                                            │
└────────────────────────────────────────────┘

                    ⬆️ ⬇️ (Dispatch/Select)

┌────────────────────────────────────────────┐
│      Redux Selectors & Hooks               │
├────────────────────────────────────────────┤
│                                            │
│  useAppDispatch()                          │
│  → dispatch(action)                        │
│                                            │
│  useAppSelector(selectProfile)             │
│  → { name, email, phone, ... }            │
│                                            │
│  useAppSelector(selectResume)              │
│  → entire resume object                    │
│                                            │
│  useAppSelector(selectWorkExperiences)     │
│  → workExperiences array                   │
│                                            │
└────────────────────────────────────────────┘

                    ⬆️ ⬇️ (Connect/Update)

┌────────────────────────────────────────────┐
│      React Components (Consumers)          │
├────────────────────────────────────────────┤
│                                            │
│  ProfileForm                               │
│  ├─ useAppSelector(selectProfile)          │
│  ├─ useAppDispatch()                       │
│  └─ Renders Input with:                    │
│     value={name}                           │
│     onChange={(f,v)=>dispatch(...)}        │
│                                            │
│  WorkExperiencesForm                       │
│  ├─ useAppSelector(selectWorkExperiences)  │
│  ├─ useAppDispatch()                       │
│  └─ Renders array of Inputs                │
│                                            │
│  AIChatbox (NEW)                           │
│  ├─ Receives API response                  │
│  ├─ dispatch(setResume or change*)         │
│  └─ Triggers form re-renders               │
│                                            │
│  ResumePDF                                 │
│  ├─ useAppSelector(selectResume)           │
│  └─ Re-renders on any change               │
│                                            │
└────────────────────────────────────────────┘

                    ⬆️ localStorage

┌────────────────────────────────────────────┐
│      localStorage Persistence              │
├────────────────────────────────────────────┤
│                                            │
│  useSaveStateToLocalStorageOnChange()      │
│  ├─ Listens for Redux changes              │
│  ├─ Serializes to JSON                     │
│  └─ Saves to localStorage:resume           │
│                                            │
│  useSetInitialStore()                      │
│  ├─ On app load                            │
│  ├─ Load from localStorage:resume          │
│  ├─ Deserialize JSON                       │
│  └─ Dispatch setResume(loaded)             │
│                                            │
└────────────────────────────────────────────┘
```

---

## 4. Message Exchange Sequence

```
Timeline: Multi-turn Conversation

┌─────────────────────────────────────────────────────────────────┐
│  Turn 1: Initial Opening                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AIChatbox Init:                                                │
│    messages = [                                                 │
│      {                                                          │
│        role: "assistant",                                       │
│        content: "Hi! I'll help you build your resume.           │
│                  What's your name?"                             │
│      }                                                          │
│    ]                                                            │
│                                                                 │
│  Display: Shows AI greeting message                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│  Turn 2: User Responds with Name                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Input: "John Doe"                                         │
│                                                                 │
│  POST /api/chat:                                                │
│  {                                                              │
│    conversationHistory: [                                       │
│      {                                                          │
│        role: "assistant",                                       │
│        content: "Hi! I'll help you build your resume.           │
│                  What's your name?"                             │
│      }                                                          │
│    ],                                                           │
│    userMessage: "John Doe",                                     │
│    role: "general"                                              │
│  }                                                              │
│                                                                 │
│  Gemini Processes:                                              │
│    System Prompt +                                              │
│    History (1 message) +                                        │
│    New Message ("John Doe")                                     │
│                                                                 │
│  Gemini Output:                                                 │
│  "Great! John, what's your professional email?"                │
│  ```json                                                        │
│  {                                                              │
│    "extractedData": {                                           │
│      "section": "profile",                                      │
│      "fields": {                                                │
│        "name": "John Doe"                                       │
│      }                                                          │
│    }                                                            │
│  }                                                              │
│  ```                                                            │
│                                                                 │
│  Return to Client:                                              │
│  {                                                              │
│    assistantMessage: "Great! John, what's your professional    │
│                      email?",                                   │
│    resumeData: {                                                │
│      extractedData: {                                           │
│        section: "profile",                                      │
│        fields: { name: "John Doe" }                             │
│      }                                                          │
│    }                                                            │
│  }                                                              │
│                                                                 │
│  Client-side Processing:                                        │
│    1. messages = [                                              │
│         { role: "user", content: "John Doe" },                  │
│         { role: "assistant",                                    │
│           content: "Great! John, what's your email?" }          │
│       ]                                                         │
│    2. dispatch(changeProfile({                                  │
│         field: "name",                                          │
│         value: "John Doe"                                       │
│       }))                                                       │
│    3. Redux updates                                             │
│    4. Form re-renders with name="John Doe"                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│  Turn 3: User Provides Email                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Input: "john.doe@google.com"                              │
│                                                                 │
│  POST /api/chat:                                                │
│  {                                                              │
│    conversationHistory: [                                       │
│      {                                                          │
│        role: "assistant",                                       │
│        content: "Hi! I'll help you build your resume.           │
│                  What's your name?"                             │
│      },                                                         │
│      {                                                          │
│        role: "user",                                            │
│        content: "John Doe"                                      │
│      },                                                         │
│      {                                                          │
│        role: "assistant",                                       │
│        content: "Great! John, what's your professional email?"  │
│      }                                                          │
│    ],                                                           │
│    userMessage: "john.doe@google.com",                          │
│    role: "general"                                              │
│  }                                                              │
│                                                                 │
│  Gemini Processes:                                              │
│    System Prompt +                                              │
│    Full History (3 messages) +                                  │
│    New Message ("john.doe@google.com")                          │
│                                                                 │
│  Gemini Output:                                                 │
│  "Perfect! What's your phone number?"                           │
│  ```json                                                        │
│  {                                                              │
│    "extractedData": {                                           │
│      "section": "profile",                                      │
│      "fields": {                                                │
│        "email": "john.doe@google.com"                           │
│      }                                                          │
│    }                                                            │
│  }                                                              │
│  ```                                                            │
│                                                                 │
│  Client-side Result:                                            │
│    1. Form now shows:                                           │
│       Name: "John Doe"                                          │
│       Email: "john.doe@google.com"                              │
│    2. Chat shows full conversation                              │
│    3. User can edit either field                                │
│    4. Both stored in Redux + localStorage                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘


[Pattern continues through all resume sections...]
```

---

## 5. Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Error Scenarios                              │
└─────────────────────────────────────────────────────────────────┘

Scenario 1: Network Error
┌─────────────────────────────────────────────────┐
│ handleSendMessage()                             │
│ ├─ try { fetch(...) }                           │
│ └─ catch (error)                                │
│    ├─ setError(error.message)                   │
│    ├─ setLoading(false)                         │
│    ├─ Render error message to user              │
│    └─ User can retry                            │
└─────────────────────────────────────────────────┘

Scenario 2: API Returns 500
┌─────────────────────────────────────────────────┐
│ response.ok === false                           │
│ ├─ throw new Error(`API error: ${status}`)      │
│ ├─ Caught in catch block                        │
│ ├─ setError displayed                           │
│ └─ Retry available                              │
└─────────────────────────────────────────────────┘

Scenario 3: JSON Parse Fails
┌─────────────────────────────────────────────────┐
│ /api/chat route.ts                              │
│ ├─ jsonMatch = response.match(...)              │
│ ├─ if (jsonMatch)                               │
│ │  └─ try { JSON.parse(...) }                  │
│ │     └─ catch (e) {                            │
│ │        └─ console.error(...)                  │
│ │           resumeData = null                   │
│ │        }                                      │
│ ├─ Return assistantMessage anyway               │
│ └─ (No form pre-fill for this turn, but data    │
│    can be added manually by user)               │
└─────────────────────────────────────────────────┘

Scenario 4: Gemini API Rate Limit
┌─────────────────────────────────────────────────┐
│ /api/chat                                       │
│ ├─ model.startChat()                            │
│ ├─ chat.sendMessage()                           │
│ └─ GoogleGenerativeAI throws error              │
│    ├─ Caught in /api/chat catch                 │
│    ├─ Returns 500 error                         │
│    ├─ Client receives error                     │
│    └─ Shows "Rate limited, try again later"     │
└─────────────────────────────────────────────────┘

Scenario 5: Invalid User Input
┌─────────────────────────────────────────────────┐
│ User clicks Send with empty input               │
│ ├─ if (!input.trim()) return                    │
│ ├─ No action taken                              │
│ ├─ Button disabled if empty                     │
│ └─ User must type something                     │
└─────────────────────────────────────────────────┘
```

---

## 6. localStorage Synchronization

```
┌─────────────────────────────────────────────┐
│  Application Lifecycle                      │
└─────────────────────────────────────────────┘

┌─ APP LOAD ──────────────────────────────────┐
│                                             │
│ 1. ResumeForm mounts                        │
│ 2. useSetInitialStore() hook runs           │
│    ├─ Check localStorage.resume             │
│    ├─ If exists:                            │
│    │  └─ Parse JSON                         │
│    │     └─ dispatch(setResume(loaded))     │
│    │        └─ Update Redux store            │
│    └─ If not exists:                        │
│       └─ Use default initial state          │
│ 3. Form renders with loaded/default data    │
│                                             │
└─────────────────────────────────────────────┘

┌─ USER INTERACTION ──────────────────────────┐
│                                             │
│ User types in form:                         │
│ <Input onChange={(f,v) =>                   │
│   dispatch(changeProfile(...))              │
│ />                                          │
│                                             │
│ 1. dispatch() called                        │
│ 2. Redux reducer processes action           │
│ 3. Store state updates                      │
│ 4. Redux emits change                       │
│                                             │
└─────────────────────────────────────────────┘

┌─ AUTO-SAVE ─────────────────────────────────┐
│                                             │
│ useSaveStateToLocalStorageOnChange() hook   │
│ ├─ Listens for Redux store changes          │
│ ├─ On any change:                           │
│ │  ├─ Get current resume state              │
│ │  ├─ Convert to JSON string                │
│ │  ├─ localStorage.setItem("resume", JSON)  │
│ │  └─ Silent auto-save                      │
│ └─ No user confirmation needed              │
│                                             │
└─────────────────────────────────────────────┘

┌─ AI INTERACTION ────────────────────────────┐
│                                             │
│ 1. User sends message via chat              │
│ 2. API response contains resumeData         │
│ 3. dispatch(changeProfile(...)) called      │
│ 4. Redux updates                            │
│ 5. useSaveStateToLocalStorageOnChange():    │
│    └─ Auto-saves new state                  │
│                                             │
└─────────────────────────────────────────────┘

┌─ BROWSER REFRESH ───────────────────────────┐
│                                             │
│ User refreshes page (F5)                    │
│                                             │
│ 1. App re-loads                             │
│ 2. ResumeForm mounts                        │
│ 3. useSetInitialStore() runs                │
│    ├─ localStorage.resume exists            │
│    ├─ Parse and load                        │
│    └─ dispatch(setResume(...))              │
│ 4. All data restored! ✓                     │
│ 5. Chat history not restored (new chat)     │
│    (Chat state not persisted by design)     │
│                                             │
└─────────────────────────────────────────────┘

┌─ DATA LOSS SCENARIOS ───────────────────────┐
│                                             │
│ ❌ Clear browser cache                      │
│    └─ localStorage cleared → data lost      │
│                                             │
│ ❌ Browser Private/Incognito mode           │
│    └─ localStorage disabled → data lost     │
│                                             │
│ ✅ Normal browsing                          │
│    └─ Data persists across sessions         │
│                                             │
│ ✅ Multiple tabs                            │
│    └─ Synced via localStorage events        │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 7. Role-Based System Prompt Selection

```
┌─────────────────────────────────────────────────┐
│  User Selects Assistant Mode                    │
└─────────────────────────────────────────────────┘

        ┌─────────────┬───────────────┬──────────┐
        │             │               │          │
        ▼             ▼               ▼          ▼
    [General]    [HR Expert]    [Educator]   [Custom?]
        │             │               │
        └─────────────┼───────────────┘
                      │
                      ▼
        ┌────────────────────────────┐
        │ AIChatbox.selectedRole     │
        │                            │
        │ useState("general")        │
        │ localStorage save          │
        └─────────┬──────────────────┘
                  │
                  │ On Send Message
                  ▼
        ┌────────────────────────────┐
        │ POST /api/chat with:       │
        │ {                          │
        │   conversationHistory,     │
        │   userMessage,             │
        │   role: selectedRole ◄──   │
        │ }                          │
        └─────────┬──────────────────┘
                  │
                  ▼
        ┌────────────────────────────┐
        │ /api/chat Handler          │
        │                            │
        │ const rolePrompts = {      │
        │   general: "...",          │
        │   hr: "...",               │
        │   educator: "..."          │
        │ }                          │
        │                            │
        │ systemPrompt =             │
        │   rolePrompts[role]        │
        └─────────┬──────────────────┘
                  │
                  ▼
        ┌────────────────────────────┐
        │ Gemini API Call            │
        │                            │
        │ model.startChat({          │
        │   systemInstruction:       │
        │     systemPrompt ◄── ROLE  │
        │   history: [...],          │
        │   ...                      │
        │ })                         │
        └─────────┬──────────────────┘
                  │
                  ▼
        ┌────────────────────────────┐
        │ Response Generation        │
        │                            │
        │ Gemini uses ROLE-specific: │
        │ - Questions                │
        │ - Keywords                 │
        │ - Tone                     │
        │ - Focus areas              │
        │                            │
        │ Example outputs:           │
        │ General: "What's your      │
        │          current role?"    │
        │ HR: "Tell me your top      │
        │      achievements with     │
        │      metrics"              │
        │ Educator: "Describe your   │
        │           teaching style"  │
        └────────────────────────────┘
```

---

These diagrams provide visual reference for understanding the complete data flow and architecture. Use them alongside the text documentation when implementing or debugging the system.

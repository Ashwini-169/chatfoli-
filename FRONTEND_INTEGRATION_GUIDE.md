# Frontend Integration Guide - AI Chatbox

## Overview

This guide explains how to integrate the backend Gemini AI chatbox into the ChatFolio React/Redux frontend.

---

## Architecture

```
┌─────────────────────────────┐
│  AIChatbox Component        │
│  - Display messages         │
│  - Manage conversation      │
│  - Call /api/chat endpoint  │
└──────────┬──────────────────┘
           │ POST request
           ▼
┌─────────────────────────────┐
│  Backend /api/chat          │
│  - Load system prompt       │
│  - Call Gemini API          │
│  - Extract JSON             │
│  - Return data              │
└──────────┬──────────────────┘
           │ JSON response
           ▼
┌─────────────────────────────┐
│  Parse Response             │
│  - Extract message          │
│  - Extract resumeData       │
│  - Dispatch Redux actions   │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Redux Store                │
│  - Update resume sections   │
│  - Persist to localStorage  │
└─────────────────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Form Components            │
│  - Show pre-filled data     │
│  - Allow user edits         │
│  - Auto-save to Redux       │
└─────────────────────────────┘
```

---

## Step 1: Create AIChatbox Component

Create `src/app/components/AIChatbox.tsx`:

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/lib/redux/hooks';
import {
  changeProfile,
  changeWorkExperiences,
  changeEducations,
  changeProjects,
  changeSkills,
  setResume
} from '@/app/lib/redux/resumeSlice';
import { selectResume } from '@/app/lib/redux/resumeSlice';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ResumeData {
  extractedData?: {
    section: 'profile' | 'workExperience' | 'educations' | 'skills' | 'projects';
    fields: Record<string, any>;
  };
  nextQuestion?: string;
}

interface ChatResponse {
  assistantMessage: string;
  resumeData?: ResumeData;
}

type ChatRole = 'general' | 'hr' | 'educator';

export const AIChatbox = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ChatRole>('general');
  const [isOpen, setIsOpen] = useState(false);
  
  const dispatch = useAppDispatch();
  const resume = useAppSelector(selectResume);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const extractAndDispatchData = (resumeData: ResumeData) => {
    if (!resumeData.extractedData) return;

    const { section, fields } = resumeData.extractedData;

    switch (section) {
      case 'profile':
        Object.entries(fields).forEach(([field, value]) => {
          dispatch(changeProfile({ field, value }));
        });
        break;

      case 'workExperience':
        // Add new or update existing work experience
        if (resume.workExperiences.length === 0) {
          dispatch(changeWorkExperiences({
            idx: 0,
            field: 'company',
            value: fields.company || ''
          }));
        }
        Object.entries(fields).forEach(([field, value]) => {
          dispatch(changeWorkExperiences({
            idx: resume.workExperiences.length - 1,
            field,
            value
          }));
        });
        break;

      case 'educations':
        if (resume.educations.length === 0) {
          dispatch(changeEducations({
            idx: 0,
            field: 'school',
            value: fields.school || ''
          }));
        }
        Object.entries(fields).forEach(([field, value]) => {
          dispatch(changeEducations({
            idx: resume.educations.length - 1,
            field,
            value
          }));
        });
        break;

      case 'skills':
        if (fields.skills && Array.isArray(fields.skills)) {
          fields.skills.forEach((skill: string, idx: number) => {
            dispatch(changeSkills({ idx, field: 'name', value: skill }));
          });
        }
        break;

      case 'projects':
        if (resume.projects.length === 0) {
          dispatch(changeProjects({
            idx: 0,
            field: 'name',
            value: fields.name || ''
          }));
        }
        Object.entries(fields).forEach(([field, value]) => {
          dispatch(changeProjects({
            idx: resume.projects.length - 1,
            field,
            value
          }));
        });
        break;
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    // Add user message to UI
    const newMessages = [...messages, { role: 'user' as const, content: userInput }];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/chat',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationHistory: newMessages,
            userMessage: userInput,
            role: selectedRole
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data: ChatResponse = await response.json();

      // Add AI response
      setMessages([...newMessages, { role: 'assistant', content: data.assistantMessage }]);

      // Extract and dispatch resume data
      if (data.resumeData) {
        extractAndDispatchData(data.resumeData);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white rounded-full w-12 h-12 shadow-lg hover:bg-blue-600 z-40"
        title="Open AI Resume Assistant"
      >
        💬
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-screen-80 bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="bg-blue-500 text-white p-4 rounded-t-lg flex justify-between items-center">
        <h3 className="font-semibold">AI Resume Assistant</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      {/* Role Selector */}
      <div className="p-3 border-b border-gray-200">
        <label className="text-xs text-gray-600">Mode:</label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as ChatRole)}
          className="w-full mt-1 p-2 border border-gray-300 rounded text-sm"
          disabled={isLoading}
        >
          <option value="general">📝 General Resume Builder</option>
          <option value="hr">👔 HR Professional Mode</option>
          <option value="educator">🎓 Educator Mode</option>
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm">
            <p>👋 Hello! I'm your AI resume assistant.</p>
            <p>Select a mode above and start chatting!</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm">
              ⏳ Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200 flex gap-2">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type here..."
          disabled={isLoading}
          className="flex-1 p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
};
```

---

## Step 2: Add AIChatbox to Resume Builder Page

Update `src/app/resume-builder/page.tsx`:

```typescript
import { AIChatbox } from '@/app/components/AIChatbox';

export default function ResumeBuilderPage() {
  return (
    <div className="flex h-screen">
      {/* Existing form/resume content */}
      <div className="flex-1">
        {/* Your existing resume builder content */}
      </div>

      {/* Add chatbox */}
      <AIChatbox />
    </div>
  );
}
```

---

## Step 3: Update Backend API URL

**Important**: Change the API endpoint to match your deployment:

### Development
```typescript
fetch('http://127.0.0.1:8000/api/chat', ...)
```

### Production (example with environment variable)
```typescript
const API_URL = process.env.NEXT_PUBLIC_GEMINI_API_URL || 'http://127.0.0.1:8000';
fetch(`${API_URL}/api/chat`, ...)
```

Add to `.env.local`:
```
NEXT_PUBLIC_GEMINI_API_URL=https://your-backend-domain.com
```

---

## Step 4: Redux Action Patterns

### Profile Update
```typescript
dispatch(changeProfile({ field: 'name', value: 'John Doe' }));
dispatch(changeProfile({ field: 'email', value: 'john@example.com' }));
```

### Work Experience
```typescript
// Add new experience
dispatch(changeWorkExperiences({
  idx: 0,
  field: 'company',
  value: 'Google'
}));
dispatch(changeWorkExperiences({
  idx: 0,
  field: 'position',
  value: 'Software Engineer'
}));
```

### Education
```typescript
dispatch(changeEducations({
  idx: 0,
  field: 'school',
  value: 'MIT'
}));
dispatch(changeEducations({
  idx: 0,
  field: 'degree',
  value: 'B.S. Computer Science'
}));
```

### Skills
```typescript
dispatch(changeSkills({
  idx: 0,
  field: 'name',
  value: 'Python'
}));
```

---

## Step 5: Environment Configuration

### `.env.local` (Next.js)
```
# Backend Gemini Chat API
NEXT_PUBLIC_GEMINI_API_URL=http://127.0.0.1:8000

# Or for production
# NEXT_PUBLIC_GEMINI_API_URL=https://api.yourresume.com
```

### `backend/.env` (Python)
```
GEMINI_API_KEY=your_api_key_here
```

---

## Conversation Flow Example

### User Initiates Chat
```
User: "Hi, I'm a software engineer"
```

### AI Response (General Mode)
```json
{
  "assistantMessage": "Great! I'm excited to help you build your resume. Let's start with your basic info. What's your full name?",
  "resumeData": {
    "extractedData": {
      "section": "profile",
      "fields": { "title": "Software Engineer" }
    },
    "nextQuestion": "What's your full name?"
  }
}
```

### Frontend Action
1. Display message: "Great! I'm excited to help..."
2. Extract: `{ title: "Software Engineer" }`
3. Dispatch: `dispatch(changeProfile({ field: 'title', value: 'Software Engineer' }))`
4. Form updates automatically
5. Data persists to localStorage

### User Response
```
User: "John Doe"
```

### AI Response (Continued)
```json
{
  "assistantMessage": "Nice to meet you, John! What's your professional email and phone number?",
  "resumeData": {
    "extractedData": {
      "section": "profile",
      "fields": { "name": "John Doe" }
    }
  }
}
```

### Frontend Action
1. Dispatch: `dispatch(changeProfile({ field: 'name', value: 'John Doe' }))`
2. Name field is automatically populated
3. User can see it in the form
4. User can edit if needed
5. Conversation continues...

---

## Testing the Integration

### 1. Start Backend Server
```bash
cd backend
python -m uvicorn main:app --port 8000
```

### 2. Run Next.js Development Server
```bash
npm run dev
```

### 3. Navigate to Resume Builder
```
http://localhost:3000/resume-builder
```

### 4. Click ChatBox Button
Click the 💬 button in bottom-right corner

### 5. Test Conversation
- Select mode (General, HR, or Educator)
- Type a message: "I'm a software engineer with 5 years of experience"
- Watch form fields auto-populate
- Continue conversation
- Edit form fields as needed

---

## Error Handling

### API Connection Error
```typescript
try {
  const response = await fetch(...);
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
} catch (error) {
  // Show error message to user
  setMessages([
    ...messages,
    { role: 'assistant', content: `Error: ${error.message}` }
  ]);
}
```

### CORS Issues
If you see CORS errors, ensure backend has CORS middleware:
```python
app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],  # Or specific domains
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"]
)
```

### API Key Issues
If Gemini doesn't respond:
1. Check `backend/.env` has valid key
2. Run `python backend/test_gemini.py` to verify
3. Check server logs for errors

---

## Performance Optimization

### Message Memoization
```typescript
const MemoizedMessage = React.memo(({ msg }: { msg: Message }) => (
  <div className={...}>
    {msg.content}
  </div>
));
```

### Debounced Input
```typescript
const [userInput, setUserInput] = useState('');
const debouncedInput = useDebounce(userInput, 300);
```

### Lazy Load Chatbox
```typescript
const AIChatbox = dynamic(
  () => import('@/app/components/AIChatbox').then(mod => mod.AIChatbox),
  { ssr: false }
);
```

---

## Customization

### Change Chatbox Position
```typescript
// Bottom-right (default)
className="fixed bottom-4 right-4"

// Top-right
className="fixed top-4 right-4"

// Bottom-left
className="fixed bottom-4 left-4"
```

### Change Colors
```typescript
// Blue theme (default)
className="bg-blue-500"

// Green theme
className="bg-green-500"

// Custom
className="bg-[#your-color]"
```

### Add More Roles
Backend `gemini_client.py`:
```python
SYSTEM_PROMPTS = {
  "general": "...",
  "hr": "...",
  "educator": "...",
  "custom": "..."  # Add new role
}
```

Frontend `AIChatbox.tsx`:
```typescript
type ChatRole = 'general';
```

---

## Next Steps

1. ✅ Start backend server
2. ✅ Create AIChatbox component
3. ✅ Add to resume-builder page
4. ✅ Test chat flow
5. ✅ Verify Redux dispatch working
6. ✅ Check form pre-population
7. ✅ Deploy backend (production)
8. ✅ Update API URL for production
9. ✅ Add analytics/logging
10. ✅ Optimize performance

# 🎨 Visual Integration Guide - AI Chatbox

## UI Layout

### Default State (Chatbox Closed)
```
┌─────────────────────────────────────────────────────────┐
│  ChatFolio Resume Builder                    X         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Form Fields]          [Resume Preview]                │
│                                                          │
│                                                  [💬]   │
│                                        ↑ Floating Button│
└─────────────────────────────────────────────────────────┘
```

### Chatbox Opened
```
┌─────────────────────────────────────────────────────────┐
│                      ┌──────────────────────────────┐   │
│  [Form Fields]       │ AI Resume Assistant   ✕      │   │
│                      ├──────────────────────────────┤   │
│  [Form Updates]      │ Powered by Gemini            │   │
│  (Auto-filled)       ├──────────────────────────────┤   │
│                      │ Mode: [General ▼]            │   │
│                      ├──────────────────────────────┤   │
│                      │ 👋 Hi! I'm your AI resume    │   │
│                      │ assistant. Let's build your  │   │
│                      │ resume together!             │   │
│                      │                              │   │
│                      │                 ⏳ Thinking  │   │
│                      ├──────────────────────────────┤   │
│                      │ [Input field]      [Send]    │   │
│                      └──────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Component Placement

### Option 1: Fixed Position (Recommended)
```tsx
// src/app/resume-builder/page.tsx
export default function ResumeBuilderPage() {
  return (
    <div className="flex gap-4">
      {/* Main resume builder content */}
      <div className="flex-1">
        <ResumeForm />
        <ResumePreview />
      </div>
      
      {/* Fixed chatbox - floats over content */}
      <AIChatbox />
    </div>
  );
}
```

**Result:** Chatbox floats in bottom-right corner, fixed position

### Option 2: Sidebar
```tsx
export default function ResumeBuilderPage() {
  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <ResumeForm />
        <ResumePreview />
      </div>
      
      {/* Sidebar chatbox */}
      <div className="w-96">
        <AIChatbox />
      </div>
    </div>
  );
}
```

**Result:** Chatbox appears in right sidebar (not floating)

---

## Message Styles

### User Message
```
┌──────────────────────┐
│ I'm a data scientist │  ← Blue background
└──────────────────────┘  ← Right aligned
```

CSS:
```css
bg-blue-500 text-white px-3 py-2 rounded-br-none
```

### AI Response
```
┌──────────────────────┐
│ Great! What's your   │  ← Gray background
│ full name?           │  ← Left aligned
└──────────────────────┘
```

CSS:
```css
bg-gray-100 text-gray-800 px-3 py-2 rounded-bl-none
```

### Loading State
```
┌──────────────────────┐
│ ⏳ AI is thinking...  │  ← Loading indicator
└──────────────────────┘
```

CSS:
```css
bg-gray-100 text-gray-800 px-3 py-2
```

---

## Form Auto-Fill Animation

### Before Chat
```
┌─────────────────────────────────────────┐
│ Profile Section                         │
├─────────────────────────────────────────┤
│ Name: [_______________] (empty)         │
│ Title: [_______________] (empty)        │
│ Email: [_______________] (empty)        │
└─────────────────────────────────────────┘
```

### Chat: "I'm a software engineer"
```
Chatbox:
AI: "What's your full name?"
↓
Redux dispatches: changeProfile({ field: 'title', value: 'Software Engineer' })
↓
Form updates:
┌─────────────────────────────────────────┐
│ Profile Section                         │
├─────────────────────────────────────────┤
│ Name: [_______________] (empty)         │
│ Title: [Software Engineer ✓] ← AUTO-FILLED
│ Email: [_______________] (empty)        │
└─────────────────────────────────────────┘
```

### Chat: "John Doe"
```
Chatbox:
AI: "Nice to meet you, John! What's your email?"
↓
Redux dispatches: changeProfile({ field: 'name', value: 'John Doe' })
↓
Form updates:
┌─────────────────────────────────────────┐
│ Profile Section                         │
├─────────────────────────────────────────┤
│ Name: [John Doe ✓] ← AUTO-FILLED        │
│ Title: [Software Engineer ✓]            │
│ Email: [_______________] (empty)        │
└─────────────────────────────────────────┘
```

---

## Conversation Mode Selector

### UI
```
┌──────────────────────────────────────────┐
│ AI Resume Assistant          ✕            │
├──────────────────────────────────────────┤
│ Conversation Mode:                       │
│ [📝 General Resume Builder       ▼]     │
│                                          │
│   Options on click:                      │
│   ✓ 📝 General Resume Builder           │
│   👔 HR Professional Mode                │
│   🎓 Educator Mode                       │
│                                          │
├──────────────────────────────────────────┤
```

### Behavior
- **General Mode** → Warm, supportive responses
- **HR Mode** → Emphasis on metrics and achievements
- **Educator Mode** → Focus on pedagogy and research

---

## Error States

### Backend Not Running
```
┌──────────────────────────────────────────┐
│ AI Resume Assistant          ✕            │
├──────────────────────────────────────────┤
│ Mode: [General ▼]                        │
├──────────────────────────────────────────┤
│ User: "Hi"                               │
│                                          │
│ ❌ Error: Backend not found              │
│ Make sure the backend is running at      │
│ http://127.0.0.1:8000                    │
├──────────────────────────────────────────┤
│ [Input field]              [Send]        │
└──────────────────────────────────────────┘
```

### API Error
```
┌──────────────────────────────────────────┐
│ User: "Tell me about yourself"          │
│                                          │
│ ❌ Error: API Error: 500 Internal        │
│ Server Error                             │
├──────────────────────────────────────────┤
│ [Input field]              [Send]        │
└──────────────────────────────────────────┘
```

### Network Timeout
```
┌──────────────────────────────────────────┐
│ User: "Hello"                            │
│                                          │
│ ❌ Error: Timeout - Request took too     │
│ long. Check your connection.             │
├──────────────────────────────────────────┤
│ [Input field]              [Send]        │
└──────────────────────────────────────────┘
```

---

## Color Scheme

### Primary Colors
```css
Button: bg-blue-500 hover:bg-blue-600      /* #3B82F6 → #2563EB */
Header: bg-gradient-to-r from-blue-500 to-blue-600
Input: border-blue-500 focus:ring-blue-500
```

### Message Colors
```css
User Message: bg-blue-500 text-white       /* #3B82F6 */
AI Message: bg-gray-100 text-gray-800      /* #F3F4F6 */
```

### Status Colors
```css
Loading: text-gray-600                     /* ⏳ thinking... */
Error: text-red-700 bg-red-50              /* ❌ error message */
Success: text-green-700 bg-green-50        /* ✓ success */
```

---

## Responsive Design

### Desktop (1024px+)
```
┌─────────────────────────────────────────┐
│ [Form]            [Preview]   [Chat ▼] │  ← Chatbox on right
└─────────────────────────────────────────┘
```

### Tablet (768px - 1023px)
```
┌─────────────────────────────────────────┐
│ [Form/Preview]                          │
│                                 [Chat] │  ← Chatbox smaller
└─────────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌──────────────────────────┐
│ [Form/Preview]           │
│                          │
│                  [💬]   │  ← Floating button
└──────────────────────────┘
        ↓ (Click)
┌──────────────────────────┐
│ [Chat Full Width]        │  ← Takes full width
│                          │
│                          │
└──────────────────────────┘
```

---

## Animation & Transitions

### Chatbox Open/Close
```
Closed:                          Open:
[💬] (fixed 14h x 14w)    →     ┌──────────────────┐
                                │ AI Resume Asst   │
                                │ [Messages area]  │
                                │ [Input]          │
                                └──────────────────┘
```

Duration: 0.2s ease-out

### Message Scroll
```
New message arrives:
  ↓
Scroll to bottom: smooth behavior
  ↓
messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
```

Duration: 0.3s smooth

### Button Hover
```
Normal:                        Hover:
[💬]                    →     [💬] + shadow + scale(1.1)
bg-blue-500                    bg-blue-600 shadow-xl
```

Duration: 0.2s ease

---

## Accessibility Features

### Keyboard Navigation
```
Tab        → Navigate between elements
Enter      → Send message (in input field)
Shift+Tab  → Navigate backwards
Escape     → Close chatbox (future enhancement)
```

### Screen Reader Support
```jsx
<button title="Open AI Resume Assistant" aria-label="Open chat">
  💬
</button>

<div role="log" aria-live="polite">
  {messages.map(msg => (...))}
</div>
```

### Color Contrast
```
Text vs Background WCAG AA:
✓ Dark text on light: 4.5:1 ratio
✓ Blue button text on blue: 3:1 ratio
✓ Error text on pink: 4.5:1 ratio
```

---

## Data Flow Visualization

### Single Message Flow
```
1. User Types
   ↓
2. Press Enter/Send
   ↓
3. AIChatbox Component
   - Adds message to local state
   - Shows in chat immediately
   - Disables input
   - Shows "⏳ AI is thinking..."
   ↓
4. POST /api/chat
   - conversationHistory: [...]
   - userMessage: "input"
   - role: "general"
   ↓
5. Backend Processing
   - Loads system prompt
   - Builds Gemini request
   - Calls Gemini API
   - Extracts JSON from response
   ↓
6. Response Received
   ```json
   {
     "assistantMessage": "...",
     "resumeData": {
       "extractedData": {
         "section": "profile",
         "fields": { "name": "John" }
       }
     }
   }
   ```
   ↓
7. Frontend Processes
   - Display AI message
   - Remove loading indicator
   - Parse resumeData
   ↓
8. Redux Dispatch
   dispatch(changeProfile({ 
     field: 'name', 
     value: 'John' 
   }))
   ↓
9. Form Auto-Update
   - Profile Name field shows "John"
   - Data persisted to localStorage
   - User can still edit
```

---

## Implementation Regions

### Header Section
```tsx
<div className="bg-gradient-to-r from-blue-500 to-blue-600 
                text-white p-4 
                flex justify-between items-center">
  <div>
    <h3 className="font-semibold text-lg">AI Resume Assistant</h3>
    <p className="text-xs text-blue-100">Powered by Gemini</p>
  </div>
  <button>✕</button>
</div>
```

### Mode Selector Section
```tsx
<div className="p-3 border-b border-gray-200 bg-gray-50">
  <label className="text-xs text-gray-600 font-semibold">
    Conversation Mode:
  </label>
  <select 
    value={selectedRole}
    onChange={(e) => setSelectedRole(e.target.value)}
    className="w-full mt-1 p-2 border border-gray-300 rounded"
  >
    <option value="general">📝 General Resume Builder</option>
    <option value="hr">👔 HR Professional Mode</option>
    <option value="educator">🎓 Educator Mode</option>
  </select>
</div>
```

### Messages Section
```tsx
<div className="flex-1 overflow-y-auto p-4 space-y-3">
  {messages.map((msg, idx) => (
    <div key={idx} 
         className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs px-3 py-2 rounded-lg text-sm 
                       ${msg.role === 'user' 
                         ? 'bg-blue-500 text-white rounded-br-none'
                         : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
        {msg.content}
      </div>
    </div>
  ))}
</div>
```

### Input Section
```tsx
<form onSubmit={handleSendMessage} 
      className="p-3 border-t border-gray-200 bg-gray-50 
                 flex gap-2">
  <input
    type="text"
    value={userInput}
    onChange={(e) => setUserInput(e.target.value)}
    placeholder="Type your message..."
    className="flex-1 p-2 border border-gray-300 rounded text-sm"
  />
  <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
    Send
  </button>
</form>
```

---

## Redux State Structure

### Before Chat
```javascript
{
  profile: {
    name: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    summary: ""
  },
  workExperiences: [...],
  educations: [...],
  projects: [...],
  skills: {...},
  custom: {...}
}
```

### After First Message
```javascript
{
  profile: {
    name: "",
    title: "Software Engineer",  ← Updated by Redux
    email: "",
    phone: "",
    location: "",
    summary: ""
  },
  workExperiences: [...],
  educations: [...],
  projects: [...],
  skills: {...},
  custom: {...}
}
```

---

## Local Storage Schema

```javascript
// Stored in window.localStorage
{
  "resume": {
    "profile": { "name": "John", "title": "Engineer", ... },
    "workExperiences": [...],
    "educations": [...],
    "projects": [...],
    "skills": {...},
    "custom": {...}
  },
  "settings": { /* theme, etc */ }
}
```

Auto-saved after each Redux action.

---

## Mobile Breakdown

### iPhone SE (375px)
```
┌─────────────────┐
│ AI Resume Asst ✕│
├─────────────────┤
│ Mode: [Gen ▼]   │
├─────────────────┤
│ 👋 Hi! I'm your │
│ AI resume...    │
│                 │
│ ⏳ AI thinking  │
├─────────────────┤
│[Input] [Send]   │
└─────────────────┘
```

### iPad (768px)
```
┌──────────────────────────────────┐
│ AI Resume Assistant       ✕       │
├──────────────────────────────────┤
│ Mode: [General Resume Builder ▼] │
├──────────────────────────────────┤
│ Messages section                 │
│ (larger text, more space)        │
│                                  │
│ [Input field]  [Send Button]     │
└──────────────────────────────────┘
```

---

## Interactions Flowchart

```
START
  ↓
User Clicks 💬
  ↓
Chatbox Opens
  ↓
Display Welcome Message
  ↓
User Selects Mode (optional)
  ↓
User Types Message
  ↓
User Presses Enter OR Clicks Send
  ├─ If empty → Do nothing
  └─ If has text:
      ↓
      Add to local state (shows immediately)
      ↓
      Disable input
      ↓
      Show "⏳ Thinking..."
      ↓
      POST /api/chat
      ├─ If Success → Parse response
      │  ├─ Display message
      │  ├─ Extract data
      │  ├─ Dispatch Redux
      │  └─ Return to input
      │
      └─ If Error → Show error message
         └─ Enable input again
      ↓
Continue Conversation OR Close 💬
  ↓
Data persisted to localStorage
  ↓
Resume fields updated
  ↓
END
```

---

This visual guide should help with understanding the UI/UX flow!

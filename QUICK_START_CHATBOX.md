# 🚀 AI Resume Builder - Quick Start Guide

## What You Have

✅ **Backend (FastAPI)**
- Gemini AI integration with three conversation modes
- `/api/chat` - AI chat with structured resume data extraction
- `/api/chatnormal` - Simple chat
- HTML test page for manual testing

✅ **Frontend Components**
- `AIChatbox.tsx` - Ready-to-use React component
- Redux integration for form pre-filling
- Responsive design with Tailwind CSS

---

## Setup Instructions

### 1. **Backend Setup** (5 minutes)

```bash
# Navigate to backend folder
cd backend

# Create virtual environment (first time only)
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify Gemini API key in .env
cat .env  # Should show: GEMINI_API_KEY=your_key_here

# Test Gemini connection
python test_gemini.py
```

**Expected Output from test:**
```
🔑 API Key loaded: AIzaSyA...
✅ google-generativeai imported successfully
✅ Gemini configured
✅ Model initialized
✅ Response received!
📝 Response text: Hello from Gemini...
```

### 2. **Start Backend Server** (Runs indefinitely)

```bash
# From backend folder with venv activated
python -m uvicorn main:app --port 8000 --reload

# Output should show:
# Uvicorn running on http://127.0.0.1:8000
# Press CTRL+C to quit
```

**Keep this terminal open!** The server must be running for the chatbox to work.

### 3. **Frontend Setup** (5 minutes)

```bash
# In a NEW terminal, navigate to project root
cd d:\ASHWINI\project\ai resume\open-resume-main

# Install dependencies (if not already done)
npm install

# Start Next.js development server
npm run dev

# Output should show:
# ▲ Next.js [version] - Local: http://localhost:3000
```

**Keep this terminal open too!**

### 4. **Add AIChatbox to Resume Builder Page**

Edit `src/app/resume-builder/page.tsx`:

```typescript
import { AIChatbox } from 'components/AIChatbox';

export default function ResumeBuilderPage() {
  return (
    <div>
      {/* Your existing resume builder content */}
      
      {/* Add this line */}
      <AIChatbox />
    </div>
  );
}
```

### 5. **Test the Integration**

1. Open browser: `http://localhost:3000/resume-builder`
2. You should see a **💬 button** in the bottom-right corner
3. Click it to open the chatbox
4. Select a mode: "General", "HR Professional", or "Educator"
5. Type a message: **"I'm a software engineer with 5 years of experience"**
6. Watch the form fields auto-populate!

---

## How It Works

```
1️⃣ User Types Message
   ↓
2️⃣ Frontend Sends to Backend
   POST http://127.0.0.1:8000/api/chat
   ↓
3️⃣ Backend Calls Gemini API
   System Prompt + Conversation History
   ↓
4️⃣ Gemini Responds
   Plain text message + Structured JSON
   ↓
5️⃣ Frontend Parses Response
   - Show message in chat
   - Extract resume data
   ↓
6️⃣ Redux Updates Resume
   dispatch(changeProfile(...))
   ↓
7️⃣ Form Fields Auto-Fill
   User sees data and can edit
```

---

## Testing Without Frontend

### Test Backend Endpoint Directly

```bash
curl -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "conversationHistory": [],
    "userMessage": "I am a Python developer with 3 years of experience",
    "role": "general"
  }'
```

**Expected Response:**
```json
{
  "assistantMessage": "That's great! What's your full name?",
  "resumeData": {
    "extractedData": {
      "section": "profile",
      "fields": {
        "title": "Python Developer"
      }
    },
    "nextQuestion": "..."
  }
}
```

### Test HTML Chat Page

Open browser: `http://127.0.0.1:8000/`

Simple chat interface to test the backend without frontend setup.

---

## Troubleshooting

### 💥 "Backend not found" error

**Problem:** Chatbox shows "Error: ... backend is running at http://127.0.0.1:8000"

**Solution:** Make sure backend server is running
```bash
# In backend folder
python -m uvicorn main:app --port 8000 --reload
```

### 💥 "Port 8000 already in use"

**Problem:** Error when starting backend

**Solution:** Use a different port
```bash
python -m uvicorn main:app --port 8001 --reload
# Then update NEXT_PUBLIC_GEMINI_API_URL=http://127.0.0.1:8001
```

### 💥 "Gemini API key error"

**Problem:** Backend crashes with API key error

**Solution:** Verify .env file
```bash
cd backend
cat .env  # Should show valid key

# Or run test
python test_gemini.py
```

### 💥 "Module not found" error on frontend

**Problem:** TypeScript can't find redux imports

**Solution:** This is normal during initial setup. The imports follow the project's convention.
All dependencies are already installed.

### 💥 Chatbox doesn't show up

**Problem:** Button doesn't appear on resume-builder page

**Solution:** 
1. Make sure you added `<AIChatbox />` to page.tsx
2. Check browser console for errors (F12)
3. Verify Next.js is running: `npm run dev`

---

## Conversation Modes

### 📝 General Resume Builder (Default)
- Warm, supportive tone
- Asks one question at a time
- Celebrates achievements
- Good for: First-time resume builders

**Flow:** Name → Email/Phone → Work History → Education → Skills

### 👔 HR Professional Mode
- Recruiter perspective
- Emphasizes quantifiable results
- ATS optimization keywords
- Power verb suggestions
- Good for: Experienced professionals

**Focus:** Metrics, achievements, industry keywords

### 🎓 Educator Mode
- Academic focus
- Student outcomes emphasis
- Research and publications
- Professional development
- Good for: Teachers, researchers, academics

**Focus:** Pedagogy, research, credentials

---

## Example Conversation Flow

```
User: "I'm a software engineer"
AI: "Great! What's your full name?"
   → Auto-fills: profile.title = "Software Engineer"

User: "John Doe"
AI: "Nice to meet you, John! What's your professional email?"
   → Auto-fills: profile.name = "John Doe"

User: "john@example.com"
AI: "Got it! Now let's talk about your work experience. 
     What company are you currently with?"
   → Auto-fills: profile.email = "john@example.com"

User: "Google"
AI: "Impressive! What's your position at Google?"
   → Auto-fills: workExperience.company = "Google"

[... conversation continues ...]
```

---

## File Structure

```
open-resume-main/
├── backend/                          # FastAPI backend
│   ├── main.py                      # Flask app + endpoints
│   ├── gemini_client.py             # Gemini SDK wrapper
│   ├── models.py                    # Pydantic schemas
│   ├── .env                         # API key
│   ├── requirements.txt             # Python dependencies
│   ├── test_gemini.py               # Connection test
│   └── test_chat.html               # HTML test page
│
├── src/app/
│   ├── components/
│   │   └── AIChatbox.tsx           # NEW: Chat UI component
│   │
│   ├── resume-builder/
│   │   └── page.tsx                # ADD: <AIChatbox />
│   │
│   └── lib/redux/
│       ├── resumeSlice.ts          # Redux actions
│       └── hooks.tsx               # Redux hooks
│
└── .env.local                       # Next.js env variables
    NEXT_PUBLIC_GEMINI_API_URL=http://127.0.0.1:8000
```

---

## Next Steps

1. ✅ Run backend server
2. ✅ Run frontend dev server  
3. ✅ Add AIChatbox to page.tsx
4. ✅ Test chatbox on localhost
5. ⏭️ Deploy backend to production
6. ⏭️ Update NEXT_PUBLIC_GEMINI_API_URL to production URL
7. ⏭️ Deploy Next.js to Vercel (or hosting)
8. ⏭️ Add analytics/logging
9. ⏭️ Customize system prompts
10. ⏭️ Add more conversation modes

---

## Environment Variables

### `.env` (Backend)
```
GEMINI_API_KEY=your_gemini_api_key_here
```

### `.env.local` (Frontend - Next.js)
```
# Development
NEXT_PUBLIC_GEMINI_API_URL=http://127.0.0.1:8000

# Production
# NEXT_PUBLIC_GEMINI_API_URL=https://api.yourresume.com
```

---

## Support

### Common Issues
- Chatbox not appearing → Add `<AIChatbox />` to page.tsx
- Backend errors → Check .env has valid API key
- Port conflicts → Use different port (8001, 8002, etc.)
- Module not found → Run `npm install`

### Testing
- Backend: `python test_gemini.py`
- Endpoint: `curl -X POST http://127.0.0.1:8000/api/chat ...`
- UI: Visit `http://127.0.0.1:8000/` for HTML test page

---

## What's Happening Behind the Scenes

### When You Send a Message:

1. **Frontend** captures your input
2. **Sends POST** to `/api/chat` with:
   - Your message
   - Previous conversation history
   - Selected mode (general/hr/educator)

3. **Backend** receives request:
   - Loads system prompt for selected mode
   - Builds conversation context
   - Calls Gemini API

4. **Gemini** generates response:
   - Natural conversation text
   - Structured JSON with extracted data

5. **Backend** parses:
   - Removes JSON from text
   - Returns both to frontend

6. **Frontend** updates:
   - Shows message in chat
   - Parses JSON data
   - Dispatches Redux actions
   - Forms auto-populate

7. **Redux** stores:
   - Updates resume state
   - Saves to localStorage
   - All data stays in browser

---

## Key Features

✨ **AI-Powered**
- Conversational resume building
- Intelligent questions in logical order
- Context-aware responses

✨ **Three Conversation Modes**
- General (friendly)
- HR Professional (metrics-focused)
- Educator (academic)

✨ **Smart Data Extraction**
- Automatically detects resume sections
- Extracts structured data
- Handles various phrasing

✨ **Redux Integration**
- Auto-fills form fields
- All data persists locally
- Users can edit any field

✨ **Production Ready**
- Error handling
- Logging
- CORS enabled
- Type-safe (TypeScript)

---

## Questions?

1. Check the API_GUIDE.md for detailed endpoint documentation
2. Check FRONTEND_INTEGRATION_GUIDE.md for advanced customization
3. Review the test_gemini.py output to verify setup
4. Check browser console (F12) for JavaScript errors
5. Check backend terminal output for server errors

**Happy resume building! 🚀**

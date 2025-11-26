# 📋 Implementation Checklist - AI Chatbox Integration

## Phase 1: Backend Setup ✅

### Environment & Dependencies
- [ ] Navigate to `backend` folder
- [ ] Create virtual environment: `python -m venv venv`
- [ ] Activate venv:
  - [ ] Windows: `venv\Scripts\activate`
  - [ ] Mac/Linux: `source venv/bin/activate`
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Verify .env has valid GEMINI_API_KEY

### Testing Backend
- [ ] Run connection test: `python test_gemini.py`
  - [ ] Verify output shows ✅ for all checks
  - [ ] Confirms Gemini API key works
- [ ] Start server: `python -m uvicorn main:app --port 8000 --reload`
  - [ ] Server runs on http://127.0.0.1:8000
  - [ ] Shows "Press CTRL+C to quit"
- [ ] Test HTML page: Open http://127.0.0.1:8000 in browser
  - [ ] Chat interface loads
  - [ ] Can type and send messages
  - [ ] Receive AI responses

### Verify API Endpoints
- [ ] Test `/api/chat` endpoint with curl
- [ ] Test `/api/chatnormal` endpoint with curl
- [ ] Verify JSON structure in responses
- [ ] Check error handling

---

## Phase 2: Frontend Component ✅

### Component Creation
- [ ] File exists: `src/app/components/AIChatbox.tsx`
- [ ] Component exports: `export const AIChatbox`
- [ ] Uses correct imports:
  - [ ] `import { useState, useRef, useEffect } from 'react'`
  - [ ] `import { useAppDispatch, useAppSelector } from 'lib/redux/hooks'`
  - [ ] `import { changeProfile, ... } from 'lib/redux/resumeSlice'`
- [ ] Component has 'use client' directive
- [ ] TypeScript compiles without errors

### Component Features
- [ ] Chat toggle button (💬 emoji)
- [ ] Message display (user + AI)
- [ ] Input field for user messages
- [ ] Send button
- [ ] Loading indicator while AI responds
- [ ] Role selector (General/HR/Educator)
- [ ] Error message display
- [ ] Scroll to bottom on new messages
- [ ] Responsive design (mobile-friendly)

### Redux Integration
- [ ] Dispatches `changeProfile` actions
- [ ] Dispatches `changeWorkExperiences` actions
- [ ] Dispatches `changeEducations` actions
- [ ] Dispatches `changeSkills` actions
- [ ] Dispatches `changeProjects` actions
- [ ] Handles missing resume data gracefully
- [ ] No errors when extracting data

### Data Flow
- [ ] Receives API responses with assistantMessage
- [ ] Receives API responses with resumeData
- [ ] Parses extractedData section and fields
- [ ] Correctly maps fields to Redux actions
- [ ] Fields are dispatched to correct slices

---

## Phase 3: Page Integration 🟡

### Resume Builder Page
- [ ] Edit `src/app/resume-builder/page.tsx`
- [ ] Add import: `import { AIChatbox } from 'components/AIChatbox'`
- [ ] Add JSX: `<AIChatbox />`
- [ ] Page compiles without errors
- [ ] Page loads without crashing

### Environment Variables
- [ ] Create/update `.env.local` in project root
- [ ] Set: `NEXT_PUBLIC_GEMINI_API_URL=http://127.0.0.1:8000`
- [ ] For production: `NEXT_PUBLIC_GEMINI_API_URL=https://your-api.com`

### Development Server
- [ ] Run: `npm run dev`
- [ ] Next.js starts on http://localhost:3000
- [ ] No build errors
- [ ] No runtime errors

---

## Phase 4: End-to-End Testing 🟡

### UI Testing
- [ ] Navigate to http://localhost:3000/resume-builder
- [ ] See 💬 button in bottom-right corner
- [ ] Click button to open chatbox
- [ ] Chatbox appears with header and input
- [ ] Close button works
- [ ] Toggle button works multiple times

### Chat Functionality
- [ ] Select "General" mode
- [ ] Type message: "I am a software engineer"
- [ ] Click Send or press Enter
- [ ] Message appears in chat
- [ ] "AI is thinking..." loading shows
- [ ] AI response appears
- [ ] Response is relevant to input

### Data Pre-Filling
- [ ] Check form fields in background
- [ ] Verify fields have been populated
- [ ] Example: profile.title = "Software Engineer"
- [ ] Can see data in the form
- [ ] All data is editable (not disabled)
- [ ] Edit a field manually → works
- [ ] Continue conversation → new data pre-fills

### Multiple Turns
- [ ] Continue conversation with: "My name is John"
- [ ] See AI's next question
- [ ] Watch profile.name populate
- [ ] Continue with work experience: "I worked at Google"
- [ ] Watch workExperience.company populate
- [ ] Continue with education details
- [ ] Watch educations section populate

### Error Handling
- [ ] Start without backend server running
- [ ] See error message: "Backend not found"
- [ ] Restart backend
- [ ] Chat works again
- [ ] Invalid API key → error message
- [ ] Network error → error message
- [ ] All errors are user-friendly

### Role Testing
- [ ] Select "HR Professional" mode
- [ ] Send message about achievements
- [ ] Verify different system prompt is used
- [ ] Response emphasizes metrics
- [ ] Select "Educator" mode
- [ ] Verify different response style
- [ ] Different conversation flow

### Redux & Local Storage
- [ ] Open DevTools → Redux tab (if redux-devtools installed)
- [ ] See actions dispatched: `changeProfile`, `changeWorkExperiences`
- [ ] Open DevTools → Storage → Local Storage
- [ ] See resume data persisted
- [ ] Refresh page
- [ ] Data persists
- [ ] Can continue conversation
- [ ] Form fields still have data

---

## Phase 5: Optimization & Polish 🟡

### Performance
- [ ] Chatbox loads quickly
- [ ] No unnecessary re-renders
- [ ] Messages scroll smoothly
- [ ] API calls complete in < 5 seconds
- [ ] Memory doesn't leak during long conversations

### Accessibility
- [ ] Keyboard navigation works
- [ ] Can send with Enter key
- [ ] Tab through inputs
- [ ] Color contrast is accessible
- [ ] Text is readable

### Mobile
- [ ] Chatbox adapts to small screens
- [ ] Input works on mobile
- [ ] Messages readable
- [ ] Button accessible
- [ ] No layout breaks

### Browser Compatibility
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge

---

## Phase 6: Production Deployment 🟡

### Backend Deployment
- [ ] Choose hosting: Heroku, Railway, Render, AWS, etc.
- [ ] Set environment variables: GEMINI_API_KEY
- [ ] Deploy `backend` folder
- [ ] Get production URL (e.g., https://api.resume.com)
- [ ] Test `/api/chat` endpoint on production
- [ ] Verify it works with new data

### Frontend Deployment
- [ ] Update `.env.local`: `NEXT_PUBLIC_GEMINI_API_URL=https://api.resume.com`
- [ ] Build: `npm run build`
- [ ] No build errors
- [ ] Deploy to Vercel or hosting
- [ ] Test on production site
- [ ] Chatbox works with production backend

### Post-Deployment Testing
- [ ] Send test message on production
- [ ] Verify data pre-fills
- [ ] Multiple roles work
- [ ] Error handling works
- [ ] No console errors
- [ ] Analytics working (if added)

---

## Phase 7: Documentation & Maintenance 🟡

### Documentation
- [ ] Update README.md with chatbox info
- [ ] Document API endpoints (API_GUIDE.md)
- [ ] Document frontend integration (FRONTEND_INTEGRATION_GUIDE.md)
- [ ] Create troubleshooting guide
- [ ] Document system prompts
- [ ] List supported roles

### Monitoring
- [ ] Set up error logging on backend
- [ ] Monitor API response times
- [ ] Track failed API calls
- [ ] Set up alerts for down time
- [ ] Monitor Gemini API quota usage

### Maintenance
- [ ] Create backup of .env files
- [ ] Document current system prompts
- [ ] Keep requirements.txt updated
- [ ] Monitor Gemini API changes
- [ ] Plan for future enhancements

---

## Testing Checklist Details

### Backend Tests
```bash
# 1. Test connection
cd backend
python test_gemini.py

# 2. Test server
python -m uvicorn main:app --port 8000

# 3. Test endpoint via curl
curl -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"conversationHistory": [], "userMessage": "Hi", "role": "general"}'

# 4. Expected response
# {"assistantMessage": "...", "resumeData": {...}}
```

### Frontend Tests
```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open in browser
# http://localhost:3000/resume-builder

# 4. Check console
# F12 → Console tab
# Should be no red errors

# 5. Open Redux DevTools
# F12 → Extensions tab (if installed)
# Should see changeProfile, changeWorkExperiences actions
```

### Integration Tests
```
Scenario 1: First message
- User: "I'm a developer"
- Expected: AI greets, asks for name
- Expected: profile.title set to "Developer"

Scenario 2: Continuing conversation
- User: "My name is John Doe"
- Expected: profile.name set to "John Doe"
- Expected: AI asks for email

Scenario 3: Mode switching
- Select "HR Professional"
- User: "Led a team of 10 engineers"
- Expected: Different response style
- Expected: Response mentions metrics/achievement

Scenario 4: Error recovery
- Stop backend server
- Send message
- Expected: Error shown
- Restart backend
- Send message
- Expected: Works again
```

---

## Success Criteria

✅ **Minimal Success**
- Chatbox appears on resume-builder page
- Can send messages
- AI responds
- At least one field pre-fills

✅ **Good Success**
- All 5 resume sections can be pre-filled
- Three roles work correctly
- Data persists to localStorage
- No console errors
- User can edit all fields

✅ **Excellent Success**
- Smooth, polished UI
- Fast responses (< 2s)
- Mobile responsive
- Deployed to production
- Works flawlessly in multiple roles
- Comprehensive error handling
- Analytics tracking
- Documentation complete

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| 404 Backend not found | Start backend: `python -m uvicorn main:app --port 8000` |
| Port 8000 in use | Use different port: `--port 8001` and update .env |
| Gemini API key error | Verify .env has valid key, run `python test_gemini.py` |
| Component not showing | Add `<AIChatbox />` to page.tsx |
| Module not found | Verify import paths match project convention |
| No form pre-fill | Check Redux dispatch in console, verify response has resumeData |
| Slow responses | Check Gemini API status, test with simple query |
| UI broken on mobile | Check Tailwind responsive classes in component |

---

## Timeline Estimate

| Phase | Time | Status |
|-------|------|--------|
| Backend Setup | 15 min | ✅ Done |
| Frontend Component | 20 min | ✅ Done |
| Page Integration | 5 min | 🟡 Pending |
| Testing | 30 min | 🟡 Pending |
| Optimization | 20 min | 🟡 Optional |
| Deployment | 30 min | 🟡 Optional |
| **Total** | **2 hours** | ✅⏳ |

---

## Quick Links

- [Quick Start Guide](./QUICK_START_CHATBOX.md)
- [API Documentation](./backend/API_GUIDE.md)
- [Frontend Integration](./FRONTEND_INTEGRATION_GUIDE.md)
- [Component File](./src/app/components/AIChatbox.tsx)
- [Backend Code](./backend/main.py)

---

## Version Control

Don't forget to commit your changes:

```bash
git add src/app/components/AIChatbox.tsx
git add backend/
git add QUICK_START_CHATBOX.md
git commit -m "feat: Add AI chatbox with Gemini integration"
git push
```

---

**Start with Phase 1 & 2 (marked ✅), then move to Phase 3 (marked 🟡) with user guidance.**

# 🎯 Quick Reference Card - AI Chatbox Integration

## 📚 Documentation Quick Lookup

| Need | Read | Time |
|------|------|------|
| **Overview** | `START_HERE.md` | 5 min |
| **How to implement** | `QUICK_START.md` | 15 min |
| **Why it's designed this way** | `GEMINI_INTEGRATION_GUIDE.md` | 20 min |
| **Visual data flows** | `ARCHITECTURE_DIAGRAMS.md` | 15 min |
| **Copy-paste prompts** | `SYSTEM_PROMPTS.md` | 10 min |
| **Multi-role support** | `ROLE_BASED_ASSISTANT.md` | 15 min |
| **Project timeline** | `IMPLEMENTATION_GUIDE.md` | 15 min |
| **AI agent setup** | `.github/copilot-instructions.md` | 10 min |

---

## 🚀 Implementation in 3 Steps

### Step 1: Create API Route (30 mins)
```bash
# Create: src/app/api/chat/route.ts
# Copy code from: QUICK_START.md Step 1
# Install: npm install @google/generative-ai
# Add to .env.local: GEMINI_API_KEY=your_key
```

### Step 2: Create Component (30 mins)
```bash
# Create: src/app/components/AIChatbox.tsx
# Copy code from: QUICK_START.md Step 2
# Import hooks: useAppDispatch, useAppSelector
# Use Redux actions: changeProfile, etc.
```

### Step 3: Integrate into Page (15 mins)
```bash
# Modify: src/app/resume-builder/page.tsx
# Add: import AIChatbox
# Add: <AIChatbox /> component
# Test: npm run dev
```

---

## 🔧 Redux Dispatch Patterns

```typescript
// Single field update
dispatch(changeProfile({ field: 'name', value: 'John Doe' }))

// Work experience
dispatch(changeWorkExperiences({ 
  idx: 0, 
  field: 'company', 
  value: 'Google' 
}))

// Bulk update (from Gemini response)
dispatch(setResume(completeResumeObject))
```

---

## 📊 Data Structure (Resume Type)

```typescript
Resume {
  profile: {
    name, email, phone, location, summary, url
  },
  workExperiences: [
    { company, jobTitle, date, descriptions[] }
  ],
  educations: [
    { school, degree, gpa, date, descriptions[] }
  ],
  projects: [
    { project, date, descriptions[] }
  ],
  skills: {
    featuredSkills: [{ skill, rating }],
    descriptions: []
  },
  custom: {
    descriptions: []
  }
}
```

---

## 🌐 API Endpoint

**URL**: `POST /api/chat`

**Request**:
```json
{
  "conversationHistory": [
    { "role": "user|assistant", "content": "..." }
  ],
  "userMessage": "John Doe",
  "role": "general|hr|educator"
}
```

**Response**:
```json
{
  "assistantMessage": "Great! What's your email?",
  "resumeData": {
    "extractedData": {
      "section": "profile",
      "fields": { "name": "John Doe" }
    }
  }
}
```

---

## 🎯 Conversation Flow

```
1. AIChatbox mounts
   ↓
2. Shows opening message
   ↓
3. User types response
   ↓
4. Click Send or press Enter
   ↓
5. POST /api/chat
   ↓
6. Gemini processes
   ↓
7. Response received
   ↓
8. Parse and dispatch Redux
   ↓
9. Form updates
   ↓
10. Show next question
    ↓
    Loop back to step 3
```

---

## 🔐 Security Checklist

- ✅ API key in `GEMINI_API_KEY` env var (not in .env file in git)
- ✅ Never expose key to browser
- ✅ Use `/api/chat` server route to proxy
- ✅ Validate user input before sending to Gemini
- ✅ Handle rate limiting server-side

---

## 🧪 Testing Checklist

- [ ] Chat sends message without errors
- [ ] API returns response
- [ ] Response parses correctly
- [ ] Redux action dispatches
- [ ] Form field updates
- [ ] Field remains editable
- [ ] localStorage persists data
- [ ] Multi-turn works
- [ ] Errors handled gracefully

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| `GEMINI_API_KEY undefined` | Add to `.env.local` |
| Module not found | Run `npm install @google/generative-ai` |
| Form not updating | Check Redux dispatch in console |
| API 500 error | Check API key validity |
| Chat not displaying | Verify AIChatbox imported in page.tsx |
| JSON parse fails | Check Gemini response format in logs |

---

## 🎭 Three Role Variants

### General AI Assistant (Default)
- Balanced approach
- Adaptive questions
- Good for any user
- Friendly tone

### HR Professional
- Metrics-focused
- Achievement-driven
- ATS optimization
- Recruiter insights

### Educator
- Teaching philosophy
- Student outcomes
- Research/publications
- Academic focus

**Implementation**: Add `role` parameter to API call

---

## 📁 File Structure After Implementation

```
src/app/
├── api/
│   └── chat/
│       └── route.ts                    # NEW ← Start here
├── components/
│   ├── AIChatbox.tsx                   # NEW ← Then here
│   ├── ResumeForm/
│   │   ├── index.tsx                   # (unchanged)
│   │   ├── ProfileForm.tsx             # Works with Redux
│   │   └── ...
│   └── Resume/
│       └── ... (unchanged)
├── lib/
│   └── redux/
│       ├── resumeSlice.ts              # Actions (unchanged)
│       └── ...
└── resume-builder/
    └── page.tsx                        # MODIFY ← Add component
```

---

## 💾 Environment Setup

**.env.local**:
```
GEMINI_API_KEY=sk-your-key-here
```

Get key from: https://makersuite.google.com/app/apikey

**package.json** - Add dependency:
```bash
npm install @google/generative-ai
```

---

## 🎓 Learning Order

### Beginner Path
1. START_HERE.md (overview)
2. QUICK_START.md (implement)
3. SYSTEM_PROMPTS.md (customize)

### Developer Path
1. .github/copilot-instructions.md (architecture)
2. QUICK_START.md (implement)
3. GEMINI_INTEGRATION_GUIDE.md (deep dive)

### Advanced Path
1. GEMINI_INTEGRATION_GUIDE.md (architecture)
2. ARCHITECTURE_DIAGRAMS.md (data flows)
3. SYSTEM_PROMPTS.md (customization)

---

## 🏁 Success Indicators

After Phase 1, you'll see:
- ✅ Chat messages in UI
- ✅ Name/email/phone pre-fill
- ✅ Form fields editable
- ✅ Data persists on refresh
- ✅ No console errors

---

## 📊 Implementation Breakdown

```
Total Time: ~2 hours
├─ Setup & reading: 15 mins
├─ API route: 30 mins
├─ Component: 30 mins
├─ Integration: 15 mins
└─ Testing & debugging: 30 mins

Difficulty: Medium
├─ Requires: TypeScript, React, Redux, API routes
├─ Learning curve: 1-2 hours
└─ After that: Maintenance is simple
```

---

## 🔄 Update Cycle (for tweaks)

If you need to tweak the system prompt:
1. Edit SYSTEM_PROMPTS.md
2. Copy updated prompt to `/api/chat/route.ts`
3. Restart dev server
4. Re-test conversation

---

## 📈 Phase 2 & 3 Additions

**Phase 2** (Weeks 2-3):
- Work experience questions
- Multiple job handling
- Role selector UI
- Education section

**Phase 3** (Weeks 3-4):
- Error recovery UI
- Loading animations
- User confirmations
- Analytics

---

## 🎯 Remember

- **User Editable**: Always. Users must feel in control.
- **Redux Driven**: Use Redux for all state updates
- **localStorage Synced**: Auto-persistence on changes
- **Error Resilient**: Graceful fallbacks built-in
- **Progressive**: Start simple, expand incrementally

---

## 🚀 Go Live Checklist

Before deploying to production:
- [ ] Error handling complete
- [ ] All roles tested
- [ ] Mobile responsive
- [ ] localStorage works
- [ ] No console warnings
- [ ] Gemini rate limits handled
- [ ] Users can't break the form
- [ ] Documentation updated

---

## 📞 Quick Help

**"I'm confused"** → Read START_HERE.md (5 mins)
**"How do I code it?"** → Follow QUICK_START.md (1 hour)
**"Why this design?"** → Study GEMINI_INTEGRATION_GUIDE.md (20 mins)
**"Show me flows"** → Check ARCHITECTURE_DIAGRAMS.md (15 mins)

---

## ✨ Key Numbers

- **3** roles (general, HR, educator)
- **7** core resume sections
- **2** new files to create
- **1** existing file to modify
- **1** API endpoint to create
- **1** dependency to install
- **~1 hour** to MVP
- **~3 weeks** to full features

---

**Last Updated**: November 7, 2025
**Status**: Ready to implement
**Questions**: See full documentation files

**Start**: Open `START_HERE.md` or `QUICK_START.md`

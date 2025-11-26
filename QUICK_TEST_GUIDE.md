# Quick Test Guide - OpenRouter Integration

## What Was Just Added

### 1. **Free OpenRouter Model**
✅ Added `openai/gpt-oss-20b:free` to model dropdown
- Completely free to use (OpenRouter free tier)
- Full resume building capabilities

### 2. **Smart Auto-Routing**
✅ Frontend automatically detects model type
- OpenRouter models (start with "openai/") → `/api/openrouter`
- Gemini models → `/api/chat`
- Different request formats for each backend

### 3. **Auto-Scroll Chat**
✅ Messages automatically scroll to latest
- Works in long conversations
- Uses aria-live for accessibility

### 4. **Clear All = Everything**
✅ "Clear All" button now resets:
- ✓ Chat messages
- ✓ Chat localStorage 
- ✓ Resume localStorage
- ✓ Resume form (Redux store to empty)
- Resume builder shows blank form after

---

## Quick Start (5 minutes)

### Setup
```bash
# In project root directory
cd d:\ASHWINI\project\ai\ resume\open-resume-main

# Terminal 1: Start backend
cd backend
python main.py
# You should see: "Uvicorn running on http://127.0.0.1:8000"

# Terminal 2: Start frontend
npm run dev
# You should see: "compiled" messages
```

### Test It
1. Open http://localhost:3000/resume-builder
2. You should see chat interface on left, resume on right
3. Look for the header with controls:
   - Mode: [General, HR, Educator]
   - Model: [5 dropdown options including GPT-OSS 20B (Free)]
   - OpenRouter: [checkbox]
   - Buttons: Save | Clear | Clear All

### Test Each Feature

#### Test Model Dropdown
1. Click Model dropdown
2. Select "GPT-OSS 20B (Free)"
3. Type message: "I worked at Google as a Software Engineer from 2020 to 2023"
4. **Check console** (F12): Should see log:
   ```
   📤 [AIChatboxContent] Sending to: http://localhost:8000/api/openrouter
   📤 [AIChatboxContent] Model: openai/gpt-oss-20b:free
   ```

#### Test Auto-Routing
1. Switch to "Gemini Pro"
2. Send same message
3. **Check console**: Should see log:
   ```
   📤 [AIChatboxContent] Sending to: http://localhost:8000/api/chat
   📤 [AIChatboxContent] Model: gemini-pro
   ```

#### Test Auto-Scroll
1. Send multiple messages (5-10)
2. Watch as each message appears at bottom
3. Page should auto-scroll smoothly

#### Test Clear Buttons
1. Send a message
2. Click "Clear" button → chat disappears, resume stays
3. Send another message
4. Click "Clear All" → dialog appears
5. Click OK in dialog → chat gone, resume form empty
6. Refresh page → still empty (localStorage cleared)

#### Test localStorage Persistence
1. Type in resume form (fill Name field)
2. Refresh page → name still there
3. Send a chat message
4. Refresh page → chat message still there
5. Click "Clear All" and confirm
6. Refresh page → everything gone

---

## Console Logs to Look For

### When sending to OpenRouter:
```
📤 [AIChatboxContent] Sending to: http://localhost:8000/api/openrouter
📤 [AIChatboxContent] Model: openai/gpt-oss-20b:free IsOpenRouter: true
📤 [AIChatboxContent] Body: {
  "messages": [...],
  "model": "openai/gpt-oss-20b:free",
  "site_url": "https://openresume.app",
  "site_title": "OpenResume - AI Resume Builder"
}
```

### When sending to Gemini:
```
📤 [AIChatboxContent] Sending to: http://localhost:8000/api/chat
📤 [AIChatboxContent] Model: gemini-pro IsOpenRouter: false
📤 [AIChatboxContent] Body: {
  "conversationHistory": [...],
  "userMessage": "...",
  "role": "general",
  "model": "gemini-pro",
  "useOpenRouter": false
}
```

### Response received:
```
📥 [AIChatboxContent] Status: 200 OK
📥 [AIChatboxContent] Response data: {
  "assistantMessage": "...",
  "resumeData": null
}
```

---

## Common Issues & Fixes

### Issue: "Cannot read property 'includes' of undefined"
**Fix**: Add `typeof` check (already fixed in code)

### Issue: Dropdown shows blank options
**Fix**: Verify AI_MODELS constant has `value` and `label` properties

### Issue: Clear All not clearing resume
**Fix**: Verify Redux `setResume(initialResumeState)` is imported and dispatched

### Issue: Auto-scroll not working
**Fix**: Verify `messagesContainerRef` is connected to messages div

### Issue: Request goes to wrong endpoint
**Fix**: Check if model starts with "openai/" or useOpenRouter is true

---

## Files to Check

| File | What to Check | Status |
|------|---------------|--------|
| `src/app/components/AIChatbox.tsx` | Model array, request routing, Clear All button | ✅ Complete |
| `backend/main.py` | `/api/openrouter` endpoint | ✅ Complete |
| `backend/opairtclient.py` | OpenRouter client | ✅ Complete |
| `.env.local` | Backend URL configured | ✅ Complete |

---

## Success Criteria

- [ ] Chat loads without errors
- [ ] Model dropdown shows 5 options
- [ ] Selecting GPT-OSS sends to `/api/openrouter`
- [ ] Selecting Gemini sends to `/api/chat`
- [ ] Console logs show correct endpoint
- [ ] Messages auto-scroll as they appear
- [ ] Clear button clears chat (not resume)
- [ ] Clear All clears everything and resets form
- [ ] localStorage persists after refresh
- [ ] Resume builder preview updates with chat data

---

## Next: Production Deployment

When ready to deploy:
1. Set `OPENROUTER_API_KEY` in backend `.env`
2. Update `NEXT_PUBLIC_GEMINI_API_URL` for production server URL
3. Deploy backend first, then frontend
4. Test on production URL with all 5 models
5. Monitor console for any errors

---

**Status: Ready to Test!** 🚀

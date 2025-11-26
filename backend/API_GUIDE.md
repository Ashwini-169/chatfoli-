# Resume Builder Chatbox - Backend API Guide

## Setup

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Create `.env` file with your Gemini API key
```
GEMINI_API_KEY=your_api_key_here
```

### 3. Start the server
```bash
python -m uvicorn main:app --port 8000
```

---

## API Endpoints

### 1. **`GET /`** - HTML Test Chat Page
Opens a simple HTML chatbox to test the chat function
```
http://127.0.0.1:8000/
```

---

### 2. **`POST /api/chat`** - Resume Builder Chat (with JSON extraction)

**Description**: Role-based resume builder chatbox that extracts structured resume data

**Request Body**:
```json
{
  "conversationHistory": [
    {"role": "user", "content": "Hi"},
    {"role": "assistant", "content": "Hi! Let's build your resume. What's your full name?"}
  ],
  "userMessage": "John Doe",
  "role": "general"
}
```

**Response**:
```json
{
  "assistantMessage": "Great, John! What's your professional email?",
  "resumeData": {
    "extractedData": {
      "section": "profile",
      "fields": {
        "name": "John Doe"
      }
    },
    "nextQuestion": "What's your professional email and phone?"
  }
}
```

**Available Roles**:
- `"general"` - Friendly, supportive resume assistant
- `"hr"` - Recruiter-focused, emphasizes metrics and ATS
- `"educator"` - Academic resume specialist

**Example with Curl**:
```bash
curl -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "conversationHistory": [],
    "userMessage": "Hi, I want to build a resume",
    "role": "general"
  }'
```

---

### 3. **`POST /api/chatnormal`** - Simple Chat (no JSON extraction)

**Description**: Plain text chat without structured data extraction

**Request Body**:
```json
{
  "conversationHistory": [],
  "userMessage": "Hello"
}
```

**Response**:
```json
{
  "assistantMessage": "Hi! How can I help you today?"
}
```

**Example with Curl**:
```bash
curl -X POST http://127.0.0.1:8000/api/chatnormal \
  -H "Content-Type: application/json" \
  -d '{
    "conversationHistory": [],
    "userMessage": "Hello"
  }'
```

---

## Data Flow

### Resume Builder Chat Flow (/api/chat)

```
User Input
   ↓
POST /api/chat with conversationHistory + userMessage + role
   ↓
Backend: Load role-based system prompt
   ↓
Backend: Send to Gemini with conversation context
   ↓
Gemini: Generate response + structured JSON
   ↓
Backend: Parse JSON from response
   ↓
Return: {
  assistantMessage: "...",  // Clean text for UI display
  resumeData: {...}         // Structured data for Redux
}
   ↓
Frontend: Display message + Parse resumeData
   ↓
Frontend: Dispatch Redux actions to pre-fill forms
   ↓
User can edit all fields (forms remain editable)
```

---

## Testing Guide

### Test 1: Verify Gemini Connection
```bash
python test_gemini.py
```

### Test 2: Test /api/chat endpoint
```bash
curl -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "conversationHistory": [],
    "userMessage": "My name is John Doe",
    "role": "general"
  }'
```

Expected Response:
```json
{
  "assistantMessage": "Great, John! What's your professional email and phone number?",
  "resumeData": {
    "extractedData": {
      "section": "profile",
      "fields": {"name": "John Doe"}
    },
    "nextQuestion": "..."
  }
}
```

### Test 3: Test /api/chatnormal endpoint
```bash
curl -X POST http://127.0.0.1:8000/api/chatnormal \
  -H "Content-Type: application/json" \
  -d '{
    "conversationHistory": [],
    "userMessage": "Hello!"
  }'
```

---

## Frontend Integration Example

### React/TypeScript Component Pattern

```typescript
const handleSendMessage = async () => {
  const response = await fetch('http://127.0.0.1:8000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationHistory: messages,
      userMessage: userInput,
      role: 'general'  // or 'hr', 'educator'
    })
  });

  const data = await response.json();
  
  // Display message
  setMessages([...messages, { role: 'assistant', content: data.assistantMessage }]);
  
  // Extract and pre-fill resume
  if (data.resumeData?.extractedData) {
    const { section, fields } = data.resumeData.extractedData;
    
    // Dispatch Redux actions
    if (section === 'profile') {
      dispatch(changeProfile({ field: 'name', value: fields.name }));
    } else if (section === 'workExperience') {
      dispatch(changeWorkExperiences({ idx: 0, field: 'company', value: fields.company }));
    }
    // ... continue for other sections
  }
};
```

---

## System Prompts

Each role uses a different system prompt guiding Gemini's responses:

### General Prompt
- Warm, supportive tone
- Asks one question at a time
- Celebrates achievements
- Perfect for first-time resume builders

### HR Prompt
- Recruiter perspective
- Emphasizes quantifiable results
- ATS optimization keywords
- Power verb suggestions

### Educator Prompt
- Academic focus
- Student outcomes
- Research and publications
- Professional development

All prompts instruct Gemini to return responses in this JSON format:
```json
{
  "extractedData": {
    "section": "profile|workExperience|educations|skills",
    "fields": { ...extracted_fields... }
  },
  "nextQuestion": "..."
}
```

---

## Troubleshooting

### Issue: "Gemini model not available"
**Solution**: Check if API key is set and valid
```bash
echo $GEMINI_API_KEY
python test_gemini.py
```

### Issue: Port 8000 already in use
**Solution**: Use a different port
```bash
python -m uvicorn main:app --port 8001
```

### Issue: No JSON extracted from response
**Solution**: Gemini might not include JSON block. Check logs:
```bash
# The server will log: "⚠️ No JSON block found in response"
# This means Gemini responded but didn't include structured JSON
```

### Issue: Module import errors
**Solution**: Reinstall dependencies
```bash
pip install -r requirements.txt --upgrade
```

---

## Files

- `main.py` - FastAPI routes
- `gemini_client.py` - Gemini API wrapper with system prompts
- `models.py` - Pydantic request/response schemas
- `.env` - API key configuration
- `test_gemini.py` - Connection test script
- `test_chat.html` - HTML chatbox test page

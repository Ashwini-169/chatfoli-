# 🔌 API Reference & Examples

## Base URL

**Development:** `http://127.0.0.1:8000`

**Production:** `https://your-api-domain.com`

---

## Endpoints

### 1. **GET /** - HTML Test Page

Opens a simple HTML chatbox for testing without frontend setup.

```
GET http://127.0.0.1:8000/
```

**Response:** HTML page with chatbox UI

**Use Case:** Quick manual testing of backend

---

### 2. **POST /api/chat** - Resume Builder Chat (Structured)

Conversational resume building with automatic resume data extraction.

#### Request

```bash
curl -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "conversationHistory": [
      {"role": "user", "content": "Hi"},
      {"role": "assistant", "content": "Hi! Tell me about yourself."}
    ],
    "userMessage": "I am a software engineer",
    "role": "general"
  }'
```

#### Request Body

```typescript
{
  // Array of previous messages (optional, can be empty)
  "conversationHistory": [
    {
      "role": "user" | "assistant",
      "content": "message text"
    }
  ],
  
  // User's current message
  "userMessage": "I am a software engineer with 5 years of experience",
  
  // Conversation mode: "general" | "hr" | "educator"
  "role": "general"
}
```

#### Response

```json
{
  "assistantMessage": "Great! What's your full name?",
  "resumeData": {
    "extractedData": {
      "section": "profile",
      "fields": {
        "title": "Software Engineer"
      }
    },
    "nextQuestion": "What's your full name?"
  }
}
```

#### Response Fields

- `assistantMessage` (string): The AI's text response for display
- `resumeData` (object, optional):
  - `extractedData.section`: Which resume section was identified
  - `extractedData.fields`: Extracted data as key-value pairs
  - `nextQuestion`: What the AI will ask next

#### Error Response

```json
{
  "assistantMessage": "Error: API key invalid",
  "resumeData": null
}
```

#### Available Roles

| Role | Tone | Focus | Best For |
|------|------|-------|----------|
| `general` | Warm, supportive | All sections equally | New builders |
| `hr` | Professional, metrics-focused | Achievements, metrics | Experienced pros |
| `educator` | Academic | Pedagogy, research | Teachers, academics |

---

### 3. **POST /api/chatnormal** - Simple Chat (Text Only)

Plain text conversation without resume data extraction.

#### Request

```bash
curl -X POST http://127.0.0.1:8000/api/chatnormal \
  -H "Content-Type: application/json" \
  -d '{
    "conversationHistory": [],
    "userMessage": "What should I include in a resume?"
  }'
```

#### Request Body

```typescript
{
  "conversationHistory": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ],
  "userMessage": "Your question here"
}
```

#### Response

```json
{
  "assistantMessage": "A good resume should include your name, contact info, professional summary, work experience, education, and key skills."
}
```

#### Use Case

- General advice questions
- Follow-up questions
- When you don't need structured data extraction

---

## Examples

### Example 1: First Turn - General Mode

**Request:**
```json
{
  "conversationHistory": [],
  "userMessage": "I want to build my resume. I work as a product manager.",
  "role": "general"
}
```

**Response:**
```json
{
  "assistantMessage": "Excellent! Let's build your resume together. 🎯 I see you're a Product Manager - that's exciting! Before we dive deep, what's your full name?",
  "resumeData": {
    "extractedData": {
      "section": "profile",
      "fields": {
        "title": "Product Manager"
      }
    },
    "nextQuestion": "What's your full name?"
  }
}
```

**Frontend Action:**
```typescript
dispatch(changeProfile({ field: 'title', value: 'Product Manager' }));
```

---

### Example 2: Second Turn - Providing Name

**Request:**
```json
{
  "conversationHistory": [
    {"role": "user", "content": "I want to build my resume. I work as a product manager."},
    {"role": "assistant", "content": "...Excellent! Let's build your resume together..."}
  ],
  "userMessage": "My name is Sarah Chen",
  "role": "general"
}
```

**Response:**
```json
{
  "assistantMessage": "Nice to meet you, Sarah! 👋 Let's capture your contact details. What's your professional email address?",
  "resumeData": {
    "extractedData": {
      "section": "profile",
      "fields": {
        "name": "Sarah Chen"
      }
    },
    "nextQuestion": "What's your professional email address?"
  }
}
```

**Frontend Action:**
```typescript
dispatch(changeProfile({ field: 'name', value: 'Sarah Chen' }));
```

---

### Example 3: Work Experience - HR Mode

**Request:**
```json
{
  "conversationHistory": [
    {"role": "user", "content": "I'm a product manager"},
    {"role": "assistant", "content": "..."},
    {"role": "user", "content": "Sarah Chen"},
    {"role": "assistant", "content": "..."},
    {"role": "user", "content": "sarah.chen@email.com"},
    {"role": "assistant", "content": "..."}
  ],
  "userMessage": "I currently work at Google as a Senior Product Manager. I launched 3 products that generated $50M in revenue.",
  "role": "hr"
}
```

**Response:**
```json
{
  "assistantMessage": "Impressive! 🚀 $50M in revenue is substantial. Can you share the specific product names and timeline for these launches? Also, what were your key responsibilities managing these products?",
  "resumeData": {
    "extractedData": {
      "section": "workExperience",
      "fields": {
        "company": "Google",
        "position": "Senior Product Manager",
        "description": "Launched 3 products that generated $50M in revenue"
      }
    },
    "nextQuestion": "Share product details and key responsibilities..."
  }
}
```

**Frontend Action:**
```typescript
dispatch(changeWorkExperiences({
  idx: 0,
  field: 'company',
  value: 'Google'
}));
dispatch(changeWorkExperiences({
  idx: 0,
  field: 'position',
  value: 'Senior Product Manager'
}));
```

---

### Example 4: Skills - Multiple Items

**Request:**
```json
{
  "conversationHistory": [...],
  "userMessage": "I'm skilled in Python, Java, React, and SQL",
  "role": "general"
}
```

**Response:**
```json
{
  "assistantMessage": "Great technical skills! Python, Java, React, and SQL are highly valuable. Beyond these, do you have experience with databases, cloud platforms, or testing frameworks?",
  "resumeData": {
    "extractedData": {
      "section": "skills",
      "fields": {
        "skills": ["Python", "Java", "React", "SQL"]
      }
    }
  }
}
```

**Frontend Action:**
```typescript
dispatch(changeSkills({ idx: 0, field: 'name', value: 'Python' }));
dispatch(changeSkills({ idx: 1, field: 'name', value: 'Java' }));
dispatch(changeSkills({ idx: 2, field: 'name', value: 'React' }));
dispatch(changeSkills({ idx: 3, field: 'name', value: 'SQL' }));
```

---

### Example 5: Education

**Request:**
```json
{
  "conversationHistory": [...],
  "userMessage": "I graduated from MIT with a degree in Computer Science",
  "role": "educator"
}
```

**Response:**
```json
{
  "assistantMessage": "Wonderful! MIT is an excellent institution. Did you engage in any research projects or academic publications during your time there? Also, did you maintain a strong GPA you'd like to highlight?",
  "resumeData": {
    "extractedData": {
      "section": "educations",
      "fields": {
        "school": "MIT",
        "degree": "Bachelor of Science (B.S.)",
        "major": "Computer Science"
      }
    }
  }
}
```

**Frontend Action:**
```typescript
dispatch(changeEducations({
  idx: 0,
  field: 'school',
  value: 'MIT'
}));
dispatch(changeEducations({
  idx: 0,
  field: 'degree',
  value: 'Bachelor of Science (B.S.)'
}));
```

---

## Response Section Types

### Profile Section
```json
{
  "section": "profile",
  "fields": {
    "name": "John Doe",
    "title": "Software Engineer",
    "email": "john@example.com",
    "phone": "(555) 123-4567",
    "location": "San Francisco, CA",
    "summary": "..."
  }
}
```

### Work Experience Section
```json
{
  "section": "workExperience",
  "fields": {
    "company": "Google",
    "position": "Senior Engineer",
    "date": "2020-2023",
    "description": "...",
    "achievements": [...]
  }
}
```

### Education Section
```json
{
  "section": "educations",
  "fields": {
    "school": "Stanford University",
    "degree": "B.S. Computer Science",
    "major": "Computer Science",
    "gpa": "3.8",
    "date": "2016-2020"
  }
}
```

### Skills Section
```json
{
  "section": "skills",
  "fields": {
    "skills": ["Python", "JavaScript", "React", "Docker"]
  }
}
```

### Projects Section
```json
{
  "section": "projects",
  "fields": {
    "name": "AI Resume Builder",
    "date": "2024",
    "description": "...",
    "technologies": ["React", "Python", "Gemini"]
  }
}
```

---

## Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | AI responded with data |
| 400 | Bad Request | Missing required fields |
| 500 | Server Error | Gemini API error |
| 503 | Service Unavailable | API is down |

---

## Common Request/Response Patterns

### Pattern 1: Bulk Resume Update

After gathering all info in multiple turns, frontend can update entire resume:

```typescript
const bulkUpdate = {
  profile: { name: "John", email: "john@example.com", ... },
  workExperiences: [...],
  educations: [...],
  skills: { featuredSkills: [...] }
};
dispatch(setResume(bulkUpdate));
```

### Pattern 2: Conversation History Management

Keep conversation in frontend state, send full history with each request:

```typescript
// State
const [messages, setMessages] = useState<Message[]>([]);

// On send
const newMessages = [...messages, { role: 'user', content: userInput }];
setMessages(newMessages);

// API call includes full history
fetch('/api/chat', {
  body: JSON.stringify({
    conversationHistory: newMessages,
    userMessage: userInput
  })
});
```

### Pattern 3: Error Recovery

If API fails, retry with optional delay:

```typescript
async function sendWithRetry(data, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch('/api/chat', { body: JSON.stringify(data) });
    } catch (err) {
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      } else {
        throw err;
      }
    }
  }
}
```

---

## Testing Tools

### cURL
```bash
# Test /api/chat
curl -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"conversationHistory":[],"userMessage":"Hi","role":"general"}'
```

### Postman
1. Import collection: [See postman_collection.json]
2. Set variables: base_url = http://127.0.0.1:8000
3. Run requests

### Browser DevTools
```javascript
// Console
const response = await fetch('http://127.0.0.1:8000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversationHistory: [],
    userMessage: 'Hi',
    role: 'general'
  })
});
const data = await response.json();
console.log(data);
```

### Python Requests
```python
import requests

response = requests.post(
  'http://127.0.0.1:8000/api/chat',
  json={
    'conversationHistory': [],
    'userMessage': 'Hi',
    'role': 'general'
  }
)
print(response.json())
```

---

## Rate Limiting

Currently no built-in rate limiting. When deploying to production, consider:

```python
# Example: 60 requests per minute per IP
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/chat")
@limiter.limit("60/minute")
async def chat_endpoint(request):
  ...
```

---

## Monitoring & Logging

### Backend Logs

The backend logs each request:

```
📝 Received chat request
🔎 System prompt selected: GENERAL_RESUME_PROMPT
✅ Gemini called successfully
🎯 JSON extracted: {'name': 'John'}
```

### Frontend Logging

```typescript
// In AIChatbox component
console.log('Message sent:', userMessage);
console.log('Response:', data);
console.log('Dispatching Redux action:', action);
```

---

## Performance Tips

1. **Conversation History**: Keep limited (last 10-20 messages)
2. **API Calls**: Debounce if needed
3. **Redux**: Use selectors for memoization
4. **Chunking**: Break large responses into sections

---

## Deployment Checklist

- [ ] Update NEXT_PUBLIC_GEMINI_API_URL to production URL
- [ ] Test /api/chat on production
- [ ] Verify error handling works
- [ ] Check CORS headers
- [ ] Enable HTTPS
- [ ] Set up monitoring/logging
- [ ] Configure rate limiting
- [ ] Add authentication if needed
- [ ] Document API for team

---

## Next Features (Future)

- [ ] Audio/voice input
- [ ] PDF upload parsing
- [ ] Multi-user support
- [ ] User authentication
- [ ] Resume templates
- [ ] Export to ATS formats
- [ ] Analytics dashboard

# Quick Start Implementation Guide

## 1. API Route Setup (Step 1: 30 mins)

Create `src/app/api/chat/route.ts`:

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { NextRequest, NextResponse } from "next/server";

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `You are an expert resume builder helping create a professional resume.

Your task is to:
1. Ask questions in this order: Name → Email → Phone → Location → Professional Summary
2. Extract information from user responses
3. Output structured JSON after each question

After each user response, output JSON in this format:
\`\`\`json
{
  "extractedData": {
    "section": "profile",
    "fields": {
      "name": "extracted value or null"
    }
  },
  "nextQuestion": "Your next question here",
  "confidence": "high" | "medium" | "low"
}
\`\`\`

Be concise. Ask one question at a time.`;

interface Message {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { conversationHistory, userMessage } = await request.json();

    // Build message history for Gemini
    const history: Message[] = conversationHistory.map(
      (msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })
    );

    const model = client.getGenerativeModel({ model: "gemini-pro" });

    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await chat.sendMessage(userMessage);
    const assistantMessage =
      result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from response
    let resumeData = null;
    const jsonMatch = assistantMessage.match(/\`\`\`json\n?([\s\S]*?)\`\`\`/);
    if (jsonMatch) {
      try {
        resumeData = JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error("Failed to parse JSON from Gemini response:", e);
      }
    }

    // Return clean message without JSON block
    const cleanMessage = assistantMessage
      .replace(/\`\`\`json[\s\S]*?\`\`\`/, "")
      .trim();

    return Response.json({
      assistantMessage: cleanMessage,
      resumeData,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
```

---

## 2. AIChatbox Component (Step 2: 45 mins)

Create `src/app/components/AIChatbox.tsx`:

```typescript
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "lib/redux/hooks";
import { changeProfile, selectProfile } from "lib/redux/resumeSlice";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ExtractedData {
  extractedData?: {
    section: string;
    fields: Record<string, any>;
  };
  nextQuestion: string;
  confidence: "high" | "medium" | "low";
}

export const AIChatbox = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'll help you build your resume. What's your name?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const profile = useAppSelector(selectProfile);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationHistory: messages,
          userMessage: input,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Add assistant message
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.assistantMessage },
      ]);

      // Process extracted data and update Redux
      if (data.resumeData?.extractedData?.fields) {
        const { fields } = data.resumeData.extractedData;
        Object.entries(fields).forEach(([key, value]) => {
          if (value) {
            dispatch(changeProfile({ field: key as any, value }));
          }
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-96 flex-col border-l border-gray-200 bg-white">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs rounded-lg px-4 py-2 ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-gray-100 px-4 py-2 text-gray-500">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 text-sm text-red-600 bg-red-50">
          Error: {error}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && !loading && handleSendMessage()
            }
            placeholder="Type your answer..."
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 3. Integrate into Resume Builder (Step 3: 15 mins)

Modify `src/app/resume-builder/page.tsx`:

```typescript
// Add to imports
import { AIChatbox } from "components/AIChatbox";
import { useState } from "react";

export default function ResumeBuilder() {
  const [showChatbox, setShowChatbox] = useState(false);

  return (
    <div className="flex h-[calc(100vh-var(--top-nav-bar-height))]">
      {/* Form Side */}
      <div className="flex-1 overflow-y-auto">
        <ResumeForm />
      </div>

      {/* PDF Preview */}
      <div className="hidden w-1/2 lg:block">
        <Resume />
      </div>

      {/* AI Chat Drawer */}
      {showChatbox && (
        <div className="fixed right-0 top-0 bottom-0 w-96 shadow-lg">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="font-semibold">Resume Assistant</h3>
            <button
              onClick={() => setShowChatbox(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <AIChatbox />
        </div>
      )}

      {/* Toggle Button */}
      {!showChatbox && (
        <button
          onClick={() => setShowChatbox(true)}
          className="fixed bottom-6 right-6 rounded-full bg-blue-500 px-6 py-3 text-white shadow-lg hover:bg-blue-600"
        >
          💬 AI Assistant
        </button>
      )}
    </div>
  );
}
```

---

## 4. Install Dependencies

```bash
npm install @google/generative-ai
```

---

## 5. Setup Environment

Create `.env.local`:

```
GEMINI_API_KEY=your_api_key_here
```

Get API key from: https://makersuite.google.com/app/apikey

---

## 6. Test Locally

```bash
npm run dev
# Visit http://localhost:3000/resume-builder
# Click "AI Assistant" button
# Test conversation flow
```

---

## Next Steps

### ✅ Immediate (Works After Above)
- Name → Email → Phone → Location conversation
- Basic form pre-fill for profile section

### 🔄 Phase 2 (Next Week)
- Extend to work experience section
- Handle multiple job entries
- Improve question prompts

### 🚀 Phase 3 (Optional)
- Education section
- Skills section
- Role-based prompt variants (HR, Educator, etc.)
- Export/import chat history

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "No API key found" | Add `GEMINI_API_KEY` to `.env.local` |
| JSON parsing fails | Check Gemini response format in `/api/chat` logs |
| Form not updating | Check Redux dispatch is being called |
| Chat not displaying | Verify AIChatbox is imported in resume-builder page |
| CORS errors | API route should handle this, check Next.js config |

---

## Files Modified/Created

**Created**:
- `src/app/api/chat/route.ts` (API endpoint)
- `src/app/components/AIChatbox.tsx` (Chat component)

**Modified**:
- `src/app/resume-builder/page.tsx` (Add chatbox)

**Configuration**:
- `.env.local` (Add API key)
- `package.json` (Add dependency)

---

## Architecture Diagram

```
┌─────────────────┐
│ Resume Builder  │
├─────────────────┤
│  Form | Preview │
│  + AI Chat ✨   │
└────────┬────────┘
         │
         ├──→ Form Input (Editable)
         │
         └──→ AIChatbox Component
             │
             ├──→ User Message
             │
             └──→ POST /api/chat
                 │
                 └──→ Gemini API
                     │
                     ├──→ Extract JSON
                     │
                     └──→ Return Response
                 │
                 └──→ Parse Data
                     │
                     └──→ Redux Action
                         │
                         └──→ Form Auto-fill
```

---

## Success Indicators

- ✅ Chat messages display properly
- ✅ User can type and send messages
- ✅ AI responds with next question
- ✅ Form fields update automatically
- ✅ Fields remain editable after pre-fill
- ✅ localStorage persists changes
- ✅ Can continue conversation naturally

---

**Questions?** Refer to `GEMINI_INTEGRATION_GUIDE.md` for detailed architecture.

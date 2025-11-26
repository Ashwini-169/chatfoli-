# Implementation Guide: Friendly + Structured Prompts & Fact Extraction

## Summary of Required Changes

This document outlines the concrete fixes needed to make the AI assistant more reliable and user-friendly.

### Problem Diagnosis
1. **Too strict "JSON-only" prompts** cause malformed responses
2. **No fact extraction** leads to repeated questions
3. **No validation** of extracted data (email format, etc.)
4. **No friendly text** before JSON makes it feel robotic

### Solution Architecture

## Part 1: Fact Extraction (✅ COMPLETED)

Created `fact_extractor.py` with:
- `pre_extract_facts(history)` - Scans conversation for name, email, phone, location
- `build_facts_context(facts)` - Formats facts as "OBSERVED FACTS" section for prompts
- `validate_email()` and `validate_phone()` - Basic field validation

**Status**: ✅ File created at `backend/fact_extractor.py`

## Part 2: Updated Main.py (✅ COMPLETED)

Modified `/api/chat` endpoint to:
1. Import fact_extractor functions
2. Call `pre_extract_facts()` before sending to Gemini
3. Pass facts_context to `gemini_client.send_message()`

**Status**: ✅ Changes applied to `backend/main.py`

**Next**: Same changes needed for `/api/openrouter` endpoint

## Part 3: Improved System Prompts (⚠️ NEEDS MANUAL UPDATE)

Created `prompts.py` with `FRIENDLY_RESUME_PROMPT` that includes:

### Key Improvements:
1. **Dual output**: Friendly text (1-2 lines) + JSON block
2. **Validation rules**: Check email format, skip answered questions
3. **OBSERVED FACTS awareness**: Don't re-ask collected fields
4. **Concrete examples**: Show exactly what output should look like

### Required Manual Edits:

#### File: `backend/gemini_client.py`

**Step 1**: Add import at top (line ~5):
```python
from prompts import FRIENDLY_RESUME_PROMPT
```

**Step 2**: Replace `GENERAL_RESUME_PROMPT` definition (lines ~30-80):
```python
GENERAL_RESUME_PROMPT = FRIENDLY_RESUME_PROMPT  # Use imported prompt
```

**Step 3**: Update `send_message()` signature (line ~118):
```python
def send_message(self, history, user_message, role="general", facts_context=""):
    """
    Send message to Gemini with role-based system prompt for resume building.
    
    Args:
        history: List of conversation messages
        user_message: Current user message
        role: Prompt role (general/hr/educator)
        facts_context: Pre-extracted facts to avoid repeat questions
        
    Returns:
        tuple: (assistant_message, resume_data)
    """
```

**Step 4**: Insert facts_context into prompt (line ~135, after system_prompt line):
```python
# Build conversation context with system prompt
prompt = system_prompt + "\n\n"
if facts_context:  # Add extracted facts
    prompt += facts_context + "\n"
prompt += "---CONVERSATION HISTORY---\n"
for msg in history:
    prompt += f"{msg.get('role', 'user')}: {msg.get('content', '')}\n"
prompt += f"\nuser: {user_message}\n"
```

#### File: `backend/opairtclient.py`

**Step 1**: Add import at top (line ~5):
```python
from prompts import FRIENDLY_RESUME_PROMPT
```

**Step 2**: Replace `SYSTEM_PROMPT` in `send_message()` method (line ~49):
```python
def send_message(
    self,
    messages: List[Dict[str, Any]],
    model: str = "openai/gpt-oss-20b:free",
    site_url: Optional[str] = None,
    site_title: Optional[str] = None,
    provider_sort: str = "price",
    max_output_tokens: int = 2048,
    response_mime_type: str = "application/json",
    facts_context: str = "",  # NEW PARAMETER
) -> Tuple[Optional[str], Optional[dict]]:
    """
    Send a chat completion request to OpenRouter API.
    
    Args:
        messages: Conversation history
        model: Model to use
        site_url: Referer URL
        site_title: Site title
        provider_sort: Provider sorting strategy
        max_output_tokens: Token limit
        response_mime_type: Hint for JSON responses
        facts_context: Pre-extracted facts from conversation
        
    Returns:
        (assistant_message, resume_data)
    """
    SYSTEM_PROMPT = FRIENDLY_RESUME_PROMPT  # Use imported prompt
    
    # Build full system message with facts if available
    full_system_prompt = SYSTEM_PROMPT
    if facts_context:
        full_system_prompt = SYSTEM_PROMPT + "\n\n" + facts_context
    
    # Prepend system message
    messages_with_system = [{"role": "system", "content": full_system_prompt}] + messages
    
    # ... rest of function unchanged
```

#### File: `backend/main.py`

**Step 5**: Update `/api/openrouter` endpoint (line ~80+):
```python
@app.post("/api/openrouter")
async def openrouter_endpoint(request: Request):
    try:
        data = await request.json()
        chat_req = ChatRequest(**data)
        
        history_dicts = [{"role": msg.role, "content": msg.content} for msg in chat_req.conversationHistory]
        
        # PRE-EXTRACT FACTS (same as /api/chat)
        facts = pre_extract_facts(history_dicts + [{"role": "user", "content": chat_req.userMessage}])
        facts_context = build_facts_context(facts)
        
        # Convert to OpenRouter format
        messages = []
        for msg in history_dicts:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": chat_req.userMessage})
        
        assistant_message, resume_data = openai_rt_client.send_message(
            messages=messages,
            model=data.get("model", "openai/gpt-oss-20b:free"),
            site_url=data.get("site_url"),
            site_title=data.get("site_title"),
            facts_context=facts_context  # PASS FACTS HERE
        )
        
        return ChatResponse(assistantMessage=assistant_message, resumeData=resume_data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ChatResponse(assistantMessage=f"Error: {str(e)}", resumeData=None)
```

## Testing Checklist

After making the above changes:

1. ✅ Verify server starts without errors:
   ```bash
   python -m uvicorn main:app --port 8000
   ```

2. ✅ Test fact extraction:
   - Open http://localhost:8000/test_opair_chat.html
   - Type: "hi, my name is John Doe"
   - Next: "john@example.com"
   - Verify AI doesn't re-ask for name or email

3. ✅ Test friendly output:
   - AI should respond with friendly text + JSON block
   - Example: "Got it, John! What's your email?" followed by ```json...```

4. ✅ Test validation:
   - Type invalid email: "asdf"
   - AI should ask to confirm: "That doesn't look like a valid email"

5. ✅ Test completion:
   - After answering all questions, type: "done"
   - AI should output full JSON with all collected data

## Benefits After Implementation

1. **Less randomness**: Friendly text + JSON structure reduces malformed responses
2. **No repeated questions**: Fact extraction remembers what was said
3. **Better UX**: Friendly sentences make it conversational, not robotic
4. **Validation**: Basic checks prevent bad data (invalid emails, etc.)
5. **Consistent format**: Always text + JSON, easier to parse in frontend

## Files Created

- ✅ `backend/fact_extractor.py` - Fact extraction & validation utilities
- ✅ `backend/prompts.py` - Improved FRIENDLY_RESUME_PROMPT
- ✅ `backend/IMPLEMENTATION_FIXES.md` - This guide

## Files To Update Manually

- ⚠️ `backend/gemini_client.py` - Add import, update prompt, add facts_context param
- ⚠️ `backend/opairtclient.py` - Add import, update prompt, add facts_context param  
- ⚠️ `backend/main.py` - Update /api/openrouter endpoint with fact extraction

## Quick Copy-Paste Snippets

### For gemini_client.py imports (line ~5):
```python
from prompts import FRIENDLY_RESUME_PROMPT
```

### For gemini_client.py prompt replacement (line ~30):
```python
GENERAL_RESUME_PROMPT = FRIENDLY_RESUME_PROMPT
```

### For gemini_client.py send_message signature (line ~118):
```python
def send_message(self, history, user_message, role="general", facts_context=""):
```

### For gemini_client.py prompt building (line ~135):
```python
prompt = system_prompt + "\n\n"
if facts_context:
    prompt += facts_context + "\n"
prompt += "---CONVERSATION HISTORY---\n"
```

### For opairtclient.py imports (line ~5):
```python
from prompts import FRIENDLY_RESUME_PROMPT
```

### For opairtclient.py send_message (line ~49):
```python
def send_message(
    self,
    messages: List[Dict[str, Any]],
    model: str = "openai/gpt-oss-20b:free",
    site_url: Optional[str] = None,
    site_title: Optional[str] = None,
    provider_sort: str = "price",
    max_output_tokens: int = 2048,
    response_mime_type: str = "application/json",
    facts_context: str = "",  # ADD THIS
) -> Tuple[Optional[str], Optional[dict]]:
    SYSTEM_PROMPT = FRIENDLY_RESUME_PROMPT
    
    full_system_prompt = SYSTEM_PROMPT
    if facts_context:
        full_system_prompt = SYSTEM_PROMPT + "\n\n" + facts_context
    
    messages_with_system = [{"role": "system", "content": full_system_prompt}] + messages
```

---

**Next Steps**: Manually apply the snippets above to the three files, then restart the server and test.

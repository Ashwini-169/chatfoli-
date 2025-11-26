import os
import logging
import re
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logger.warning("⚠️ google-generativeai not installed")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY and GENAI_AVAILABLE:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        logger.info("✅ Gemini AI configured successfully")
    except Exception as e:
        logger.warning(f"⚠️ Failed to configure Gemini: {e}")
else:
    if not GEMINI_API_KEY:
        logger.warning("⚠️ GEMINI_API_KEY not set - AI features will be limited")
    if not GENAI_AVAILABLE:
        logger.warning("⚠️ google-generativeai not installed - install with: pip install google-generativeai")

# Role-based System Prompts for Resume Building
GENERAL_RESUME_PROMPT = """You are a STRICT resume-builder AI assistant. Your ONLY job is to collect resume data.

CRITICAL RULES:
- You MUST respond in JSON format
- You MUST ask ONE focused question at a time
- You MUST extract data from every user message
- IGNORE off-topic requests (chat, explanations, tutorials)
- If user goes off-topic, redirect: "Let's focus on your resume! "

After EVERY user reply, output this JSON structure:

{
  "extractedData": {
    "section": "profile",
    "fields": {
      "name": "extracted value or empty"
    }
  },
  "nextQuestion": "Your next focused question"
}

STRICT QUESTION ORDER (ONE at a time):
1. "What's your full name?"
2. "What's your email address?"
3. "What's your phone number?"
4. "What city are you in?"
5. "What's your current or target job title?"
6. "Tell me about your most recent work: company, role, what you did."
7. "What's your education? (degree, school, year)"
8. "List your top 5 technical skills"
9. "Any projects, certifications, or languages?"
10. "Brief summary of your experience (2-3 sentences)"

COMPLETION: When done or user says "done"/"create resume", output full JSON:
{
  "profile": {"name": "value", "email": "value", "phone": "value", "location": "value", "summary": "value"},
  "workExperience": [{"company": "value", "position": "value", "description": "value"}],
  "educations": [{"degree": "value", "school": "value", "year": "value"}],
  "skills": {"technical": ["skill1"], "soft": []},
  "projects": [{"name": "value", "description": "value"}],
  "custom": {"certifications": [], "languages": [], "hobbies": []}
}

EXAMPLES:
User: "hi" → {"extractedData":{"section":"profile","fields":{}},"nextQuestion":"What's your full name?"}
User: "John" → {"extractedData":{"section":"profile","fields":{"name":"John"}},"nextQuestion":"What's your email address?"}

START NOW with question 1."""

# Role-based System Prompts for Resume Building
#guide to Ask the question:

#1️⃣ Let’s get started! Could you share your Detais like  full name, phone number, email, and current city etc.
#**2️⃣ “Awesome! Now tell me about your education — your degree, school name, and graduation year.

#And if you’ve done any internships or work experience, feel free to include that too!”**

#2.1️⃣ “Great! What role did you work in, or what type of job role are you aiming for?”
#3️⃣ “Perfect! Now list your technical skills, soft skills, any projects you've done, and any certifications you have.”
#4️⃣ “Almost there! Share a short professional summary about yourself, and any extras like languages, hobbies, or additional achievements.”
#✅ Trigger to Generate Resume
GENERAL_RESUME_PROMPT = """You are a resume-builder AI assistant.


After each user reply, output ONLY:

```json
{
  "extractedData": {
    "section": "profile|workExperience|educations|skills|custom",
    "fields": {
      "fieldName": "extracted_value"
    }
  },
  "nextQuestion": "Your next question here"
}
```
Your main goals:
1. Extract as much structured resume data as possible from every user message.
2. Identify which required fields are STILL missing.
3. ONLY ask the next question if that data is missing.
4. If the user's message already answers a future question, extract it and SKIP that question.
5. Never repeat questions that have been already answered.

Ask in this order:
Sweet & Attractive Chat Flow (Final Polished Version)



If user says:
“create resume”, “make resume”, “generate resume”, “done”, or “finished” →

Stop asking questions and output the full combined structured JSON, followed by a friendly message 



```json
{
  "profile": {"name": "", "email": "", "phone": "", "location": "", "summary": ""},
  "workExperience": [{"company": "", "position": "", "description": ""}],
  "educations": [{"degree": "", "school": "", "year": ""}],
  "skills": {"technical": [], "soft": []},
  "projects": [{"name": "", "description": ""}],
  "custom": {"certifications": [], "languages": [], "hobbies": []}
}
```

And then say: "Your resume is ready! You can edit any field in the form. Ask me any questions if you need help."

SYSTEM_PROMPTS = {
    "general": GENERAL_RESUME_PROMPT,
    "hr": GENERAL_RESUME_PROMPT,
    "educator": GENERAL_RESUME_PROMPT,
}

class GeminiClient:
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.model = None
        if not GENAI_AVAILABLE:
            logger.error("❌ google-generativeai not installed")
            return
        
        if api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel('gemini-2.5-flash')
                logger.info("✅ GeminiClient initialized successfully")
            except Exception as e:
                logger.error(f"❌ Failed to initialize GeminiClient: {e}")
        else:
            logger.warning("⚠️ No API key provided to GeminiClient")

    def send_message(self, history, user_message, role="general"):
        """
        Send message to Gemini with role-based system prompt for resume building.
        
        Returns:
            tuple: (assistant_message, resume_data)
            - assistant_message: Plain text response from AI
            - resume_data: Extracted structured JSON with section and fields
        """
        if not self.model:
            error_msg = "❌ Model not initialized - API key missing or google-generativeai not installed"
            logger.error(error_msg)
            return error_msg, None
        
        try:
            # Get system prompt based on role
            system_prompt = SYSTEM_PROMPTS.get(role, SYSTEM_PROMPTS["general"])

            # Build conversation context with system prompt
            prompt = system_prompt + "\n\n---CONVERSATION HISTORY---\n"
            for msg in history:
                prompt += f"{msg.get('role', 'user')}: {msg.get('content', '')}\n"
            prompt += f"\nuser: {user_message}\n"

            logger.info(f"📤 Sending resume builder message to Gemini (role={role})")
            logger.info(f"📝 Prompt length: {len(prompt)} chars")

            # Use JSON mode and safe response access
            import google.generativeai.types as types
            response = None
            try:
                response = self.model.generate_content(
                    prompt,
                    generation_config=types.GenerateContentConfig(
                        max_output_tokens=2048,
                        response_mime_type="application/json"
                    )
                )
            except Exception as api_error:
                error_msg = f"❌ Gemini API Error: {str(api_error)}"
                logger.error(error_msg)
                return error_msg, None

            c = response.candidates[0]
            parts = c.content.parts if c.content else []
            if not parts:
                raise RuntimeError(f"No parts. finish_reason={c.finish_reason}")
            # Expecting a single JSON part
            assistant_message = None
            resume_data = None
            for part in parts:
                if isinstance(part, dict):
                    resume_data = part
                    assistant_message = json.dumps(part, indent=2)
                elif isinstance(part, str):
                    assistant_message = part
                    try:
                        resume_data = json.loads(part)
                    except Exception:
                        resume_data = None
            logger.info(f"✅ Received response with {len(parts)} parts")

            # If assistant_message is still None, fallback to empty string
            if assistant_message is None:
                assistant_message = ""

            logger.info(f"📨 Returning to client: message={len(assistant_message)} chars, has_json={resume_data is not None}")
            return assistant_message, resume_data
        except Exception as e:
            error_msg = f"❌ Error communicating with Gemini: {str(e)}"
            logger.error(error_msg)
            import traceback
            traceback.print_exc()
            return error_msg, None

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
6. Sweet & Attractive Chat Flow 



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

."""

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

    def send_message(self, history, user_message, role="general", facts_context=""):
        """
        Send message to Gemini with role-based system prompt for resume building.
        
        Args:
            history: List of previous conversation messages
            user_message: Current user message
            role: Role-based prompt ("general", "hr", "educator")
            facts_context: Pre-extracted facts to avoid repetitive questions
        
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

            # Build conversation context with system prompt and facts
            prompt = system_prompt
            if facts_context:
                prompt += f"\n\n---KNOWN FACTS---\n{facts_context}\n"
            prompt += "\n\n---CONVERSATION HISTORY---\n"
            for msg in history:
                prompt += f"{msg.get('role', 'user')}: {msg.get('content', '')}\n"
            prompt += f"\nuser: {user_message}\n"

            logger.info(f"📤 Sending resume builder message to Gemini (role={role})")
            logger.info(f"📝 Prompt length: {len(prompt)} chars")

            # Use generation_config dict instead of GenerateContentConfig to avoid API version issues
            response = None
            try:
                response = self.model.generate_content(
                    prompt,
                    generation_config={
                        'max_output_tokens': 2048,
                        'response_mime_type': 'application/json'
                    }
                )
            except Exception as api_error:
                error_msg = f"❌ Gemini API Error: {str(api_error)}"
                logger.error(error_msg)
                return error_msg, None

            # Safe response parsing
            if not response or not response.candidates:
                logger.warning("⚠️ No candidates in Gemini response")
                return "No response from Gemini", None
            
            c = response.candidates[0]
            parts = c.content.parts if c.content else []
            if not parts:
                error_msg = f"❌ No parts in response. finish_reason={c.finish_reason}"
                logger.error(error_msg)
                return error_msg, None
            
            # Extract text and JSON from response
            assistant_message = None
            resume_data = None
            
            for part in parts:
                if hasattr(part, 'text'):
                    assistant_message = part.text
                    try:
                        resume_data = json.loads(part.text)
                    except Exception:
                        # Try extracting JSON from markdown code blocks
                        json_match = re.search(r"```json\n?([\s\S]*?)```", part.text)
                        if json_match:
                            try:
                                resume_data = json.loads(json_match.group(1))
                            except Exception:
                                pass
                elif isinstance(part, dict):
                    resume_data = part
                    assistant_message = json.dumps(part, indent=2)
                elif isinstance(part, str):
                    assistant_message = part
                    try:
                        resume_data = json.loads(part)
                    except Exception:
                        pass
            
            if assistant_message is None:
                assistant_message = ""
            
            logger.info(f"✅ Received response: {len(assistant_message)} chars, has_json={resume_data is not None}")
            return assistant_message, resume_data
            
        except Exception as e:
            error_msg = f"❌ Error communicating with Gemini: {str(e)}"
            logger.error(error_msg)
            import traceback
            traceback.print_exc()
            return error_msg, None
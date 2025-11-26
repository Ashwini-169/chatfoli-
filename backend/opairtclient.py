from openai import OpenAI
import os
import logging
import json
import re
from typing import List, Optional, Tuple, Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")


class OpenAIRTClient:
    """
    Wrapper for OpenAI/OpenRouter API for chat completions.

    Features:
    - Supports extra headers/body for OpenRouter
    - Safely extracts JSON responses when available (code block or raw JSON)
    - Falls back to plain text when structured JSON is not present
    - Accepts max_output_tokens and response_mime_type hints
    """

    def __init__(self, api_key: str = None, base_url: str = None):
        self.api_key = api_key or OPENROUTER_API_KEY
        self.base_url = base_url or OPENROUTER_BASE_URL
        if not self.api_key:
            logger.warning("⚠️ OPENROUTER_API_KEY not set - AI features will be limited")
        self.client = OpenAI(base_url=self.base_url, api_key=self.api_key)

    def send_message(
        self,
        messages: List[Dict[str, Any]],
        model: str = "openai/gpt-oss-20b:free",
        site_url: Optional[str] = None,
        site_title: Optional[str] = None,
        provider_sort: str = "price",
        max_output_tokens: int = 2048,
        response_mime_type: str = "application/json",
    ) -> Tuple[Optional[str], Optional[dict]]:
        """
        Send a chat completion request to OpenRouter API and return (assistant_message, structured_json_or_none).

        Returns:
            (assistant_message, resume_data)
        """
        SYSTEM_PROMPT = """You are a resume-builder AI assistant.


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

."""

        # Prepend system message if not already present
        messages_with_system = [{"role": "system", "content": SYSTEM_PROMPT}] + messages

        extra_headers = {}
        if site_url:
            extra_headers["HTTP-Referer"] = site_url
        if site_title:
            extra_headers["X-Title"] = site_title

        extra_body = {"provider": {"sort": provider_sort}}
# the prompt 
        # Try to pass token limit where supported
        request_kwargs: Dict[str, Any] = {
            "extra_headers": extra_headers,
            "extra_body": extra_body,
            "model": model,
            "messages": messages_with_system,
            # pass max_tokens as a best-effort hint to the router
            "max_tokens": max_output_tokens,
        }

        try:
            completion = self.client.chat.completions.create(**request_kwargs)
        except Exception as e:
            logger.error(f"❌ OpenRouter API Error: {e}")
            return None, None

        # Robust extraction logic: handle different response shapes
        assistant_text: Optional[str] = None
        structured_json: Optional[dict] = None

        # 1) Standard choices -> message.content
        try:
            if hasattr(completion, "choices") and completion.choices:
                # Try common access patterns
                first = completion.choices[0]
                # Some SDKs: first.message.content
                content = None
                try:
                    content = first.message.content
                except Exception:
                    try:
                        content = first.text
                    except Exception:
                        content = None

                if content is not None:
                    assistant_text = content
                    # Try to parse JSON directly
                    try:
                        structured_json = json.loads(content)
                    except Exception:
                        # Try to extract ```json blocks
                        m = re.search(r"```json\n?([\s\S]*?)```", content)
                        if m:
                            try:
                                structured_json = json.loads(m.group(1))
                            except Exception:
                                structured_json = None

        except Exception:
            pass

        # 2) Fallback: look for candidates with content.parts (router-style)
        if not assistant_text:
            try:
                if hasattr(completion, "candidates") and completion.candidates:
                    c = completion.candidates[0]
                    parts = c.content.parts if getattr(c, "content", None) else []
                    if not parts:
                        logger.warning(f"No parts found in candidate. finish_reason={getattr(c, 'finish_reason', None)}")
                    else:
                        # parts may be strings or dicts
                        for part in parts:
                            if isinstance(part, dict):
                                structured_json = part
                                assistant_text = json.dumps(part)
                                break
                            elif isinstance(part, str):
                                assistant_text = part
                                try:
                                    structured_json = json.loads(part)
                                    break
                                except Exception:
                                    # try to find json block inside
                                    m = re.search(r"```json\n?([\s\S]*?)```", part)
                                    if m:
                                        try:
                                            structured_json = json.loads(m.group(1))
                                            break
                                        except Exception:
                                            continue
            except Exception:
                pass

        # 3) Clean assistant_text (remove json code blocks for UI)
        clean_text = assistant_text or ""
        if clean_text:
            clean_text = re.sub(r"```json[\s\S]*?```", "", clean_text).strip()

        logger.info(f"✅ OpenRouter response received. has_json={structured_json is not None}")
        return clean_text, structured_json


if __name__ == "__main__":
    # Example usage
    client = OpenAIRTClient()
    messages = [
        {"role": "user", "content": "What is the meaning of life?"}
    ]
    text, data = client.send_message(messages)
    print("Assistant text:\n", text)
    print("Structured JSON:\n", json.dumps(data, indent=2))

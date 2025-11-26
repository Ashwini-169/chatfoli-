from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from gemini_client import GeminiClient
from opairtclient import OpenAIRTClient
from models import ChatRequest, ChatResponse
from fact_extractor import pre_extract_facts, build_facts_context
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI()
app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

gemini_api_key = os.getenv("GEMINI_API_KEY")
print(f"🔑 Gemini API Key loaded: {gemini_api_key[:10] if gemini_api_key else 'NOT FOUND'}...")
gemini_client = GeminiClient(gemini_api_key)

openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
print(f"🔑 OpenRouter API Key loaded: {openrouter_api_key[:10] if openrouter_api_key else 'NOT FOUND'}...")
openai_rt_client = OpenAIRTClient(openrouter_api_key)

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: Request):
  try:
    data = await request.json()
    chat_req = ChatRequest(**data)
    
    # Convert Pydantic models to dicts for GeminiClient
    history_dicts = [{"role": msg.role, "content": msg.content} for msg in chat_req.conversationHistory]
    
    # Pre-extract facts from history to avoid repeat questions
    facts = pre_extract_facts(history_dicts + [{"role": "user", "content": chat_req.userMessage}])
    facts_context = build_facts_context(facts)
    
    assistant_message, resume_data = gemini_client.send_message(
      history_dicts, chat_req.userMessage, chat_req.role, facts_context
    )
    return ChatResponse(assistantMessage=assistant_message, resumeData=resume_data)
  except Exception as e:
    import traceback
    traceback.print_exc()
    return ChatResponse(assistantMessage=f"Error: {str(e)}", resumeData=None)
@app.post("/api/chatnormal")
async def chatnormal_endpoint(request: Request):
    """
    Simple chat endpoint: returns only plain text AI response (no resume JSON extraction).
    Request body: {"conversationHistory": [...], "userMessage": "..."}
    """
    try:
        data = await request.json()
        history = data.get("conversationHistory", [])
        user_message = data.get("userMessage", "")
        # Build conversation string for Gemini prompt
        conversation = ""
        for msg in history:
            conversation += f"{msg['role']}: {msg['content']}\n"
        conversation += f"user: {user_message}\n"
        # Use GeminiClient for plain chat
        assistant_message, _ = gemini_client.send_message([], conversation, role="general")
        return JSONResponse(content={"assistantMessage": assistant_message})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(content={"assistantMessage": f"Error: {str(e)}"})

@app.get("/")
def test_page():
    html = """
    <!DOCTYPE html>
    <html>
    <head><title>ChatFolio Chat Test</title></head>
    <body>
      <h2>Resume AI Chat Test</h2>
      <div id=\"chat\"></div>
      <input id=\"msg\" type=\"text\" placeholder=\"Type your message...\" />
      <button onclick=\"sendMsg()\">Send</button>
      <script>
        let history = [];
        function sendMsg() {
          const msg = document.getElementById('msg').value;
          history.push({role: 'user', content: msg});
          fetch('/api/chat', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({conversationHistory: history, userMessage: msg})
          })
          .then(r => r.json())
          .then(data => {
            history.push({role: 'assistant', content: data.assistantMessage});
            document.getElementById('chat').innerHTML += '<div><b>You:</b> ' + msg + '</div>';
            document.getElementById('chat').innerHTML += '<div><b>AI:</b> ' + data.assistantMessage + '</div>';
            document.getElementById('msg').value = '';
          });
        }
      </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html)

@app.get("/test_opair_chat.html")
def test_opair_page():
    """Serve the OpenRouter test chat interface"""
    try:
        with open("test_opair_chat.html", "r") as f:
            html_content = f.read()
        return HTMLResponse(content=html_content)
    except FileNotFoundError:
        return HTMLResponse(content="<h1>test_opair_chat.html not found</h1>", status_code=404)

@app.post("/api/openrouter")
async def openrouter_endpoint(request: Request):
    """
    OpenRouter chat endpoint: routes messages to OpenAI/OpenRouter API.
    Request: { "messages": [...], "model": "...", "site_url": "...", "site_title": "..." }
    Response: { "assistantMessage": "...", "resumeData": {...} }
    """
    try:
        data = await request.json()
        messages = data.get("messages", [])
        model = data.get("model", "openai/gpt-oss-20b:free")
        site_url = data.get("site_url")
        site_title = data.get("site_title")
        
        # Call OpenRouter client
        assistant_text, structured_json = openai_rt_client.send_message(
            messages=messages,
            model=model,
            site_url=site_url,
            site_title=site_title,
            max_output_tokens=2048
        )
        
        return JSONResponse(content={
            "assistantMessage": assistant_text or "",
            "resumeData": structured_json
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"assistantMessage": f"Error: {str(e)}", "resumeData": None}
        )

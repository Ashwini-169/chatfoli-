'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from 'lib/redux/hooks';
import {
  changeProfile,
  changeWorkExperiences,
  changeEducations,
  changeProjects,
  changeSkills,
  changeCustom,
  selectResume,
  setResume,
  initialResumeState,
} from 'lib/redux/resumeSlice';
import type { 
  ResumeProfile, 
  ResumeWorkExperience, 
  ResumeEducation, 
  ResumeProject 
} from 'lib/redux/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ResumeData {
  extractedData?: {
    section: 'profile' | 'workExperience' | 'educations' | 'skills' | 'projects';
    fields: Record<string, any>;
  };
  nextQuestion?: string;
}

interface ChatResponse {
  assistantMessage: string;
  resumeData?: ResumeData;
}

type ChatRole = 'general' | 'hr' | 'educator';
type ViewMode = 'chat' | 'builder';

interface AIChatboxProps {
  viewMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

// Prefer env var; otherwise default to local backend. Avoid chaining literal strings with ||,
// since non-empty strings are always truthy and would mask later options.
const BACKEND_URL = (process.env.NEXT_PUBLIC_GEMINI_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');

// persistence keys
const CHAT_LS_KEY = 'chatfolio-ai-chat-v1';

// Available AI models
const AI_MODELS = [
  { value: 'gemini-pro', label: 'Gemini Pro (Google)' },
  { value: 'gemini-ultra', label: 'Gemini Ultra (Google)' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (OpenRouter)' },
  { value: 'openai/gpt-4o', label: 'GPT-4o (OpenRouter)' },
  { value: 'openai/gpt-oss-20b:free', label: 'GPT-OSS 20B (Free)' },
];

// helper: download JSON
function downloadJSON(filename: string, data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const AIChatbox = ({ viewMode, onModeChange }: AIChatboxProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ChatRole>('general');
  const [error, setError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const resume = useAppSelector(selectResume);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (viewMode === 'chat' && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: "👋 Hi! I'm your AI resume assistant. Select a mode above and let's build your resume together!"
        }
      ]);
    }
  }, [viewMode]);

  const parseAIResponse = (aiResponse: string): { message: string; extractedData?: any } => {
    console.log('🔍 [AIChatbox] Raw AI Response:', aiResponse, 'Type:', typeof aiResponse);
    
    try {
      // Your backend returns JSON format like: 
      // {"extractedData": {"section": "profile", "fields": {"name": "John"}}, "nextQuestion": "..."}
      const parsed = JSON.parse(aiResponse);
      console.log('✅ [AIChatbox] Parsed successfully:', parsed);
      
      if (parsed.extractedData && parsed.nextQuestion) {
        console.log('📝 [AIChatbox] Extracting nextQuestion:', parsed.nextQuestion);
        return {
          message: parsed.nextQuestion,
          extractedData: parsed.extractedData
        };
      }
      
      // Fallback to treating as plain message
      console.log('⚠️ [AIChatbox] No extractedData/nextQuestion found, using raw');
      return { message: aiResponse };
    } catch (error) {
      // If JSON parsing fails, treat as plain text
      console.log('❌ [AIChatbox] JSON parse failed, using as plain text');
      return { message: aiResponse };
    }
  };

  const extractAndDispatchData = (extractedData: any) => {
    if (!extractedData || !extractedData.section) return;

    const { section, fields } = extractedData;
    console.log('Extracting data for section:', section, 'fields:', fields);

    try {
      switch (section) {
        case 'profile':
          Object.entries(fields).forEach(([field, value]) => {
            if (value && typeof value === 'string') {
              // Map backend field names to correct Redux field names
              const fieldMapping: Record<string, keyof ResumeProfile> = {
                'name': 'name',
                'email': 'email', 
                'phone': 'phone',
                'location': 'location',
                'summary': 'summary'
              };
              const reduxField = fieldMapping[field];
              if (reduxField) {
                dispatch(changeProfile({ field: reduxField, value }));
              }
            }
          });
          break;

        case 'workExperience':
          if (Object.keys(fields).length > 0) {
            const idx = 0; // Always use first entry
            Object.entries(fields).forEach(([field, value]) => {
              if (value && typeof value === 'string') {
                // Map backend field names to correct Redux field names
                const fieldMapping: Record<string, keyof ResumeWorkExperience> = {
                  'company': 'company',
                  'position': 'jobTitle',
                  'jobTitle': 'jobTitle',
                  'date': 'date',
                  'description': 'descriptions'
                };
                const reduxField = fieldMapping[field];
                if (reduxField) {
                  if (reduxField === 'descriptions') {
                    // Handle descriptions as array
                    dispatch(changeWorkExperiences({ idx, field: reduxField, value: [value] }));
                  } else {
                    dispatch(changeWorkExperiences({ idx, field: reduxField, value }));
                  }
                }
              }
            });
          }
          break;

        case 'educations':
          if (Object.keys(fields).length > 0) {
            const idx = 0; // Always use first entry
            Object.entries(fields).forEach(([field, value]) => {
              if (value && typeof value === 'string') {
                // Map backend field names to correct Redux field names
                if (field === 'school') {
                  dispatch(changeEducations({ idx, field: 'school', value }));
                } else if (field === 'degree') {
                  dispatch(changeEducations({ idx, field: 'degree', value }));
                } else if (field === 'year' || field === 'date') {
                  dispatch(changeEducations({ idx, field: 'date', value }));
                } else if (field === 'gpa') {
                  dispatch(changeEducations({ idx, field: 'gpa', value }));
                }
              }
            });
          }
          break;

        case 'skills':
          if (fields.technical && Array.isArray(fields.technical)) {
            // Handle technical skills by adding to featuredSkills
            fields.technical.forEach((skill: string, idx: number) => {
              dispatch(changeSkills({ 
                field: 'featuredSkills',
                idx, 
                skill,
                rating: 4 // Default rating
              }));
            });
          }
          if (fields.soft && Array.isArray(fields.soft)) {
            // Add soft skills to descriptions
            const softSkillsText = `Soft Skills: ${fields.soft.join(', ')}`;
            dispatch(changeSkills({ 
              field: 'descriptions', 
              value: [softSkillsText] 
            }));
          }
          break;

        case 'projects':
          if (Object.keys(fields).length > 0) {
            const idx = 0; // Always use first entry
            Object.entries(fields).forEach(([field, value]) => {
              if (value && typeof value === 'string') {
                // Map backend field names to correct Redux field names
                const fieldMapping: Record<string, keyof ResumeProject> = {
                  'name': 'project',
                  'project': 'project',
                  'date': 'date',
                  'description': 'descriptions'
                };
                const reduxField = fieldMapping[field];
                if (reduxField) {
                  if (reduxField === 'descriptions') {
                    // Handle descriptions as array
                    dispatch(changeProjects({ idx, field: reduxField, value: [value] }));
                  } else {
                    dispatch(changeProjects({ idx, field: reduxField, value }));
                  }
                }
              }
            });
          }
          break;

        case 'custom':
          // Handle custom fields (certifications, languages, hobbies)
          Object.entries(fields).forEach(([field, value]) => {
            if (value && Array.isArray(value)) {
              // Add to custom descriptions
              const customText = `${field.charAt(0).toUpperCase() + field.slice(1)}: ${value.join(', ')}`;
              // Get existing descriptions and add new one
              const existingDescriptions = resume.custom.descriptions || [];
              const newDescriptions = [...existingDescriptions, customText];
              dispatch(changeCustom({ field: 'descriptions', value: newDescriptions }));
            }
          });
          break;
      }
    } catch (err) {
      console.error('Error dispatching resume data:', err);
    }
  };

  const handleSendMessage = async (e: any) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    setError(null);

    // Add user message to UI
    const newMessages = [...messages, { role: 'user' as const, content: userInput }];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    const requestBody = {
      conversationHistory: newMessages,
      userMessage: userInput,
      role: selectedRole
    };
    console.log('📤 [AIChatbox] Sending to:', `${BACKEND_URL}/api/chat`);
    console.log('📤 [AIChatbox] Body:', JSON.stringify(requestBody, null, 2));

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        }
      );

      console.log('📥 [AIChatbox] Status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📥 [AIChatbox] Error response:', errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data: ChatResponse = await response.json();
      console.log('📥 [AIChatbox] Response data:', data);
      
      // Parse the AI response - your backend returns JSON format directly
      const { message, extractedData } = parseAIResponse(data.assistantMessage);

      // Add AI response to messages
      setMessages(prev => [...prev, { role: 'assistant', content: message }]);

      // Extract and dispatch resume data if available
      if (extractedData && extractedData.section && Object.keys(extractedData.fields || {}).length > 0) {
        extractAndDispatchData(extractedData);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ [AIChatbox] Chat error:', error);
      setError(errorMsg);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ Error: ${errorMsg}. Make sure the backend is running at ${BACKEND_URL}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Return the toggle button that switches between Chat and Builder modes
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => onModeChange(viewMode === 'chat' ? 'builder' : 'chat')}
        className="flex items-center gap-3 bg-card border border-border-color hover:shadow-lg px-3 py-2 rounded-full transition-shadow duration-150"
        title={viewMode === 'chat' ? 'Switch to Resume Builder' : 'Switch to AI Chat'}
        aria-label="Toggle Chat / Builder"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white text-lg shadow">
          {viewMode === 'chat' ? '📝' : '💬'}
        </span>
        <span className="hidden sm:inline text-sm font-medium text-primary-fg">{viewMode === 'chat' ? 'Resume Builder' : 'AI Chat'}</span>
      </button>
    </div>
  );
};

// New component for the actual chatbox content
export const AIChatboxContent = ({ selectedRole, setSelectedRole }: { 
  selectedRole: ChatRole; 
  setSelectedRole: (role: ChatRole) => void; 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-pro');
  const [useOpenRouter, setUseOpenRouter] = useState<boolean>(false);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const resume = useAppSelector(selectResume);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // load saved chat on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to load saved chat:', err);
    }
    // fallback: default welcome
    setMessages([
      {
        role: 'assistant',
        content: "👋 Hi! I'm your AI resume assistant. Select a model and let's build your resume together!"
      }
    ]);
  }, []);

  // persist chat to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_LS_KEY, JSON.stringify(messages));
    } catch (err) {
      console.warn('Failed to save chat to localStorage:', err);
    }
  }, [messages]);

  // auto-scroll on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  // Ensure the messages container gets a max-height based on viewport so
  // the chat will scroll when device height is constrained (mobile/short view).
  useEffect(() => {
    const updateMessagesMaxHeight = () => {
      const mc = messagesContainerRef.current;
      if (!mc || typeof window === 'undefined') return;

      try {
        // Compute available height: distance from top of messages container to bottom of viewport
        const rect = mc.getBoundingClientRect();
        const top = rect.top;

        // Try to determine footer/input height (form). Fall back to a sensible default.
        const containerRoot = mc.parentElement;
        const formEl = containerRoot?.querySelector('form');
        const formHeight = formEl ? (formEl as HTMLElement).getBoundingClientRect().height : 88;

        // Small buffer for paddings/margins
        const buffer = 20;

        const available = Math.max(120, window.innerHeight - top - formHeight - buffer);
        mc.style.maxHeight = `${available}px`;
      } catch (err) {
        // Don't throw — if measurement fails, leave default CSS behavior
        // eslint-disable-next-line no-console
        console.warn('Failed to update chat max-height:', err);
      }
    };

    // Run initially and on resize/orientation change
    updateMessagesMaxHeight();
    window.addEventListener('resize', updateMessagesMaxHeight);
    window.addEventListener('orientationchange', updateMessagesMaxHeight);

    return () => {
      window.removeEventListener('resize', updateMessagesMaxHeight);
      window.removeEventListener('orientationchange', updateMessagesMaxHeight);
    };
  }, []);

  // Auto-resize textarea when user types a long prompt
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    // reset height to allow shrink
    ta.style.height = 'auto';
    const maxHeight = 240; // px (approx 15rem)
    const newHeight = Math.min(ta.scrollHeight, maxHeight);
    ta.style.height = newHeight + 'px';
    ta.style.overflowY = ta.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [userInput, isLoading]);

  const parseAIResponse = (aiResponse: string): { message: string; extractedData?: any } => {
    console.log('🔍 [AIChatboxContent] Raw AI Response:', aiResponse, 'Type:', typeof aiResponse);
    
    try {
      // Your backend returns JSON format like: 
      // {"extractedData": {"section": "profile", "fields": {"name": "John"}}, "nextQuestion": "..."}
      const parsed = JSON.parse(aiResponse);
      console.log('✅ [AIChatboxContent] Parsed successfully:', parsed);
      
      if (parsed.extractedData && parsed.nextQuestion) {
        console.log('📝 [AIChatboxContent] Extracting nextQuestion:', parsed.nextQuestion);
        return {
          message: parsed.nextQuestion,
          extractedData: parsed.extractedData
        };
      }
      
      // Fallback to treating as plain message
      console.log('⚠️ [AIChatboxContent] No extractedData/nextQuestion found, using raw');
      return { message: aiResponse };
    } catch (error) {
      // If JSON parsing fails, treat as plain text
      console.log('❌ [AIChatboxContent] JSON parse failed, using as plain text');
      return { message: aiResponse };
    }
  };

  const extractAndDispatchData = (extractedData: any) => {
    if (!extractedData || !extractedData.section) return;

    const { section, fields } = extractedData;
    console.log('Extracting data for section:', section, 'fields:', fields);

    try {
      switch (section) {
        case 'profile':
          Object.entries(fields).forEach(([field, value]) => {
            if (value && typeof value === 'string') {
              // Map backend field names to correct Redux field names
              const fieldMapping: Record<string, keyof ResumeProfile> = {
                'name': 'name',
                'email': 'email', 
                'phone': 'phone',
                'location': 'location',
                'summary': 'summary'
              };
              const reduxField = fieldMapping[field];
              if (reduxField) {
                dispatch(changeProfile({ field: reduxField, value }));
              }
            }
          });
          break;

        case 'workExperience':
          if (Object.keys(fields).length > 0) {
            const idx = 0; // Always use first entry
            Object.entries(fields).forEach(([field, value]) => {
              if (value && typeof value === 'string') {
                // Map backend field names to correct Redux field names
                const fieldMapping: Record<string, keyof ResumeWorkExperience> = {
                  'company': 'company',
                  'position': 'jobTitle',
                  'jobTitle': 'jobTitle',
                  'date': 'date',
                  'description': 'descriptions'
                };
                const reduxField = fieldMapping[field];
                if (reduxField) {
                  if (reduxField === 'descriptions') {
                    // Handle descriptions as array
                    dispatch(changeWorkExperiences({ idx, field: reduxField, value: [value] }));
                  } else {
                    dispatch(changeWorkExperiences({ idx, field: reduxField, value }));
                  }
                }
              }
            });
          }
          break;

        case 'educations':
          if (Object.keys(fields).length > 0) {
            const idx = 0; // Always use first entry
            Object.entries(fields).forEach(([field, value]) => {
              if (value && typeof value === 'string') {
                // Map backend field names to correct Redux field names
                if (field === 'school') {
                  dispatch(changeEducations({ idx, field: 'school', value }));
                } else if (field === 'degree') {
                  dispatch(changeEducations({ idx, field: 'degree', value }));
                } else if (field === 'year' || field === 'date') {
                  dispatch(changeEducations({ idx, field: 'date', value }));
                } else if (field === 'gpa') {
                  dispatch(changeEducations({ idx, field: 'gpa', value }));
                }
              }
            });
          }
          break;

        case 'skills':
          if (fields.technical && Array.isArray(fields.technical)) {
            // Handle technical skills by adding to featuredSkills
            fields.technical.forEach((skill: string, idx: number) => {
              dispatch(changeSkills({ 
                field: 'featuredSkills',
                idx, 
                skill,
                rating: 4 // Default rating
              }));
            });
          }
          if (fields.soft && Array.isArray(fields.soft)) {
            // Add soft skills to descriptions
            const softSkillsText = `Soft Skills: ${fields.soft.join(', ')}`;
            dispatch(changeSkills({ 
              field: 'descriptions', 
              value: [softSkillsText] 
            }));
          }
          break;

        case 'projects':
          if (Object.keys(fields).length > 0) {
            const idx = 0; // Always use first entry
            Object.entries(fields).forEach(([field, value]) => {
              if (value && typeof value === 'string') {
                // Map backend field names to correct Redux field names
                const fieldMapping: Record<string, keyof ResumeProject> = {
                  'name': 'project',
                  'project': 'project',
                  'date': 'date',
                  'description': 'descriptions'
                };
                const reduxField = fieldMapping[field];
                if (reduxField) {
                  if (reduxField === 'descriptions') {
                    // Handle descriptions as array
                    dispatch(changeProjects({ idx, field: reduxField, value: [value] }));
                  } else {
                    dispatch(changeProjects({ idx, field: reduxField, value }));
                  }
                }
              }
            });
          }
          break;

        case 'custom':
          // Handle custom fields (certifications, languages, hobbies)
          Object.entries(fields).forEach(([field, value]) => {
            if (value && Array.isArray(value)) {
              // Add to custom descriptions
              const customText = `${field.charAt(0).toUpperCase() + field.slice(1)}: ${value.join(', ')}`;
              // Get existing descriptions and add new one
              const existingDescriptions = resume.custom.descriptions || [];
              const newDescriptions = [...existingDescriptions, customText];
              dispatch(changeCustom({ field: 'descriptions', value: newDescriptions }));
            }
          });
          break;
      }
    } catch (err) {
      console.error('Error dispatching resume data:', err);
    }
  };

  const handleSendMessage = async (e: any) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    setError(null);

    // Add user message to UI
    const newMessages = [...messages, { role: 'user' as const, content: userInput }];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    // Determine which endpoint to use based on model and OpenRouter toggle
    const isOpenRouterModel = selectedModel.startsWith('openai/') || useOpenRouter;
    const endpoint = isOpenRouterModel ? `/api/openrouter` : `/api/chat`;
    
    // Format request body based on endpoint
    let requestBody: any;
    if (isOpenRouterModel) {
      // OpenRouter endpoint expects: { messages, model, site_url, site_title }
      requestBody = {
        messages: newMessages,
        model: selectedModel,
        site_url: 'https://openresume.app',
        site_title: 'OpenResume - AI Resume Builder'
      };
    } else {
      // Gemini endpoint expects: { conversationHistory, userMessage, role, model, useOpenRouter }
      requestBody = {
        conversationHistory: newMessages,
        userMessage: userInput,
        role: selectedRole,
        model: selectedModel,
        useOpenRouter: useOpenRouter
      };
    }
    
    console.log('📤 [AIChatboxContent] Sending to:', `${BACKEND_URL}${endpoint}`);
    console.log('📤 [AIChatboxContent] Model:', selectedModel, 'IsOpenRouter:', isOpenRouterModel);
    console.log('📤 [AIChatboxContent] Body:', JSON.stringify(requestBody, null, 2));

    try {
      const response = await fetch(
        `${BACKEND_URL}${endpoint}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        }
      );

      console.log('📥 [AIChatboxContent] Status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📥 [AIChatboxContent] Error response:', errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data: ChatResponse = await response.json();
      console.log('📥 [AIChatboxContent] Response data:', data);
      
      // Prefer structured resumeData from backend when available (main.py returns `resumeData`)
      const resumePayload = (data as any).resumeData;
      let message = data.assistantMessage ?? "";
      let extractedData: any | undefined = undefined;

      if (resumePayload && resumePayload.extractedData) {
        // backend returned structured JSON already parsed
        extractedData = resumePayload.extractedData;
        // Use nextQuestion if backend provides it, otherwise fall back to assistantMessage
        message = resumePayload.nextQuestion || message;
        console.log('🔁 [AIChatboxContent] Using backend resumeData:', resumePayload);
      } else {
        // Fallback: try to parse assistantMessage text for JSON (existing logic)
        const parsed = parseAIResponse(data.assistantMessage);
  message = parsed.message;
  extractedData = parsed.extractedData;
  console.log('🔁 [AIChatbox] Fallback parsed from assistantMessage:', parsed);
}

// Add AI response to messages (show the bot's question or plain text)
setMessages(prev => [...prev, { role: 'assistant', content: message }]);

// Extract and dispatch resume data if available
if (extractedData && extractedData.section && Object.keys(extractedData.fields || {}).length > 0) {
  extractAndDispatchData(extractedData);
}

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ [AIChatboxContent] Chat error:', error);
      setError(errorMsg);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ Error: ${errorMsg}. Make sure the backend is running at ${BACKEND_URL}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-card rounded-lg shadow-2xl flex flex-col border border-border-color overflow-hidden">
      {/* Header */}
      <div className="p-3 flex flex-col gap-3 bg-card border-b border-border-color">
        {/* Title Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white">🤖</div>
            <div>
              <div className="text-sm font-semibold text-primary-fg">AI Resume Assistant</div>
              <div className="text-xs text-tertiary-fg">Ask the assistant to draft bullets, extract experience, or format your resume</div>
            </div>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="role-select" className="text-xs text-secondary-fg hidden sm:inline">Mode:</label>
            <select
              id="role-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as ChatRole)}
              className="hidden sm:inline-block w-auto p-1.5 border border-border-color rounded-md text-xs bg-input text-primary-fg"
              disabled={isLoading}
              aria-label="Conversation Mode"
            >
              <option value="general">General</option>
              <option value="hr">HR</option>
              <option value="educator">Educator</option>
            </select>
          </div>

          {/* Model Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="model-select" className="text-xs text-secondary-fg hidden sm:inline">Model:</label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="hidden sm:inline-block w-auto p-1.5 border border-border-color rounded-md text-xs bg-input text-primary-fg"
              disabled={isLoading}
              aria-label="AI Model"
            >
              {AI_MODELS.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>

          {/* OpenRouter Toggle */}
          <div className="flex items-center gap-2">
            <input
              id="openrouter-toggle"
              type="checkbox"
              checked={useOpenRouter}
              onChange={(e) => setUseOpenRouter(e.target.checked)}
              className="hidden sm:inline-block w-4 h-4 cursor-pointer"
              disabled={isLoading}
              aria-label="Use OpenRouter API"
            />
            <label htmlFor="openrouter-toggle" className="text-xs text-secondary-fg hidden sm:inline cursor-pointer">
              OpenRouter
            </label>
          </div>

          <div className="flex-1" />

          {/* Control Buttons */}
          <button
            onClick={() => {
              const filename = `chat-${new Date().toISOString().split('T')[0]}.json`;
              downloadJSON(filename, { messages, selectedModel, useOpenRouter, timestamp: new Date().toISOString() });
              alert('Chat saved!');
            }}
            className="hidden sm:inline-block px-2 py-1.5 text-xs bg-blue-500/10 text-blue-600 border border-blue-500/30 rounded-md hover:bg-blue-500/20 transition"
            disabled={isLoading || messages.length === 0}
            title="Save current chat to JSON file"
          >
            💾 Save
          </button>

          <button
            onClick={() => {
              if (window.confirm('Clear chat history? This cannot be undone.')) {
                setMessages([]);
                localStorage.removeItem(CHAT_LS_KEY);
              }
            }}
            className="hidden sm:inline-block px-2 py-1.5 text-xs bg-orange-500/10 text-orange-600 border border-orange-500/30 rounded-md hover:bg-orange-500/20 transition"
            disabled={isLoading || messages.length === 0}
            title="Clear current chat"
          >
            🗑️ Clear
          </button>

          <button
            onClick={() => {
              if (window.confirm('Clear ALL data including resume? This cannot be undone.')) {
                setMessages([]);
                localStorage.removeItem(CHAT_LS_KEY);
                // Reset Redux resume store to initial state (auto-persists to "chatfolio-state")
                dispatch(setResume(initialResumeState));
                alert('All data cleared!');
              }
            }}
            className="hidden sm:inline-block px-2 py-1.5 text-xs bg-red-500/10 text-red-600 border border-red-500/30 rounded-md hover:bg-red-500/20 transition"
            disabled={isLoading}
            title="Clear all chat and resume data"
          >
            ☢️ Clear All
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-card" ref={messagesContainerRef} aria-live="polite" aria-label="Chat messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="mr-3 hidden sm:block">
                <div className="h-8 w-8 rounded-full bg-tertiary-fg/10 flex items-center justify-center text-sm">A</div>
              </div>
            )}
            <div className={`max-w-[90%] sm:max-w-[78%] break-words whitespace-pre-wrap px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-gradient-to-br from-blue-500 to-violet-600 text-white rounded-2xl rounded-br-none' : 'bg-card text-primary-fg rounded-2xl border border-border-color'}`}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="ml-3 hidden sm:block">
                <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-sm">Y</div>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-card text-secondary-fg px-3 py-2 rounded-lg text-sm rounded-bl-none border border-border-color">
              ⏳ AI is thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-border-color bg-card flex items-center gap-2 flex-shrink-0">
        <textarea
          ref={textareaRef}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask the assistant to improve a bullet, extract experience, or suggest keywords..."
          disabled={isLoading}
          rows={2}
          className="flex-1 resize-none min-h-[56px] max-h-60 p-3 rounded-2xl border border-border-color bg-input text-primary-fg focus:outline-none focus:ring-1 focus:ring-blue-500 whitespace-pre-wrap overflow-auto"
        />
        <button
          type="submit"
          disabled={isLoading || !userInput.trim()}
          className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-150"
          aria-label="Send message"
        >
          ➤
        </button>
      </form>
    </div>
  );
};

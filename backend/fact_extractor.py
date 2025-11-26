import re
from typing import Dict, List, Any

# Regex patterns for common fields
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE_RE = re.compile(r"(?:\+?\d[\d\s\-\(\)]{6,}\d)")
NAME_RE = re.compile(r"(?:my name is|i am|i'm|call me)\s+([\w\s\-\.]+)", re.IGNORECASE)

def pre_extract_facts(history: List[Dict[str, Any]]) -> Dict[str, str]:
    """
    Extract high-confidence facts from conversation history.
    
    Args:
        history: List of message dicts with 'role' and 'content'
    
    Returns:
        Dict of extracted facts (name, email, phone, location, etc.)
    """
    facts = {}
    
    # Look through last 10 messages (most recent first)
    for msg in reversed(history[-10:]):
        if msg.get('role') == 'user':
            txt = msg.get('content', '')
            
            # Extract name
            if 'name' not in facts:
                # Try "my name is X" pattern
                m = NAME_RE.search(txt)
                if m:
                    facts['name'] = m.group(1).strip()
                else:
                    # Try simple capitalized words (2-4 words)
                    words = txt.split()
                    if 2 <= len(words) <= 4 and all(w[0].isupper() for w in words if w):
                        # Check if it looks like a name (all words capitalized, no special chars)
                        if all(w.replace('-', '').replace('.', '').isalpha() for w in words):
                            facts['name'] = ' '.join(words)
            
            # Extract email
            if 'email' not in facts:
                m = EMAIL_RE.search(txt)
                if m:
                    email = m.group(0)
                    # Basic validation: must have @ and domain
                    if '@' in email and '.' in email.split('@')[1]:
                        facts['email'] = email
            
            # Extract phone
            if 'phone' not in facts:
                m = PHONE_RE.search(txt)
                if m:
                    phone = re.sub(r"\D", "", m.group(0))
                    # Must be 10-15 digits
                    if 10 <= len(phone) <= 15:
                        facts['phone'] = phone
            
            # Extract location (city/state patterns)
            if 'location' not in facts:
                # Look for "from X", "in X", "located in X", "city: X"
                loc_pattern = re.search(
                    r"(?:from|in|located in|city:?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:,\s*[A-Z]{2})?)",
                    txt
                )
                if loc_pattern:
                    facts['location'] = loc_pattern.group(1).strip()
    
    return facts


def build_facts_context(facts: Dict[str, str]) -> str:
    """
    Build a context string from extracted facts.
    
    Args:
        facts: Dict of extracted facts
    
    Returns:
        Formatted string for inclusion in prompt
    """
    if not facts:
        return ""
    
    lines = ["---OBSERVED FACTS (already provided by user)---"]
    for key, value in facts.items():
        lines.append(f"{key}: {value}")
    lines.append("---\n")
    
    return "\n".join(lines)


def validate_email(email: str) -> bool:
    """Validate email format."""
    if not email:
        return False
    return bool(EMAIL_RE.fullmatch(email)) and '@' in email and '.' in email.split('@')[1]


def validate_phone(phone: str) -> bool:
    """Validate phone number format."""
    if not phone:
        return False
    digits = re.sub(r"\D", "", phone)
    return 10 <= len(digits) <= 15

import asyncio
import os
import random
from typing import Any, Dict, List, Optional
from uuid import uuid4

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

PROJECT_DESCRIPTION_FILE = os.path.join(os.path.dirname(__file__), 'project_description.txt')


def load_project_description() -> str:
    if not os.path.exists(PROJECT_DESCRIPTION_FILE):
        return ''

    try:
        with open(PROJECT_DESCRIPTION_FILE, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except Exception:
        return ''


PROJECT_DESCRIPTION = load_project_description()

SYSTEM_PROMPT = (
    "You are CivicPulse, the friendly citizen-facing assistant for a municipal issue reporting platform. "
    "Your job is to guide users through reporting local civic issues, finding duplicates, tracking report status, understanding trust score, and using the web app features. "
    "Refer to the app pages by name: Report Issue, My Issues, Nearby Issues, and Heatmap. "
    "Keep answers conversational, clear, and actionable. "
    "Do not mention the internal implementation, code, or server details. "
    "If the user asks for something outside the app, explain what the app can do and how they can use it. "
    "If the user asks about the project or app concepts, answer using the project description below and describe the app pages, features, workflows, and user experience clearly. "
    + (f"Project description:\n{PROJECT_DESCRIPTION}\n" if PROJECT_DESCRIPTION else "")
)

FALLBACK_PATTERNS = {
    'greeting': [
        'Hi there! I’m CivicPulse, your local issue report guide. How can I help you today?',
        'Hello! I’m here to help you report problems and track issues in your community.',
        'Hey! Need help with reporting an issue or checking your report status?'
    ],
    'thanks': [
        'You’re welcome! If you need more help, just ask.',
        'Glad I could help. I’m here whenever you want to report another issue.',
        'Anytime! Let me know if you have more questions about the process.'
    ],
    'bye': [
        'Goodbye! Keep an eye out for local issues and report anything that needs attention.',
        'See you soon. I’m here if you want to submit another report.',
        'Take care! I’ll be ready if you need help again.'
    ],
}

HELP_RESPONSE = (
    'I can help you submit a new report, check your issue status, avoid duplicate reports, and explain how trust scores work. '
    'Tell me what you need—for example: "How do I report a pothole?", "What is my trust score?" or "Show me critical issues."'
)


def is_match(message: str, patterns: List[str]) -> bool:
    return any(pattern in message for pattern in patterns)


def random_choice(patterns: List[str]) -> str:
    return random.choice(patterns)


def sanitize(text: str) -> str:
    return text.lower().strip()


SESSIONS: Dict[str, List[Dict[str, str]]] = {}
MAX_SESSION_MESSAGES = int(os.getenv('PYTHON_CHATBOT_MAX_CONTEXT', '8'))


def create_session() -> str:
    session_id = uuid4().hex
    SESSIONS[session_id] = []
    return session_id


def append_session_message(session_id: str, role: str, content: str) -> None:
    if session_id not in SESSIONS:
        SESSIONS[session_id] = []
    SESSIONS[session_id].append({'role': role, 'content': content})
    if len(SESSIONS[session_id]) > MAX_SESSION_MESSAGES * 2:
        SESSIONS[session_id] = SESSIONS[session_id][-MAX_SESSION_MESSAGES * 2:]


def get_session_context(session_id: Optional[str]) -> List[Dict[str, str]]:
    if not session_id or session_id not in SESSIONS:
        return []
    return SESSIONS[session_id]


def fallback_response(message: str, user_name: Optional[str] = None) -> str:
    clean = sanitize(message)
    if is_match(clean, ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening']):
        greeting = random_choice(FALLBACK_PATTERNS['greeting'])
        return f"{greeting} {user_name or ''}".strip()

    if is_match(clean, ['thanks', 'thank you', 'appreciate']):
        return random_choice(FALLBACK_PATTERNS['thanks'])

    if is_match(clean, ['bye', 'goodbye', 'see you', 'later']):
        return random_choice(FALLBACK_PATTERNS['bye'])

    if is_match(clean, ['help', 'problem', 'guide', 'how do i', 'how can i', 'what do i', 'what is', 'where can i', 'can i', 'why', 'who can']):
        return HELP_RESPONSE

    if is_match(clean, ['report', 'submit', 'create', 'pothole', 'leak', 'water', 'road', 'street', 'issue']):
        return (
            'To report an issue, go to the Report Issue page and fill in a clear title, description, category, severity, location, and photo evidence. '
            'Our system also checks for duplicates and calculates priority automatically.'
        )

    if is_match(clean, ['duplicate', 'existing', 'same issue']):
        return (
            'If you think the issue is already reported, check Nearby Issues first. If it matches, vote on the existing report instead of creating a duplicate. '
            'That helps the system focus on the most urgent problems.'
        )

    if is_match(clean, ['trust', 'score']):
        return (
            'Your trust score reflects how reliable your reports are. More verified reports raise it, while incorrect or manipulated reports lower it. '
            'A higher score helps your reports get more attention.'
        )

    if is_match(clean, ['priority', 'critical', 'urgent', 'important']):
        return (
            'I can tell you what kinds of issues are most urgent in the system. Ask me about priority areas, high-priority reports, or what problems are currently most critical.'
        )

    if is_match(clean, ['status', 'track', 'my issues']):
        returns = 'You can track your issues on the My Issues page. '
        returns += 'Each report moves from Reported to In Progress to Resolved. '
        returns += 'If you want, I can also explain how to understand each status.'
        return returns

    if is_match(clean, ['photo', 'image', 'evidence']):
        return (
            'Photos and evidence are important because they help verify an issue faster. '
            'Try to capture the location clearly and show the exact problem in the picture.'
        )

    return (
        f'I heard you ask: "{message.strip()}". {HELP_RESPONSE}'
    )


async def generate_openai_response(message: str, user_name: Optional[str], session_context: List[Dict[str, str]]) -> str:
    openai.api_key = os.getenv('OPENAI_API_KEY')
    model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
    user_profile = f"User name: {user_name}." if user_name else 'User name: unknown.'

    messages = [
        {'role': 'system', 'content': SYSTEM_PROMPT},
        {'role': 'system', 'content': user_profile},
    ]

    for item in session_context:
        messages.append({'role': item['role'], 'content': item['content']})

    messages.append({'role': 'user', 'content': message})

    completion = await asyncio.to_thread(
        openai.ChatCompletion.create,
        model=model,
        messages=messages,
        temperature=float(os.getenv('OPENAI_TEMPERATURE', '0.7')),
        max_tokens=int(os.getenv('OPENAI_MAX_TOKENS', '300')),
        user=user_name or 'citizen',
    )

    return completion.choices[0].message.content.strip()


async def generate_response(
    message: str,
    user_id: Optional[str] = None,
    user_name: Optional[str] = None,
    session_id: Optional[str] = None,
) -> tuple[str, str]:
    if not session_id:
        session_id = create_session()

    session_context = get_session_context(session_id)
    append_session_message(session_id, 'user', message)

    if OPENAI_AVAILABLE and os.getenv('OPENAI_API_KEY'):
        try:
            content = await generate_openai_response(message, user_name, session_context)
        except Exception:
            content = fallback_response(message, user_name)
    else:
        content = fallback_response(message, user_name)

    append_session_message(session_id, 'assistant', content)
    return content, session_id

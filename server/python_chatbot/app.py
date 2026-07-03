import os
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from chatbot import generate_response
from ai_detection import analyze_image_ai_detection

load_dotenv()

app = FastAPI(title='CivicPulse Python Chatbot')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

class ChatRequest(BaseModel):
    message: str
    userId: Optional[str] = None
    userName: Optional[str] = None
    sessionId: Optional[str] = None

class ChatResponse(BaseModel):
    content: str
    sessionId: str


class ImageAnalysisRequest(BaseModel):
    imageBase64: str


class ImageAnalysisResponse(BaseModel):
    isManipulated: bool
    isAIGenerated: bool
    manipulationType: str
    confidence: int
    artifacts: dict
    reasons: list
    recommendations: list
    analysisMethod: str
    metrics: dict


@app.get('/health')
async def health():
    return {'status': 'ok', 'service': 'CivicPulse Python Chatbot'}


@app.post('/chat/citizen', response_model=ChatResponse)
async def citizen_chat(request: ChatRequest):
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail='Message required')

    content, session_id = await generate_response(
        request.message,
        request.userId,
        request.userName,
        request.sessionId,
    )
    return {'content': content, 'sessionId': session_id}


@app.post('/ai/detect-image', response_model=ImageAnalysisResponse)
async def detect_ai_image(request: ImageAnalysisRequest):
    """Analyze image for AI generation and manipulation"""
    if not request.imageBase64:
        raise HTTPException(status_code=400, detail='imageBase64 required')
    
    try:
        result = analyze_image_ai_detection(request.imageBase64)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Analysis failed: {str(e)}')


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=int(os.getenv('PYTHON_CHATBOT_PORT', 8000)), reload=True)

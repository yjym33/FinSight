from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any
from app.services.agent_service import InvestmentAgent

router = APIRouter()
agent = InvestmentAgent()

class ChatRequest(BaseModel):
    message: str
    chat_history: Optional[List[Any]] = []
    context_news: Optional[List[dict]] = []

class ChatResponse(BaseModel):
    answer: str

@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest):
    try:
        # If news context is provided, ingest it into RAG
        if request.context_news:
            agent.ingest_news(request.context_news)
            
        answer = await agent.run(request.message, request.chat_history)
        return ChatResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ingest-news")
async def ingest_news(news: List[dict]):
    try:
        agent.ingest_news(news)
        return {"message": "Success", "count": len(news)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

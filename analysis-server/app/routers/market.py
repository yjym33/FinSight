from fastapi import APIRouter, Depends, HTTPException
from app.services.market_service import MarketService
from typing import List, Dict, Any

router = APIRouter()
market_service = MarketService()

@router.get("/briefing")
async def get_market_briefing():
    return {"briefing": await market_service.get_market_briefing()}

@router.get("/themes")
async def get_theme_clustering():
    themes = market_service.get_theme_clustering()
    if not themes:
        return []
    return themes

from fastapi import APIRouter
from typing import List
from app.schemas.analysis import TradeData, TradesAnalysisResponse
from app.services.analyzer import AnalyzerService

router = APIRouter()
analyzer = AnalyzerService()


@router.post("/trades", response_model=TradesAnalysisResponse)
async def analyze_trades(trades: List[TradeData]):
    """
    Analyze trading history and provide insights.

    - Win Rate: Percentage of profitable trades
    - Average Return: Mean return per trade
    - Risk Reward Ratio: Average profit / average loss
    - Common Patterns: Identified trading patterns
    """
    result = analyzer.analyze_trades(trades)
    return result

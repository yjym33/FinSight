from fastapi import APIRouter
from app.schemas.analysis import StrategyRequest, StrategyResponse
from app.services.analyzer import AnalyzerService

router = APIRouter()
analyzer = AnalyzerService()


@router.post("/strategy", response_model=StrategyResponse)
async def analyze_strategy(request: StrategyRequest):
    """
    Analyze investment strategy and return performance metrics.

    - CAGR: Compound Annual Growth Rate
    - MDD: Maximum Drawdown
    - Sharpe Ratio: Risk-adjusted return
    - Volatility: Standard deviation of returns
    """
    result = analyzer.analyze_strategy(
        stock_code=request.stock_code,
        strategy_type=request.strategy_type,
        start_date=request.start_date,
        end_date=request.end_date,
    )
    return result

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date


class StrategyRequest(BaseModel):
    stock_code: str
    strategy_type: str
    start_date: str
    end_date: str


class StrategyResponse(BaseModel):
    cagr: float
    mdd: float
    sharpe_ratio: float
    volatility: float


class ProfileRequest(BaseModel):
    survey_data: Dict[str, Any]


class ProfileResponse(BaseModel):
    risk_score: float
    loss_aversion_index: float
    investment_type: str


class TradeData(BaseModel):
    stock_code: str
    stock_name: str
    buy_price: float
    sell_price: Optional[float] = None
    quantity: int
    buy_date: str
    sell_date: Optional[str] = None
    buy_reason: Optional[str] = None
    sell_reason: Optional[str] = None


class TradesAnalysisResponse(BaseModel):
    win_rate: float
    average_return: float
    risk_reward_ratio: float
    total_trades: int
    profitable_trades: int
    common_patterns: List[str]
    recommendations: List[str]

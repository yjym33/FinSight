import random
from typing import List, Dict, Any
from app.schemas.analysis import (
    StrategyResponse,
    ProfileResponse,
    TradesAnalysisResponse,
    TradeData,
)


class AnalyzerService:
    """
    Mock analyzer service for investment analysis.
    Replace with actual ML models and calculations in production.
    """

    def analyze_strategy(
        self,
        stock_code: str,
        strategy_type: str,
        start_date: str,
        end_date: str,
    ) -> StrategyResponse:
        """
        Analyze investment strategy performance.
        This is a mock implementation - replace with actual backtesting logic.
        """
        # Mock calculation based on strategy type
        base_cagr = {
            "momentum": 0.15,
            "value": 0.12,
            "growth": 0.18,
            "dividend": 0.08,
            "index": 0.10,
        }.get(strategy_type.lower(), 0.10)

        # Add some randomness for mock data
        cagr = base_cagr + random.uniform(-0.05, 0.05)
        mdd = random.uniform(-0.30, -0.05)
        sharpe_ratio = random.uniform(0.5, 2.5)
        volatility = random.uniform(0.10, 0.35)

        return StrategyResponse(
            cagr=round(cagr, 4),
            mdd=round(mdd, 4),
            sharpe_ratio=round(sharpe_ratio, 4),
            volatility=round(volatility, 4),
        )

    def analyze_profile(self, survey_data: Dict[str, Any]) -> ProfileResponse:
        """
        Analyze investment profile based on survey responses.
        This is a mock implementation - replace with actual analysis logic.
        """
        # Calculate mock scores based on survey data
        risk_score = random.uniform(30, 80)
        loss_aversion = random.uniform(2, 8)

        # Determine investment type based on risk score
        if risk_score < 40:
            investment_type = "conservative"
        elif risk_score < 60:
            investment_type = "moderate"
        else:
            investment_type = "aggressive"

        return ProfileResponse(
            risk_score=round(risk_score, 2),
            loss_aversion_index=round(loss_aversion, 2),
            investment_type=investment_type,
        )

    def analyze_trades(self, trades: List[TradeData]) -> TradesAnalysisResponse:
        """
        Analyze trading history and provide insights.
        This is a mock implementation - replace with actual analysis logic.
        """
        total_trades = len(trades)

        if total_trades == 0:
            return TradesAnalysisResponse(
                win_rate=0.0,
                average_return=0.0,
                risk_reward_ratio=0.0,
                total_trades=0,
                profitable_trades=0,
                common_patterns=[],
                recommendations=["Start tracking your trades to get analysis."],
            )

        # Mock calculations
        completed_trades = [t for t in trades if t.sell_price is not None]

        if not completed_trades:
            profitable_trades = 0
            win_rate = 0.0
            average_return = 0.0
        else:
            profitable_trades = sum(
                1 for t in completed_trades if t.sell_price > t.buy_price
            )
            win_rate = (profitable_trades / len(completed_trades)) * 100

            returns = [
                ((t.sell_price - t.buy_price) / t.buy_price) * 100
                for t in completed_trades
            ]
            average_return = sum(returns) / len(returns) if returns else 0.0

        # Mock risk-reward ratio
        risk_reward_ratio = random.uniform(1.0, 3.0)

        # Mock patterns and recommendations
        patterns = [
            "Momentum buying tendency",
            "Short-term holding pattern",
            "Sector concentration",
        ]

        recommendations = [
            "Consider diversifying across sectors",
            "Review position sizing strategy",
            "Set clearer exit criteria",
        ]

        return TradesAnalysisResponse(
            win_rate=round(win_rate, 2),
            average_return=round(average_return, 2),
            risk_reward_ratio=round(risk_reward_ratio, 2),
            total_trades=total_trades,
            profitable_trades=profitable_trades,
            common_patterns=random.sample(patterns, min(2, len(patterns))),
            recommendations=random.sample(recommendations, min(2, len(recommendations))),
        )

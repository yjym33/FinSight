import pandas as pd
import numpy as np
import ta
from typing import Dict, Any, List

class TAService:
    """
    Service for calculating technical indicators.
    """
    
    @staticmethod
    def calculate_indicators(prices_df: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculates key technical indicators given a DataFrame with 'close', 'high', 'low' columns.
        """
        if prices_df.empty or len(prices_df) < 20:
            return {"error": "Not enough data for technical analysis"}
            
        # Ensure correct column names for 'ta' library
        # ta expects 'close', 'high', 'low', 'volume'
        
        # 1. Trend Indicators
        sma_20 = ta.trend.sma_indicator(prices_df['close'], window=20)
        sma_60 = ta.trend.sma_indicator(prices_df['close'], window=60)
        macd = ta.trend.macd_diff(prices_df['close'])
        
        # 2. Momentum Indicators
        rsi = ta.momentum.rsi(prices_df['close'], window=14)
        stoch = ta.momentum.stoch(prices_df['high'], prices_df['low'], prices_df['close'], window=14)
        
        # 3. Volatility Indicators
        bb_low = ta.volatility.bollinger_lband(prices_df['close'])
        bb_high = ta.volatility.bollinger_hband(prices_df['close'])
        
        last_idx = prices_df.index[-1]
        
        current_price = prices_df['close'].iloc[-1]
        last_rsi = rsi.iloc[-1]
        last_macd = macd.iloc[-1]
        last_stoch = stoch.iloc[-1]
        
        # Interpretations
        rsi_signal = "Overbought" if last_rsi > 70 else ("Oversold" if last_rsi < 30 else "Neutral")
        macd_signal = "Bullish" if last_macd > 0 else "Bearish"
        
        return {
            "current_price": float(current_price),
            "indicators": {
                "rsi": round(float(last_rsi), 2),
                "macd_diff": round(float(last_macd), 2),
                "stoch": round(float(last_stoch), 2),
                "sma_20": round(float(sma_20.iloc[-1]), 2),
                "sma_60": round(float(sma_60.iloc[-1]), 2),
            },
            "signals": {
                "rsi": rsi_signal,
                "macd": macd_signal,
                "trend": "Upward" if current_price > sma_20.iloc[-1] else "Downward"
            }
        }

    @staticmethod
    def prepare_df(price_history: List[Dict[str, Any]]) -> pd.DataFrame:
        """
        Converts raw price history list to a Pandas DataFrame.
        """
        df = pd.DataFrame(price_history)
        # Assuming history format from NestJS KIS service
        # Normalize keys if necessary
        return df

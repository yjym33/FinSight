import os
import requests
from typing import List, Dict, Any, Optional, cast
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

class MarketService:
    """
    Service for summarizing disclosures and generating market briefings.
    """
    
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0,
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        # Assuming backend is accessible. In a real environment, use an internal URL or a configured one.
        self.backend_url = os.getenv("BACKEND_URL", "http://localhost:3001")

    def summarize_disclosures(self, stock_code: str, stock_name: Optional[str] = None) -> str:
        """
        Summarizes the latest disclosures and earnings news for a specific stock.
        """
        try:
            # 1. Fetch news from backend that likely contains disclosures
            query = stock_name if stock_name else stock_code
            response = requests.get(f"{self.backend_url}/news", params={"q": f"{query} 공시"})
            news_data = response.json() if response.status_code == 200 else []
            
            if not news_data:
                # Try another keyword
                response = requests.get(f"{self.backend_url}/news", params={"q": f"{query} 실적"})
                news_data = response.json() if response.status_code == 200 else []
            
            # Ensure news_data is a list
            news: List[Dict[str, Any]] = cast(List[Dict[str, Any]], news_data) if isinstance(news_data, list) else []
            
            if not news:
                return f"{stock_code}에 대한 최근 공시나 실적 뉴스를 찾을 수 없습니다."

            # 2. Prepare summary prompt
            news_text = "\n".join([f"- {n.get('title', 'No Title')}: {n.get('summary', 'No Summary')}" for n in news[:5]])
            
            prompt = ChatPromptTemplate.from_template("""
다음은 {stock}에 대한 최근 공시 및 실적 관련 뉴스입니다.
주요 수치(매출, 영업이익 등)와 공시의 핵심 내용을 한 눈에 들어오게 요약해 주세요.

[관련 뉴스]
{news}

요약 결과:
""")
            
            chain = prompt | self.llm
            result = chain.invoke({"stock": stock_name or stock_code, "news": news_text})
            
            return str(result.content)
        except Exception as e:
            return f"공시 요약 중 오류가 발생했습니다: {str(e)}"

    def get_market_briefing(self) -> str:
        """
        Generates a summary of the current market situation.
        """
        try:
            # 1. Fetch latest general news
            response = requests.get(f"{self.backend_url}/news", params={"limit": 10})
            news_data = response.json() if response.status_code == 200 else []
            
            news: List[Dict[str, Any]] = cast(List[Dict[str, Any]], news_data) if isinstance(news_data, list) else []
            
            if not news:
                return "현재 시장 브리핑을 생성할 뉴스가 충분하지 않습니다."

            # 2. Generate briefing
            news_text = "\n".join([f"[{n.get('source', 'Unknown')}] {n.get('title', 'No Title')}" for n in news])
            
            prompt = ChatPromptTemplate.from_template("""
오늘의 주요 뉴스들입니다. 현재 시장의 전반적인 분위기와 투자자들이 주의 깊게 봐야 할 포인트 3가지를 '오늘의 투자 날씨' 브리핑 형식으로 작성해 주세요.

[최신 뉴스 목록]
{news}

브리핑:
""")
            
            chain = prompt | self.llm
            result = chain.invoke({"news": news_text})
            
            return str(result.content)
        except Exception as e:
            return f"시장 브리핑 생성 중 오류가 발생했습니다: {str(e)}"

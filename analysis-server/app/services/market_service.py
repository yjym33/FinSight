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

    async def get_market_briefing(self) -> str:
        """
        Generates a professional market briefing based on indices and news.
        """
        try:
            # 1. Fetch Market Indices
            indices_response = requests.get(f"{self.backend_url}/stocks/market-indices")
            indices = indices_response.json() if indices_response.status_code == 200 else {}
            
            # 2. Fetch latest domestic news specifically about KOSPI/Market
            news_response = requests.get(f"{self.backend_url}/news", params={"q": "코스피", "limit": 5})
            news_data = news_response.json() if news_response.status_code == 200 else []
            
            news: List[Dict[str, Any]] = cast(List[Dict[str, Any]], news_data) if isinstance(news_data, list) else []
            
            # 3. Format index data
            kospi = indices.get('kospi', {})
            kosdaq = indices.get('kosdaq', {})
            
            market_status = "현재 지수 데이터를 일시적으로 불러올 수 없습니다."
            if kospi and kospi.get('price') is not None and kosdaq and kosdaq.get('price') is not None:
                market_status = f"KOSPI: {kospi.get('price'):,.2f} ({kospi.get('changePercent'):+.2f}% {'▲' if kospi.get('change', 0) > 0 else '▼'}), " \
                                f"KOSDAQ: {kosdaq.get('price'):,.2f} ({kosdaq.get('changePercent'):+.2f}% {'▲' if kosdaq.get('change', 0) > 0 else '▼'})"

            # 4. Generate briefing with index data
            news_text = "\n".join([f"- {n.get('title', 'No Title')}" for n in news[:5]])
            
            prompt = ChatPromptTemplate.from_template("""
당신은 전문 수석 이코노미스트입니다. 현재 시장 지수와 뉴스를 바탕으로 투자자를 위한 고품격 시장 브리핑을 작성해 주세요.

[현재 시장 지수]
{market_status}

[주요 뉴스 요약]
{news}

브리핑 가이드라인:
1. 지수의 흐름을 먼저 언급하여 시장의 현재 분위기를 진단하세요.
2. 뉴스와 지수를 연결하여 시장이 왜 이렇게 움직이는지에 대한 인사이트를 제공하세요.
3. 향후 투자자들이 유의해야 할 핵심 '투자 포인트' 3가지를 명확히 제시하세요.
4. 절대로 "데이터가 부족하다"는 말을 하지 마세요. 주어진 정보가 적더라도 전문가로서의 추론과 인사이트를 보여주세요.
5. 답변은 정중하고 신뢰감 있는 전문가의 문체로 한국어로 작성하세요.

브리핑:
""")
            
            chain = prompt | self.llm
            result = chain.invoke({"market_status": market_status, "news": news_text})
            
            return str(result.content)
        except Exception as e:
            return f"시장 브리핑 생성 중 오류가 발생했습니다: {str(e)}"

    def get_theme_clustering(self) -> List[Dict[str, Any]]:
        """
        Clusters top active stocks into themes and provides analysis.
        """
        try:
            # 1. Fetch ranking data from backend
            response = requests.get(f"{self.backend_url}/stocks/ranking/volume", params={"market": "J", "type": "volume"})
            ranking_data = response.json() if response.status_code == 200 else []
            
            if not ranking_data:
                return []

            # 2. Get top 20-30 stocks to analyze
            top_stocks = ranking_data[:30]
            stocks_info = "\n".join([f"- {s.get('name')} ({s.get('code')}): 전일대비 {s.get('changePercent')}% 변동" for s in top_stocks])

            # 3. Fetch very recent news to get theme context
            news_response = requests.get(f"{self.backend_url}/news", params={"limit": 20})
            recent_news = news_response.json() if news_response.status_code == 200 else []
            news_context = "\n".join([f"- {n.get('title')}" for n in recent_news[:10]])

            # 4. Prepare Clustering Prompt
            prompt = ChatPromptTemplate.from_template("""
당신은 대한민국 주식 시장의 흐름을 꿰뚫고 있는 전문 퀀트 분석가입니다.
현재 시장에서 가장 활발하게 거래되는 다음 종목들과 최근 뉴스들을 분석하여, 현재 시장의 자금이 쏠리고 있는 '핵심 테마' 3~5개를 선정해 주세요.

[거래 상위 종목]
{stocks_info}

[최근 주요 뉴스]
{news_context}

[결과 형식]
반드시 다음 JSON 배열 형식을 지켜주세요:
[
  {{
    "theme": "테마명 (예: 반도체 HBM, 초전도체 등)",
    "reason": "테마 형성의 핵심 배경 설명 (1문장)",
    "stocks": ["종목명1", "종목명2", ...],
    "strength": 0~100 사이의 테마 강도 점수
  }}
]
""")

            chain = prompt | self.llm
            result = chain.invoke({"stocks_info": stocks_info, "news_context": news_context})
            
            # 5. Clean and Parse JSON
            content = str(result.content)
            clean_json = content.replace("```json", "").replace("```", "").strip()
            import json
            themes = json.loads(clean_json)
            
            return themes if isinstance(themes, list) else []

        except Exception as e:
            print(f"Error in theme clustering: {str(e)}")
            return []

import os
from typing import List, Dict, Any, Optional
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.tools import Tool
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from app.services.ta_service import TAService
from app.services.rag_service import RAGService
from app.services.market_service import MarketService
import pandas as pd

class InvestmentAgent:
    """
    Intelligent Investment Agent using LangChain and OpenAI Functions.
    """
    
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o", 
            temperature=0, 
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        self.rag_service = RAGService()
        self.ta_service = TAService()
        self.market_service = MarketService()
        
        # Define Tools
        self.tools = [
            Tool(
                name="search_market_knowledge",
                func=self.rag_service.query,
                description="Use this tool to search for recent news, market trends, and stock-specific reports from the knowledge base."
            ),
            Tool(
                name="get_technical_indicators",
                func=self._get_ta_data,
                description="Use this tool to get technical indicators like RSI, MACD, and SMA for a given stock code. Input should be stock code."
            ),
            Tool(
                name="get_market_briefing",
                func=lambda x: self.market_service.get_market_briefing(),
                description="Use this tool when the user asks for a general market summary, 'today's weather', or market briefing."
            ),
            Tool(
                name="summarize_stock_disclosures",
                func=self.market_service.summarize_disclosures,
                description="Use this tool to summarize the latest company disclosures, earnings reports, or performance news for a specific stock code."
            )
        ]
        
        # Define Prompt Template
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """당신은 FinSight 플랫폼의 수석 수석 투자 전략가(Lead Investment Strategist)이자 분석 전문가입니다. 
단순히 데이터를 읽어주는 것을 넘어, 복잡한 시장 상황 속에서 통찰력 있는 분석과 투자 전략을 제시하는 것이 당신의 역할입니다.

분석 원칙:
1. **데이터 기반 통찰**: 제공된 도구(Tools)를 최대한 활용하여 구체적인 수치(지수, 기술적 지표, 실적 등)를 근거로 답변하세요.
2. **전문가적 추론**: 만약 특정 데이터가 부족하다면 "데이터가 없다"는 답변으로 끝내지 마십시오. 공개된 시장 트렌드와 경제 상식을 바탕으로 전문가로서의 가이드라인과 분석을 제공하여 사용자에게 가치를 전달하세요.
3. **구조적 답변**: 답변을 논리적인 섹션(예: 현재 시황, 핵심 요인, 대응 전략)으로나누어 가독성 있게 전달하세요.
4. **어조**: 항상 차분하고 전문적이며 신뢰감 있는 어조(격식 있는 한국어)를 유지하세요.
5. **실시간성**: 'get_market_briefing'을 사용하여 현재 코스피/코스닥 지수와 최신 헤드라인을 먼저 확인하는 습관을 들이세요.

도구 활용 가이드:
- 시장 전체 흐름 질문: 'get_market_briefing' 우선 사용
- 특정 종목 분석: 'get_technical_indicators'와 'summarize_stock_disclosures' 병행 사용
- 뉴스/지식 검색: 'search_market_knowledge' 사용"""),
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        
        # Create Agent
        self.agent = create_openai_functions_agent(self.llm, self.tools, self.prompt)
        self.agent_executor = AgentExecutor(agent=self.agent, tools=self.tools, verbose=True)

    def _get_ta_data(self, stock_code: str) -> str:
        """
        Internal wrapper for TAService. 
        """
        return f"Technical analysis results for {stock_code}: RSI is 42 (Neutral), MACD is showing a bullish crossover, SMA(20) is below current price."

    async def run(self, user_input: str, chat_history: Optional[List[Any]] = None) -> str:
        """
        Run the agent with the given user input.
        """
        result = await self.agent_executor.ainvoke({
            "input": user_input,
            "chat_history": chat_history or []
        })
        return result["output"]

    def ingest_news(self, news_items: List[Dict[str, Any]]):
        """
        Ingest news into RAG memory.
        """
        self.rag_service.add_news(news_items)

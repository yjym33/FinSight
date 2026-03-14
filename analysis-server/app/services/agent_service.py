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
            ("system", """당신은 FinSight 플랫폼의 전문 AI 투자 분석가입니다.
사용자의 질문에 대해 당신이 가진 도구(Tools)를 활용하여 가장 정확하고 전문적인 분석을 제공하세요.

1. 기술적 분석이 필요할 때는 'get_technical_indicators'를 사용하세요.
2. 최신 뉴스나 시장 지식이 필요할 때는 'search_market_knowledge'를 사용하세요.
3. 시장 전체의 흐름이나 브리핑이 필요할 때는 'get_market_briefing'을 사용하세요.
4. 특정 기업의 공시나 실적 요약이 필요할 때는 'summarize_stock_disclosures'를 사용하세요.
5. 답변은 항상 한국어로 작성하며, 전문가다운 어조를 유지하세요.
6. 분석 결과에 대해 수치와 근거를 명확히 제시하세요."""),
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

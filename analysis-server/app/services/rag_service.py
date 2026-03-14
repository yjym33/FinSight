import os
from typing import List, Dict, Any
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.schema import Document
from dotenv import load_dotenv

load_dotenv()

class RAGService:
    """
    Retrieval-Augmented Generation Service for indexing and searching investment news/data.
    """
    
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(openai_api_key=os.getenv("OPENAI_API_KEY"))
        self.persist_directory = "./chroma_db"
        self.vector_store = Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings,
            collection_name="investment_news"
        )
        
    def add_news(self, news_items: List[Dict[str, Any]]):
        """
        In-memory indexing of news items.
        """
        documents = []
        for item in news_items:
            content = f"Title: {item.get('title')}\nSummary: {item.get('summary')}\nSource: {item.get('source')}\nStock: {item.get('stockCode', 'N/A')}"
            metadata = {
                "source": item.get('source'),
                "stock_code": item.get('stockCode'),
                "date": item.get('publishedAt')
            }
            documents.append(Document(page_content=content, metadata=metadata))
            
        self.vector_store.add_documents(documents)
        self.vector_store.persist()
        
    def query(self, text: str, k: int = 3, stock_code: str = None) -> List[str]:
        """
        Query the vector store for relevant context.
        """
        search_kwargs = {}
        if stock_code:
            search_kwargs["filter"] = {"stock_code": stock_code}
            
        results = self.vector_store.similarity_search(text, k=k, **search_kwargs)
        return [doc.page_content for doc in results]

    def clear(self):
        """
        Clear the collection.
        """
        self.vector_store.delete_collection()
        self.vector_store = Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings,
            collection_name="investment_news"
        )

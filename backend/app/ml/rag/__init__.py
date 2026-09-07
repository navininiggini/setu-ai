"""RAG (Retrieval-Augmented Generation) Real-World Grounding Module.

Provides external statutory, environmental, seasonal, and institutional context
outside the tabular machine learning models to prevent hard-negative false accusations
and ground audit intelligence in operational reality.
"""

from app.ml.rag.knowledge_base import RAGKnowledgeBase
from app.ml.rag.retriever import RAGRetriever

__all__ = ["RAGKnowledgeBase", "RAGRetriever"]

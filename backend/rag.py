from langchain_community.document_loaders import DirectoryLoader
from langchain_community.document_loaders import TextLoader
from langchain_community.document_loaders import PyPDFLoader
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_text_splitters import CharacterTextSplitter
import os
import yaml

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "configs", "rag_config.yaml")
with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    RAG_CONFIG = yaml.safe_load(f)

def setup_rag():
    rag_dir = os.path.join(os.path.dirname(__file__), "rag_docs")
    os.makedirs(rag_dir, exist_ok=True)

    # Load all .txt files from rag_docs/ with UTF-8 encoding
    txt_loader = DirectoryLoader(
        rag_dir,
        glob="*.txt",
        loader_cls=TextLoader,
        loader_kwargs={"encoding": "utf-8"}
    )
    documents = txt_loader.load()

    # Load PDFs if pypdf is available and any PDFs exist
    try:
        pdf_loader = DirectoryLoader(
            rag_dir,
            glob="*.pdf",
            loader_cls=PyPDFLoader
        )
        documents += pdf_loader.load()
    except Exception:
        pass  # pypdf not installed or no PDFs present — skip silently
    
    splitter_config = RAG_CONFIG.get("text_splitter", {})
    text_splitter = CharacterTextSplitter(
        chunk_size=splitter_config.get("chunk_size", 1000), 
        chunk_overlap=splitter_config.get("chunk_overlap", 0)
    )
    docs = text_splitter.split_documents(documents)

    api_key = os.getenv("GOOGLE_API_KEY", "mock_key")
    if api_key == "mock_key":
        print("WARNING: Using mock keys. RAG will not work.")
        return None
        
    embed_config = RAG_CONFIG.get("embeddings", {})
    embeddings = GoogleGenerativeAIEmbeddings(model=embed_config.get("model", "models/embedding-001"), google_api_key=api_key)
    
    chroma_config = RAG_CONFIG.get("chroma", {})
    vectorstore = Chroma.from_documents(docs, embeddings, persist_directory=chroma_config.get("persist_directory", "./chroma_db"))
    return vectorstore

def get_rag_retriever():
    vectorstore = setup_rag()
    if vectorstore:
        return vectorstore.as_retriever(search_type="similarity",search_kwargs={"k": 4})
    return None

if __name__ == "__main__":
    setup_rag()

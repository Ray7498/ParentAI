from langchain_community.document_loaders import TextLoader
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.text_splitter import CharacterTextSplitter
import os

def setup_rag():
    # Setup dummy document for RAG
    text = """
    School Guidelines for Parents
    1. Lunch Assistance: To apply for school lunch assistance, fill out form F-1A at the main office or on the parent portal before Sept 15.
    2. Grading System: A is 90-100, B is 80-89, C is 70-79. F is failing.
    3. Extracurriculars: Sign ups for soccer and debate club are during the second week of each semester via the 'Activities' tab on the portal.
    4. Teacher Meetings: To schedule a meeting with a teacher, you must log into the portal and select 'Schedule Meeting' under the student's profile at least 48 hours in advance.
    """
    
    with open("school_guidelines.txt", "w") as f:
        f.write(text)

    loader = TextLoader("school_guidelines.txt")
    documents = loader.load()
    text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
    docs = text_splitter.split_documents(documents)

    api_key = os.getenv("GOOGLE_API_KEY", "mock_key")
    if api_key == "mock_key":
        print("WARNING: Using mock keys. RAG will not work.")
        # Setup dummy embeddings if it crashes without API key
        return None
        
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=api_key)
    
    vectorstore = Chroma.from_documents(docs, embeddings, persist_directory="./chroma_db")
    return vectorstore

def get_rag_retriever():
    vectorstore = setup_rag()
    if vectorstore:
        return vectorstore.as_retriever()
    return None

if __name__ == "__main__":
    setup_rag()

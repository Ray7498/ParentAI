from langchain_community.document_loaders import TextLoader
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.text_splitter import CharacterTextSplitter
import os
import yaml

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "configs", "rag_config.yaml")
with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    RAG_CONFIG = yaml.safe_load(f)

def setup_rag():
    # Setup dummy document for RAG with real German schools
    text = """
    School Guidelines & Administration for Parents
    
    1. Goethe-Gymnasium (Berlin)
    - Administration Staff: Mr. Klaus Schmidt (Principal), Mrs. Heidi Müller (Secretary), Ms. Anna Fischer (Counselor).
    - Lunch Assistance: To apply for school lunch assistance, fill out form F-1A at the main office or on the Parent portal before Sept 15.
    - Extracurriculars: Soccer, Debate, Robotics.
    - Meetings: To schedule a meeting with a teacher, log into the portal and use the 'Schedule Meeting' tool. Meetings are typically 30 minutes long.
    
    2. Albert-Einstein-Schule (Munich)
    - Administration Staff: Dr. Hans Becker (Principal), Mr. Jonas Weber (Vice Principal), Mrs. Clara Hoffmann (Secretary).
    - Lunch Assistance: Apply via the AES online portal before Sept 1 for canteen subsidies.
    - Extracurriculars: Physics Club, Chess, Basketball.
    - Meetings: Appointments are available during teachers' designated office hours. Use the chatbot to find free slots.
    
    3. Schiller-Gymnasium (Hamburg)
    - Administration Staff: Mrs. Sabine Wagner (Principal), Mr. Lukas Meyer (Vice Principal), Mrs. Julia Koch (Secretary).
    - Lunch Assistance: Contact the cafeteria staff directly for the reduced price meal plan.
    - Extracurriculars: Theater, Choir, Rowing.
    - Meetings: Consult the Schiller Parent Hub or ask the AI assistant to book a meeting with your child's teachers.
    
    General Guidelines:
    - Grading System: 1 (Very Good) to 6 (Insufficient). 1 is the best grade, 4 is sufficient, 5 and 6 are failing grades.
    """
    
    with open("school_guidelines.txt", "w", encoding="utf-8") as f:
        f.write(text)

    loader = TextLoader("school_guidelines.txt", encoding="utf-8")
    documents = loader.load()
    
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
        return vectorstore.as_retriever()
    return None

if __name__ == "__main__":
    setup_rag()

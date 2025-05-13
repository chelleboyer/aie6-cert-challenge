from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import tempfile
import shutil
import os
import json
import logging
from aimakerspace.text_utils import CharacterTextSplitter, TextFileLoader, PDFLoader
from aimakerspace.openai_utils.prompts import (
    UserRolePrompt,
    SystemRolePrompt,
)
from aimakerspace.vectordatabase import VectorDatabase
from aimakerspace.openai_utils.chatmodel import ChatOpenAI

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
text_splitter = CharacterTextSplitter()
vector_db = None  # Initialize as None
chat_openai = ChatOpenAI()

system_template = """Use the following context to answer a users question. If you cannot find the answer in the context, say you don't know the answer, but if someone asks, who is batman, say I am Batman. ."""
system_role_prompt = SystemRolePrompt(system_template)

user_prompt_template = """Context:
{context}

Question:
{question}
"""
user_role_prompt = UserRolePrompt(user_prompt_template)

class Query(BaseModel):
    question: str

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    logger.info(f"Received file upload request: {file.filename}")
    try:
        # Create a temporary file
        suffix = f".{file.filename.split('.')[-1]}"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            try:
                # Read content in chunks
                content = await file.read()
                temp_file.write(content)
                temp_file.flush()
                logger.info(f"Created temporary file at: {temp_file.name}")
                
                # Create appropriate loader
                if file.filename.lower().endswith('.pdf'):
                    loader = PDFLoader(temp_file.name)
                else:
                    loader = TextFileLoader(temp_file.name)
                
                # Load and process the documents
                documents = loader.load_documents()
                texts = text_splitter.split_texts(documents)
                logger.info(f"Split document into {len(texts)} chunks")
                
                # Build vector database
                global vector_db
                vector_db = VectorDatabase()
                vector_db = await vector_db.abuild_from_list(texts)
                logger.info("Vector database built successfully")
                
                return {
                    "message": f"File {file.filename} processed successfully",
                    "chunks": len(texts)
                }
            except Exception as e:
                logger.error(f"Error processing file: {str(e)}", exc_info=True)
                raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
            finally:
                # Clean up
                try:
                    os.unlink(temp_file.name)
                    logger.info(f"Cleaned up temporary file: {temp_file.name}")
                except Exception as e:
                    logger.error(f"Error cleaning up temp file: {str(e)}")
    except Exception as e:
        logger.error(f"Upload error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")

@app.post("/query")
async def query_documents(query: Query):
    logger.info(f"Received query: {query.question}")
    
    if not vector_db:
        logger.error("Vector database not initialized")
        raise HTTPException(
            status_code=400,
            detail="Please upload a document first"
        )

    async def generate():
        try:
            # Search for relevant context
            context_list = vector_db.search_by_text(query.question, k=4)
            logger.info("Retrieved context from vector database")
            
            # Format context
            context_prompt = ""
            for context in context_list:
                context_prompt += context[0] + "\n"
            
            # Create prompts
            formatted_system_prompt = system_role_prompt.create_message()
            formatted_user_prompt = user_role_prompt.create_message(
                question=query.question,
                context=context_prompt
            )
            
            # Stream response
            async for chunk in chat_openai.astream([formatted_system_prompt, formatted_user_prompt]):
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            
            yield f"data: {json.dumps({'status': 'completed'})}\n\n"
            logger.info("Query processing completed")
                
        except Exception as e:
            logger.error(f"Error processing query: {str(e)}", exc_info=True)
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)  # Changed to 0.0.0.0 to allow external connections 
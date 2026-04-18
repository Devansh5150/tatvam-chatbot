"""
Tatvam Local Inference Server
Serves a GGUF model via an OpenAI-compatible API.
Uses llama-cpp-python for backend inference.

File: server.py
Run with: python server.py
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import time
import uuid

# --- llama-cpp-python ---
# Install with: pip install llama-cpp-python
try:
    from llama_cpp import Llama
except ImportError:
    raise ImportError(
        "Please install llama-cpp-python first:\n"
        "pip install llama-cpp-python\n"
        "For GPU (CUDA) support:\n"
        "CMAKE_ARGS='-DGGML_CUDA=on' pip install llama-cpp-python --force-reinstall --no-cache-dir"
    )

# ─── Configuration ────────────────────────────────────────────────────────────

MODEL_PATH = r"C:\Users\Taksh Sehrawat\Downloads\llama-3.2-1b-instruct.Q4_K_M.gguf"

# Context window size. Llama 3.2 supports up to 131072 but 8192 is safe for 8GB RAM
N_CTX = 8192

# Number of layers to offload to GPU. Set to 0 if you have no GPU.
# Set to a higher number (e.g., 32) to use GPU acceleration.
N_GPU_LAYERS = 0

# ─── Load Model ───────────────────────────────────────────────────────────────

print(f"Loading model from: {MODEL_PATH}")
print(f"Context window: {N_CTX} | GPU Layers: {N_GPU_LAYERS}")
print("This may take a few seconds...")

llm = Llama(
    model_path=MODEL_PATH,
    n_ctx=N_CTX,
    n_gpu_layers=N_GPU_LAYERS,
    verbose=False,
    chat_format="llama-3"  # Tells llama.cpp to use Llama 3's instruct template
)

print("✅ Model loaded successfully! Tatvam is awakened.")

# ─── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(title="Tatvam Inference Server", version="1.0.0")

# Allow all origins so your friend's Next.js app can connect over local Wi-Fi
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── OpenAI-Compatible Request / Response Models ──────────────────────────────

class ChatMessage(BaseModel):
    role: str        # "system", "user", or "assistant"
    content: str

class ChatCompletionRequest(BaseModel):
    model: Optional[str] = "tatvam-local"
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1024
    stream: Optional[bool] = False  # Streaming not supported in this simple version

class ChatCompletionChoice(BaseModel):
    index: int
    message: ChatMessage
    finish_reason: str

class ChatCompletionUsage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

class ChatCompletionResponse(BaseModel):
    id: str
    object: str
    created: int
    model: str
    choices: List[ChatCompletionChoice]
    usage: ChatCompletionUsage

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "Tatvam Inference Server is running 🕉️", "model": MODEL_PATH}

@app.get("/v1/models")
def list_models():
    """OpenAI-compatible /v1/models endpoint."""
    return {
        "object": "list",
        "data": [{
            "id": "tatvam-local",
            "object": "model",
            "created": int(time.time()),
            "owned_by": "tatvam"
        }]
    }

@app.post("/v1/chat/completions", response_model=ChatCompletionResponse)
def chat_completions(request: ChatCompletionRequest):
    """
    OpenAI-compatible /v1/chat/completions endpoint.
    Your Next.js app can point its OpenAI client at this.
    """
    try:
        # Convert Pydantic models to the dicts llama-cpp expects
        messages = [{"role": m.role, "content": m.content} for m in request.messages]

        print(f"Received request with {len(messages)} messages | max_tokens={request.max_tokens} | temp={request.temperature}")

        response = llm.create_chat_completion(
            messages=messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )

        reply_content = response["choices"][0]["message"]["content"]
        finish_reason = response["choices"][0]["finish_reason"]
        usage = response.get("usage", {})

        print(f"Generated reply ({len(reply_content)} chars) | finish_reason={finish_reason}")

        return ChatCompletionResponse(
            id=f"chatcmpl-{uuid.uuid4().hex[:12]}",
            object="chat.completion",
            created=int(time.time()),
            model=request.model or "tatvam-local",
            choices=[
                ChatCompletionChoice(
                    index=0,
                    message=ChatMessage(role="assistant", content=reply_content),
                    finish_reason=finish_reason or "stop",
                )
            ],
            usage=ChatCompletionUsage(
                prompt_tokens=usage.get("prompt_tokens", 0),
                completion_tokens=usage.get("completion_tokens", 0),
                total_tokens=usage.get("total_tokens", 0),
            )
        )

    except Exception as e:
        print(f"Error during inference: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ─── Start Server ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\n" + "="*55)
    print("  🕉️  TATVAM INFERENCE SERVER STARTING")
    print("="*55)
    print(f"  Local:   http://localhost:8000")
    print(f"  Network: Run 'ipconfig' to get your Wi-Fi IP")
    print(f"           Then tell your friend: http://<your-ip>:8000")
    print("  API:     http://localhost:8000/v1/chat/completions")
    print("="*55 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)

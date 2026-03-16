from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import strategy, profile, trades, chat, market

app = FastAPI(
    title="Investment Analysis Server",
    description="AI-based Investment Analysis API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(strategy.router, prefix="/analyze", tags=["Strategy Analysis"])
app.include_router(profile.router, prefix="/analyze", tags=["Profile Analysis"])
app.include_router(trades.router, prefix="/analyze", tags=["Trades Analysis"])
app.include_router(market.router, prefix="/analyze", tags=["Market Analysis"])
app.include_router(chat.router, prefix="/chat", tags=["AI Agent"])


@app.get("/")
async def root():
    return {"message": "Investment Analysis Server is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)


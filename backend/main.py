from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import os

app = FastAPI(title="AURIXA API", description="Luxury Fashion E-commerce & AI Concierge API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Models
class CartItem(BaseModel):
    id: int
    name: str
    price: float
    quantity: int

class PaymentRequest(BaseModel):
    cart: List[CartItem]
    total: float

class ContactRequest(BaseModel):
    name: str
    email: str
    message: str

class ChatRequest(BaseModel):
    message: str

# Dummy Products Database
PRODUCTS = [
    {
        "id": 1,
        "name": "Obsidian Silk Blazer",
        "price": 1250.00,
        "image_url": "images/obsidian_silk_blazer.png"
    },
    {
        "id": 2,
        "name": "Hand-Sourced Cashmere Trench",
        "price": 2400.00,
        "image_url": "images/cashmere_trench.png"
    },
    {
        "id": 3,
        "name": "Champagne Gold Evening Gown",
        "price": 3100.00,
        "image_url": "images/gold_evening_gown.png"
    },
    {
        "id": 4,
        "name": "Pure White Leather Tote",
        "price": 890.00,
        "image_url": "images/white_leather_tote.png"
    }
]

@app.get("/products")
async def get_products():
    return PRODUCTS

@app.post("/process-payment")
async def process_payment(request: PaymentRequest):
    # Simulate a 2-second delay for payment processing
    await asyncio.sleep(2)
    return {"status": "success", "message": "Payment Successful. Thank you for choosing AURIXA."}

@app.post("/contact-submit")
async def contact_submit(request: ContactRequest):
    # Simulate saving to database
    print(f"Received inquiry from {request.name} ({request.email}): {request.message}")
    return {"status": "success", "message": "Your inquiry has been received. Our concierge will contact you shortly."}

@app.post("/chat")
async def chat(request: ChatRequest):
    msg = request.message.lower()
    
    # Keyword matching for dummy AI concierge
    if "material" in msg or "fabric" in msg:
        response = "Our garments are crafted from the finest materials, featuring hand-sourced Italian silk and exceptional cashmere to ensure uncompromising luxury."
    elif "shipping" in msg or "delivery" in msg:
        response = "We offer complimentary white-glove delivery worldwide. Each piece is meticulously packaged to arrive in perfect condition."
    elif "return" in msg or "exchange" in msg:
        response = "We accept returns within 30 days of purchase for a full refund or exchange. Our concierge can arrange a complimentary home pickup at your convenience."
    elif "hello" in msg or "hi" in msg:
        response = "Welcome to AURIXA. I am your personal concierge. How may I assist you with your wardrobe selections today?"
    elif "price" in msg or "cost" in msg:
        response = "Our pricing reflects the unparalleled craftsmanship, exclusive materials, and timeless design invested into every AURIXA piece."
    else:
        response = "Thank you for reaching out. A senior stylist will review your request. In the meantime, is there anything specific about our current collection I can help you discover?"
        
    return {"response": response}

# Mount frontend static files
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from config import settings
from services import EmailService
from workflow import EmailWorkflow
from models import UserActionRequest
from langchain_groq import ChatGroq

import re

app = FastAPI(title="Inbox Copilot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loaded Groq Key:", settings.GROQ_API_KEY)

llm = ChatGroq(api_key=settings.GROQ_API_KEY, model_name=settings.MODEL_NAME, temperature=0.2)
email_service = EmailService(settings.EMAIL_ADDRESS, settings.EMAIL_PASSWORD)
workflow_manager = EmailWorkflow(llm, email_service)


class ConfirmSendRequest(BaseModel):
    thread_id: str
    approved_text: str
    to_email: str


@app.get("/api/fetch-and-analyze")
async def fetch_and_analyze(thread_id: str = "thread-1"):
    email_data = email_service.fetch_latest_unread()
    if not email_data:
        return {"status": "no_new_emails"}

    initial_state = {
        "thread_id": thread_id,
        "sender": email_data["sender"],
        "subject": email_data["subject"],
        "body": email_data["body"],
        "current_step": "fetching"
    }

    config = {"configurable": {"thread_id": thread_id}}
    result = workflow_manager.graph.invoke(initial_state, config=config)

    return {"status": "waiting_for_decision", "state": result}


@app.post("/api/submit-decision")
async def submit_decision(request: UserActionRequest):
    config = {"configurable": {"thread_id": request.thread_id}}

    workflow_manager.graph.update_state(config, {"user_decision": request.decision})
    result = workflow_manager.graph.invoke(None, config=config)

    return {"status": "draft_ready", "draft": result["draft_response"]}


@app.post("/api/confirm-send")
async def confirm_send(request: ConfirmSendRequest):
    try:
        email_service.send_reply(
            to_email=request.to_email,
            thread_id=request.thread_id,
            body=request.approved_text
        )

        print(f" Email confirmed and dispatched to: {request.to_email}")
        return {"status": "sent_successfully"}

    except Exception as e:
        print(f" Error dispatching email: {e}")
        raise HTTPException(status_code=500, detail=str(e))
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from models import EmailState
from services import EmailService
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
import csv


class EmailWorkflow:
    def __init__(self, llm: ChatGroq, email_service: EmailService):
        self.llm = llm
        self.email_service = email_service
        self.memory = MemorySaver()
        self.graph = self._build_graph()

    def load_org_chart(self, file_path="org_chart.csv") -> str:
        try:
            with open(file_path, mode='r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                org_lines = [f"- {row['Role']}: {row['Name']} (Email: {row['Email']})" for row in reader]
                return "\n".join(org_lines)
        except FileNotFoundError:
            return "Organization chart not found."

    def analyze_node(self, state: EmailState):
        org_chart_text = self.load_org_chart()

        system_prompt = f"""
        You are a smart enterprise AI assistant. Analyze the incoming email and provide 3 short, actionable suggestions (e.g., approve, reject, or escalate).

        If escalation or forwarding is required, you must use the following organizational chart to suggest the correct person:
        {org_chart_text}

        Provide the suggestions strictly as a dashed bulleted list (- Action) with no additional conversational text or explanations.
        """

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "Subject: {subject}\nBody: {body}")
        ])

        chain = prompt | self.llm
        response = chain.invoke({"subject": state["subject"], "body": state["body"]})

        actions = [act.strip() for act in response.content.split("\n") if act.strip()]
        return {"suggested_actions": actions, "current_step": "waiting_for_user"}

    def draft_node(self, state: EmailState):
        decision = state.get("user_decision", "polite response")

        prompt = ChatPromptTemplate.from_messages([
            ("system",
             "Write a formal, concise email reply based on the user's decision ({decision}). Provide only the email body text without placeholders or meta-commentary."),
            ("human", "Subject: {subject}\nBody: {body}")
        ])

        chain = prompt | self.llm
        draft = chain.invoke({"decision": decision, "subject": state["subject"], "body": state["body"]})

        return {"draft_response": draft.content, "current_step": "ready_to_send"}

    def _build_graph(self):
        workflow = StateGraph(EmailState)
        workflow.add_node("analyze", self.analyze_node)
        workflow.add_node("draft", self.draft_node)

        workflow.add_edge(START, "analyze")
        workflow.add_edge("analyze", "draft")
        workflow.add_edge("draft", END)

        return workflow.compile(checkpointer=self.memory, interrupt_before=["draft"])
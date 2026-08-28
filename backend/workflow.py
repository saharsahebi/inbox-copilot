from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from models import EmailState
from services import EmailService
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
import csv
from langchain_core.prompts import ChatPromptTemplate


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
                org_lines = [f"- {row['Role']}: {row['Name']} (ایمیل: {row['Email']})" for row in reader]
                return "\n".join(org_lines)
        except FileNotFoundError:
            return "چارت سازمانی یافت نشد."

    def analyze_node(self, state: EmailState):
        org_chart_text = self.load_org_chart()

        system_prompt = f"""
        شما یک دستیار هوشمند سازمانی هستید. ایمیل دریافتی را تحلیل کنید و ۳ پیشنهاد کوتاه برای اقدام (مثل تایید، رد، یا ارجاع) ارائه دهید.

        در صورت نیاز به ارجاع، حتماً از چارت سازمانی زیر استفاده کنید:
        {org_chart_text}

        پیشنهادات را فقط به صورت لیست با خط تیره بنویسید و توضیحات اضافه ندهید.
        """

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "موضوع: {subject}\nمتن: {body}")
        ])

        chain = prompt | self.llm
        response = chain.invoke({"subject": state["subject"], "body": state["body"]})

        actions = [act.strip() for act in response.content.split("\n") if act.strip()]
        return {"suggested_actions": actions, "current_step": "waiting_for_user"}
    def draft_node(self, state: EmailState):
        decision = state.get("user_decision", "پاسخ محترمانه")
        prompt = ChatPromptTemplate.from_messages([
            ("system", "یک پاسخ رسمی و کوتاه برای ایمیل به زبان فارسی بر اساس تصمیم کاربر ({decision}) بنویسید."),
            ("human", "موضوع: {subject}\nمتن: {body}")
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
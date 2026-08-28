import imaplib
import smtplib
import email
from email.mime.text import MIMEText
from email.header import decode_header


class EmailService:
    def __init__(self, email_addr: str, password: str):
        self.email_addr = email_addr
        self.password = password

    def fetch_latest_unread(self) -> dict:
        try:
            mail = imaplib.IMAP4_SSL("imap.gmail.com", 993)
            mail.login(self.email_addr, self.password)
            mail.select("inbox")
            status, messages = mail.search(None, "UNSEEN")

            if status != "OK" or not messages[0]:
                return {}

            latest_email_id = messages[0].split()[-1]
            status, msg_data = mail.fetch(latest_email_id, "(RFC822)")

            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    subject, encoding = decode_header(msg["Subject"])[0]
                    if isinstance(subject, bytes):
                        subject = subject.decode(encoding if encoding else "utf-8")

                    body = ""
                    if msg.is_multipart():
                        for part in msg.walk():
                            if part.get_content_type() == "text/plain":
                                body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                                break
                    else:
                        body = msg.get_payload(decode=True).decode("utf-8", errors="ignore")

            mail.logout()
            return {"sender": msg.get("From"), "subject": subject, "body": body[:1500]}
        except Exception as e:
            print(f"Error fetching email: {e}")
            return {}

    def send_email(self, to: str, subject: str, body: str) -> bool:
        try:
            msg = MIMEText(body)
            msg['Subject'] = subject
            msg['From'] = self.email_addr
            msg['To'] = to

            with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp_server:
                smtp_server.login(self.email_addr, self.password)
                smtp_server.sendmail(self.email_addr, to, msg.as_string())
            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            return False
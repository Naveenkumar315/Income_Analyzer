import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os

load_dotenv()

EMAIL_USER = os.environ.get("EMAIL_USER")
EMAIL_PASS = os.environ.get("EMAIL_PASS")
SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))


def send_email(to_email, subject, html_body, cc_emails=None):
    """
    Send email with optional CC support.
    cc_emails can be a string or list of strings.
    """
    try:
        msg = MIMEMultipart()
        msg["From"] = EMAIL_USER
        msg["To"] = to_email
        msg["Subject"] = subject

        # Normalize CC
        if cc_emails:
            if isinstance(cc_emails, list):
                msg["Cc"] = ", ".join(cc_emails)
                recipients = [to_email] + cc_emails
            else:
                msg["Cc"] = cc_emails
                recipients = [to_email, cc_emails]
        else:
            recipients = [to_email]

        msg.attach(MIMEText(html_body, "html"))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)

        # Send to TO + CC
        server.sendmail(EMAIL_USER, recipients, msg.as_string())
        server.quit()

        print("Email sent successfully!")

    except Exception as e:
        print("Error sending email:", str(e))

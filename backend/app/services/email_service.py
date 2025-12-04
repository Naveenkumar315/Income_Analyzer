import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os

load_dotenv()

EMAIL_USER = ""
EMAIL_PASS = ""

SMTP_SERVER = "smtp.office365.com"
SMTP_PORT = 587


def send_email(to_email, subject, html_body):
    try:
        # Create the email
        msg = MIMEMultipart()
        msg["From"] = EMAIL_USER
        msg["To"] = to_email
        msg["Subject"] = subject

        msg.attach(MIMEText(html_body, "html"))

        # Connect to Outlook SMTP
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()  # Secure connection
        server.login(EMAIL_USER, EMAIL_PASS)

        # Send email
        server.sendmail(EMAIL_USER, to_email, msg.as_string())
        server.quit()

        print("Email sent successfully!")

    except Exception as e:
        print("Error sending email:", str(e))


send_email('NMurugan@loanDNA.com', 'Hello', 'Hello')

# app/templates/email_templates.py

def get_verification_code_email(code: str, recipient_name: str = "Loan Officer") -> str:
    """
    Outlook-safe, compact email verification code template.
    Uses system default light/dark mode (no forced background colors).
    """

    return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Email Verification Code</title>

  <!-- Allow system-controlled light/dark mode -->
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
</head>

<body style="margin:0; padding:0; font-family:Arial, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <tr>
    <td align="center" style="padding:20px 10px;">

      <!-- Main container -->
      <table width="600" cellpadding="0" cellspacing="0" role="presentation"
             style="max-width:600px; border-collapse:collapse; border:1px solid;">

        <!-- Header -->
        <tr>
          <td align="center"
              style="font-size:22px; font-weight:700; padding:14px; border-bottom:1px solid;">
            Email Verification Code
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:16px; font-size:14px; line-height:20px;">
            Hello <strong>{recipient_name}</strong>,<br><br>

            Thank you for registering. Please use the passcode below to verify your email address:
          </td>
        </tr>

        <!-- Code box -->
        <tr>
          <td align="center" style="padding:14px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                   style="border:1px solid;">
              <tr>
                <td align="center"
                    style="padding:12px; font-size:28px; font-weight:700; letter-spacing:6px;">
                  {code}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Info -->
        <tr>
          <td style="padding:14px 16px; font-size:13px; line-height:18px;">
            This code will expire in <strong>15 minutes</strong>.
            If you didn’t request this, you can safely ignore this email.
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:14px 16px; font-size:13px; line-height:18px;">
            Thank you,<br>
            <strong>The Support Team</strong>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>
"""


def get_password_reset_email(reset_link: str, email: str) -> str:
    """Generate HTML email template for password reset."""
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px;">
                    <tr>
                        <td align="center" style="padding: 40px 20px 20px 20px;">
                            <h1 style="margin: 0; font-size: 24px; color: #333333;">Reset Your Password</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px;">
                            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 22px; color: #666666;">
                                Click the button below to reset your password:
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="{reset_link}" style="display: inline-block; padding: 15px 30px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 20px 0 0 0; font-size: 13px; color: #666666;">
                                This link expires in 1 hour.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 30px 40px; border-top: 1px solid #eeeeee;">
                            <p style="margin: 0; font-size: 11px; color: #999999;">
                                © 2025 Income Analyzer
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""


def get_welcome_email(name: str, email: str) -> str:
    """Generate HTML email template for welcome message."""
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px;">
                    <tr>
                        <td align="center" style="padding: 40px 20px 20px 20px;">
                            <h1 style="margin: 0; font-size: 24px; color: #333333;">Welcome to Income Analyzer!</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px;">
                            <p style="margin: 0 0 15px 0; font-size: 14px; color: #666666;">Hi {name},</p>
                            <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 22px; color: #666666;">
                                Thank you for joining Income Analyzer! We're excited to have you on board.
                            </p>
                            <p style="margin: 0; font-size: 14px; line-height: 22px; color: #666666;">
                                Your account has been successfully created and you're ready to start analyzing income documents.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 30px 40px; border-top: 1px solid #eeeeee;">
                            <p style="margin: 0; font-size: 11px; color: #999999;">
                                © 2025 Income Analyzer
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""


def get_welcome_email_html(full_name: str, temp_password: str) -> str:
    """
    Returns HTML email body for sending the welcome email with a temporary password.
    """

    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>Welcome to Income Analyzer</title>
</head>

<body style="margin:0; padding:0; background-color:#1e1e1e; font-family:Arial, sans-serif; color:#ffffff;">

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding:30px 0;">
        <tr>
            <td align="center">

                <table width="600" cellspacing="0" cellpadding="0" style="background:#262626; border-radius:8px; padding:40px;">

                    <tr>
                        <td align="center" style="font-size:28px; font-weight:bold; padding-bottom:20px; color:#ffffff;">
                            Welcome to Income Analyzer
                        </td>
                    </tr>

                    <tr>
                        <td style="font-size:16px; line-height:1.6; color:#e6e6e6;">
                            Hello <strong>{full_name}</strong>,
                            <br><br>
                            Your account request for Income Analyzer has been approved.
                            <br><br>
                            Use the temporary password below to log in and access your account.
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding:25px 0;">
                            <div style="
                                background:#1a1a1a;
                                border:1px solid #555;
                                padding:14px;
                                border-radius:6px;
                                width:80%;
                                color:#ffffff;
                                font-size:18px;
                                font-weight:bold;
                                text-align:center;
                                letter-spacing:1px;
                            ">
                                {temp_password}
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="font-size:16px; line-height:1.6; color:#cccccc;">
                            If you have questions, please reach out to support.
                            <br><br>
                            Thank you,<br>
                            <strong>The Income Analyzer Team</strong>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
"""


# email_templates.py
def get_welcome_email_html(full_name: str, temp_password: str) -> str:
    """
    Returns HTML email body for sending the welcome email with a temporary password.
    """
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>Welcome to Income Analyzer</title>
</head>

<body style="margin:0; padding:0; background-color:#1e1e1e; font-family:Arial, sans-serif; color:#ffffff;">

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding:30px 0;">
        <tr>
            <td align="center">

                <table width="600" cellspacing="0" cellpadding="0" style="background:#262626; border-radius:8px; padding:40px;">

                    <tr>
                        <td align="center" style="font-size:28px; font-weight:bold; padding-bottom:20px; color:#ffffff;">
                            Welcome to Income Analyzer
                        </td>
                    </tr>

                    <tr>
                        <td style="font-size:16px; line-height:1.6; color:#e6e6e6;">
                            Hello <strong>{full_name}</strong>,
                            <br><br>
                            Thank you for signing up for Income Analyzer.
                            <br><br>
                            Your account request has been approved. Use the temporary password below to log in and access your account.
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding:25px 0;">
                            <div style="
                                background:#1a1a1a;
                                border:1px solid #555;
                                padding:14px;
                                border-radius:6px;
                                width:80%;
                                color:#ffffff;
                                font-size:18px;
                                font-weight:bold;
                                text-align:center;
                                letter-spacing:1px;
                            ">
                                {temp_password}
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="font-size:16px; line-height:1.6; color:#cccccc;">
                            If you have questions, please reach out to support.
                            <br><br>
                            Thank you,<br>
                            <strong>The Income Analyzer Team</strong>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
"""


def get_signup_submitted_email_html(full_name: str) -> str:
    """
    HTML email for signup request submitted (Income Analyzer).
    Uses system default light/dark mode, Outlook-safe layout.
    """

    return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Income Analyzer Onboarding Process Started</title>

  <!-- Allow system-controlled light/dark mode -->
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
</head>

<body style="margin:0; padding:0; font-family:Arial, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <tr>
    <td align="center" style="padding:20px 10px;">

      <!-- Container -->
      <table width="600" cellpadding="0" cellspacing="0" role="presentation"
             style="max-width:600px; border-collapse:collapse; border:1px solid;">

        <!-- Header -->
        <tr>
          <td align="center"
              style="font-size:22px; font-weight:700; padding:14px; border-bottom:1px solid;">
            Welcome to Income Analyzer
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:16px; font-size:14px; line-height:20px;">
            Hello <strong>{full_name}</strong>,<br><br>

            Thank you for signing up for Income Analyzer.
            <br><br>
            Your request has been submitted. Our team will review it shortly and respond to you via email.
            <br><br>
            If you have questions, please reach out to support.
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:14px 16px; font-size:13px; line-height:18px;">
            Thank you,<br>
            <strong>The Income Analyzer Team</strong>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>
"""


def get_admin_new_broker_signup_email_html(
    name: str,
    email: str,
    phone: str
) -> str:
    """
    HTML email for admin notification when a new broker signup request is submitted.
    Outlook-safe, system light/dark mode compatible.
    """

    return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New Broker Signup Request Submitted</title>

  <!-- Allow system-controlled light/dark mode -->
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
</head>

<body style="margin:0; padding:0; font-family:Arial, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <tr>
    <td align="center" style="padding:20px 10px;">

      <!-- Container -->
      <table width="600" cellpadding="0" cellspacing="0" role="presentation"
             style="max-width:600px; border-collapse:collapse; border:1px solid;">

        <!-- Header -->
        <tr>
          <td align="center"
              style="font-size:22px; font-weight:700; padding:14px; border-bottom:1px solid;">
            New Broker Signup Request Submitted
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:16px; font-size:14px; line-height:20px;">
            Hello Admin,<br><br>

            A new broker signup request has been submitted. Below are the details:
            <br><br>

            <strong>Broker Details</strong>
          </td>
        </tr>

        <!-- Details -->
        <tr>
          <td style="padding:0 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                   style="border-collapse:collapse;">

              <tr>
                <td style="padding:10px 0; font-weight:700; width:120px;">
                  Name:
                </td>
                <td style="padding:10px 0;">
                  {name}
                </td>
              </tr>

              <tr>
                <td colspan="2" style="border-top:1px solid;"></td>
              </tr>

              <tr>
                <td style="padding:10px 0; font-weight:700;">
                  Email:
                </td>
                <td style="padding:10px 0;">
                  <a href="mailto:{email}" style="text-decoration:underline;">
                    {email}
                  </a>
                </td>
              </tr>

              <tr>
                <td colspan="2" style="border-top:1px solid;"></td>
              </tr>

              <tr>
                <td style="padding:10px 0; font-weight:700;">
                  Phone:
                </td>
                <td style="padding:10px 0;">
                  {phone}
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <!-- Footer Message -->
        <tr>
          <td style="padding:16px; font-size:14px; line-height:20px;">
            Please log in to the admin portal to review and take appropriate action on this request.
            <br><br>

            Thank you,<br>
            <strong>The Income Analyzer System</strong>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>
"""


def get_rejection_email_html(full_name: str, reason: str = None, ) -> str:
    """
    Returns HTML email body for sending the rejection/decline notification.
    `reason` is optional — if provided, it will be included in the email.
    """
    # sanitize/escape reason if you render user-provided content (left raw here for brevity)
    reason_block = f"<br><br><strong>Reason:</strong> {reason}" if reason else ""
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>Income Analyzer — Request Update</title>
</head>

<body style="margin:0; padding:0; background-color:#1e1e1e; font-family:Arial, sans-serif; color:#ffffff;">

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding:30px 0;">
        <tr>
            <td align="center">

                <table width="600" cellspacing="0" cellpadding="0" style="background:#262626; border-radius:8px; padding:40px;">

                    <tr>
                        <td align="center" style="font-size:28px; font-weight:bold; padding-bottom:20px; color:#ffffff;">
                            Income Analyzer — Account Request Received
                        </td>
                    </tr>

                    <tr>
                        <td style="font-size:16px; line-height:1.6; color:#e6e6e6;">
                            Hello <strong>{full_name}</strong>,
                            <br><br>
                            Thank you for signing up for Income Analyzer.
                            <br><br>
                            Your request has been submitted. Our team has reviewed it and, at this time, we are unable to approve the account.
                            {reason_block}
                            <br><br>
                            If you have questions or believe this was a mistake, please reply to this email or reach out to our support team.
                        </td>
                    </tr>

                    <tr>
                        <td style="font-size:16px; line-height:1.6; color:#cccccc; padding-top:20px;">
                            Thank you,<br>
                            <strong>The Income Analyzer Team</strong>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
"""


def get_admin_signup_notification_html(name: str, email: str, phone: str, extra_info: str | None = None) -> str:
    """
    Returns an HTML email body for notifying admin about a new broker/signup request.
    """
    extra_block = f"<tr><td style='padding-top:12px;color:#cccccc;font-size:14px;'>Additional info: {extra_info}</td></tr>" if extra_info else ""
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>New Signup Request — Income Analyzer</title>
</head>
<body style="margin:0;padding:0;background:#111; font-family:Arial, sans-serif;color:#fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="background:#1f1f1f;border-radius:8px;padding:28px;">
        <tr>
          <td style="font-size:20px;font-weight:700;color:#ffffff;padding-bottom:12px;text-align:left;">
            New Broker Signup Request Submitted
          </td>
        </tr>

        <tr>
          <td style="font-size:14px;line-height:1.6;color:#e6e6e6;padding-bottom:14px;">
            Hello Admin,
            <br/><br/>
            A new broker signup request has been submitted. Below are the details:
          </td>
        </tr>

        <tr>
          <td style="background:#141414;border:1px solid #2b2b2b;padding:16px;border-radius:6px;">
            <table width="100%" cellpadding="6" cellspacing="0" style="color:#dcdcdc;font-size:14px;">
              <tr>
                <td style="width:150px;font-weight:600;color:#ffffff">Name:</td>
                <td>{name}</td>
              </tr>
              <tr>
                <td style="font-weight:600;color:#ffffff">Email:</td>
                <td>{email}</td>
              </tr>
              <tr>
                <td style="font-weight:600;color:#ffffff">Phone:</td>
                <td>{phone}</td>
              </tr>
            </table>
            {extra_block}
          </td>
        </tr>

        <tr>
          <td style="font-size:14px;line-height:1.6;color:#cccccc;padding-top:18px;">
            Please log in to the admin portal to review and take appropriate action on this request.
            <br/><br/>
            Thank you,<br/>
            <strong>The Income Analyzer Team</strong>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
"""


def get_rejection_email_html(full_name: str, reason) -> str:
    """
    HTML body for rejection email (Income Analyzer).
    System-default styling (no forced light or dark mode).
    """
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Income Analyzer — Account Request Update</title>
</head>

<body style="margin:0;padding:0;font-family:Arial, sans-serif;color:#222222;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0"
               style="padding:28px;border:1px solid #e5e5e5;border-radius:8px;">
          
          <tr>
            <td style="font-size:20px;font-weight:700;padding-bottom:12px;">
              Income Analyzer — Account Request Update
            </td>
          </tr>

          <tr>
            <td style="font-size:14px;line-height:1.6;">
              Hello <strong>{full_name}</strong>,
              <br><br>
              We regret to inform you that your Income Analyzer account request has been rejected.
              <br><br>
              If you believe this was a mistake, please contact the administrator.
              If you have questions, please reach out to support.
            </td>
          </tr>

          <tr>
            <td style="font-size:14px;padding-top:18px;">
              Thank you,<br>
              <strong>The Income Analyzer Team</strong>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

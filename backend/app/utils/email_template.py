# app/templates/email_templates.py

def get_verification_code_email(code: str, email: str) -> str:
    """
    Generate HTML email template for verification code.

    Args:
        code: 6-digit verification code
        email: User's email address

    Returns:
        HTML string for the email
    """
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; max-width: 600px;">
                    
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 20px 20px 20px;">
                            <h1 style="margin: 0; font-size: 24px; color: #333333;">Income Analyzer</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 40px 20px 40px;">
                            <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #333333;">Verify Your Email</h2>
                            <p style="margin: 0; font-size: 14px; line-height: 22px; color: #666666;">
                                Thank you for signing up! Please use the verification code below to complete your registration:
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Verification Code -->
                    <tr>
                        <td align="center" style="padding: 20px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="background-color: #667eea; border-radius: 8px; padding: 30px;">
                                        <p style="margin: 0 0 10px 0; font-size: 12px; color: #ffffff; text-transform: uppercase; letter-spacing: 2px;">
                                            Your Verification Code
                                        </p>
                                        <p style="margin: 0; font-size: 32px; font-weight: bold; color: #ffffff; letter-spacing: 10px; font-family: 'Courier New', monospace;">
                                            {code}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Info -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <p style="margin: 0 0 10px 0; font-size: 13px; color: #666666;">
                                This code will expire in <strong>10 minutes</strong>.
                            </p>
                            <p style="margin: 0; font-size: 13px; color: #666666;">
                                If you didn't request this code, please ignore this email.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 30px 40px; border-top: 1px solid #eeeeee;">
                            <p style="margin: 0 0 5px 0; font-size: 12px; color: #999999;">
                                Need help? Contact us at support@incomeanalyzer.com
                            </p>
                            <p style="margin: 0; font-size: 11px; color: #999999;">
                                © 2025 Income Analyzer. All rights reserved.
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

import nodemailer from 'nodemailer'

// Gmail SMTP Transporter 생성
export const createGmailTransporter = () => {
  const gmailUsername = process.env.GMAIL_USERNAME
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD

  if (!gmailUsername || !gmailAppPassword) {
    throw new Error('Gmail credentials are not set. Please check GMAIL_USERNAME and GMAIL_APP_PASSWORD in .env.local')
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUsername,
      pass: gmailAppPassword,
    },
  })
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

/**
 * Gmail SMTP를 통해 이메일 발송
 */
export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const transporter = createGmailTransporter()

    console.log(`[Gmail] Sending email to ${to}...`)

    const info = await transporter.sendMail({
      from: `"News Aggregator" <${process.env.GMAIL_USERNAME}>`,
      to,
      subject,
      html,
    })

    console.log(`[Gmail] Email sent successfully to ${to}. Message ID: ${info.messageId}`)

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error: any) {
    console.error(`[Gmail] Failed to send email to ${to}:`, error)
    throw new Error(`Failed to send email: ${error.message}`)
  }
}

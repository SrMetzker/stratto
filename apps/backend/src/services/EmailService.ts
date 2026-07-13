import { AppError } from '../utils/errors'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export class EmailService {
  private static isConfigured(): boolean {
    return Boolean(
      process.env.SENDGRID_API_KEY ||
      process.env.SMTP_HOST ||
      process.env.MAILGUN_API_KEY
    )
  }

  static async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    const subject = 'Recupere sua senha | Stratto'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Recuperação de Senha</h2>
        <p>Recebemos uma solicitação para redefinir sua senha. Clique no link abaixo para continuar:</p>
        <p style="margin: 20px 0;">
          <a href="${resetLink}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Redefinir Senha
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Ou copie e cole este link no seu navegador:<br/>
          <code>${resetLink}</code>
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 40px;">
          Este link expira em 30 minutos.<br/>
          Se você não solicitou isso, ignore este email.
        </p>
      </div>
    `

    if (!this.isConfigured()) {
      console.warn('[EmailService] Email not configured. Skipping send.')
      console.info(`[EmailService] Password reset link: ${resetLink}`)
      return
    }

    try {
      if (process.env.SENDGRID_API_KEY) {
        await this.sendViaSendGrid({ to: email, subject, html })
      } else if (process.env.MAILGUN_API_KEY) {
        await this.sendViaMailgun({ to: email, subject, html })
      } else if (process.env.SMTP_HOST) {
        await this.sendViaSMTP({ to: email, subject, html })
      }
    } catch (error) {
      console.error('[EmailService] Failed to send email:', error)
      throw new AppError(500, 'Falha ao enviar email de recuperação')
    }
  }

  private static async sendViaSendGrid(options: EmailOptions): Promise<void> {
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)

    await sgMail.send({
      to: options.to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@stratto.com',
      subject: options.subject,
      html: options.html,
    })
  }

  private static async sendViaMailgun(options: EmailOptions): Promise<void> {
    const mailgun = require('mailgun.js')
    const FormData = require('form-data')
    const client = new mailgun(FormData)

    const domain = process.env.MAILGUN_DOMAIN || 'mail.stratto.com'
    const mg = client.client({ username: 'api', key: process.env.MAILGUN_API_KEY })

    await mg.messages.create(domain, {
      from: `Stratto <noreply@${domain}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
  }

  private static async sendViaSMTP(options: EmailOptions): Promise<void> {
    const nodemailer = require('nodemailer')

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@stratto.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
  }
}

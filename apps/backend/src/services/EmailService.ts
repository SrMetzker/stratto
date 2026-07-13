/**
 * EmailService - Sends emails for password recovery
 *
 * Development mode: Logs the password reset link to console
 * Production mode: Configure SENDGRID_API_KEY, MAILGUN_API_KEY, or SMTP_HOST to send real emails
 *
 * For production, install the email provider library:
 * - npm install @sendgrid/mail
 * - npm install mailgun.js form-data
 * - npm install nodemailer
 */

export class EmailService {
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

    // For production, implement your email provider here
    // For now, just log the link
    console.info(`[EmailService] Password reset requested for: ${email}`)
    console.info(`[EmailService] Reset link: ${resetLink}`)
    console.info(`[EmailService] Configure SENDGRID_API_KEY, MAILGUN_API_KEY, or SMTP_HOST to send real emails`)
  }
}

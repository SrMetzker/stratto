import sgMail from '@sendgrid/mail'

/**
 * EmailService - Sends emails for password recovery
 *
 * Requires: SENDGRID_API_KEY environment variable
 * Falls back to console logs if not configured
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

    // If SendGrid is configured, send email
    if (process.env.SENDGRID_API_KEY) {
      try {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY)

        await sgMail.send({
          to: email,
          from: process.env.SENDGRID_FROM_EMAIL || 'noreply@stratto.com',
          subject,
          html,
        })

        console.info(`[EmailService] Password reset email sent via SendGrid to: ${email}`)
        return
      } catch (error) {
        console.error('[EmailService] SendGrid error:', error instanceof Error ? error.message : String(error))
        throw error
      }
    }

    // Fallback: log the reset link for development
    console.warn('[EmailService] SENDGRID_API_KEY not configured - logging reset link')
    console.info(`[EmailService] Password reset requested for: ${email}`)
    console.info(`[EmailService] Reset link: ${resetLink}`)
  }
}

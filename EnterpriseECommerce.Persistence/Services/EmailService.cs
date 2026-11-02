using System.Globalization;
using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.Domain.Entities;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace EnterpriseECommerce.Persistence.Services;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly IConfiguration _configuration;

    public EmailService(ILogger<EmailService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    private bool IsSmtpConfigured =>
        !string.IsNullOrWhiteSpace(_configuration["Smtp:Host"]) &&
        !string.IsNullOrWhiteSpace(_configuration["Smtp:Username"]) &&
        !string.IsNullOrWhiteSpace(_configuration["Smtp:Password"]);

    public async Task SendPasswordResetEmailAsync(string toEmail, string resetToken, CancellationToken cancellationToken = default)
    {
        var clientUrl = _configuration["ClientUrl"] ?? "http://localhost";
        var resetLink = $"{clientUrl}?resetToken={resetToken}&email={Uri.EscapeDataString(toEmail)}";

        var subject = "Şifrenizi Sıfırlayın - YILDIRIM";
        var htmlBody = $"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #18181b;">
            <div style="margin-bottom: 24px;">
                <h1 style="font-size: 20px; font-weight: 300; letter-spacing: -0.5px; margin: 0;">YILDIRIM</h1>
                <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #71717a; margin-top: 4px;">Güvenlik & Hesap Yönetimi</p>
            </div>
            <div style="border-top: 1px solid #e4e4e7; padding-top: 24px; margin-bottom: 24px;">
                <h2 style="font-size: 16px; font-weight: 500; margin: 0 0 12px 0;">Şifre Sıfırlama Talebi</h2>
                <p style="font-size: 13px; color: #52525b; line-height: 1.6; margin: 0 0 24px 0;">
                    Hesabınız için şifre sıfırlama talebinde bulundunuz. Yeni bir şifre belirlemek için aşağıdaki butona tıklayabilirsiniz.
                </p>
                <div style="text-align: left; margin: 24px 0;">
                    <a href="{resetLink}" style="background-color: #18181b; color: #ffffff; padding: 12px 28px; border-radius: 9999px; text-decoration: none; font-size: 12px; font-weight: 500; display: inline-block;">
                        Şifremi Sıfırla
                    </a>
                </div>
                <p style="font-size: 11px; color: #a1a1aa; line-height: 1.5;">
                    Bu talebi siz yapmadıysanız lütfen bu e-postayı dikkate almayınız. Bağlantı 15 dakika boyunca geçerlidir.
                </p>
            </div>
            <div style="border-top: 1px solid #f4f4f5; padding-top: 16px; font-size: 10px; color: #a1a1aa; font-family: monospace;">
                © {DateTime.UtcNow.Year} YILDIRIM. Tüm hakları saklıdır.
            </div>
        </div>
        """;

        await SendEmailInternalAsync(toEmail, subject, htmlBody, null, cancellationToken);
    }

    public async Task SendEmailConfirmationAsync(string toEmail, string confirmationToken, CancellationToken cancellationToken = default)
    {
        var clientUrl = _configuration["ClientUrl"] ?? "http://localhost";
        var confirmLink = $"{clientUrl}?confirmToken={confirmationToken}&email={Uri.EscapeDataString(toEmail)}";

        var subject = "Hesabınızı Doğrulayın - YILDIRIM";
        var htmlBody = $"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #18181b;">
            <div style="margin-bottom: 24px;">
                <h1 style="font-size: 20px; font-weight: 300; letter-spacing: -0.5px; margin: 0;">YILDIRIM</h1>
                <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #71717a; margin-top: 4px;">Aramıza Hoş Geldiniz</p>
            </div>
            <div style="border-top: 1px solid #e4e4e7; padding-top: 24px; margin-bottom: 24px;">
                <h2 style="font-size: 16px; font-weight: 500; margin: 0 0 12px 0;">E-Posta Adresinizi Doğrulayın</h2>
                <p style="font-size: 13px; color: #52525b; line-height: 1.6; margin: 0 0 24px 0;">
                    YILDIRIM hesabınız başarıyla oluşturuldu. Alışverişe başlamak ve siparişlerinizi yönetmek için lütfen e-posta adresinizi onaylayın.
                </p>
                <div style="text-align: left; margin: 24px 0;">
                    <a href="{confirmLink}" style="background-color: #18181b; color: #ffffff; padding: 12px 28px; border-radius: 9999px; text-decoration: none; font-size: 12px; font-weight: 500; display: inline-block;">
                        E-Postamı Doğrula
                    </a>
                </div>
            </div>
            <div style="border-top: 1px solid #f4f4f5; padding-top: 16px; font-size: 10px; color: #a1a1aa; font-family: monospace;">
                © {DateTime.UtcNow.Year} YILDIRIM. Tüm hakları saklıdır.
            </div>
        </div>
        """;

        await SendEmailInternalAsync(toEmail, subject, htmlBody, null, cancellationToken);
    }

    public async Task SendOrderConfirmationEmailAsync(
        string toEmail, 
        Order order, 
        byte[]? pdfInvoiceBytes = null, 
        CancellationToken cancellationToken = default)
    {
        var subject = $"Sipariş Onayı (#{order.OrderNumber}) - YILDIRIM";
        var turkishCulture = new CultureInfo("tr-TR");

        var htmlBody = $"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #18181b;">
            <div style="margin-bottom: 24px;">
                <h1 style="font-size: 20px; font-weight: 300; letter-spacing: -0.5px; margin: 0;">YILDIRIM</h1>
                <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #16a34a; margin-top: 4px;">Ödeme Onaylandı & Sipariş Alındı</p>
            </div>
            <div style="border-top: 1px solid #e4e4e7; padding-top: 24px; margin-bottom: 24px;">
                <h2 style="font-size: 16px; font-weight: 500; margin: 0 0 12px 0;">Siparişiniz Hazırlanıyor</h2>
                <p style="font-size: 13px; color: #52525b; line-height: 1.6; margin: 0 0 16px 0;">
                    Sayın müşterimiz, <strong>#{order.OrderNumber}</strong> numaralı siparişiniz başarıyla alınmış ve ödemesi Iyzico Sanal POS üzerinden tahsil edilmiştir.
                </p>
                <div style="background-color: #fafafa; border: 1px solid #f4f4f5; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                    <div style="font-size: 11px; color: #71717a; margin-bottom: 4px;">Toplam Sipariş Tutarı</div>
                    <div style="font-size: 18px; font-weight: 600; font-family: monospace;">₺{order.TotalAmount.ToString("N2", turkishCulture)}</div>
                    <div style="font-size: 11px; color: #71717a; margin-top: 8px;">Iyzico Referansı: {order.PaymentId ?? "Sanal POS Provizyonlu"}</div>
                </div>
                <p style="font-size: 12px; color: #71717a; line-height: 1.5;">
                    E-Arşiv faturanız sistemimiz tarafından oluşturulmuş olup bu e-postanın ekinde PDF olarak yer almaktadır.
                </p>
            </div>
            <div style="border-top: 1px solid #f4f4f5; padding-top: 16px; font-size: 10px; color: #a1a1aa; font-family: monospace;">
                © {DateTime.UtcNow.Year} YILDIRIM. Tüm hakları saklıdır.
            </div>
        </div>
        """;

        (string, byte[])? attachment = pdfInvoiceBytes != null 
            ? ($"Fatura-{order.OrderNumber}.pdf", pdfInvoiceBytes) 
            : null;

        await SendEmailInternalAsync(toEmail, subject, htmlBody, attachment, cancellationToken);
    }

    private async Task SendEmailInternalAsync(
        string toEmail, 
        string subject, 
        string htmlBody, 
        (string FileName, byte[] Data)? attachment = null, 
        CancellationToken cancellationToken = default)
    {
        if (IsSmtpConfigured)
        {
            try
            {
                var host = _configuration["Smtp:Host"]!;
                var port = int.Parse(_configuration["Smtp:Port"] ?? "587");
                var username = _configuration["Smtp:Username"]!;
                var password = _configuration["Smtp:Password"]!;
                var senderName = _configuration["Smtp:SenderName"] ?? "YILDIRIM";
                var senderEmail = _configuration["Smtp:SenderEmail"] ?? username;

                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(senderName, senderEmail));
                message.To.Add(new MailboxAddress(toEmail, toEmail));
                message.Subject = subject;

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = htmlBody
                };

                if (attachment.HasValue)
                {
                    bodyBuilder.Attachments.Add(
                        attachment.Value.FileName, 
                        attachment.Value.Data, 
                        ContentType.Parse("application/pdf"));
                }

                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();
                await client.ConnectAsync(host, port, SecureSocketOptions.StartTls, cancellationToken);
                await client.AuthenticateAsync(username, password, cancellationToken);
                await client.SendAsync(message, cancellationToken);
                await client.DisconnectAsync(true, cancellationToken);

                _logger.LogInformation("✅ [SMTP BAŞARILI] E-Posta gerçek gelen kutusuna iletildi: {ToEmail} | Konu: {Subject}", toEmail, subject);
                return;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "🚨 [SMTP HATASI] Gerçek e-posta gönderilemedi! Konsol fallback moduna geçiliyor: {ToEmail}", toEmail);
            }
        }

        // 🛡️ FALLBACK: Eğer SMTP girilmemişse veya hata verirse konsola güzelce yazdır:
        _logger.LogInformation("""
        ========================================================================
        📧 [E-POSTA FALLBACK] GERÇEK SMTP AYARLANMADIĞI İÇİN KONSOLA YAZILDI
        ------------------------------------------------------------------------
        Kime   : {ToEmail}
        Konu   : {Subject}
        Ek     : {Attachment}
        ========================================================================
        """, toEmail, subject, attachment.HasValue ? attachment.Value.FileName : "Yok");
    }
}

using EnterpriseECommerce.Domain.Entities;

namespace EnterpriseECommerce.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string toEmail, string resetToken, CancellationToken cancellationToken = default);
    Task SendEmailConfirmationAsync(string toEmail, string confirmationToken, CancellationToken cancellationToken = default);
    Task SendOrderConfirmationEmailAsync(string toEmail, Order order, byte[]? pdfInvoiceBytes = null, CancellationToken cancellationToken = default);
}

using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.Application.Orders.Events;
using EnterpriseECommerce.Domain.Enums;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EnterpriseECommerce.Application.Orders.Consumers;

// 🟢 2. ADIM (BAŞARILI SON): Ödeme alındıktan sonra siparişi "Paid" yapıp faturayı e-posta ile gönderen sınıf
public class PaymentCompletedConsumer : IConsumer<PaymentCompletedIntegrationEvent>
{
    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IInvoicePdfGenerator _pdfGenerator;
    private readonly ILogger<PaymentCompletedConsumer> _logger;

    public PaymentCompletedConsumer(
        IApplicationDbContext context, 
        IEmailService emailService,
        IInvoicePdfGenerator pdfGenerator,
        ILogger<PaymentCompletedConsumer> logger)
    {
        _context = context;
        _emailService = emailService;
        _pdfGenerator = pdfGenerator;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<PaymentCompletedIntegrationEvent> context)
    {
        var message = context.Message;

        var order = await _context.Orders
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == message.OrderId, context.CancellationToken);

        if (order != null)
        {
            order.Status = OrderStatus.Paid;
            order.PaymentId = message.PaymentId;
            await _context.SaveChangesAsync(context.CancellationToken);

            _logger.LogInformation("🎉 [SAGA TAMAMLANDI] Sipariş onaylandı ve durumu 'Paid' yapıldı! Sipariş No: {OrderNumber}, PaymentId: {PaymentId}", 
                message.OrderNumber, message.PaymentId);

            // 📧 Müşteriye Sipariş Onayı & PDF Fatura E-Postası Gönder:
            try
            {
                var pdfBytes = _pdfGenerator.GenerateInvoicePdf(order);
                await _emailService.SendOrderConfirmationEmailAsync(
                    order.CustomerEmail, 
                    order, 
                    pdfBytes, 
                    context.CancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "⚠️ [E-POSTA UYARISI] Sipariş onay e-postası gönderilirken hata oluştu: {OrderNumber}", order.OrderNumber);
            }
        }
    }
}

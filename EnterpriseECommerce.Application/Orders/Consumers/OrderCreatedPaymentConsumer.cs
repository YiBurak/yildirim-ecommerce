using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.Application.Orders.Events;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace EnterpriseECommerce.Application.Orders.Consumers;

// 💳 1. ADIM: Sipariş gelince gerçek banka servisiyle (IPaymentService) ödemeyi çeken Consumer
public class OrderCreatedPaymentConsumer : IConsumer<OrderCreatedIntegrationEvent>
{
    private readonly IPaymentService _paymentService;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<OrderCreatedPaymentConsumer> _logger;

    public OrderCreatedPaymentConsumer(
        IPaymentService paymentService,
        IPublishEndpoint publishEndpoint, 
        ILogger<OrderCreatedPaymentConsumer> logger)
    {
        _paymentService = paymentService;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<OrderCreatedIntegrationEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation("💳 [SAGA - BANKA ADIMI] {OrderNumber} için {Amount} TL tahsilat deneniyor...", message.OrderNumber, message.TotalAmount);

        try
        {
            // 🏦 Dış banka / sanal POS servisine bağlanıp ödemeyi çekiyoruz:
            var paymentResult = await _paymentService.ProcessPaymentAsync(
                message.OrderId, 
                message.TotalAmount, 
                message.PaymentCard,
                context.CancellationToken);

            if (paymentResult.IsSuccess)
            {
                _logger.LogInformation("✅ [SAGA - ÖDEME BAŞARILI] Banka ödemeyi onayladı: {OrderNumber}, PaymentId: {PaymentId}", 
                    message.OrderNumber, paymentResult.PaymentId);
                
                await _publishEndpoint.Publish(new PaymentCompletedIntegrationEvent
                {
                    OrderId = message.OrderId,
                    OrderNumber = message.OrderNumber,
                    CustomerEmail = message.CustomerEmail,
                    TotalAmount = message.TotalAmount,
                    PaymentId = paymentResult.PaymentId
                });
            }
            else
            {
                // Banka kart limiti yetersiz vs. dedi:
                await PublishPaymentFailedAsync(message, paymentResult.ErrorMessage ?? "Banka kart limitini yetersiz buldu veya işlemi reddetti.");
            }
        }
        catch (Exception ex)
        {
            // Ağ koptu, banka çöktü veya zaman aşımı oldu:
            _logger.LogError(ex, "❌ [SAGA - ÖDEME HATASI] Banka iletişiminde hata oluştu: {OrderNumber}", message.OrderNumber);
            await PublishPaymentFailedAsync(message, $"Banka servis hatası: {ex.Message}");
        }
    }

    private async Task PublishPaymentFailedAsync(OrderCreatedIntegrationEvent message, string reason)
    {
        _logger.LogWarning("❌ [SAGA - ÖDEME REDDEDİLDİ] {Reason} Telafi operasyonu tetikleniyor... (Sipariş: {OrderNumber})", reason, message.OrderNumber);
        
        // 🚨 SAGA TELAFİ TETİĞİ FIRLATILIYOR!
        await _publishEndpoint.Publish(new PaymentFailedIntegrationEvent
        {
            OrderId = message.OrderId,
            OrderNumber = message.OrderNumber,
            CustomerEmail = message.CustomerEmail,
            Reason = reason
        });
    }
}

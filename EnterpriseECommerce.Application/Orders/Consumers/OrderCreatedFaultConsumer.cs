using EnterpriseECommerce.Application.Orders.Events;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace EnterpriseECommerce.Application.Orders.Consumers;

// 🚨 HATA MASASI NÖBETÇİSİ (Dead Letter Queue Handler):
// 3 denemede de işlenemeyen mektupları karşılayan ve alarm çalan sınıf
public class OrderCreatedFaultConsumer : IConsumer<Fault<OrderCreatedIntegrationEvent>>
{
    private readonly ILogger<OrderCreatedFaultConsumer> _logger;

    public OrderCreatedFaultConsumer(ILogger<OrderCreatedFaultConsumer> logger)
    {
        _logger = logger;
    }

    public Task Consume(ConsumeContext<Fault<OrderCreatedIntegrationEvent>> context)
    {
        var originalMessage = context.Message.Message;
        var exceptions = context.Message.Exceptions;

        _logger.LogError(
            "🚨 [DEAD LETTER QUEUE / HATA KUYRUĞU] Dikkat! Sipariş mektubu tüm denemelere rağmen İŞLENEMEDİ! " +
            "Sipariş No: {OrderNumber} | Hata Sayısı: {Count} | Hata Mesajı: {ErrorMessage}",
            originalMessage.OrderNumber,
            exceptions.Length,
            exceptions.FirstOrDefault()?.Message);

        return Task.CompletedTask;
    }
}

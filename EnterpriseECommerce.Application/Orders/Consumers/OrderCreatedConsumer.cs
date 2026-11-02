using EnterpriseECommerce.Application.Orders.Events;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace EnterpriseECommerce.Application.Orders.Consumers;

// 👷 KUYRUK NÖBETÇİSİ (Consumer): RabbitMQ'dan gelen sipariş mektubunu okuyan görevli
public class OrderCreatedConsumer : IConsumer<OrderCreatedIntegrationEvent>
{
    private readonly ILogger<OrderCreatedConsumer> _logger;

    public OrderCreatedConsumer(ILogger<OrderCreatedConsumer> logger)
    {
        _logger = logger;
    }

    public Task Consume(ConsumeContext<OrderCreatedIntegrationEvent> context)
    {
        var message = context.Message;

        
        // Gerçek dünyada burada SendGrid/SMTP ile müşteriye şık bir HTML e-posta fırlatılır:
        _logger.LogInformation(
            "🐰📦 [RABBITMQ CONSUMER TETİKLENDİ] Kuyruktan mesaj çekildi! -> Sipariş No: {OrderNumber} | Alıcı: {Email} | Tutar: {Amount} TL",
            message.OrderNumber,
            message.CustomerEmail,
            message.TotalAmount);

        return Task.CompletedTask;
    }
}

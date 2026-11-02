using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace EnterpriseECommerce.Application.Orders.EventHandlers;

// 🛎️ GARSON: "OrderCreatedEvent" olayını dinleyen sınıf
public class OrderCreatedEventHandler : INotificationHandler<OrderCreatedEvent>
{
    private readonly ILogger<OrderCreatedEventHandler> _logger;
    private readonly INotificationService _notificationService;

    public OrderCreatedEventHandler(ILogger<OrderCreatedEventHandler> logger, INotificationService notificationService)
    {
        _logger = logger;
        _notificationService = notificationService;
    }

    public async Task Handle(OrderCreatedEvent notification, CancellationToken cancellationToken)
    {
        var order = notification.Order;

        // Gerçek hayatta burada SendGrid / SMTP ile e-posta atılır:
        _logger.LogInformation(
            "📧 [E-POSTA SERVİSİ] '{Email}' adresine '{OrderNumber}' numaralı sipariş için onay e-postası gönderildi! Toplam Tutar: {TotalAmount} TL",
            order.CustomerEmail,
            order.OrderNumber,
            order.TotalAmount);

        // 📢 SignalR ile canlı WebSocket bildirimini fırlat:
        await _notificationService.PublishOrderCreatedAsync(
            order.Id, 
            order.OrderNumber, 
            order.TotalAmount, 
            order.CustomerEmail, 
            cancellationToken);
    }
}

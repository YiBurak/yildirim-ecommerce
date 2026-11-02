using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace EnterpriseECommerce.Application.Orders.EventHandlers;

// 🛎️ GARSON: "OrderCancelledEvent" olayını dinleyen sınıf
public class OrderCancelledEventHandler : INotificationHandler<OrderCancelledEvent>
{
    private readonly ILogger<OrderCancelledEventHandler> _logger;
    private readonly INotificationService _notificationService;

    public OrderCancelledEventHandler(ILogger<OrderCancelledEventHandler> logger, INotificationService notificationService)
    {
        _logger = logger;
        _notificationService = notificationService;
    }

    public async Task Handle(OrderCancelledEvent notification, CancellationToken cancellationToken)
    {
        var order = notification.Order;

        // Gerçek hayatta burada banka API'sine "Parayı iade et (Refund)" emri verilir ve e-posta atılır:
        _logger.LogInformation(
            "🚫 [İPTAL VE İADE BİLDİRİMİ] '{Email}' müşterisine '{OrderNumber}' numaralı siparişin iptal edildiği bildirildi ve {TotalAmount} TL kartına iade edilmek üzere bankaya iletildi!",
            order.CustomerEmail,
            order.OrderNumber,
            order.TotalAmount);

        // 📢 SignalR ile sipariş durumunun iptal edildiğini duyur:
        await _notificationService.PublishOrderStatusChangedAsync(order.Id, "Cancelled", cancellationToken);
    }
}

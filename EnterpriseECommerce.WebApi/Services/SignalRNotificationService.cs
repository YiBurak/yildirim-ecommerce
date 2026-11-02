using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.WebApi.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace EnterpriseECommerce.WebApi.Services;

public class SignalRNotificationService : INotificationService
{
    private readonly IHubContext<CommerceHub> _hubContext;
    private readonly ILogger<SignalRNotificationService> _logger;

    public SignalRNotificationService(
        IHubContext<CommerceHub> hubContext, 
        ILogger<SignalRNotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    // 1. Herkese (All) stok güncellemesini duyur:
    public async Task PublishStockUpdatedAsync(Guid productId, int newStock, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("📢 [SignalR Broadcast] Ürün {ProductId} yeni stok: {NewStock}", productId, newStock);

        await _hubContext.Clients.All.SendAsync("ReceiveStockUpdated", new 
        { 
            productId, 
            newStock,
            timestamp = DateTime.UtcNow 
        }, cancellationToken);
    }

    // 2. Yeni sipariş bildirimini duyur:
    public async Task PublishOrderCreatedAsync(Guid orderId, string orderNumber, decimal totalAmount, string customerEmail, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("📢 [SignalR Broadcast] Yeni sipariş: {OrderNumber} - {TotalAmount} TL", orderNumber, totalAmount);

        await _hubContext.Clients.All.SendAsync("ReceiveOrderCreated", new
        {
            orderId,
            orderNumber,
            totalAmount,
            customerEmail,
            timestamp = DateTime.UtcNow
        }, cancellationToken);
    }

    // 3. Sipariş durum değişikliği (Örn: İptal edildi):
    public async Task PublishOrderStatusChangedAsync(Guid orderId, string newStatus, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("📢 [SignalR Broadcast] Sipariş {OrderId} yeni durum: {Status}", orderId, newStatus);

        await _hubContext.Clients.All.SendAsync("ReceiveOrderStatusChanged", new
        {
            orderId,
            status = newStatus,
            timestamp = DateTime.UtcNow
        }, cancellationToken);
    }
}

namespace EnterpriseECommerce.Application.Common.Interfaces;

public interface INotificationService
{
    // Stok değiştiğinde (Sipariş verilince veya Admin stok güncelleyince)
    Task PublishStockUpdatedAsync(Guid productId, int newStock, CancellationToken cancellationToken = default);

    // Yeni sipariş geldiğinde (Tüm sistem ve Admin'lerin ekranında anlık uyarı çıkması için)
    Task PublishOrderCreatedAsync(Guid orderId, string orderNumber, decimal totalAmount, string customerEmail, CancellationToken cancellationToken = default);

    // Sipariş iptal edildiğinde (Müşteriye ve Admin'e durum değişikliği)
    Task PublishOrderStatusChangedAsync(Guid orderId, string newStatus, CancellationToken cancellationToken = default);
}

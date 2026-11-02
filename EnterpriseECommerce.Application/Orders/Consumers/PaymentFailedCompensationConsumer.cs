using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.Application.Orders.Events;
using EnterpriseECommerce.Domain.Enums;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EnterpriseECommerce.Application.Orders.Consumers;

// 🚨 3. ADIM (TELAFİ - COMPENSATING TRANSACTION): 
// Ödeme patlarsa düşülen stokları rafa geri koyan ve siparişi PaymentFailed yapan kurtarma ekibi!
public class PaymentFailedCompensationConsumer : IConsumer<PaymentFailedIntegrationEvent>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<PaymentFailedCompensationConsumer> _logger;

    public PaymentFailedCompensationConsumer(
        IApplicationDbContext context, 
        ILogger<PaymentFailedCompensationConsumer> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<PaymentFailedIntegrationEvent> context)
    {
        var message = context.Message;

        _logger.LogWarning("🚨 [SAGA TELAFİ BAŞLADI] {OrderNumber} için stok iade süreci devrede! Sebep: {Reason}", message.OrderNumber, message.Reason);

        // 1. Siparişi ve sepetindeki ürünleri bul:
        var order = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == message.OrderId);

        if (order == null) return;

        // 2. Düşülen stokları tek tek mağazanın rafına GERİ EKLE!
        foreach (var item in order.Items)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == item.ProductId);
            if (product != null)
            {
                product.StockQuantity += item.Quantity; // 👈 STOKLAR KURTARILDI!
                _logger.LogInformation("🔄 [STOK İADE EDİLDİ] Ürün ID: {ProductId} | İade Edilen Adet: {Quantity} | Yeni Stok: {Stock}", 
                    product.Id, item.Quantity, product.StockQuantity);
            }
        }

        // 3. Sipariş durumunu PaymentFailed yap:
        order.Status = OrderStatus.PaymentFailed;
        await _context.SaveChangesAsync(context.CancellationToken);

        _logger.LogError("🛑 [SAGA TELAFİ BİTTİ] {OrderNumber} siparişi 'PaymentFailed' yapıldı, stoklar rafa geri kondu!", message.OrderNumber);
    }
}

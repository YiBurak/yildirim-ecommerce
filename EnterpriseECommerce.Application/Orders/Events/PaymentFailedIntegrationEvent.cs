namespace EnterpriseECommerce.Application.Orders.Events;

// 🔴 SAGA TELAFİ MEKTUBU: Ödeme patladığında stokları geri iade ettirecek olay
public record PaymentFailedIntegrationEvent
{
    public Guid OrderId { get; init; }
    public string OrderNumber { get; init; } = string.Empty;
    public string CustomerEmail { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty; // Reddedilme sebebi (örn: Yetersiz Bakiye)
}

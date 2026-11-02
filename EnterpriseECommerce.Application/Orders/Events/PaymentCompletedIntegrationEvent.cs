namespace EnterpriseECommerce.Application.Orders.Events;

// 🟢 SAGA BAŞARI MEKTUBU: Bankadan para çekildiğinde fırlatılacak olay
public record PaymentCompletedIntegrationEvent
{
    public Guid OrderId { get; init; }
    public string OrderNumber { get; init; } = string.Empty;
    public string CustomerEmail { get; init; } = string.Empty;
    public decimal TotalAmount { get; init; }
    public string? PaymentId { get; init; }
}

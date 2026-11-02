using EnterpriseECommerce.Application.Common.Models;

namespace EnterpriseECommerce.Application.Orders.Events;

// 📜 MEKTUP KAĞIDI: RabbitMQ kuyruğuna atacağımız hafif ve güvenli mesaj paketi
public record OrderCreatedIntegrationEvent
{
    public Guid OrderId { get; init; }
    public string OrderNumber { get; init; } = string.Empty;
    public string CustomerEmail { get; init; } = string.Empty;
    public decimal TotalAmount { get; init; }
    public PaymentCardDto? PaymentCard { get; init; }
    public DateTime CreatedAtUtc { get; init; }
}

using EnterpriseECommerce.Domain.Common;
using EnterpriseECommerce.Domain.Entities;

namespace EnterpriseECommerce.Domain.Events;

// Sipariş oluştuğunda fırlatılacak olay mektubu:
public record OrderCreatedEvent(
    Order Order,
    string? CardNumber = null,
    string? CardHolderName = null,
    string? ExpireMonth = null,
    string? ExpireYear = null,
    string? Cvc = null
) : IDomainEvent;

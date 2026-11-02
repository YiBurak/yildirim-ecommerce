using EnterpriseECommerce.Domain.Common;
using EnterpriseECommerce.Domain.Entities;
namespace EnterpriseECommerce.Domain.Events;
// Sipariş iptal edildiğinde fırlatılacak olay mektubu:
public record OrderCancelledEvent(Order Order) : IDomainEvent;

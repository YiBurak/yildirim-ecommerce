using EnterpriseECommerce.Application.Common.Models;

namespace EnterpriseECommerce.Application.Common.Interfaces;

public interface IPaymentService
{
    Task<PaymentResult> ProcessPaymentAsync(
        Guid orderId, 
        decimal amount, 
        PaymentCardDto? card = null, 
        CancellationToken cancellationToken = default);

    Task<bool> CancelPaymentAsync(
        string paymentId, 
        string? reason = null, 
        CancellationToken cancellationToken = default);
}
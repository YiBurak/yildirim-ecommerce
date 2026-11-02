namespace EnterpriseECommerce.Application.Common.Models;
public record PaymentResult(bool IsSuccess, string? PaymentId = null, string? ErrorMessage = null);
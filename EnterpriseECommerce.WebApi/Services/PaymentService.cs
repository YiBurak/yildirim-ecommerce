using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.Application.Common.Models;

namespace EnterpriseECommerce.WebApi.Services;

public class PaymentService : IPaymentService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<PaymentService> _logger;

    public PaymentService(HttpClient httpClient, ILogger<PaymentService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<PaymentResult> ProcessPaymentAsync(
        Guid orderId, 
        decimal amount, 
        PaymentCardDto? card = null, 
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("💳 [BANKA İSTEĞİ] {OrderId} numaralı sipariş için {Amount} TL ödeme çekiliyor...", orderId, amount);
        await Task.Delay(500, cancellationToken);
        var mockPaymentId = "MOCK-" + Guid.NewGuid().ToString()[..8];
        _logger.LogInformation("✅ [ÖDEME BAŞARILI] {OrderId} için {Amount} TL sanal POS ile başarıyla tahsil edildi! PaymentId: {PaymentId}", orderId, amount, mockPaymentId);
        return new PaymentResult(true, mockPaymentId);
    }

    public async Task<bool> CancelPaymentAsync(
        string paymentId, 
        string? reason = null, 
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("💳 [BANKA İPTAL İSTEĞİ] PaymentId: {PaymentId} için iptal işlemi yapılıyor...", paymentId);
        await Task.Delay(300, cancellationToken);
        _logger.LogInformation("✅ [İPTAL BAŞARILI] {PaymentId} başarıyla iptal edildi.", paymentId);
        return true;
    }
}

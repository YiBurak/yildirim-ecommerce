using EnterpriseECommerce.Application.Common.Models;
using System.Globalization;
using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.Persistence.Configurations;
using Iyzipay.Model;
using Iyzipay.Request;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using IyzipayOptions = Iyzipay.Options;

namespace EnterpriseECommerce.Persistence.Services;

public class IyzicoPaymentService : IPaymentService
{
    private readonly IyzipayOptions _iyzipayOptions;
    private readonly ILogger<IyzicoPaymentService> _logger;

    public IyzicoPaymentService(IOptions<IyzicoOptions> iyzicoOptions, ILogger<IyzicoPaymentService> logger)
    {
        _logger = logger;
        
        // Iyzico SDK'sının kendi Options nesnesini hazırlıyoruz:
        _iyzipayOptions = new IyzipayOptions
        {
            ApiKey = iyzicoOptions.Value.ApiKey,
            SecretKey = iyzicoOptions.Value.SecretKey,
            BaseUrl = iyzicoOptions.Value.BaseUrl
        };
    }

    public async Task<PaymentResult> ProcessPaymentAsync(
        Guid orderId, 
        decimal amount, 
        PaymentCardDto? card = null, 
        CancellationToken cancellationToken = default)
    {
        var rawCardNumber = card?.CardNumber ?? "5890040000000016";
        var cleanCardNumber = rawCardNumber.Replace(" ", "").Trim();
        var cardHolder = !string.IsNullOrWhiteSpace(card?.CardHolderName) ? card.CardHolderName : "BURAK YILDIRIM";
        
        var expireMonth = card?.ExpireMonth ?? "12";
        if (expireMonth.Contains('/'))
        {
            var parts = expireMonth.Split('/');
            expireMonth = parts[0].Trim();
        }
        var expireYear = card?.ExpireYear ?? "2030";
        if (expireYear.Length == 2) expireYear = $"20{expireYear}";
        var cvc = card?.Cvc ?? "123";

        var cardPrefix = cleanCardNumber.Length >= 4 ? cleanCardNumber[..4] : "••••";
        var cardSuffix = cleanCardNumber.Length >= 4 ? cleanCardNumber[^4..] : "••••";

        _logger.LogInformation("💳 [IYZICO] {OrderId} için {Amount} TL Sandbox isteği atılıyor... Kart: {Holder} ({Prefix} •••• {Suffix})", 
            orderId, amount, cardHolder, cardPrefix, cardSuffix);

        var amountStr = amount.ToString("F2", CultureInfo.InvariantCulture);

        // Iyzico ödeme isteği nesnesi
        var request = new CreatePaymentRequest
        {
            Locale = Locale.TR.ToString(),
            ConversationId = orderId.ToString(),
            Price = amountStr,
            PaidPrice = amountStr,
            Currency = Currency.TRY.ToString(),
            Installment = 1,
            BasketId = orderId.ToString(),
            PaymentChannel = PaymentChannel.WEB.ToString(),
            PaymentGroup = PaymentGroup.PRODUCT.ToString(),

            // 💳 MÜŞTERİNİN GİRDİĞİ VEYA SEÇTİĞİ DİNAMİK KART BİLGİLERİ:
            PaymentCard = new PaymentCard
            {
                CardHolderName = cardHolder,
                CardNumber = cleanCardNumber,
                ExpireMonth = expireMonth,
                ExpireYear = expireYear,
                Cvc = cvc,
                RegisterCard = 0
            },

            // 👤 Test Alıcı Bilgileri
            Buyer = new Buyer
            {
                Id = "BY-" + orderId.ToString()[..8],
                Name = "Test",
                Surname = "Kullanici",
                GsmNumber = "+905350000000",
                Email = "test@enterprise-ecommerce.com",
                IdentityNumber = "11111111110",
                RegistrationAddress = "Levent, İstanbul",
                Ip = "127.0.0.1",
                City = "Istanbul",
                Country = "Turkey"
            },

            // 📦 Teslimat Adresi
            ShippingAddress = new Address
            {
                ContactName = "Test Kullanici",
                City = "Istanbul",
                Country = "Turkey",
                Description = "Levent, İstanbul"
            },

            // 🧾 Fatura Adresi
            BillingAddress = new Address
            {
                ContactName = "Test Kullanici",
                City = "Istanbul",
                Country = "Turkey",
                Description = "Levent, İstanbul"
            },

            // 🛒 Sepet Kalemleri (Iyzico en az 1 kalem zorunlu kılar)
            BasketItems = new List<BasketItem>
            {
                new BasketItem
                {
                    Id = "ITEM-" + orderId.ToString()[..8],
                    Name = "Siparis Sepet Tutari",
                    Category1 = "Genel",
                    ItemType = BasketItemType.PHYSICAL.ToString(),
                    Price = amountStr
                }
            }
        };

        try
        {
            // Iyzico SDK'sı senkron çalıştığı için asenkron Task.Run ile sarmalıyoruz:
            var payment = await Task.Run(() => Payment.Create(request, _iyzipayOptions), cancellationToken);

            if (payment.Status == "success")
            {
                _logger.LogInformation("✅ [IYZICO BAŞARILI] Ödeme onaylandı! PaymentId: {PaymentId}, Sipariş: {OrderId}", payment.PaymentId, orderId);
                return new PaymentResult(true, payment.PaymentId);
            }
            else
            {
                _logger.LogWarning("❌ [IYZICO REDDETTİ] Hata Kodu: {ErrorCode}, Mesaj: {ErrorMessage}, Sipariş: {OrderId}", 
                    payment.ErrorCode, payment.ErrorMessage, orderId);
                return new PaymentResult(false, null, payment.ErrorMessage);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "🚨 [IYZICO BAĞLANTI HATASI] Iyzico API'sine erişirken hata oluştu! Sipariş: {OrderId}", orderId);
            throw;
        }
    }

    public async Task<bool> CancelPaymentAsync(
        string paymentId, 
        string? reason = null, 
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("💳 [IYZICO İPTAL İSTEĞİ] PaymentId: {PaymentId} için iptal/iade çağrısı yapılıyor...", paymentId);

        var request = new CreateCancelRequest
        {
            Locale = Locale.TR.ToString(),
            ConversationId = Guid.NewGuid().ToString(),
            PaymentId = paymentId,
            Ip = "127.0.0.1",
            Reason = reason ?? "Müşteri veya yönetici iptal talebi"
        };

        try
        {
            var cancel = await Task.Run(() => Cancel.Create(request, _iyzipayOptions), cancellationToken);

            if (cancel.Status == "success")
            {
                _logger.LogInformation("✅ [IYZICO İPTAL BAŞARILI] PaymentId: {PaymentId} başarıyla iptal edildi ve tutar karta iade edildi.", paymentId);
                return true;
            }
            else
            {
                _logger.LogWarning("❌ [IYZICO İPTAL REDDETTİ] PaymentId: {PaymentId}, Hata Kodu: {ErrorCode}, Mesaj: {ErrorMessage}",
                    paymentId, cancel.ErrorCode, cancel.ErrorMessage);
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "🚨 [IYZICO İPTAL HATASI] PaymentId: {PaymentId} iptal edilirken hata oluştu!", paymentId);
            throw;
        }
    }
}

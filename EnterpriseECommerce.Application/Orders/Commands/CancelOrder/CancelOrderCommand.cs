using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.Domain.Enums;
using EnterpriseECommerce.Application.Common.Security;
using MediatR;
using Microsoft.EntityFrameworkCore;
using EnterpriseECommerce.Domain.Entities;
using EnterpriseECommerce.Application.Common.Exceptions;
using EnterpriseECommerce.Domain.Events;
using Microsoft.Extensions.Logging;

namespace EnterpriseECommerce.Application.Orders.Commands.CancelOrder;

// 1. ZARF (Command): Sadece hangi siparişin iptal edileceğini bildirir
[Authorize]
public record CancelOrderCommand(Guid OrderId) : IRequest;

// 2. İŞÇİ (Handler): İptal, Iyzico iade ve stok telafi mantığını yürüten sınıf
public class CancelOrderCommandHandler : IRequestHandler<CancelOrderCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPaymentService _paymentService;
    private readonly ILogger<CancelOrderCommandHandler> _logger;

    public CancelOrderCommandHandler(
        IApplicationDbContext context, 
        ICurrentUserService currentUserService,
        IPaymentService paymentService,
        ILogger<CancelOrderCommandHandler> logger)
    {
        _context = context;
        _currentUserService = currentUserService;
        _paymentService = paymentService;
        _logger = logger;
    }

    public async Task Handle(CancelOrderCommand request, CancellationToken cancellationToken)
    {
        // 1. Adım: Siparişi KALEMLERİYLE (Items) birlikte çekiyoruz
        var order = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
        {
            throw new NotFoundException(nameof(Order), request.OrderId);
        }

        var isOwner = string.Equals(_currentUserService.Email, order.CustomerEmail, StringComparison.OrdinalIgnoreCase);
        var isAdmin = string.Equals(_currentUserService.Role, "Admin", StringComparison.OrdinalIgnoreCase);

        if (!isOwner && !isAdmin)
        {
            throw new ForbiddenAccessException();
        }

        // 2. Adım: Domain / İş Kuralı Kontrolleri
        if (order.Status == OrderStatus.Cancelled)
        {
            throw new BusinessException("Bu sipariş zaten daha önce iptal edilmiş!");
        }

        if (order.Status == OrderStatus.Shipped || order.Status == OrderStatus.Delivered)
        {
            throw new BusinessException("Kargoya verilmiş veya teslim edilmiş siparişler iptal edilemez!");
        }

        // 💳 3. Adım: EĞER SİPARİŞ ÖDENMİŞSE IYZICO'DAN KARTA PARAYI İADE ET (CANCEL/VOID):
        if (order.Status == OrderStatus.Paid && !string.IsNullOrWhiteSpace(order.PaymentId))
        {
            _logger.LogInformation("💳 [IYZICO İADE SÜRECİ] Sipariş {OrderNumber} iptal ediliyor. {PaymentId} nolu ödeme karta iade edilecek...", 
                order.OrderNumber, order.PaymentId);

            var cancelSuccess = await _paymentService.CancelPaymentAsync(
                order.PaymentId, 
                "Kullanıcı veya yönetici siparişi iptal etti", 
                cancellationToken);

            if (!cancelSuccess)
            {
                _logger.LogWarning("⚠️ [IYZICO İADE UYARISI] {OrderNumber} için Iyzico iade çağrısı onaylanamadı ancak sipariş iptaline devam ediliyor.", order.OrderNumber);
            }
        }

        // 4. Adım: İade edilecek ürünleri veritabanından tek sorguda çek ve stokları geri yükle
        var productIds = order.Items.Select(i => i.ProductId).ToList();
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync(cancellationToken);

        foreach (var item in order.Items)
        {
            var product = products.FirstOrDefault(p => p.Id == item.ProductId);
            if (product != null)
            {
                // Stok iadesi
                product.StockQuantity += item.Quantity;
            }
        }

        order.Status = OrderStatus.Cancelled;

        // 🏷️ Domain Event tetikle:
        order.AddDomainEvent(new OrderCancelledEvent(order));
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("✅ [SİPARİŞ İPTALİ TAMAMLANDI] {OrderNumber} başarıyla iptal edildi, para iadesi ve stok telafisi yapıldı.", order.OrderNumber);
    }
}

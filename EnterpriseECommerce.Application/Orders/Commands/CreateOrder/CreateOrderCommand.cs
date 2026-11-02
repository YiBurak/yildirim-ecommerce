using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.Domain.Entities;
using EnterpriseECommerce.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using EnterpriseECommerce.Application.Common.Exceptions;
using EnterpriseECommerce.Application.Common.Security; 
using EnterpriseECommerce.Domain.Events;


namespace EnterpriseECommerce.Application.Orders.Commands.CreateOrder;

[Authorize]
public record OrderItemDto(
    Guid ProductId,
    int Quantity
);

public record CreateOrderCommand(
    List<OrderItemDto> Items,
    EnterpriseECommerce.Application.Common.Models.PaymentCardDto? PaymentCard = null,
    Guid IdempotencyKey = default
) : IRequest<Guid>, IIdempotentCommand, ICacheInvalidatorRequest
{
    // Sipariş verildiği anda RAM'deki bayat ürün listesini anında patlat:
    public IReadOnlyCollection<string> CacheKeys => new[] 
    { 
        "products-p1-s10-qnone-min0-max0-sortnone" 
    };
}

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, Guid>
{
    private readonly IApplicationDbContext _context;
     private readonly ICurrentUserService _currentUserService; // 👈 3. Kullanıcı servisi enjekte edildi
     private readonly IDistributedLockService _lockService; // 👈 1. Kilit servisi eklendi
    public CreateOrderCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService, IDistributedLockService lockService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _lockService = lockService;
    }
    public async Task<Guid> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {

        var customerEmail = _currentUserService.Email 
            ?? throw new UnauthorizedAccessException("Sipariş oluşturmak için geçerli bir kullanıcı oturumu gereklidir.");
        var productIds = request.Items
            .Select(i => i.ProductId)
            .OrderBy(id => id)
            .ToList();
        // Alınan kilitleri hafızada tutacağız (iş bitince tek tek açmak için)
        var acquiredLocks = new List<string>();
        try
        {
            // 2. Adım: Sepetteki her ürün için kilidi almaya çalış
            foreach (var productId in productIds)
            {
                var lockKey = $"lock:product:{productId}";
                // 5 saniyeliğine kilidi almayı dene
                var isLockAcquired = await _lockService.TryAcquireLockAsync(
                    lockKey, 
                    TimeSpan.FromSeconds(5), 
                    cancellationToken);
                if (!isLockAcquired)
                {
                    // Kilit başkasındaysa, müşteriyi nazikçe uyar:
                    throw new BusinessException("Sepetinizdeki ürün şu anda başka bir sipariş tarafından işleniyor. Lütfen birkaç saniye sonra tekrar deneyin!");
                }
                // Kilidi aldık, listeye not et:
                acquiredLocks.Add(lockKey);
            }
        // 2. Adım: Bu ürünleri veritabanından tek bir sorguyla çek
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync(cancellationToken);
        // 3. Adım: Ürün sayısı eşleşiyor mu? (Olmayan ürün ID'si gönderilmiş olabilir)
        if (products.Count != productIds.Count)
        {
            throw new NotFoundException("Siparişteki bazı ürünler sistemde bulunamadı!");
        }
        // 4. Adım: Sipariş nesnesini hazırla
        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}",
            CustomerEmail = customerEmail,
            Status = OrderStatus.Pending,
            TotalAmount = 0
        };
        // 5. Adım: Her ürün için stok kontrolü yap, fiyatı hesapla ve stoğu düş
        foreach (var item in request.Items)
        {
            var product = products.First(p => p.Id == item.ProductId);
            // Stok yeterli mi kontrolü
            if (product.StockQuantity < item.Quantity)
            {
                throw new BusinessException($"'{product.Name}' adlı ürün için yetersiz stok! Mevcut stok: {product.StockQuantity}, İstenen: {item.Quantity}");
            }
            // Stoğu düş
            product.StockQuantity -= item.Quantity;
            // Kalemi oluştur (O anki güncel fiyatı snapshot olarak kaydediyoruz!)
            var orderItem = new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                ProductId = product.Id,
                UnitPrice = product.Price,
                Quantity = item.Quantity
            };
            order.Items.Add(orderItem);
            // Toplam tutara ekle
            order.TotalAmount += orderItem.UnitPrice * orderItem.Quantity;
        }
        // 6. Adım: Siparişi ekle ve tek seferde kaydet

        // 🏷️ Aşçı tabağa notu yapıştırıyor:
        order.AddDomainEvent(new OrderCreatedEvent(
            order,
            request.PaymentCard?.CardNumber,
            request.PaymentCard?.CardHolderName,
            request.PaymentCard?.ExpireMonth,
            request.PaymentCard?.ExpireYear,
            request.PaymentCard?.Cvc
        ));
        _context.Orders.Add(order);
        await _context.SaveChangesAsync(cancellationToken);
        
        return order.Id;
         }
        finally
        {
            // -------------------------------------------------------------
            // 🔓 TEMİZLİK BÖLGESİ (İşlem başarılı olsa da, patlasa da çalışır!)
            // -------------------------------------------------------------
            foreach (var lockKey in acquiredLocks)
            {
                await _lockService.ReleaseLockAsync(lockKey, cancellationToken);
            }
        }
    }
}

using EnterpriseECommerce.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using EnterpriseECommerce.Application.Common.Exceptions;
using EnterpriseECommerce.Domain.Entities;

namespace EnterpriseECommerce.Application.Products.Commands.UpdateProduct;

public record UpdateProductCommand(
    Guid Id,
    string Name,
    string Description,
    decimal Price,
    int StockQuantity,
    string Sku,
    Guid CategoryId,
    string? ImageUrl = null
) : IRequest, ICacheInvalidatorRequest
{
    // Temizlenecek anahtarlar: Bu ürünün tekil RAM kaydı!
    public IReadOnlyCollection<string> CacheKeys => new[] 
    { 
        $"product-{Id}",
        "products-p1-s10-qnone-min0-max0-sortnone" 
    };
}

public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand>
{ 
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notificationService;

    public UpdateProductCommandHandler(IApplicationDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (product == null)
        {
            throw new NotFoundException(nameof(Product), request.Id);
        }

        product.Name = request.Name;
        product.Description = request.Description;
        product.Price = request.Price;
        product.StockQuantity = request.StockQuantity;
        product.Sku = request.Sku;
        product.CategoryId = request.CategoryId;
        if (request.ImageUrl != null)
        {
            product.ImageUrl = request.ImageUrl;
        }
        product.UpdatedAt = DateTime.UtcNow; // Ne zaman güncellendiğini not alıyoruz!

        await _context.SaveChangesAsync(cancellationToken);

        // 📢 SignalR ile tüm bağlı ekranlara yeni stoğu anında canlı bildir:
        await _notificationService.PublishStockUpdatedAsync(product.Id, product.StockQuantity, cancellationToken);
    }
}
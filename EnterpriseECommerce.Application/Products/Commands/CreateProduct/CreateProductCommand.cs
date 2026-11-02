using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.Domain.Entities;
using MediatR;

namespace EnterpriseECommerce.Application.Products.Commands.CreateProduct;

public record CreateProductCommand(
    string Name,
    string Description,
    decimal Price,
    int StockQuantity,
    string Sku,
    Guid CategoryId,
    string? ImageUrl = null
) : IRequest<Guid>, ICacheInvalidatorRequest
{
    // ⚡ Vitrin önbellek anahtarını silecek dizi:
    public IReadOnlyCollection<string> CacheKeys => new[]
    {
        "products-p1-s10-qnone-min0-max0-sortnone"
    };
}

public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CreateProductCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            StockQuantity = request.StockQuantity,
            Sku = request.Sku,
            CategoryId = request.CategoryId,
            ImageUrl = request.ImageUrl
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync(cancellationToken);

        return product.Id;
    }
}

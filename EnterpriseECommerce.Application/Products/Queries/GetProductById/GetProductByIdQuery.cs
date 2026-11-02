using EnterpriseECommerce.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseECommerce.Application.Products.Queries.GetProductById;

// 1. DTO (Müşterinin göreceği detaylı ürün kartı - Kategori adıyla beraber!)
public record ProductDetailsDto(
    Guid Id,
    string Name,
    string Description,
    decimal Price,
    int StockQuantity,
    string Sku,
    Guid CategoryId,
    string? CategoryName,
    DateTime CreatedAt,
    string? ImageUrl = null
);

// 2. SORU ZARFI (İçine aradığımız ürünün ID'sini koyuyoruz)
// Sonunda '?' var çünkü veritabanında bu ID'ye sahip ürün YOKSA null dönebilir!
public record GetProductByIdQuery(Guid Id) : IRequest<ProductDetailsDto?>, ICacheableRequest
{
    // RAM'deki benzersiz kimliği (Örnek: "product-3fa85f64-5717-4562-b3fc-2c963f66afa6")
    public string CacheKey => $"product-{Id}";
    // RAM'de ne kadar kalsın? (Örnek: 10 dakika)
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}


// 3. USTA (Kilerde arama yapan kişi)
public class GetProductByIdQueryHandler : IRequestHandler<GetProductByIdQuery, ProductDetailsDto?>
{
    private readonly IApplicationDbContext _context;

    

    public GetProductByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProductDetailsDto?> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
    {
        return await _context.Products
            .AsNoTracking()
            .Where(p => p.Id == request.Id)
            .Select(p => new ProductDetailsDto(
                p.Id,
                p.Name,
                p.Description,
                p.Price,
                p.StockQuantity,
                p.Sku,
                p.CategoryId,
                p.Category != null ? p.Category.Name : null,
                p.CreatedAt,
                p.ImageUrl
            ))
            .FirstOrDefaultAsync(cancellationToken);
    }
}

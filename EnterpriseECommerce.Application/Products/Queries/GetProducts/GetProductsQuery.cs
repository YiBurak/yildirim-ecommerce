using EnterpriseECommerce.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using EnterpriseECommerce.Application.Common.Models;

namespace EnterpriseECommerce.Application.Products.Queries.GetProducts;

// 1. DTO (Müşterinin göreceği temiz ürün kartı)
public record ProductDto(
    Guid Id,
    string Name,
    string Description,
    decimal Price,
    int StockQuantity,
    string Sku,
    Guid CategoryId,
    DateTime CreatedAt,
    string? ImageUrl = null
);

// 2. SORU ZARFI
public record GetProductsQuery(
    int PageNumber = 1,
    int PageSize = 10,
    string? SearchTerm = null,
    Guid? CategoryId = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    string? SortBy = null // "price_asc", "price_desc", "name_asc", "name_desc", "date_asc"
) : IRequest<PagedResult<ProductDto>>, ICacheableRequest
{
    public string CacheKey => 
        $"products-p{PageNumber}-s{PageSize}-q{SearchTerm ?? "none"}-min{MinPrice?.ToString() ?? "0"}-max{MaxPrice?.ToString() ?? "0"}-sort{SortBy ?? "none"}";
        public TimeSpan? Expiration => TimeSpan.FromMinutes(2);
}

// 3. USTA (Veritabanından ürünleri okuyan kişi)
public class GetProductsQueryHandler : IRequestHandler<GetProductsQuery, PagedResult<ProductDto>>
{
    private readonly IApplicationDbContext _context;

    public GetProductsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<ProductDto>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Products.AsNoTracking();


        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(term) || p.Description.ToLower().Contains(term));
        }

         if (request.CategoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == request.CategoryId.Value);
        }

         if (request.MinPrice.HasValue)
        {
            query = query.Where(p => p.Price >= request.MinPrice.Value);
        }
        if (request.MaxPrice.HasValue)
        {
            query = query.Where(p => p.Price <= request.MaxPrice.Value);
        }

         query = request.SortBy?.ToLower() switch
        {
            "price_asc" => query.OrderBy(p => p.Price),
            "price_desc" => query.OrderByDescending(p => p.Price),
            "name_asc" => query.OrderBy(p => p.Name),
            "name_desc" => query.OrderByDescending(p => p.Name),
            "date_asc" => query.OrderBy(p => p.CreatedAt),
            _ => query.OrderByDescending(p => p.CreatedAt) // Varsayılan: En yeni eklenen en başta
        };
        // 6. ADIM: Filtrelenmiş TOPLAM kayıt sayısı
        // ⚠️ Çok Önemli: Bu Count, yukarıdaki filtrelere uyan toplam kayıt sayısını döner!
        var totalCount = await query.CountAsync(cancellationToken);
        // 7. ADIM: Sadece istenen sayfadaki kayıtları çek (Sayfalama ve Projeksiyon)
        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new ProductDto(
                p.Id,
                p.Name,
                p.Description,
                p.Price,
                p.StockQuantity,
                p.Sku,
                p.CategoryId,
                p.CreatedAt,
                p.ImageUrl
            ))
            .ToListAsync(cancellationToken);
        return new PagedResult<ProductDto>(items, totalCount, request.PageNumber, request.PageSize);
    }
}


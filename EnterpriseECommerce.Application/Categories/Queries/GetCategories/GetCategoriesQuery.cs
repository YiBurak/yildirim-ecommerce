using EnterpriseECommerce.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseECommerce.Application.Categories.Queries.GetCategories;

// 1. DTO (Dışarıya döneceğimiz temiz veri)
public record CategoryDto(Guid Id, string Name, string Description);

// 2. Query
public record GetCategoriesQuery : IRequest<List<CategoryDto>>;

// 3. Handler
public class GetCategoriesQueryHandler : IRequestHandler<GetCategoriesQuery, List<CategoryDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCategoriesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CategoryDto>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        return await _context.Categories
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Description))
            .ToListAsync(cancellationToken);
    }
}

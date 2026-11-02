using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseECommerce.Application.Categories.Commands.CreateCategory;

// 1. Command
public record CreateCategoryCommand(string Name, string Description) : IRequest<Guid>;

// 2. Handler
public class CreateCategoryCommandHandler : IRequestHandler<CreateCategoryCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CreateCategoryCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        var normalizedName = request.Name.Trim();

        // Aynı isimde kategori var mı kontrol et:
        var exists = await _context.Categories
            .AnyAsync(c => c.Name.ToLower() == normalizedName.ToLower(), cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException($"'{normalizedName}' adında bir kategori zaten mevcut!");
        }

        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = normalizedName,
            Description = request.Description?.Trim() ?? string.Empty
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync(cancellationToken);

        return category.Id;
    }
}

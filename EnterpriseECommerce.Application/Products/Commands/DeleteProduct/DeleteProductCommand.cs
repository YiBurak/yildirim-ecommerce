using EnterpriseECommerce.Application.Common.Exceptions;
using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using EnterpriseECommerce.Application.Common.Security;



namespace EnterpriseECommerce.Application.Products.Commands.DeleteProduct;


[Authorize(Roles = "Admin")] 
public record DeleteProductCommand(Guid Id) : IRequest, ICacheInvalidatorRequest
{
    // Ürün silindiğinde de RAM'deki eski kaydı çöpe atılsın
    public IReadOnlyCollection<string> CacheKeys => [$"product-{Id}"];
}


public class DeleteProductCommandHandler : IRequestHandler<DeleteProductCommand>
{
    private readonly IApplicationDbContext _context;
    public DeleteProductCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

     public async Task Handle(DeleteProductCommand request, CancellationToken cancellationToken)
    {
        // 1. Ürünü bul
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);
        // 2. Ürün yoksa false dön (Garson 404 versin)
        if (product == null)
        {
            throw new NotFoundException(nameof(Product), request.Id);
        }
        // 3. FİZİKSEL SİLMİYORUZ! Sadece Soft Delete yapıyoruz:
        product.IsDeleted = true;
        product.UpdatedAt = DateTime.UtcNow;
        // 4. Değişikliği kaydet
        await _context.SaveChangesAsync(cancellationToken);
        
    }
}

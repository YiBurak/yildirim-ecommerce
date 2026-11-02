using EnterpriseECommerce.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using EnterpriseECommerce.Application.Common.Exceptions;
using EnterpriseECommerce.Application.Common.Security;
using EnterpriseECommerce.Domain.Entities;


namespace EnterpriseECommerce.Application.Orders.Queries.GetOrderById;
public record OrderItemDetailDto(
    Guid ProductId,
    string ProductName,
    decimal UnitPrice,
    int Quantity,
    decimal TotalPrice
);

public record OrderDetailDto(
    Guid Id,
    string OrderNumber,
    string CustomerEmail,
    decimal TotalAmount,
    string Status,
    DateTime CreatedAt,
    List<OrderItemDetailDto> Items
);
[Authorize]
public record GetOrderByIdQuery(Guid Id) : IRequest<OrderDetailDto>;


public class GetOrderByIdQueryHandler : IRequestHandler<GetOrderByIdQuery, OrderDetailDto?>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    public GetOrderByIdQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }
    
    public async Task<OrderDetailDto?> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .AsNoTracking()
            .Where(o => o.Id == request.Id)
            .Select(o => new OrderDetailDto(
                o.Id,
                o.OrderNumber,
                o.CustomerEmail,
                o.TotalAmount,
                o.Status.ToString(),
                o.CreatedAt,
                o.Items.Select(i => new OrderItemDetailDto(
                    i.ProductId,
                    i.Product != null ? i.Product.Name : "Bilinmeyen Ürün",
                    i.UnitPrice,
                    i.Quantity,
                    i.UnitPrice * i.Quantity
                )).ToList()
            ))
            .FirstOrDefaultAsync(cancellationToken);

         if (order == null)
    {
        throw new NotFoundException(nameof(Order), request.Id);
    }
    // 3. ADIM: Güvenlik Kontrolü - Bu kişi siparişin sahibi mi yoksa Admin mi?
        var isOwner = string.Equals(_currentUserService.Email, order.CustomerEmail, StringComparison.OrdinalIgnoreCase);
        var isAdmin = string.Equals(_currentUserService.Role, "Admin", StringComparison.OrdinalIgnoreCase);
        // Eğer ne Admin ne de siparişin sahibi ise kapıdan kov (403 Forbidden)!
        if (!isAdmin && !isOwner)
        {
            throw new ForbiddenAccessException("Size ait olmayan bir siparişin detaylarını görüntüleyemezsiniz!");
        }
        // 4. ADIM: Her şey güvenliyse siparişi teslim et!
        return order;
        }
}
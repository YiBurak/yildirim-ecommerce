using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.Application.Common.Security;
using EnterpriseECommerce.Application.Orders.Queries.GetOrderById;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseECommerce.Application.Orders.Queries.GetAllOrders;

// 1. SADECE ADMIN OLANLAR ÇAĞIRABİLİR (RBAC GÜVENLİK ZIRHI):
[Authorize(Roles = "Admin")]
public record GetAllOrdersQuery : IRequest<List<OrderDetailDto>>;

// 2. TÜM SİPARİŞLERİ VERİTABANINDAN GETİREN İŞÇİ:
public class GetAllOrdersQueryHandler : IRequestHandler<GetAllOrdersQuery, List<OrderDetailDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAllOrdersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<OrderDetailDto>> Handle(GetAllOrdersQuery request, CancellationToken cancellationToken)
    {
        return await _context.Orders
            .AsNoTracking()
            .OrderByDescending(o => o.CreatedAt) // En yeni sipariş en başta
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
            .ToListAsync(cancellationToken);
    }
}

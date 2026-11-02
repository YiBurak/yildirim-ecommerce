using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.Application.Common.Security;
using EnterpriseECommerce.Application.Orders.Queries.GetOrderById;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseECommerce.Application.Orders.Queries.GetMyOrders;

// 1. GİRİŞ YAPMAYAN KULLANICI BURAYA BAKAMAZ:
[Authorize]
public record GetMyOrdersQuery : IRequest<List<OrderDetailDto>>;

// 2. KULLANICININ SİPARİŞLERİNİ BULAN İŞÇİ:
public class GetMyOrdersQueryHandler : IRequestHandler<GetMyOrdersQuery, List<OrderDetailDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyOrdersQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<OrderDetailDto>> Handle(GetMyOrdersQuery request, CancellationToken cancellationToken)
    {
        var userEmail = _currentUserService.Email;
        if (string.IsNullOrEmpty(userEmail))
        {
            return new List<OrderDetailDto>();
        }

        // Sadece giriş yapan kullanıcının siparişlerini en yeni tarihten eskiye doğru çekiyoruz:
        return await _context.Orders
            .AsNoTracking()
            .Where(o => o.CustomerEmail == userEmail)
            .OrderByDescending(o => o.CreatedAt)
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

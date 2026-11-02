using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.Application.Common.Security;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseECommerce.Application.Auth.Queries.GetMe;

// 1. DTO (Kullanıcının göreceği profil kartı)
public record UserProfileDto(
    Guid Id,
    string Email,
    string FullName,
    string Role,
    DateTime CreatedAt,
    int TotalOrdersCount
);

// 2. GİRİŞ YAPMAYAN BURAYA BAKAMAZ:
[Authorize]
public record GetMeQuery : IRequest<UserProfileDto>;

// 3. PROFİL BİLGİLERİNİ VE SİPARİŞ SAYISINI HESAPLAYAN İŞÇİ:
public class GetMeQueryHandler : IRequestHandler<GetMeQuery, UserProfileDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMeQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<UserProfileDto> Handle(GetMeQuery request, CancellationToken cancellationToken)
    {
        var email = _currentUserService.Email;
        if (string.IsNullOrEmpty(email))
        {
            throw new UnauthorizedAccessException("Giriş yapılmış bir kullanıcı bulunamadı!");
        }

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

        if (user == null)
        {
            throw new UnauthorizedAccessException("Kullanıcı veritabanında bulunamadı!");
        }

        // Kullanıcının bugüne kadar verdiği toplam sipariş sayısını sayıyoruz:
        var totalOrders = await _context.Orders
            .CountAsync(o => o.CustomerEmail == email, cancellationToken);

        return new UserProfileDto(
            Id: user.Id,
            Email: user.Email,
            FullName: $"{user.FirstName} {user.LastName}",
            Role: user.Role.ToString(),
            CreatedAt: user.CreatedAt,
            TotalOrdersCount: totalOrders
        );
    }
}

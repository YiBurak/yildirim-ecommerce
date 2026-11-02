using EnterpriseECommerce.Application.Auth.Commands.Login;
using EnterpriseECommerce.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseECommerce.Application.Auth.Commands.RefreshToken;

public record RefreshTokenCommand(string RefreshToken) : IRequest<AuthResponseDto>;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResponseDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public RefreshTokenCommandHandler(
        IApplicationDbContext context, 
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _context = context;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponseDto> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        // 1. Bu Refresh Token kime ait?
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken, cancellationToken);

        // Güvenlik kontrolü: Kullanıcı yoksa veya anahtarın süresi bitmişse reddet!
        if (user == null || user.RefreshTokenExpiresOnUtc <= DateTime.UtcNow)
        {
            throw new UnauthorizedAccessException("Geçersiz veya süresi dolmuş Refresh Token! Lütfen tekrar giriş yapın.");
        }

        // 2. 🔄 REFRESH TOKEN ROTASYONU (Eski anahtarı çöpe at, yepyeni iki anahtar üret!):
        var newAccessToken = _jwtTokenGenerator.GenerateToken(user);
        var newRefreshToken = _jwtTokenGenerator.GenerateRefreshToken();
        var newExpiry = DateTime.UtcNow.AddDays(7);

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiresOnUtc = newExpiry;
        await _context.SaveChangesAsync(cancellationToken);

        return new AuthResponseDto(
            AccessToken: newAccessToken,
            RefreshToken: newRefreshToken,
            RefreshTokenExpiresOnUtc: newExpiry,
            Email: user.Email,
            FullName: $"{user.FirstName} {user.LastName}",
            Role: user.Role.ToString()
        );
    }
}

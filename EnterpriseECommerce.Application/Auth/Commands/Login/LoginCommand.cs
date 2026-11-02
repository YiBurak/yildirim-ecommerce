using EnterpriseECommerce.Application.Common.Exceptions;
using EnterpriseECommerce.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseECommerce.Application.Auth.Commands.Login;

// 1. MÜŞTERİYE DÖNECEK CEVAP PAKETİ (İki anahtar birden veriyoruz):
public record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    DateTime RefreshTokenExpiresOnUtc,
    string Email,
    string FullName,
    string Role
);

// 2. ZARF (Command): Giriş formu verileri
public record LoginCommand(
    string Email,
    string Password
) : IRequest<AuthResponseDto>;

// 3. İŞÇİ (Handler): Şifreyi doğrulayıp hem Access hem Refresh Token üreten usta
public class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResponseDto>
{
    private readonly IApplicationDbContext _context;
        private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public LoginCommandHandler(
        IApplicationDbContext context, 
        IPasswordHasher passwordHasher, 
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);

        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new BusinessException("E-posta veya şifre hatalı!");
        }
        if (!user.IsEmailConfirmed)
        {
            throw new BusinessException("E-posta adresiniz henüz doğrulanmamıştır. Lütfen e-postanıza gönderilen doğrulama bağlantısına tıklayın.");
        }


        // 1. 15 dakikalık kısa ömürlü JWT üret:
        var accessToken = _jwtTokenGenerator.GenerateToken(user);

        // 2. 7 günlük gizli yedek anahtar (Refresh Token) üret:
        var refreshToken = _jwtTokenGenerator.GenerateRefreshToken();
        var expiry = DateTime.UtcNow.AddDays(7);

        // 3. Bu yedek anahtarı kullanıcının veritabanı kaydına yaz:
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiresOnUtc = expiry;
        await _context.SaveChangesAsync(cancellationToken);

        // 4. Müşteriye iki anahtarı da teslim et:
        return new AuthResponseDto(
            AccessToken: accessToken,
            RefreshToken: refreshToken,
            RefreshTokenExpiresOnUtc: expiry,
            Email: user.Email,
            FullName: $"{user.FirstName} {user.LastName}",
            Role: user.Role.ToString()
        );
    }
}

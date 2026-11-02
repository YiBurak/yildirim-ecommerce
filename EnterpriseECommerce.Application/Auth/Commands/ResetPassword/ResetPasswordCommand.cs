using EnterpriseECommerce.Application.Common.Exceptions;
using EnterpriseECommerce.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseECommerce.Application.Auth.Commands.ResetPassword;

public record ResetPasswordCommand(string Email, string Token, string NewPassword) : IRequest;

public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public ResetPasswordCommandHandler(IApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLower();
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email, cancellationToken);

        // 1. Kullanıcı var mı ve Token eşleşiyor mu?
        if (user == null || string.IsNullOrEmpty(user.PasswordResetToken) || user.PasswordResetToken != request.Token)
        {
            throw new BusinessException("Şifre sıfırlama linki geçersiz veya hatalı!");
        }

        // 2. Token'ın 15 dakikalık süresi dolmuş mu?
        if (user.PasswordResetExpiresAt == null || user.PasswordResetExpiresAt < DateTime.UtcNow)
        {
            throw new BusinessException("Şifre sıfırlama linkinin süresi dolmuş. Lütfen yeniden talep edin.");
        }

        // 3. Yeni şifreyi kriptografik olarak hash'le:
        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);

        // 4. Güvenlik: Kullanılan token'ı imha et (Tekrar kullanılamasın!):
        user.PasswordResetToken = null;
        user.PasswordResetExpiresAt = null;

        // 5. Güvenlik: Eski cihazlardaki tüm aktif oturumları iptal et (Session Invalidation):
        user.RefreshToken = null;

        await _context.SaveChangesAsync(cancellationToken);
    }
}

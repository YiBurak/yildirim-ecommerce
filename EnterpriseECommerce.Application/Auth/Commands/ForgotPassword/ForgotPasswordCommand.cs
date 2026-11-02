using EnterpriseECommerce.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace EnterpriseECommerce.Application.Auth.Commands.ForgotPassword;

public record ForgotPasswordCommand(string Email) : IRequest<string>;

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, string>
{
    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public ForgotPasswordCommandHandler(IApplicationDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task<string> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLower();
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email, cancellationToken);

        // 🛡️ Hesap Tarama Koruması: Kullanıcı yoksa bile hacker'a belli etme!
        if (user == null)
        {
            return "Eğer bu e-posta adresi sistemimizde kayıtlıysa, şifre sıfırlama linki gönderilmiştir.";
        }

        // 🎲 Kriptografik rastgele güvenli 32 baytlık tek kullanımlık token üret:
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

        // 🕰️ Token'a tam 15 dakika ömür biç:
        user.PasswordResetToken = token;
        user.PasswordResetExpiresAt = DateTime.UtcNow.AddMinutes(15);

        await _context.SaveChangesAsync(cancellationToken);

        // 📧 E-postayı fırlat:
        await _emailService.SendPasswordResetEmailAsync(user.Email, token, cancellationToken);

        return "Eğer bu e-posta adresi sistemimizde kayıtlıysa, şifre sıfırlama linki gönderilmiştir.";
    }
}

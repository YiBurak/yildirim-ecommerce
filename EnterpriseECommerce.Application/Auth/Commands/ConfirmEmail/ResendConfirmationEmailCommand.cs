using EnterpriseECommerce.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace EnterpriseECommerce.Application.Auth.Commands.ConfirmEmail;

public record ResendConfirmationEmailCommand(string Email) : IRequest<string>;

public class ResendConfirmationEmailCommandHandler : IRequestHandler<ResendConfirmationEmailCommand, string>
{
    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public ResendConfirmationEmailCommandHandler(IApplicationDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task<string> Handle(ResendConfirmationEmailCommand request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLower();
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email, cancellationToken);

        // Kullanıcı yoksa veya e-postası zaten onaylanmışsa bile güvenlik gereği genel bilgi mesajı dön:
        if (user == null || user.IsEmailConfirmed)
        {
            return "Eğer bu e-posta adresi sistemimizde kayıtlı ve henüz onaylanmamışsa, yeni doğrulama linki gönderildi.";
        }

        // Yeni tek kullanımlık kriptografik onay kodu üret:
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        user.EmailConfirmationToken = token;

        await _context.SaveChangesAsync(cancellationToken);

        // Yeni linki içeren e-postayı fırlat:
        await _emailService.SendEmailConfirmationAsync(user.Email, token, cancellationToken);

        return "Yeni e-posta doğrulama bağlantısı başarıyla adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.";
    }
}


using EnterpriseECommerce.Application.Common.Exceptions;
using EnterpriseECommerce.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseECommerce.Application.Auth.Commands.ConfirmEmail;

public record ConfirmEmailCommand(string Email, string Token) : IRequest<string>;

public class ConfirmEmailCommandHandler : IRequestHandler<ConfirmEmailCommand, string>
{
    private readonly IApplicationDbContext _context;

    public ConfirmEmailCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<string> Handle(ConfirmEmailCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);

        if (user == null || string.IsNullOrEmpty(user.EmailConfirmationToken) || user.EmailConfirmationToken != request.Token)
        {
            throw new BusinessException("Geçersiz veya süresi dolmuş e-posta doğrulama bağlantısı.");
        }

        // Onayla ve tek kullanımlık token'ı imha et:
        user.IsEmailConfirmed = true;
        user.EmailConfirmationToken = null;

        await _context.SaveChangesAsync(cancellationToken);

        return "Tebrikler! E-posta adresiniz başarıyla doğrulandı. Şimdi güvenle giriş yapabilirsiniz.";
    }
}

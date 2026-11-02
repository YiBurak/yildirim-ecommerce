using EnterpriseECommerce.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseECommerce.Application.Auth.Commands.RevokeToken;

public record RevokeTokenCommand(string RefreshToken) : IRequest;

public class RevokeTokenCommandHandler : IRequestHandler<RevokeTokenCommand>
{
    private readonly IApplicationDbContext _context;

    public RevokeTokenCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(RevokeTokenCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken, cancellationToken);

        if (user != null)
        {
            // Anahtarı veritabanından siliyoruz (REVOKE!):
            user.RefreshToken = null;
            user.RefreshTokenExpiresOnUtc = null;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}

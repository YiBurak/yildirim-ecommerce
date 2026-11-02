using System.Security.Cryptography;
using EnterpriseECommerce.Application.Common.Exceptions;
using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.Domain.Entities;
using EnterpriseECommerce.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseECommerce.Application.Auth.Commands.Register;

public record RegisterCommand(
    string Email,
    string Password,
    string FirstName,
    string LastName
) : IRequest<Guid>;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailService _emailService;

    public RegisterCommandHandler(
        IApplicationDbContext context, 
        IPasswordHasher passwordHasher,
        IEmailService _emailService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        this._emailService = _emailService;
    }

    public async Task<Guid> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var emailExists = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);

        if (emailExists)
        {
            throw new BusinessException($"'{request.Email}' adresiyle kayıtlı bir kullanıcı zaten mevcut!");
        }

        var passwordHash = _passwordHasher.HashPassword(request.Password);
        
        // 🔑 32-byte kriptografik rastgele onay kodu üret:
        var confirmationToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email.Trim().ToLower(),
            PasswordHash = passwordHash,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Role = UserRole.Customer,
            IsEmailConfirmed = false,
            EmailConfirmationToken = confirmationToken
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        // 📧 Doğrulama e-postasını simüle et / gönder:
        await _emailService.SendEmailConfirmationAsync(user.Email, confirmationToken, cancellationToken);

        return user.Id;
    }
}

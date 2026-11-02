using System.Reflection;
using EnterpriseECommerce.Application.Common.Exceptions;
using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.Application.Common.Security;
using MediatR;

namespace EnterpriseECommerce.Application.Common.Behaviors;

public class AuthorizationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ICurrentUserService _currentUserService;

    public AuthorizationBehavior(ICurrentUserService currentUserService)
    {
        _currentUserService = currentUserService;
    }

    public async Task<TResponse> Handle(
        TRequest request, 
        RequestHandlerDelegate<TResponse> next, 
        CancellationToken cancellationToken)
    {
        // 1. Adım: Çalıştırılmak istenen komutun (TRequest) tepesinde [Authorize] etiketi var mı?
        var authorizeAttributes = request.GetType().GetCustomAttributes<AuthorizeAttribute>().ToList();

        if (authorizeAttributes.Any())
        {
            // 2. Adım: Etiket varsa, KULLANICI GİRİŞ YAPMIŞ MI?
            if (!_currentUserService.IsAuthenticated)
            {
                throw new UnauthorizedAccessException("Bu işlemi gerçekleştirmek için giriş yapmalısınız.");
            }

            // 3. Adım: Rol Kontrolü (Roles = "Admin,Manager" gibi kısıtlar var mı?)
            var authorizeAttributesWithRoles = authorizeAttributes
                .Where(a => !string.IsNullOrWhiteSpace(a.Roles));

            if (authorizeAttributesWithRoles.Any())
            {
                var userRole = _currentUserService.Role;
                var authorized = false;

                foreach (var roles in authorizeAttributesWithRoles.Select(a => a.Roles.Split(',')))
                {
                    foreach (var role in roles)
                    {
                        if (string.Equals(userRole, role.Trim(), StringComparison.OrdinalIgnoreCase))
                        {
                            authorized = true;
                            break;
                        }
                    }
                }

                // Rol tutmuyorsa: 403 Forbidden!
                if (!authorized)
                {
                    throw new ForbiddenAccessException("Bu işlemi gerçekleştirmek için yetkiniz bulunmamaktadır.");
                }
            }
        }

        // Yetki tamsa (veya kural yoksa) komutu Handler'a teslim et:
        return await next();
    }
}

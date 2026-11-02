using System.Security.Claims;
using EnterpriseECommerce.Application.Common.Interfaces;

namespace EnterpriseECommerce.WebApi.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
     public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
          _httpContextAccessor = httpContextAccessor;
    }

    public Guid? UserId
    {
        get
        {
            var userIdString = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                               ?? _httpContextAccessor.HttpContext?.User?.FindFirst("sub")?.Value;
            return Guid.TryParse(userIdString, out var userId) ? userId : null;
        }
    }
    // 2. Kullanıcı E-postasını yakala
    public string? Email => 
        _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Email)
        ?? _httpContextAccessor.HttpContext?.User?.FindFirst("email")?.Value;
    // 3. Kullanıcı Rolünü yakala ("Admin" mi "Customer" mı?)
    public string? Role => 
        _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Role);
    // 4. Kullanıcı biletli ve giriş yapmış mı?
    public bool IsAuthenticated => 
        _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;

}
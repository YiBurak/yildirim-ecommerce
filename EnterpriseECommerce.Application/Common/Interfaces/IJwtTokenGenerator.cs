using EnterpriseECommerce.Domain.Entities;
namespace EnterpriseECommerce.Application.Common.Interfaces;
public interface IJwtTokenGenerator
{
    // Kısa ömürlü mühürlü JWT (Access Token) üretir:
    string GenerateToken(User user);
    // Kriptografik rastgele 64 baytlık gizli yedek anahtar (Refresh Token) üretir:
    string GenerateRefreshToken();
}
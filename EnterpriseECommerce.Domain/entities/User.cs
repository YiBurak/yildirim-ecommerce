using EnterpriseECommerce.Domain.Common;
using EnterpriseECommerce.Domain.Enums;
namespace EnterpriseECommerce.Domain.Entities;
public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Customer;
    // 🔑 REFRESH TOKEN (GİZLİ YEDEK ANAHTAR) ALANLARI:
    public string? RefreshToken { get; set; }
    public bool IsEmailConfirmed { get; set; } = false;
    public string? PasswordResetToken { get; set; }
    public DateTime? PasswordResetExpiresAt { get; set; }
    public DateTime? RefreshTokenExpiresOnUtc { get; set; }
    public string? EmailConfirmationToken { get; set; }

}
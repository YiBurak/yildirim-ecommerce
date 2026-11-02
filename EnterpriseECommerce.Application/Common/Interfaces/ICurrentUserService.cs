namespace EnterpriseECommerce.Application.Common.Interfaces;
public interface ICurrentUserService
{
    // Giriş yapmış kullanıcının benzersiz GUID kimliği (Giriş yapmadıysa null)
    Guid? UserId { get; }
    // Kullanıcının e-posta adresi
    string? Email { get; }
    // Kullanıcının rolü ("Admin" veya "Customer")
    string? Role { get; }
    // Kullanıcı geçerli bir token ile giriş yapmış mı?
    bool IsAuthenticated { get; }
}

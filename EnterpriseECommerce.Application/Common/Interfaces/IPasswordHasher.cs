namespace EnterpriseECommerce.Application.Common.Interfaces;

public interface IPasswordHasher
{
    // Düz şifreyi ("123456") alır, tuzlanmış karmaşık bir hash döner:
    string HashPassword(string password);

    // Giriş yaparken kullanıcının girdiği şifre ile veritabanındaki hash uyuşuyor mu?
    bool VerifyPassword(string password, string passwordHash);
}

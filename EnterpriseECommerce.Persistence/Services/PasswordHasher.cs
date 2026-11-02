using System.Security.Cryptography;
using EnterpriseECommerce.Application.Common.Interfaces;

namespace EnterpriseECommerce.Persistence.Services;

public class PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 16; // 128 bit tuz
    private const int KeySize = 32;  // 256 bit anahtar
    private const int Iterations = 100000; // 100.000 tur karıştırma (Brute-force saldırılarını imkansız kılar)
    private static readonly HashAlgorithmName Algorithm = HashAlgorithmName.SHA256;

    public string HashPassword(string password)
    {
        // 1. Rastgele kriptografik tuz üret:
        byte[] salt = RandomNumberGenerator.GetBytes(SaltSize);

        // 2. Şifreyi tuz ile 100.000 tur yoğur:
        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, Algorithm, KeySize);

        // 3. Veritabanına kaydederken hem tuzu hem hash'i aralarına tire koyarak birleştirip sakla:
        return $"{Convert.ToBase64String(salt)}-{Convert.ToBase64String(hash)}";
    }

    public bool VerifyPassword(string password, string passwordHash)
    {
        // 1. Veritabanındaki hash'i tuz ve hash parçalarına ayır:
        var parts = passwordHash.Split('-');
        if (parts.Length != 2) return false;

        byte[] salt = Convert.FromBase64String(parts[0]);
        byte[] hash = Convert.FromBase64String(parts[1]);

        // 2. Kullanıcının giriş yaparken yazdığı şifreyi AYNI TUZ ile yoğur:
        byte[] inputHash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, Algorithm, KeySize);

        // 3. İki hash birbirinin aynısı mı? (CryptographicOperations zamanlama saldırılarını önler):
        return CryptographicOperations.FixedTimeEquals(hash, inputHash);
    }
}

namespace EnterpriseECommerce.Application.Common.Interfaces;
/// <summary>
/// Bu arayüzü uygulayan herhangi bir Komut (Command),
/// veritabanı işlemi başarılı bittiğinde belirttiği CacheKey'leri RAM'den siler.
/// </summary>
public interface ICacheInvalidatorRequest
{
    // Silinmesi gereken RAM anahtarları listesi (Tek bir anahtar da olabilir, birkaç tane de)
    IReadOnlyCollection<string> CacheKeys { get; }
}
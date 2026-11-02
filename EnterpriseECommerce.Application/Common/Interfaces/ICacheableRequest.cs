namespace EnterpriseECommerce.Application.Common.Interfaces;
public interface ICacheableRequest
{
    // RAM'deki benzersiz anahtar
    string CacheKey { get; }
    // Verinin RAM'de ne kadar süre kalacağı (Örn: 5 dakika)
    TimeSpan? Expiration { get; }
}

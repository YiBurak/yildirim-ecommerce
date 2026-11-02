namespace EnterpriseECommerce.Application.Common.Interfaces;

public interface IDistributedLockService
{
    /// <summary>
    /// Belirtilen kaynak için kilidi almaya çalışır.
    /// Kilit müsaitse 'true' döner ve kilidi belirtilen süre kadar tutar.
    /// Başka bir sunucu kilitlemişse 'false' döner.
    /// </summary>
    Task<bool> TryAcquireLockAsync(string resourceKey, TimeSpan expiration, CancellationToken cancellationToken = default);

    /// <summary>
    /// İşlem bittiğinde kilidi kaldırır, başkalarının girmesine izin verir.
    /// </summary>
    Task ReleaseLockAsync(string resourceKey, CancellationToken cancellationToken = default);
}

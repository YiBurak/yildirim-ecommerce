using System.Collections.Concurrent;
using EnterpriseECommerce.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace EnterpriseECommerce.Persistence.Services;

public class DistributedLockService : IDistributedLockService
{
    // Kilit odası: Hangi anahtarın ne zamana kadar kilitli olduğunu tutan thread-safe sözlük
    private static readonly ConcurrentDictionary<string, DateTime> Locks = new();
    private readonly ILogger<DistributedLockService> _logger;

    public DistributedLockService(ILogger<DistributedLockService> logger)
    {
        _logger = logger;
    }

    public Task<bool> TryAcquireLockAsync(string resourceKey, TimeSpan expiration, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var newExpiry = now.Add(expiration);

        // Atomik Kontrol: Anahtar var mı ve süresi hala geçerli mi?
        var acquired = Locks.AddOrUpdate(
            resourceKey,
            // 1. Durum: Anahtar hiç yoksa, kilidi bu tarihe kadar ver:
            _ => 
            {
                _logger.LogInformation("🔒 [LOCK ACQUIRED] Kilit alındı! Kaynak: {ResourceKey}, Süre: {Seconds} sn", resourceKey, expiration.TotalSeconds);
                return newExpiry;
            },
            // 2. Durum: Anahtar zaten varsa:
            (_, currentExpiry) =>
            {
                // Eğer eski kilidin süresi dolmuşsa (bayat kilit), yenisine izin ver:
                if (currentExpiry < now)
                {
                    _logger.LogWarning("⏱️ [LOCK EXPIRED] Eski kilit zaman aşımına uğramıştı, yeni işlem devraldı. Kaynak: {ResourceKey}", resourceKey);
                    return newExpiry;
                }

                // Süresi dolmamış! Başkası hala içeride, kilidi VERME:
                return currentExpiry;
            }
        );

        // Eğer sözlükteki kilit süresi bizim verdiğimiz yeni süreye eşitse, kilit bizimdir!
        var isMine = acquired == newExpiry;

        if (!isMine)
        {
            _logger.LogWarning("⛔ [LOCK REJECTED] Kaynak şu anda başka bir işlem tarafından kilitli! Kaynak: {ResourceKey}", resourceKey);
        }

        return Task.FromResult(isMine);
    }

    public Task ReleaseLockAsync(string resourceKey, CancellationToken cancellationToken = default)
    {
        if (Locks.TryRemove(resourceKey, out _))
        {
            _logger.LogInformation("🔓 [LOCK RELEASED] Kilit serbest bırakıldı! Kaynak: {ResourceKey}", resourceKey);
        }

        return Task.CompletedTask;
    }
}

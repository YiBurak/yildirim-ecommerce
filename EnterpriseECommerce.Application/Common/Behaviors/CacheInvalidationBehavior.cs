using EnterpriseECommerce.Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace EnterpriseECommerce.Application.Common.Behaviors;

public class CacheInvalidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IDistributedCache _distributedCache;
    private readonly ILogger<CacheInvalidationBehavior<TRequest, TResponse>> _logger;

    public CacheInvalidationBehavior(
        IDistributedCache distributedCache,
        ILogger<CacheInvalidationBehavior<TRequest, TResponse>> logger)
    {
        _distributedCache = distributedCache;
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        // 1. ADIM: Bu gelen istek bir önbellek temizleme isteği mi?
        if (request is not ICacheInvalidatorRequest invalidatorRequest)
        {
            // Değilse (örneğin sadece bir GetProducts sorgusuysa), hiç karışma, yoluna devam etsin:
            return await next();
        }

        // 2. ADIM: Önce asıl komutu çalıştır (Veritabanında güncelleme/silme tamamlansın!)
        var response = await next();

        // 3. ADIM: Veritabanı işlemi başarıyla bitti! Şimdi RAM'deki bayat verileri temizle:
        foreach (var cacheKey in invalidatorRequest.CacheKeys)
        {
            if (!string.IsNullOrWhiteSpace(cacheKey))
            {
                await _distributedCache.RemoveAsync(cacheKey, cancellationToken);
                _logger.LogInformation("🗑️ [CACHE INVALIDATED] Bayat veri RAM'den silindi! Key: {CacheKey}", cacheKey);
            }
        }

        return response;
    }
}

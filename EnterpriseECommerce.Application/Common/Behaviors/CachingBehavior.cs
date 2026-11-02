using System.Text.Json;
using EnterpriseECommerce.Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace EnterpriseECommerce.Application.Common.Behaviors;

public class CachingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IDistributedCache _distributedCache;
    private readonly ILogger<CachingBehavior<TRequest, TResponse>> _logger;

    public CachingBehavior(
        IDistributedCache distributedCache,
        ILogger<CachingBehavior<TRequest, TResponse>> logger)
    {
        _distributedCache = distributedCache;
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request, 
        RequestHandlerDelegate<TResponse> next, 
        CancellationToken cancellationToken)
    {
        // 1. Bu istek önbelleklenebilir bir istek mi?
        if (request is not ICacheableRequest cacheableRequest)
        {
            // Değilse (örneğin Ürün Ekleme komutuysa), doğrudan devam et:
            return await next();
        }

        var cacheKey = cacheableRequest.CacheKey;

        var cachedData = await _distributedCache.GetStringAsync(cacheKey, cancellationToken);

       if (!string.IsNullOrEmpty(cachedData))
        {
            _logger.LogInformation("🎯 [DISTRIBUTED CACHE HIT] Veri Redis/Önbellekten getirildi! Key: {CacheKey}", cacheKey);
            var cachedResponse = JsonSerializer.Deserialize<TResponse>(cachedData);
            return cachedResponse!;
        }

        // 3. RAM'de yoksa veritabanına git (Cache MISS)
        _logger.LogInformation("⚡ [DISTRIBUTED CACHE MISS] Veri RAM'de bulunamadı, veritabanına gidiliyor... Key: {CacheKey}", cacheKey);
        var response = await next();

        // 4. Mutfaktan gelen sonucu RAM'e kaydet (Varsayılan: 5 dakika)
        var expiration = cacheableRequest.Expiration ?? TimeSpan.FromMinutes(5);
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiration
        };
        var jsonData = JsonSerializer.Serialize(response);
            await _distributedCache.SetStringAsync(cacheKey, jsonData, options, cancellationToken);
        _logger.LogInformation("💾 [CACHE SAVED] Veri {Minutes} dakikalığına RAM'e kaydedildi. Key: {CacheKey}", 
            expiration.TotalMinutes, cacheKey);

        return response;
    }
}

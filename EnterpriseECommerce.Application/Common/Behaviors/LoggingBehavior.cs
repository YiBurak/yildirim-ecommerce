using MediatR;
using Microsoft.Extensions.Logging;

namespace EnterpriseECommerce.Application.Common.Behaviors;

public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
where TRequest : notnull
{
     private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;

    public LoggingBehavior(ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }
    public async Task<TResponse> Handle(
        TRequest request, 
        RequestHandlerDelegate<TResponse> next, 
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        _logger.LogInformation("🚀 [İstek Başladı] {RequestName} çalıştırılıyor...", requestName);
        var response = await next();
        _logger.LogInformation("✅ [İstek Tamamlandı] {RequestName} başarıyla bitti.", requestName);

        return response;
    }
}
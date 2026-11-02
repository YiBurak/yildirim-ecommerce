using System.Diagnostics;
using MediatR;
using Microsoft.Extensions.Logging;
namespace EnterpriseECommerce.Application.Common.Behaviors;
public class PerformanceBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly Stopwatch _timer;
    private readonly ILogger<PerformanceBehavior<TRequest, TResponse>> _logger;     
    public PerformanceBehavior(ILogger<PerformanceBehavior<TRequest, TResponse>> logger)
    {
        _timer = new Stopwatch();
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request, 
        RequestHandlerDelegate<TResponse> next, 
        CancellationToken cancellationToken)
    {
         _timer.Restart();
         var response = await next();
         _timer.Stop();

         var elapsedMilliseconds = _timer.ElapsedMilliseconds;
         var requestName = typeof(TRequest).Name;
        _logger.LogInformation("⏱️ [Süre] {RequestName} {ElapsedMilliseconds} ms sürdü.", 
            requestName, elapsedMilliseconds);
        // ALARM: Eğer bir istek 500 ms'den uzun sürdüyse sarı alarm ver!
        if (elapsedMilliseconds > 500)
        {
            _logger.LogWarning("⚠️ [YAVAŞ İSTEK ALARMI] {RequestName} ({ElapsedMilliseconds} ms) uzun sürdü! İnceleme gerekebilir.", 
                requestName, elapsedMilliseconds);
        }
        return response;
    }
}
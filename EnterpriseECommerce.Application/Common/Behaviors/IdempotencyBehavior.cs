using System.Text.Json;
using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseECommerce.Application.Common.Behaviors;
public class IdempotencyBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>

    where TRequest : notnull
{
    private readonly IApplicationDbContext _context;
    public IdempotencyBehavior(IApplicationDbContext context)
    {
       _context = context;
    }
    public async Task<TResponse> Handle(
        TRequest request, 
        RequestHandlerDelegate<TResponse> next, 
        CancellationToken cancellationToken)
    {
    if (request is not IIdempotentCommand idempotentCommand)
            {
                return await next();
            }
    if (idempotentCommand.IdempotencyKey == Guid.Empty)
        {
            return await next();
        }
     var existingRequest = await _context.IdempotentRequests
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Key == idempotentCommand.IdempotencyKey, cancellationToken);

     if (existingRequest != null)
        {
            // 🎯 BİNGO! Bu istek zaten daha önce işlenmiş!
            // Handler'ı tekrar ÇALIŞTIRMA! Eski cevabı geri dönüştürüp teslim et:
            var cachedResponse = JsonSerializer.Deserialize<TResponse>(existingRequest.ResponseJson);
            return cachedResponse!;
        }
    var response = await next();
    var responseJson = JsonSerializer.Serialize(response);
        var record = new IdempotentRequest
        {
            Key = idempotentCommand.IdempotencyKey,
            Name = typeof(TRequest).Name,
            ResponseJson = responseJson
        };
        _context.IdempotentRequests.Add(record);
        await _context.SaveChangesAsync(cancellationToken);
        return response;
    }
}

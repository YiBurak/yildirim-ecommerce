using EnterpriseECommerce.Application.Common.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EnterpriseECommerce.WebApi.Endpoints;

public static class PaymentEndpoints
{
    public static IEndpointRouteBuilder MapPaymentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/payments")
                       .WithTags("Payments");

        // 💳 1. Iyzico Sandbox Ödeme Test Endpoint'i (Giriş Yapmış Kullanıcılar İçin)
        group.MapPost("/test", async ([FromBody] PaymentTestRequest request, IPaymentService paymentService, CancellationToken ct) =>
        {
            var result = await paymentService.ProcessPaymentAsync(request.OrderId, request.Amount, null, ct);

            if (result.IsSuccess)
            {
                return Results.Ok(new
                {
                    status = "success",
                    message = "Iyzico Sandbox üzerinden ödeme başarıyla tahsil edildi!",
                    orderId = request.OrderId,
                    paymentId = result.PaymentId,
                    amount = request.Amount
                });
            }

            return Results.BadRequest(new
            {
                status = "failed",
                message = result.ErrorMessage ?? "Iyzico ödemeyi onaylamadı veya işlem reddedildi.",
                orderId = request.OrderId
            });
        }).RequireAuthorization();

        return app;
    }
}

public record PaymentTestRequest(Guid OrderId, decimal Amount);

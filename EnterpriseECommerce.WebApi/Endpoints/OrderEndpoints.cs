using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.Application.Orders.Commands.CancelOrder;
using EnterpriseECommerce.Application.Orders.Commands.CreateOrder;
using EnterpriseECommerce.Application.Orders.Queries.GetOrderById;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseECommerce.WebApi.Endpoints;

public static class OrderEndpoints
{
    public static IEndpointRouteBuilder MapOrderEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/orders")
                       .WithTags("Orders");

        group.MapPost("", async (
            CreateOrderCommand command, 
            [FromHeader(Name = "Idempotency-Key")] Guid? idempotencyHeader, 
            ISender mediator) =>
        {
            var finalCommand = idempotencyHeader.HasValue && idempotencyHeader.Value != Guid.Empty
                ? command with { IdempotencyKey = idempotencyHeader.Value }
                : command;
            var orderId = await mediator.Send(finalCommand);
            return Results.Created($"/api/orders/{orderId}", new { id = orderId });
        });

        group.MapGet("/{id:guid}", async (Guid id, ISender mediator) =>
        {
            var order = await mediator.Send(new GetOrderByIdQuery(id));
            return Results.Ok(order);
        });

        // 📦 Kullanıcının kendi siparişlerini listeleme kapısı:
        group.MapGet("/my-orders", async (ISender mediator) =>
        {
            var orders = await mediator.Send(new EnterpriseECommerce.Application.Orders.Queries.GetMyOrders.GetMyOrdersQuery());
            return Results.Ok(orders);
        });

        group.MapPost("/{id:guid}/cancel", async (Guid id, ISender mediator) =>
        {
            await mediator.Send(new CancelOrderCommand(id));
            return Results.Ok(new 
            { 
                message = $"'{id}' numaralı sipariş başarıyla iptal edildi ve stoklar depoya iade edildi." 
            });
        });

        // 👑 Admin için: Sistemdeki TÜM siparişleri listeleme kapısı
        group.MapGet("/all", async (ISender mediator) =>
        {
            var orders = await mediator.Send(new EnterpriseECommerce.Application.Orders.Queries.GetAllOrders.GetAllOrdersQuery());
            return Results.Ok(orders);
        });

        // 📄 4. E-Arşiv Fatura & Dekont PDF İndirme Kapısı (QuestPDF):
        group.MapGet("/{id:guid}/invoice", async (
            Guid id, 
            IApplicationDbContext context, 
            IInvoicePdfGenerator pdfGenerator, 
            ICurrentUserService currentUserService,
            CancellationToken ct) =>
        {
            var order = await context.Orders
                .Include(o => o.Items)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(o => o.Id == id, ct);

            if (order == null)
            {
                return Results.NotFound(new { message = $"ID'si '{id}' olan sipariş bulunamadı." });
            }

            var isOwner = string.Equals(currentUserService.Email, order.CustomerEmail, StringComparison.OrdinalIgnoreCase);
            var isAdmin = string.Equals(currentUserService.Role, "Admin", StringComparison.OrdinalIgnoreCase);

            if (!isOwner && !isAdmin)
            {
                return Results.Forbid();
            }

            var pdfBytes = pdfGenerator.GenerateInvoicePdf(order);
            return Results.File(pdfBytes, "application/pdf", $"Fatura-{order.OrderNumber}.pdf");
        }).RequireAuthorization();

        return app;
    }
}

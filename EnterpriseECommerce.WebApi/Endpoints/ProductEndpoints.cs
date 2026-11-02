using EnterpriseECommerce.Application.Products.Commands.CreateProduct;
using EnterpriseECommerce.Application.Products.Commands.DeleteProduct;
using EnterpriseECommerce.Application.Products.Commands.UpdateProduct;
using EnterpriseECommerce.Application.Products.Queries.GetProductById;
using EnterpriseECommerce.Application.Products.Queries.GetProducts;
using MediatR;


namespace EnterpriseECommerce.WebApi.Endpoints;

public static class ProductEndpoints
{
    public static IEndpointRouteBuilder MapProductEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/products")
                       .WithTags("Products");

        group.MapPost("", async (CreateProductCommand command, ISender mediator) =>
        {
            var productId = await mediator.Send(command);
            return Results.Created($"/api/products/{productId}", new { id = productId });
        });

         group.MapGet("", async ([AsParameters] GetProductsQuery query, ISender mediator) =>
        {
            var products = await mediator.Send(query);
            return Results.Ok(products);
        });

         group.MapGet("/{id:guid}", async (Guid id, ISender mediator) =>
        {
            var product = await mediator.Send(new GetProductByIdQuery(id));
            return product is not null 
                ? Results.Ok(product) 
                : Results.NotFound(new { message = $"ID'si '{id}' olan ürün bulunamadı." });
        });

        group.MapPut("/{id:guid}", async (Guid id, UpdateProductCommand command, ISender mediator) =>
        {
            if (id != command.Id)
            {
                return Results.BadRequest(new { message = "URL'deki ID ile gönderilen nesnedeki ID uyuşmuyor!" });
            }
             await mediator.Send(command);
            return Results.NoContent(); // Tertemiz tek satır!
        });
        

        group.MapDelete("/{id:guid}", async (Guid id, ISender mediator) =>
        {
            await mediator.Send(new DeleteProductCommand(id));
            return Results.NoContent(); // Tertemiz tek satır!
        });
        

        return app;
    }
}
using EnterpriseECommerce.Application.Categories.Commands.CreateCategory;
using EnterpriseECommerce.Application.Categories.Queries.GetCategories;
using MediatR;

namespace EnterpriseECommerce.WebApi.Endpoints;

public static class CategoryEndpoints
{
    public static IEndpointRouteBuilder MapCategoryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/categories")
                       .WithTags("Categories");

        // 🌐 1. Tüm Kategorileri Getir (Müşteriler ve Vitrin İçin Açık)
        group.MapGet("", async (ISender mediator) =>
        {
            var categories = await mediator.Send(new GetCategoriesQuery());
            return Results.Ok(categories);
        });

        // 👑 2. Yeni Kategori Ekle (SADECE ADMIN)
        group.MapPost("", async (CreateCategoryCommand command, ISender mediator) =>
        {
            var categoryId = await mediator.Send(command);
            return Results.Created($"/api/categories/{categoryId}", new { id = categoryId });
        }).RequireAuthorization(policy => policy.RequireRole("Admin"));

        return app;
    }
}

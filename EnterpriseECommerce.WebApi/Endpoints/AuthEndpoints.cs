using MediatR;
using EnterpriseECommerce.Application.Auth.Commands.Login;
using EnterpriseECommerce.Application.Auth.Commands.Register;
using EnterpriseECommerce.Application.Auth.Commands.RefreshToken;
using EnterpriseECommerce.Application.Auth.Commands.RevokeToken;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Caching.Distributed;
using EnterpriseECommerce.Application.Auth.Commands.ForgotPassword;
using EnterpriseECommerce.Application.Auth.Commands.ResetPassword;
using EnterpriseECommerce.Application.Auth.Commands.ConfirmEmail;

namespace EnterpriseECommerce.WebApi.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth")
                       .WithTags("Authentication")
                       .RequireRateLimiting("auth-limit");

        group.MapPost("/register", async (RegisterCommand command, ISender mediator) =>
        {
            var userId = await mediator.Send(command);
            return Results.Created($"/api/auth/register/{userId}", new {
                id = userId,
                message = $"'{command.Email}' adresiyle yeni bir kullanıcı başarıyla oluşturuldu!"
            });
        });

        group.MapPost("/login", async (LoginCommand command, ISender mediator) =>
        {
            var result = await mediator.Send(command);
            return Results.Ok(result);
        });

        // 🔄 1. Sessiz Oturum Yenileme:
        group.MapPost("/refresh", async (RefreshTokenCommand command, ISender mediator) =>
        {
            var result = await mediator.Send(command);
            return Results.Ok(result);
        });

        // 🚪 2. Güvenli Çıkış (Logout / Revoke):
        group.MapPost("/revoke", async (RevokeTokenCommand command, ISender mediator) =>
        {
            await mediator.Send(command);
            return Results.Ok(new { message = "Oturum anahtarı başarıyla iptal edildi (Revoked)." });
        });

        // 👤 Kullanıcı Profil Bilgisi:
        group.MapGet("/me", async (ISender mediator) =>
        {
            var profile = await mediator.Send(new EnterpriseECommerce.Application.Auth.Queries.GetMe.GetMeQuery());
            return Results.Ok(profile);
        }).RequireAuthorization();

        // 🎟️ 3. SignalR İçin Bilet Üretici:
        group.MapPost("/hub-ticket", async (HttpContext context, IDistributedCache cache) =>
        {
            var authHeader = context.Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            {
                return Results.Unauthorized();
            }

            var token = authHeader["Bearer ".Length..].Trim();
            var ticket = Guid.NewGuid().ToString("N");

            await cache.SetStringAsync($"hub_ticket:{ticket}", token, new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30)
            });

            return Results.Ok(new { ticket });
        }).RequireAuthorization();

        // 📧 4. Şifremi Unuttum:
        group.MapPost("/forgot-password", async (ForgotPasswordCommand command, ISender mediator) =>
        {
            var message = await mediator.Send(command);
            return Results.Ok(new { message });
        });

        // 🔑 5. Yeni Şifreyi Kaydetme:
        group.MapPost("/reset-password", async (ResetPasswordCommand command, ISender mediator) =>
        {
            await mediator.Send(command);
            return Results.Ok(new { message = "Şifreniz başarıyla güncellendi! Yeni şifrenizle giriş yapabilirsiniz." });
        });

        // ✉️ 6. E-Posta Doğrulama:
        group.MapPost("/confirm-email", async (ConfirmEmailCommand command, ISender mediator) =>
        {
            var message = await mediator.Send(command);
            return Results.Ok(new { message });
        });

        // 📩 7. Doğrulama E-Postasını Yeniden Gönder:
        group.MapPost("/resend-confirmation-email", async (ResendConfirmationEmailCommand command, ISender mediator) =>
        {
            var message = await mediator.Send(command);
            return Results.Ok(new { message });
        });

        return app;
    }
}

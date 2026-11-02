using EnterpriseECommerce.Persistence;
using EnterpriseECommerce.Persistence.Contexts;
using EnterpriseECommerce.Domain.Entities;
using EnterpriseECommerce.Application;
using EnterpriseECommerce.WebApi.Endpoints;
using FluentValidation;
using EnterpriseECommerce.WebApi.Infrastructure;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.WebApi.Services;
using EnterpriseECommerce.Domain.Enums;
using Microsoft.AspNetCore.RateLimiting;
using OpenTelemetry.Trace;
using OpenTelemetry.Resources;
using MassTransit;
using EnterpriseECommerce.Application.Orders.Consumers;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.EntityFrameworkCore;
using EnterpriseECommerce.Application.Categories;






var builder = WebApplication.CreateBuilder(args);

builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<OrderCreatedConsumer>();
    x.AddConsumer<OrderCreatedFaultConsumer>();
    x.AddConsumer<OrderCreatedPaymentConsumer>();
    x.AddConsumer<PaymentCompletedConsumer>();
    x.AddConsumer<PaymentFailedCompensationConsumer>();
    var rabbitUrl = builder.Configuration["RabbitMQ:Url"];
    if (!string.IsNullOrEmpty(rabbitUrl))
    {
        x.UsingRabbitMq((context, cfg) =>
        {
            // Bulut adresine tek satırda güvenle bağlan:
            cfg.Host(new Uri(rabbitUrl));
            cfg.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(2)));
            cfg.ConfigureEndpoints(context);
        });
    }
    else
    {
        x.UsingInMemory((context, cfg) =>
        {
            cfg.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(2)));
            cfg.ConfigureEndpoints(context);
        });
    }
});



builder.Services.AddApplicationServices();
builder.Services.AddPersistenceServices(builder.Configuration);
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSignalR(); // ⚡ SignalR WebSocket Servisi
builder.Services.AddScoped<INotificationService, SignalRNotificationService>(); // 📢 Gerçek Zamanlı Bildirim Servisi
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddHostedService<OutboxBackgroundProcessor>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true) // 🌐 Dinamik Origin İzni
              .AllowAnyMethod()              // GET, POST, PUT, DELETE
              .AllowAnyHeader()              // Başlıklar
              .AllowCredentials();           // 👈 SignalR WebSockets için zorunlu!
    });
});

builder.Services.AddProblemDetails();
builder.Services.AddHttpContextAccessor(); 
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>(); //


var jwtSecret = builder.Configuration["Jwt:Secret"] 
    ?? throw new InvalidOperationException("Jwt:Secret ayarı bulunamadı!");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "EnterpriseECommerce";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "EnterpriseECommerceClient";


builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ClockSkew = TimeSpan.Zero // Süresi bittiği saniye reddet!
    };
        options.Events = new JwtBearerEvents
    {
        OnMessageReceived = async context =>
        {
            var path = context.HttpContext.Request.Path;
            // İstek SignalR Hub'ına mı gidiyor?
            if (path.StartsWithSegments("/hubs"))
            {
                // URL'den "ticket" parametresini oku:
                var ticket = context.Request.Query["ticket"].ToString();
                if (!string.IsNullOrEmpty(ticket))
                {
                    // RAM'deki önbelleğe (IDistributedCache) eriş:
                    var cache = context.HttpContext.RequestServices
                        .GetRequiredService<Microsoft.Extensions.Caching.Distributed.IDistributedCache>();
                    var cacheKey = $"hub_ticket:{ticket}";
                    var token = await cache.GetStringAsync(cacheKey);
                    if (!string.IsNullOrEmpty(token))
                    {
                        // 💥 GÖREV TAMAMLANDI: BİLETİ ANINDA İMHA ET! (Tekrar kullanılamaz)
                        await cache.RemoveAsync(cacheKey);
                        // Token'ı ASP.NET Core doğrulama motoruna teslim et:
                        context.Token = token;
                    }
                }
            }
        }};
});

builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(options =>
{
    // Sınırı aşanlara döneceğimiz durum kodu: 429 Too Many Requests
    options.RejectionStatusCode  = StatusCodes.Status429TooManyRequests;
    // "auth-limit" Kuralı: Login ve Register için sıkı kural (10 saniyede en fazla 3 istek!)
    options.AddFixedWindowLimiter("auth-limit", opt =>
    {
        opt.PermitLimit = 3;                         // En fazla 3 bilet
        opt.Window = TimeSpan.FromSeconds(10);        // 10 saniyelik zaman penceresi
        opt.QueueLimit = 0;                          // Sırada bekletme yok, hemen 429 dön!
    });
});


builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>(
        name: "Sqlite_Veritabani",
        tags: ["db", "sqlite"]);

// 🩻 OPENTELEMETRY (Dağıtık İzleme / Distributed Tracing)
builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource.AddService("EnterpriseECommerce.WebApi"))
    .WithTracing(tracing =>
    {
        tracing
            .AddAspNetCoreInstrumentation() // 1. Kapıdan giren tüm HTTP isteklerini izle
            .AddHttpClientInstrumentation() // 2. Bizim dışarıya (Banka/Kargo) attığımız HTTP isteklerini izle
            .AddConsoleExporter();          // 3. Röntgen sonuçlarını konsola renkli dök!
    });


var app = builder.Build();

app.UseExceptionHandler();



using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();


    context.Database.Migrate();
    
    

    
}


if (app.Environment.IsDevelopment())
{
     app.MapOpenApi();
     
    app.UseHttpsRedirection();
}


app.UseCors("AllowAll"); 

app.UseAuthentication();
app.UseAuthorization();

app.UseRateLimiter(); 

app.MapProductEndpoints();
app.MapOrderEndpoints();
app.MapAuthEndpoints();
app.MapCategoryEndpoints();
app.MapPaymentEndpoints();
app.MapHub<EnterpriseECommerce.WebApi.Hubs.CommerceHub>("/hubs/commerce"); // ⚡ SignalR Hub Kapısı


// 🏥 SİSTEM SAĞLIK RAPORU (Load Balancer & Kubernetes İçin)
app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var response = new
        {
            status = report.Status.ToString(), // "Healthy" (Sağlıklı) veya "Unhealthy" (Bozuk)
            totalDuration = $"{report.TotalDuration.TotalMilliseconds:0.00} ms",
            checks = report.Entries.Select(e => new
            {
                component = e.Key, // "Sqlite_Veritabani"
                status = e.Value.Status.ToString(),
                duration = $"{e.Value.Duration.TotalMilliseconds:0.00} ms",
                description = e.Value.Description ?? "Sistem sorunsuz çalışıyor."
            })
        };
        var json = System.Text.Json.JsonSerializer.Serialize(response, new System.Text.Json.JsonSerializerOptions 
        { 
            WriteIndented = true // Okunaklı güzel JSON formatı
        });
        await context.Response.WriteAsync(json);
    }
});





app.Run();
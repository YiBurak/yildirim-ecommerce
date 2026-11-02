using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using EnterpriseECommerce.Persistence.Services;
using EnterpriseECommerce.Persistence.Configurations;
using Microsoft.Extensions.Options;

namespace EnterpriseECommerce.Persistence;

public static class DependencyInjection
{
    public static IServiceCollection AddPersistenceServices(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection") 
                               ?? "Data Source=EnterpriseECommerce.db";
        
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IApplicationDbContext>(provider => 
            provider.GetRequiredService<AppDbContext>());
        
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddSingleton<IDistributedLockService, DistributedLockService>(); 
        services.AddScoped<IEmailService, EmailService>();
        services.Configure<IyzicoOptions>(configuration.GetSection(IyzicoOptions.SectionName));
        services.AddScoped<IPaymentService, IyzicoPaymentService>();
        services.AddScoped<IInvoicePdfGenerator, InvoicePdfGenerator>();
        
        return services;
    }
}

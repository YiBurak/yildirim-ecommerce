
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;
using EnterpriseECommerce.Application.Common.Behaviors;
using FluentValidation;
using MediatR;


namespace EnterpriseECommerce.Application;
public static class DependencyInjection {
    
    public static IServiceCollection AddApplicationServices(this IServiceCollection services) {

        var assembly = Assembly.GetExecutingAssembly();

        services.AddMediatR(cfg => 
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(AuthorizationBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(IdempotencyBehavior<,>)); 
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(PerformanceBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(CachingBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(CacheInvalidationBehavior<,>));
            
        });

        
         services.AddValidatorsFromAssembly(assembly);
         
        return services;
    }
}

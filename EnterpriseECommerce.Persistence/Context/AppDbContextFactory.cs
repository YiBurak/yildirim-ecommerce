using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace EnterpriseECommerce.Persistence.Contexts;

// 🏭 EF Core Migration aracı için Tasarım Zamanı Fabrikası
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        
        // Tasarım zamanında PostgreSQL şemasını okuması için dummy bağlantı:
        optionsBuilder.UseNpgsql("Host=localhost;Database=EnterpriseECommerceDb;Username=ecommerce_admin;Password=dummy");

        return new AppDbContext(optionsBuilder.Options, new NoOpPublisher());
    }

    // Migration üretilirken MediatR olaylarına gerek olmadığı için sahte bir Publisher:
    private class NoOpPublisher : IPublisher
    {
        public Task Publish(object notification, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task Publish<TNotification>(TNotification notification, CancellationToken cancellationToken = default) where TNotification : INotification => Task.CompletedTask;
    }
}

using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.Domain.Common;
using EnterpriseECommerce.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace EnterpriseECommerce.Persistence.Contexts;


public class AppDbContext : DbContext, IApplicationDbContext
{
    private static readonly JsonSerializerOptions _jsonSerializerOptions = new()
{
    ReferenceHandler = ReferenceHandler.IgnoreCycles
};
    private readonly IPublisher _publisher; // 👈 1. MediatR kuryesi (Olay dağıtıcı)
    public AppDbContext(DbContextOptions<AppDbContext> options, IPublisher publisher) : base(options)
    {
        _publisher = publisher;
    }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<User> Users => Set<User>();
    public DbSet<IdempotentRequest> IdempotentRequests => Set<IdempotentRequest>();
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 🪄 Sihirli Satır: Configurations klasöründeki ProductConfiguration vb. hepsini tek seferde otomatik yükler!
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType)
                    .Property(nameof(BaseEntity.RowVersion))
                    .IsConcurrencyToken();
                
            }
        
        }
        modelBuilder.Entity<IdempotentRequest>()
                .HasIndex(r => r.Key)
                .IsUnique();
    }

    // 🕰️ Otomatik Audit: Her kayıtta CreatedAt ve UpdatedAt otomatik basılır!
    public override async  Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    break;

                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    entry.Entity.RowVersion = Guid.NewGuid(); 
                    break;
            }
        }

        var entitiesWithEvents = ChangeTracker.Entries<BaseEntity>()
            .Select(e => e.Entity)
            .Where(e => e.DomainEvents.Any())
            .ToList();
        var domainEvents = entitiesWithEvents
            .SelectMany(e => e.DomainEvents)
            .ToList();
        
        if (domainEvents.Any())
        {
            
            var outboxMessages = domainEvents.Select(domainEvent => new OutboxMessage
            {
                
                // Mektubun tam C# tip adı (Örn: "EnterpriseECommerce.Domain.Events.OrderCreatedEvent"):
                Type = domainEvent.GetType().AssemblyQualifiedName ?? domainEvent.GetType().Name,
                // Mektubun içindeki verilerin JSON metni:
                Content = JsonSerializer.Serialize(domainEvent, domainEvent.GetType(), _jsonSerializerOptions),

                // Henüz postacı dağıtmadı, o yüzden boş:
                ProcessedOnUtc = null
            }).ToList();
            OutboxMessages.AddRange(outboxMessages);
        }
        // 4. Tabakların üstündeki notları temizle:
        entitiesWithEvents.ForEach(e => e.ClearDomainEvents());
        // 5. HEM SİPARİŞİ HEM DE MEKTUPLARI AYNI ANDA TEK SEFERDE VERİTABANINA MÜHÜRLE:
        return await base.SaveChangesAsync(cancellationToken);
        }
    }

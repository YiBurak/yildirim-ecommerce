using EnterpriseECommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
namespace EnterpriseECommerce.Application.Common.Interfaces;
public interface IApplicationDbContext
{
    DbSet<Product> Products { get; }
    DbSet<Category> Categories { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<User> Users { get; }
    DbSet<IdempotentRequest> IdempotentRequests { get; }
    DbSet<OutboxMessage> OutboxMessages { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
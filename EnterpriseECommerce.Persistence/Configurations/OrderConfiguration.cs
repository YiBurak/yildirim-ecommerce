using EnterpriseECommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnterpriseECommerce.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        // 1. Sipariş Numarası (Benzersiz ve Zorunlu)
        builder.Property(o => o.OrderNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(o => o.OrderNumber)
            .IsUnique();

        // 2. Müşteri E-postası
        builder.Property(o => o.CustomerEmail)
            .IsRequired()
            .HasMaxLength(150);

        // Arama performansı için e-postaya index
        builder.HasIndex(o => o.CustomerEmail);

        // 3. Toplam Tutar (Finansal Hassasiyet: 18 basamak, 2 ondalık)
        builder.Property(o => o.TotalAmount)
            .HasPrecision(18, 2);

        // 4. Enum Dönüşümü (Sipariş Durumu: string olarak DB'ye yazılsın)
        builder.Property(o => o.Status)
            .HasConversion<string>()
            .HasMaxLength(30);

        // 5. İlişki: 1 Siparişin çok Kalemi (OrderItem) olur
        // Sipariş silinirse detay kalemleri de birlikte silinsin (Cascade)
        builder.HasMany(o => o.Items)
            .WithOne(i => i.Order)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // 6. Global Query Filter (Soft Delete)
        builder.HasQueryFilter(o => !o.IsDeleted);
    }
}

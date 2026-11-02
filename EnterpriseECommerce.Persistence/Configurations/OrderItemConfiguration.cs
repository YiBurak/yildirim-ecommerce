using EnterpriseECommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnterpriseECommerce.Persistence.Configurations;

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
     public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
         // 1. Birim Fiyat (Finansal Hassasiyet: 18 basamak, 2 ondalık)
        builder.Property(oi => oi.UnitPrice)
            .IsRequired()
            .HasPrecision(18, 2);
        // 2. Adet Bilgisi (Zorunlu)
        builder.Property(oi => oi.Quantity)
            .IsRequired();
        // 3. Product ile İlişki (Bir sipariş kaleminde 1 ürün bulunur)
        // Ürün silinse bile geçmiş sipariş kalemi patlamasın (Restrict)
        builder.HasOne(oi => oi.Product)
            .WithMany()
            .HasForeignKey(oi => oi.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
        // 4. Global Query Filter (Soft Delete)
        builder.HasQueryFilter(oi => !oi.IsDeleted);
    }
    
}
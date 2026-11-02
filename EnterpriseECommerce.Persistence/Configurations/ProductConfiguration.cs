using EnterpriseECommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnterpriseECommerce.Persistence.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        // İsim zorunlu ve en fazla 150 karakter
        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(150);

        // Para kurumsal hassasiyeti: 18 basamak, virgülden sonra 2 hane (Örn: 999999.99)
        builder.Property(p => p.Price)
            .HasPrecision(18, 2);

        // SKU benzersiz (Unique Index) olmalı; aynı barkodla 2 farklı ürün eklenemez!
        builder.Property(p => p.Sku)
            .IsRequired()
            .HasMaxLength(50);
            
        builder.HasIndex(p => p.Sku)
            .IsUnique();

        // 🛡️ Global Query Filter: Silinmiş (IsDeleted = true) ürünleri otomatik gizle!
        builder.HasQueryFilter(p => !p.IsDeleted);
    }
}

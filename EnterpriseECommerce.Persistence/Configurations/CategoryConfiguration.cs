using EnterpriseECommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace EnterpriseECommerce.Persistence.Configurations;
public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        // 1. İsim alanı zorunlu ve en fazla 100 karakter
        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(100);
        // 2. Kategori adı benzersiz olmalı (Unique Index)
        builder.HasIndex(c => c.Name)
            .IsUnique();
        // 3. Açıklama opsiyonel fakat en fazla 500 karakter
        builder.Property(c => c.Description)
            .HasMaxLength(500);
        // 4. Bire-Çok İlişki (Bir kategorinin çok ürünü olur, kategori silinirse ürünler patlamasın: Restrict)
        builder.HasMany(c => c.Products)
            .WithOne(p => p.Category)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
        // 5. Global Query Filter (Soft Delete: IsDeleted = true olanlar sorgularda otomatik gizlensin)
        builder.HasQueryFilter(c => !c.IsDeleted);
    }
}
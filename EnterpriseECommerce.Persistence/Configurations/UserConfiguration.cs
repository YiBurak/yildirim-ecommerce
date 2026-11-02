using EnterpriseECommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnterpriseECommerce.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        // 1. E-posta zorunlu, en fazla 150 karakter ve BENZERSİZ olmalı:
        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(150);
        builder.HasIndex(u => u.Email)
            .IsUnique(); //  Aynı e-postayla 2 kişi ASLA kaydolamaz!
        // 2. Şifre hash'i zorunlu:
        builder.Property(u => u.PasswordHash)
            .IsRequired();
        // 3. Ad ve Soyad:
        builder.Property(u => u.FirstName)
            .IsRequired()
            .HasMaxLength(100);
        builder.Property(u => u.LastName)
            .IsRequired()
            .HasMaxLength(100);
        // 4. Rol alanı veritabanında yazı olarak saklansın (Örn: "Admin", "Customer"):
        builder.Property(u => u.Role)
            .HasConversion<string>()
            .HasMaxLength(20);
    }
}
using EnterpriseECommerce.Domain.Common;
namespace EnterpriseECommerce.Domain.Entities;
public class IdempotentRequest : BaseEntity
{
        // Frontend'den gelen benzersiz anahtar (Örn: "c4b1a8d0-...")
    public Guid Key { get; set; }
    // Hangi komut çalıştırıldı? (Örn: "CreateOrderCommand")
    public string Name { get; set; } = string.Empty;
    // O komut çalıştığında üretilen sonucun JSON hali (Örn: "{ id: 'guid-order-id' }")
    public string ResponseJson { get; set; } = string.Empty;
}
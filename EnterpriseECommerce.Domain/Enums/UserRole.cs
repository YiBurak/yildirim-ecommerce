namespace EnterpriseECommerce.Domain.Enums;

public enum UserRole
{
    Customer = 1, // Normal Müşteri (Sipariş verebilir, ürünleri görebilir)
    Admin = 2     // Yönetici (Ürün ekleyebilir, güncelleyebilir, stok değiştirebilir)
}

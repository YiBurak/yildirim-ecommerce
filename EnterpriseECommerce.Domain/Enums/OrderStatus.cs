namespace EnterpriseECommerce.Domain.Enums;
public enum OrderStatus
{
    Pending = 0,     // Sipariş alındı, ödeme bekleniyor
    Paid = 1,        // Ödeme onaylandı
    Shipped = 2,     // Kargoya verildi
    Delivered = 3,   // Teslim edildi
    Cancelled = 4,      // Sipariş iptal edildi
    PaymentFailed = 5    // Ödeme başarısız
}
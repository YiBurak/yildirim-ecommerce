using EnterpriseECommerce.Domain.Common;
using EnterpriseECommerce.Domain.Enums;

namespace EnterpriseECommerce.Domain.Entities;

public class Order : BaseEntity
{
    // Sipariş Numarası (Örn: "ORD-20261013-A8F2")
    public string OrderNumber { get; set; } = string.Empty;
    
    public string CustomerEmail { get; set; } = string.Empty;
    
    // Toplam Tutar
    public decimal TotalAmount { get; set; }
    
    // Sipariş Durumu
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public string? PaymentId { get; set; }

    // Siparişin Kalemleri (1 Siparişin birden çok ürünü/kalemi olur)
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}

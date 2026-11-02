using EnterpriseECommerce.Domain.Common;

namespace EnterpriseECommerce.Domain.Entities;

public class OrderItem : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order? Order { get; set; }

    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    // 💰 O anki satış fiyatı (Ürünün fiyatı sonradan değişse bile burası değişmez!)
    public decimal UnitPrice { get; set; }
    
    // Adet
    public int Quantity { get; set; }
}

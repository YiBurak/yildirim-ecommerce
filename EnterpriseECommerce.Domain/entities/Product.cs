using EnterpriseECommerce.Domain.Common;

namespace EnterpriseECommerce.Domain.Entities;

public class Product : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public decimal Price { get; set; }
    
    public int StockQuantity { get; set; }

    public string Sku { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }

    public Guid CategoryId { get; set; }
    public Category? Category { get; set; }
}


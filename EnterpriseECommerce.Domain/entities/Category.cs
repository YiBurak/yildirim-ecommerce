using EnterpriseECommerce.Domain.Common;

namespace EnterpriseECommerce.Domain.Entities;

public class Category : BaseEntity
{
     public string Name { get; set; } = string.Empty;
     public string Description { get; set; } = string.Empty;

     public ICollection<Product> Products { get; set; } = new List<Product>();

}
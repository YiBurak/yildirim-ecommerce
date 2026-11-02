using FluentValidation;
namespace EnterpriseECommerce.Application.Products.Commands.UpdateProduct;
public class UpdateProductCommandValidator : AbstractValidator<UpdateProductCommand>
{
    public UpdateProductCommandValidator()
    {
        RuleFor(p => p.Id)
            .NotEmpty().WithMessage("Güncellenecek ürünün ID'si boş olamaz.");
        // 2. Kural: Ürün adı boş olamaz, 3 ile 150 karakter arasında olmalıdır
        RuleFor(p => p.Name)
            .NotEmpty().WithMessage("Ürün adı boş olamaz.")
            .MinimumLength(3).WithMessage("Ürün adı en az 3 karakter olmalıdır.")
            .MaximumLength(150).WithMessage("Ürün adı 150 karakterden uzun olamaz.");
        // 3. Kural: Fiyat 0 veya negatif olamaz
        RuleFor(p => p.Price)
            .GreaterThan(0).WithMessage("Ürün fiyatı 0'dan büyük olmalıdır.");
        // 4. Kural: Stok adedi negatif olamaz (0 tane kalmış olabilir ama -5 tane olamaz!)
        RuleFor(p => p.StockQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Stok miktarı 0 veya daha büyük olmalıdır.");
        // 5. Kural: Barkod (SKU) boş bırakılamaz
        RuleFor(p => p.Sku)
            .NotEmpty().WithMessage("Ürün barkodu (SKU) boş olamaz.");
        // 6. Kural: Kategori ID'si boş GUID olamaz
        RuleFor(p => p.CategoryId)
            .NotEmpty().WithMessage("Lütfen geçerli bir kategori seçiniz.");
    }
}
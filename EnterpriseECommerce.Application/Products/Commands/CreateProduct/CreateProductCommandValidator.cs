using FluentValidation;

namespace EnterpriseECommerce.Application.Products.Commands.CreateProduct;

public class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
        // 1. Kural: Ürün adı boş olamaz, en az 3, en fazla 150 karakter olmalı
        RuleFor(p => p.Name)
            .NotEmpty().WithMessage("Ürün adı boş olamaz.")
            .MinimumLength(3).WithMessage("Ürün adı en az 3 karakter olmalıdır.")
            .MaximumLength(150).WithMessage("Ürün adı 150 karakterden uzun olamaz.");
        // 2. Kural: Fiyat sıfırdan büyük olmak zorunda (Bedava veya eksi ürün olamaz!)
        RuleFor(p => p.Price)
            .GreaterThan(0).WithMessage("Ürün fiyatı 0'dan büyük olmalıdır.");
        // 3. Kural: Stok miktarı negatif olamaz
        RuleFor(p => p.StockQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Stok miktarı 0 veya daha büyük olmalıdır.");
        // 4. Kural: SKU (Barkod) boş olamaz
        RuleFor(p => p.Sku)
            .NotEmpty().WithMessage("Ürün barkodu (SKU) boş olamaz.");
        // 5. Kural: Kategori ID'si boş (00000000...) olamaz
        RuleFor(p => p.CategoryId)
            .NotEmpty().WithMessage("Lütfen geçerli bir kategori seçiniz.");
    }
}
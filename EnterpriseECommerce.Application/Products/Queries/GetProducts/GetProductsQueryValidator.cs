using FluentValidation;

namespace EnterpriseECommerce.Application.Products.Queries.GetProducts;

public class GetProductsQueryValidator : AbstractValidator<GetProductsQuery>
{
    // İzin verilen güvenli sıralama anahtarları listesi (Beyaz Liste / Whitelist)
    private static readonly string[] AllowedSortByValues =
    [
        "price_asc", "price_desc", "name_asc", "name_desc", "date_asc", "date_desc"
    ];

    public GetProductsQueryValidator()
    {
        // 1. Sayfa numarası en az 1 olmalıdır
        RuleFor(x => x.PageNumber)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Sayfa numarası en az 1 olmalıdır.");

        // 2. Sayfa boyutu 1 ile 50 arasında olmalıdır (DoS Koruması!)
        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50)
            .WithMessage("Sayfa boyutu 1 ile 50 arasında olmalıdır.");

        // 3. MinPrice negatif olamaz
        When(x => x.MinPrice.HasValue, () =>
        {
            RuleFor(x => x.MinPrice!.Value)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Minimum fiyat 0'dan küçük olamaz.");
        });

        // 4. MaxPrice negatif olamaz
        When(x => x.MaxPrice.HasValue, () =>
        {
            RuleFor(x => x.MaxPrice!.Value)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Maksimum fiyat 0'dan küçük olamaz.");
        });

        // 5. Mantıksal Çelişki Koruması: MinPrice, MaxPrice'tan büyük olamaz!
        When(x => x.MinPrice.HasValue && x.MaxPrice.HasValue, () =>
        {
            RuleFor(x => x)
                .Must(x => x.MinPrice <= x.MaxPrice)
                .WithMessage("Minimum fiyat, maksimum fiyattan büyük olamaz!");
        });

        // 6. Sıralama Güvenliği (Whitelist Kontrolü)
        When(x => !string.IsNullOrWhiteSpace(x.SortBy), () =>
        {
            RuleFor(x => x.SortBy!.ToLower())
                .Must(val => AllowedSortByValues.Contains(val))
                .WithMessage($"Geçersiz sıralama kriteri! Kullanılabilecek değerler: {string.Join(", ", AllowedSortByValues)}");
        });
    }
}

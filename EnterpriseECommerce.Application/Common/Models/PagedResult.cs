using System.Text.Json.Serialization;

namespace EnterpriseECommerce.Application.Common.Models;
// Generic Sayfalama Yanıt Modeli (Her entity için tekrar kullanılabilir)
public class PagedResult<T>
{
    // 1. O anki sayfada bulunan veriler (Örn: 10 adet ürün)
    public IReadOnlyList<T> Items { get; init; }
    // 2. Kaçıncı sayfadayız? (Örn: 1, 2, 3...)
    public int PageNumber { get; init; }
    // 3. Bir sayfada kaç adet kayıt istenmişti? (Örn: 10)
    public int PageSize { get; init; }
    // 4. Veritabanındaki TOPLAM ürün sayısı (Örn: 145)
    public int TotalCount { get; init; }
    // 5. Hesaplanmış Toplam Sayfa Sayısı: Math.Ceiling(145 / 10.0) => 15 Sayfa
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    // 6. Önceki sayfa var mı? (1. sayfadaysak false, 2'deysek true)
    public bool HasPreviousPage => PageNumber > 1;
    // 7. Sonraki sayfa var mı? (Son sayfadaysak false, değilsek true)
    public bool HasNextPage => PageNumber < TotalPages;
    public PagedResult(IReadOnlyList<T> items, int totalCount, int pageNumber, int pageSize)
    {
        Items = items;
        TotalCount = totalCount;
        PageNumber = pageNumber;
        PageSize = pageSize;
    }
}
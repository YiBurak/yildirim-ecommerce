using EnterpriseECommerce.Domain.Common;
namespace EnterpriseECommerce.Domain.Entities;
// 📬 DEMİR POSTA KUTUSU: Olayların kaybolmaması için saklandığı tablo
public class OutboxMessage : BaseEntity
{
    // 1. Mektubun türü / başlığı ne? (Örn: "EnterpriseECommerce.Domain.Events.OrderCreatedEvent")
    public string Type { get; set; } = string.Empty;
    // 2. Mektubun içindeki bilgiler (Siparişin JSON hali):
    public string Content { get; set; } = string.Empty;
    // 3. Postacı bu mektubu dağıttı mı? 
    // Mektup ilk atıldığında burası NULL (boş) olur. Postacı dağıttığı an saat damgası basılır!
    public DateTime? ProcessedOnUtc { get; set; }
    // 4. Eğer dağıtırken bir hata oluştuysa hata detayı (Örn: "SMTP sunucusu yanıt vermedi"):
    public string? Error { get; set; }
}

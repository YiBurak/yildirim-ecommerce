namespace EnterpriseECommerce.Application.Common.Interfaces;
public interface IIdempotentCommand
{
    // Komutla birlikte taşınan Idempotency Anahtarı
    Guid IdempotencyKey { get; }
}

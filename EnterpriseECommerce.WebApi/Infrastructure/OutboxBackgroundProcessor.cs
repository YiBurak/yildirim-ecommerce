using System.Text.Json;
using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.Application.Orders.Events;
using EnterpriseECommerce.Domain.Events;
using MassTransit;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace EnterpriseECommerce.WebApi.Infrastructure;
// 🚐 POSTACI ARABASI: Veritabanındaki Outbox tablosunu tarayıp mektupları RabbitMQ'ya ve MediatR'a dağıtan servis
public class OutboxBackgroundProcessor : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<OutboxBackgroundProcessor> _logger;
    public OutboxBackgroundProcessor(
        IServiceProvider serviceProvider, 
        ILogger<OutboxBackgroundProcessor> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("📬 [OUTBOX SERVİSİ] Postacı arabası devriyede! Bekleyen mektuplar taranıyor...");
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
                var publisher = scope.ServiceProvider.GetRequiredService<IPublisher>();
                var publishEndpoint = scope.ServiceProvider.GetRequiredService<IPublishEndpoint>(); // 👈 MassTransit VIP Kuryesi
                // 1. Henüz işlenmemiş mektupları getir
                var messages = await context.OutboxMessages
                    .Where(m => m.ProcessedOnUtc == null)
                    .OrderBy(m => m.CreatedAt)
                    .Take(20)
                    .ToListAsync(stoppingToken);
                foreach (var message in messages)
                {
                    try
                    {
                        var eventType = Type.GetType(message.Type);
                        if (eventType == null)
                        {
                            _logger.LogWarning("⚠️ Olay tipi bulunamadı: {Type}", message.Type);
                            message.ProcessedOnUtc = DateTime.UtcNow;
                            message.Error = "Olay tipi bulunamadı.";
                            continue;
                        }
                        var domainEvent = JsonSerializer.Deserialize(message.Content, eventType);
                        if (domainEvent != null)
                        {
                            // A) Sunucu İçi Dağıtım (Eski MediatR Garsonu):
                            await publisher.Publish(domainEvent, stoppingToken);
                            // B) Dış Dünyaya / Mesaj Kuyruğuna Dağıtım (RabbitMQ Kargo Şirketi):
                            if (domainEvent is OrderCreatedEvent orderCreated)
                            {
                                var integrationEvent = new OrderCreatedIntegrationEvent
                                {
                                    OrderId = orderCreated.Order.Id,
                                    OrderNumber = orderCreated.Order.OrderNumber,
                                    CustomerEmail = orderCreated.Order.CustomerEmail,
                                    TotalAmount = orderCreated.Order.TotalAmount,
                                    PaymentCard = !string.IsNullOrEmpty(orderCreated.CardNumber)
                                        ? new EnterpriseECommerce.Application.Common.Models.PaymentCardDto(
                                            orderCreated.CardHolderName ?? "Musteri",
                                            orderCreated.CardNumber,
                                            orderCreated.ExpireMonth ?? "12",
                                            orderCreated.ExpireYear ?? "2030",
                                            orderCreated.Cvc ?? "123"
                                          )
                                        : null,
                                    CreatedAtUtc = DateTime.UtcNow
                                };
                                // 🐰 Mesajı RabbitMQ kuyruğuna fırlatıyoruz!
                                await publishEndpoint.Publish(integrationEvent, stoppingToken);
                                _logger.LogInformation("🚀 [OUTBOX -> RABBITMQ] Sipariş mektubu kuyruğa fırlatıldı: {OrderNumber}", integrationEvent.OrderNumber);
                            }
                        }
                        message.ProcessedOnUtc = DateTime.UtcNow;
                        message.Error = null;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "❌ Mektup dağıtılırken hata oluştu: {MessageId}", message.Id);
                        message.Error = ex.Message;
                    }
                }
                if (messages.Any())
                {
                    await context.SaveChangesAsync(stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Outbox döngüsünde beklenmeyen bir hata oluştu.");
            }
            // 5 saniye uyu, sonra tekrar posta kutusunu tara
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }
}

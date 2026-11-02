using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace EnterpriseECommerce.WebApi.Hubs;

public class CommerceHub : Hub
{
    private readonly ILogger<CommerceHub> _logger;

    public CommerceHub(ILogger<CommerceHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var user = Context.User;
        var connectionId = Context.ConnectionId;

        if (user?.Identity?.IsAuthenticated == true)
        {
            var email = user.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value 
                        ?? user.Identity.Name;
            var role = user.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            _logger.LogInformation("🟢 [SignalR] Kullanıcı bağlandı: {Email} (Rol: {Role}) | ConnId: {ConnId}", 
                email, role, connectionId);

            if (role == "Admin")
            {
                await Groups.AddToGroupAsync(connectionId, "Admins");
                _logger.LogInformation("👑 [SignalR] {Email} 'Admins' grubuna dahil edildi.", email);
            }
        }
        else
        {
            _logger.LogInformation("⚪ [SignalR] Ziyaretçi bağlandı | ConnId: {ConnId}", connectionId);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("🔴 [SignalR] Bağlantı koptu | ConnId: {ConnId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}

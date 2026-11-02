using FluentValidation;
namespace EnterpriseECommerce.Application.Orders.Commands.CancelOrder;
public class CancelOrderCommandValidator : AbstractValidator<CancelOrderCommand>
{
    public CancelOrderCommandValidator()
    {
        // Kural: OrderId boş Guid (00000000-0000-...) olamaz!
        RuleFor(x => x.OrderId)
            .NotEmpty()
            .WithMessage("İptal edilecek sipariş numarası (OrderId) boş olamaz!");
    }
}

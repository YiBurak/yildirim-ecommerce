using FluentValidation;


namespace EnterpriseECommerce.Application.Orders.Commands.CreateOrder;

public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        
        RuleFor(o => o.Items)
            .NotEmpty().WithMessage("Siparişte en az 1 ürün bulunmalıdır.");
        // 3. Kural: Sepetteki her bir kalemin kendi kuralları (Döngüsel Kontrol)
        RuleForEach(o => o.Items).ChildRules(items =>
        {
            // Ürün ID'si boş Guid (00000000-0000...) olamaz
            items.RuleFor(i => i.ProductId)
                .NotEmpty().WithMessage("Geçersiz ürün seçimi (Ürün ID'si boş olamaz).");
            // Adet en az 1 olmalı (0 veya -5 adet sipariş verilemez!)
            items.RuleFor(i => i.Quantity)
                .GreaterThan(0).WithMessage("Ürün adedi en az 1 olmalıdır.");
        });
    }
}

namespace EnterpriseECommerce.Application.Common.Models;

public record PaymentCardDto(
    string CardHolderName,
    string CardNumber,
    string ExpireMonth,
    string ExpireYear,
    string Cvc
);


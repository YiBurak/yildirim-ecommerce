using EnterpriseECommerce.Domain.Entities;

namespace EnterpriseECommerce.Application.Common.Interfaces;

public interface IInvoicePdfGenerator
{
    byte[] GenerateInvoicePdf(Order order);
}


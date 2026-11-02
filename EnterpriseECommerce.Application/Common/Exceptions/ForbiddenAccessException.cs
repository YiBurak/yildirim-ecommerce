namespace EnterpriseECommerce.Application.Common.Exceptions;

public class ForbiddenAccessException : Exception
{
    public ForbiddenAccessException() 
        : base("Bu işlemi gerçekleştirmek için yetkiniz bulunmamaktadır.") { }

    public ForbiddenAccessException(string message) 
        : base(message) { }
}

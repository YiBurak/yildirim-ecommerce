namespace EnterpriseECommerce.Application.Common.Security;

// Bu etiketin sadece sınıflara (class/record) takılabileceğini belirtiyoruz:
[AttributeUsage(AttributeTargets.Class, AllowMultiple = true, Inherited = true)]
public class AuthorizeAttribute : Attribute
{
    public AuthorizeAttribute() { }

    // Virgüle ayrılmış roller (Örn: "Admin" veya "Admin,Manager")
    public string Roles { get; set; } = string.Empty;

    // İleride yazacağımız özel politikalar için (Örn: "CanDeleteProduct")
    public string Policy { get; set; } = string.Empty;
}

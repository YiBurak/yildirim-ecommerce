using EnterpriseECommerce.Application.Common.Exceptions;
using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseECommerce.WebApi.Infrastructure;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

     public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext, 
        Exception exception, 
        CancellationToken cancellationToken)
    {
        _logger.LogError(exception, "Bir hata meydana geldi: {Message}", exception.Message);
        var problemDetails = new ProblemDetails();
        switch (exception)
        {
           // 1. FluentValidation Doğrulama Hataları (400)
            case ValidationException validationException:
                httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
                var errors = validationException.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                await httpContext.Response.WriteAsJsonAsync(new
                {
                    title = "Doğrulama Hatası (Validation Error)",
                    status = StatusCodes.Status400BadRequest,
                    errors = errors
                }, cancellationToken);
                return true;
            // 2. Kaynak Bulunamadı Hataları (404)
            case NotFoundException notFoundException:
                httpContext.Response.StatusCode = StatusCodes.Status404NotFound;
                problemDetails.Status = StatusCodes.Status404NotFound;
                problemDetails.Title = "Kayıt Bulunamadı";
                problemDetails.Detail = notFoundException.Message;
                break;
            // 3. İş Mantığı / Domain Kuralı Hataları (400)
            case BusinessException businessException:
                httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
                problemDetails.Status = StatusCodes.Status400BadRequest;
                problemDetails.Title = "İş Mantığı Kural İhlali";
                problemDetails.Detail = businessException.Message;
                break;
            // 401: Giriş Yapmamış (Biletsiz)
            case UnauthorizedAccessException unauthorizedException:
                httpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
                problemDetails.Status = StatusCodes.Status401Unauthorized;
                problemDetails.Title = "Yetkisiz Erişim";
                problemDetails.Detail = unauthorizedException.Message;
                break;

            // 403: Giriş Yapmış Ama Yetkisi Yok (Customer gelip Admin işi yapmaya çalışıyor)
            case ForbiddenAccessException forbiddenException:
                httpContext.Response.StatusCode = StatusCodes.Status403Forbidden;
                problemDetails.Status = StatusCodes.Status403Forbidden;
                problemDetails.Title = "Erişim Engellendi";
                problemDetails.Detail = forbiddenException.Message;
                break;

            case DbUpdateConcurrencyException:
            httpContext.Response.StatusCode = StatusCodes.Status409Conflict;
                problemDetails.Status = StatusCodes.Status409Conflict;
                problemDetails.Title = "Eşzamanlılık Çakışması (Concurrency Conflict)";
                problemDetails.Detail = "İşlem yapmaya çalıştığınız veri, siz işlemi tamamlarken başka bir kullanıcı tarafından güncellendi. Lütfen sayfayı yenileyip tekrar deneyin.";
                break;

            
            // 4. Beklenmeyen Sunucu / Veritabanı Hataları (500)
            default:
                httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
                problemDetails.Status = StatusCodes.Status500InternalServerError;
                problemDetails.Title = "Sunucu Hatası";
                problemDetails.Detail = "Beklenmeyen bir hata oluştu. Lütfen sistem yöneticisiyle iletişime geçin.";
                break;
        }
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
        return true; // Hatayı başarıyla ele aldığımızı .NET'e bildiriyoruz
    }
}

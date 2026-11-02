# 1. Aşama: Derleme (Build Stage - .NET 10 SDK)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Docker Katman Önbelleği (Layer Caching) için önce csproj dosyalarını kopyalayıp restore ediyoruz:
COPY ["EnterpriseECommerce.Domain/EnterpriseECommerce.Domain.csproj", "EnterpriseECommerce.Domain/"]
COPY ["EnterpriseECommerce.Application/EnterpriseECommerce.Application.csproj", "EnterpriseECommerce.Application/"]
COPY ["EnterpriseECommerce.Persistence/EnterpriseECommerce.Persistence.csproj", "EnterpriseECommerce.Persistence/"]
COPY ["EnterpriseECommerce.WebApi/EnterpriseECommerce.WebApi.csproj", "EnterpriseECommerce.WebApi/"]

RUN dotnet restore "EnterpriseECommerce.WebApi/EnterpriseECommerce.WebApi.csproj"

# Tüm proje kaynak dosyalarını kopyala ve optimize Release paketini oluştur:
COPY . .
WORKDIR "/src/EnterpriseECommerce.WebApi"
RUN dotnet publish "EnterpriseECommerce.WebApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 2. Aşama: Çalışma Zamanı (Runtime Stage - Hafif, Hızlı ve Güvenli ASP.NET 10 İmajı)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 5041

ENV ASPNETCORE_URLS=http://+:5041
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .

# Kalıcı veritabanı (SQLite) ve yüklemeler için klasör oluştur:
RUN mkdir -p /app/data

ENTRYPOINT ["dotnet", "EnterpriseECommerce.WebApi.dll"]

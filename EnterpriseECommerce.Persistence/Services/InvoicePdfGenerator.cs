using System.Globalization;
using EnterpriseECommerce.Application.Common.Interfaces;
using EnterpriseECommerce.Domain.Entities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace EnterpriseECommerce.Persistence.Services;

public class InvoicePdfGenerator : IInvoicePdfGenerator
{
    static InvoicePdfGenerator()
    {
        // QuestPDF Community Lisansı:
        QuestPDF.Settings.License = LicenseType.Community;
        QuestPDF.Settings.UseSystemFonts = false;
    }

    public byte[] GenerateInvoicePdf(Order order)
    {
        var turkishCulture = new CultureInfo("tr-TR");
        var invoiceNumber = $"INV-{order.OrderNumber}";
        var createdDate = order.CreatedAt.ToString("dd MMMM yyyy HH:mm", turkishCulture);
        var subTotal = order.TotalAmount / 1.20m;
        var vatAmount = order.TotalAmount - subTotal;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(36); // ~0.5 inch
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontColor(Colors.Grey.Darken3));

                // 1. ÜST BİLGİ (HEADER)
                page.Header().Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(titleCol =>
                        {
                            titleCol.Item().Text("YILDIRIM")
                                .FontSize(20)
                                .SemiBold()
                                .FontColor(Colors.Grey.Darken4);
                            
                            titleCol.Item().Text("Kurumsal Hazır Giyim & Tasarım A.Ş.")
                                .FontSize(9)
                                .FontColor(Colors.Grey.Medium);
                            
                            titleCol.Item().Text("Levent Mah. Cömert Sok. No:1 Beşiktaş / İstanbul")
                                .FontSize(8)
                                .FontColor(Colors.Grey.Medium);
                        });

                        row.RelativeItem().AlignRight().Column(metaCol =>
                        {
                            metaCol.Item().Text("E-ARŞİV FATURA")
                                .FontSize(16)
                                .Bold()
                                .FontColor(Colors.Grey.Darken4);

                            metaCol.Item().Text($"Fatura No: {invoiceNumber}")
                                .FontSize(9)
                                .SemiBold();

                            metaCol.Item().Text($"Düzenleme Tarihi: {createdDate}")
                                .FontSize(9);

                            metaCol.Item().Text($"Ödeme Durumu: {(order.Status.ToString() == "Paid" ? "ÖDENDİ" : order.Status.ToString())}")
                                .FontSize(9)
                                .FontColor(order.Status.ToString() == "Paid" ? Colors.Green.Darken2 : Colors.Amber.Darken2)
                                .Bold();
                        });
                    });

                    col.Item().PaddingVertical(12).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

                    // Müşteri & Ödeme Detayları
                    col.Item().Row(clientRow =>
                    {
                        clientRow.RelativeItem().Column(c =>
                        {
                            c.Item().Text("SAYIN MÜŞTERİ").FontSize(8).Bold().FontColor(Colors.Grey.Medium);
                            c.Item().Text(order.CustomerEmail).FontSize(10).SemiBold();
                            c.Item().Text("Teslimat Türü: Sigortalı Standart Kargo").FontSize(8).FontColor(Colors.Grey.Medium);
                        });

                        clientRow.RelativeItem().AlignRight().Column(c =>
                        {
                            c.Item().Text("ÖDEME VE PROVİZYON").FontSize(8).Bold().FontColor(Colors.Grey.Medium);
                            c.Item().Text("Yöntem: Iyzico Sanal POS (256-Bit SSL)").FontSize(9);
                            c.Item().Text($"Ödeme Referansı: {(string.IsNullOrWhiteSpace(order.PaymentId) ? "PROV-TEST" : order.PaymentId)}").FontSize(8).FontColor(Colors.Grey.Medium);
                        });
                    });

                    col.Item().PaddingTop(12);
                });

                // 2. İÇERİK: ÜRÜN TABLOSU
                page.Content().PaddingTop(10).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(30);
                        columns.RelativeColumn(6);
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(3);
                    });

                    // Tablo Başlığı
                    table.Header(header =>
                    {
                        header.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten1).PaddingVertical(6).Text("#").FontSize(8).Bold();
                        header.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten1).PaddingVertical(6).Text("ÜRÜN AÇIKLAMASI").FontSize(8).Bold();
                        header.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten1).PaddingVertical(6).AlignRight().Text("BİRİM FİYAT").FontSize(8).Bold();
                        header.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten1).PaddingVertical(6).AlignCenter().Text("ADET").FontSize(8).Bold();
                        header.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten1).PaddingVertical(6).AlignRight().Text("TOPLAM").FontSize(8).Bold();
                    });

                    // Satırlar
                    int index = 1;
                    foreach (var item in order.Items)
                    {
                        var rowBackground = index % 2 == 0 ? Colors.Grey.Lighten5 : Colors.White;

                        table.Cell().Background(rowBackground).PaddingVertical(8).Text(index.ToString()).FontSize(8).FontColor(Colors.Grey.Medium);
                        table.Cell().Background(rowBackground).PaddingVertical(8).Column(c =>
                        {
                            c.Item().Text(item.Product?.Name ?? "Özel Koleksiyon Parçası").FontSize(9).SemiBold();
                            c.Item().Text($"SKU: {item.Product?.Sku ?? $"PRD-{item.ProductId.ToString()[..8].ToUpper()}"}").FontSize(7).FontColor(Colors.Grey.Medium);
                        });
                        table.Cell().Background(rowBackground).PaddingVertical(8).AlignRight().Text($"₺{item.UnitPrice.ToString("N2", turkishCulture)}").FontSize(9);
                        table.Cell().Background(rowBackground).PaddingVertical(8).AlignCenter().Text(item.Quantity.ToString()).FontSize(9);
                        table.Cell().Background(rowBackground).PaddingVertical(8).AlignRight().Text($"₺{(item.UnitPrice * item.Quantity).ToString("N2", turkishCulture)}").FontSize(9).SemiBold();

                        index++;
                    }
                });

                // 3. ALT BİLGİ: TUTAR VE YASAL NOTLAR
                page.Footer().Column(col =>
                {
                    // Tutar Özeti (Sağ Tarafa Hizalı)
                    col.Item().AlignRight().Width(240).Column(totals =>
                    {
                        totals.Item().Row(r =>
                        {
                            r.RelativeItem().Text("Ara Toplam:").FontSize(9);
                            r.RelativeItem().AlignRight().Text($"₺{subTotal.ToString("N2", turkishCulture)}").FontSize(9);
                        });

                        totals.Item().PaddingTop(2).Row(r =>
                        {
                            r.RelativeItem().Text("KDV (%20):").FontSize(9);
                            r.RelativeItem().AlignRight().Text($"₺{vatAmount.ToString("N2", turkishCulture)}").FontSize(9);
                        });

                        totals.Item().PaddingTop(2).Row(r =>
                        {
                            r.RelativeItem().Text("Kargo Bedeli:").FontSize(9);
                            r.RelativeItem().AlignRight().Text("ÜCRETSİZ").FontSize(9).FontColor(Colors.Green.Darken2);
                        });

                        totals.Item().PaddingVertical(4).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

                        totals.Item().Row(r =>
                        {
                            r.RelativeItem().Text("GENEL TOPLAM:").FontSize(11).Bold().FontColor(Colors.Grey.Darken4);
                            r.RelativeItem().AlignRight().Text($"₺{order.TotalAmount.ToString("N2", turkishCulture)}").FontSize(12).Bold().FontColor(Colors.Grey.Darken4);
                        });
                    });

                    col.Item().PaddingTop(20).LineHorizontal(0.5f).LineColor(Colors.Grey.Lighten2);

                    col.Item().PaddingTop(8).Row(r =>
                    {
                        r.RelativeItem().Text("Bu belge 213 sayılı V.U.K. hükümlerine göre elektronik ortamda düzenlenmiştir.")
                            .FontSize(7)
                            .FontColor(Colors.Grey.Medium);

                        r.RelativeItem().AlignRight().Text(text =>
                        {
                            text.Span("Sayfa ").FontSize(7).FontColor(Colors.Grey.Medium);
                            text.CurrentPageNumber().FontSize(7).FontColor(Colors.Grey.Medium);
                            text.Span(" / ").FontSize(7).FontColor(Colors.Grey.Medium);
                            text.TotalPages().FontSize(7).FontColor(Colors.Grey.Medium);
                        });
                    });
                });
            });
        });

        return document.GeneratePdf();
    }
}

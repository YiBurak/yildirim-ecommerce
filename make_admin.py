import sys
import os
import sqlite3

def main():
    if sys.stdout.encoding != 'utf-8':
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass
    script_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(script_dir, "EnterpriseECommerce.WebApi", "EnterpriseECommerce.db")

    if not os.path.exists(db_path):
        print(f"❌ Veritabanı dosyası bulunamadı: {db_path}")
        sys.exit(1)

    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    if len(sys.argv) < 2:
        print("=" * 60)
        print("🛡️ ENTERPRISE E-COMMERCE - KONSOL ADMIN YETKİLENDİRME ARACI")
        print("=" * 60)
        print("\nKullanım:")
        print("   python make_admin.py <kullanici_epostasi>\n")
        print("Mevcut Kayıtlı Kullanıcılar:")
        c.execute("SELECT Email, Role, FirstName, LastName FROM Users")
        users = c.fetchall()
        for u in users:
            icon = "👑" if u[1] == "Admin" else "👤"
            print(f"   {icon} {u[0]:<28} | Rol: {u[1]:<9} | {u[2]} {u[3]}")
        print("\n" + "=" * 60)
        sys.exit(0)

    target_email = sys.argv[1].strip().lower()
    c.execute("SELECT Id, Email, Role, FirstName, LastName FROM Users WHERE LOWER(Email) = ?", (target_email,))
    user = c.fetchone()

    if not user:
        print(f"❌ HATA: '{target_email}' e-posta adresine sahip bir kullanıcı bulunamadı!")
        print("Mevcut kullanıcıları görmek için argümansız çalıştırın: python make_admin.py")
        sys.exit(1)

    if user[2] == "Admin":
        print(f"ℹ️ BİLGİ: {user[3]} {user[4]} ({user[1]}) zaten ADMIN rolüne sahip!")
        sys.exit(0)

    c.execute("UPDATE Users SET Role = 'Admin', UpdatedAt = datetime('now') WHERE LOWER(Email) = ?", (target_email,))
    conn.commit()

    print("=" * 60)
    print(f"🎉 TEBRİKLER! {user[3]} {user[4]} ({user[1]})")
    print("👑 BAŞARIYLA ADMIN (YÖNETİCİ) YETKİSİNE YÜKSELTİLDİ!")
    print("=" * 60)
    print("👉 Kullanıcı sisteme giriş yaptığında Yönetici Paneli otomatik açılacaktır.")

if __name__ == "__main__":
    main()

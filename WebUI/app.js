// 🌐 1. BACKEND ADRESİMİZ
const API_BASE_URL = 'http://localhost:5041/api';

// 📦 2. UYGULAMANIN ANLIK HAFIZASI (STATE)
let cart = []; // Sepetteki ürünler
let hubConnection = null; // ⚡ Canlı SignalR Bağlantı Nesnesi


// 📡 3. CANLI KONSOLA LOG YAZDIRMA FONKSİYONU
function log(message, type = 'info') {
    const consoleEl = document.getElementById('live-console');
    const time = new Date().toLocaleTimeString();
    const item = document.createElement('div');
    item.className = `log-item ${type}`;
    item.textContent = `[${time}] ${message}`;
    consoleEl.appendChild(item);
    consoleEl.scrollTop = consoleEl.scrollHeight; // Otomatik aşağı kaydır
}

// 🍞 MODERN, RAHATSIZ ETMEYEN TOAST BİLDİRİMİ (Tarayıcı popup'ını kaldırdık!)
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const borderColors = { success: '#10b981', danger: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
    toast.style.cssText = `background:#1e293b;color:#f8fafc;padding:12px 20px;border-radius:10px;box-shadow:0 10px 25px rgba(0,0,0,0.4);font-size:14px;font-weight:500;border-left:5px solid ${borderColors[type] || borderColors.info};pointer-events:auto;transition:all 0.3s ease;opacity:0;transform:translateY(10px);`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// -------------------------------------------------------------
// ⭐️ 4. SİHİRLİ GARSOR: AKILLI API İSTEMCİSİ (HTTP INTERCEPTOR)
// -------------------------------------------------------------
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    options.headers = options.headers || {};
    
    // JSON gönderiyorsak başlığı ayarla:
    if (options.body && typeof options.body === 'string') {
        options.headers['Content-Type'] = 'application/json';
    }

    // Cebimizde Access Token varsa tabağın yanına koy (Bearer ey...):
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
        options.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // 1. İsteği mutfağa gönder:
    log(`➡️ [İSTEK] ${options.method || 'GET'} ${endpoint}`, 'info');
    let response = await fetch(url, options);

    // 2. Eğer mutfak "401: Biletinin süresi dolmuş!" derse (SESSİZ YENİLEME):
    if (response.status === 401) {
        log(`⚠️ [401 UNAUTHORIZED] Access Token süresi bitmiş! Sessiz yenileme deneniyor...`, 'warning');
        
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            log(`❌ Refresh Token bulunamadı, oturum kapatılıyor!`, 'danger');
            logout();
            throw new Error('Oturum süresi doldu.');
        }

        try {
            // Arka kapıdan /api/auth/refresh'e koş:
            const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: refreshToken })
            });

            if (!refreshRes.ok) {
                throw new Error('Refresh token geçersiz veya iptal edilmiş.');
            }

            const refreshData = await refreshRes.json();
            // Yeni anahtarları cebe koy:
            localStorage.setItem('accessToken', refreshData.accessToken);
            localStorage.setItem('refreshToken', refreshData.refreshToken);
            log(`🔄 [TOKEN ROTASYONU BAŞARILI] Yepyeni Access ve Refresh Token alındı!`, 'success');

            // 3. Yarım kalan isteği YENİ TOKEN ile tekrar dene:
            options.headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
            log(`🔁 [TEKRAR DENE] Yarım kalan istek yeni token ile tekrar gönderiliyor...`, 'info');
            response = await fetch(url, options);

        } catch (err) {
            log(`🚨 [OTURUM ÖLDÜ] Token yenilenemedi, lütfen tekrar giriş yapın!`, 'danger');
            logout();
            throw err;
        }
    }

    // 4. Rate Limiting Yakalama (429):
    if (response.status === 429) {
        log(`🛑 [429 TOO MANY REQUESTS] Çok hızlı istek attınız! Rate Limiter zırhı devrede.`, 'danger');
        showToast("Sakin ol şampiyon! 10 saniyede çok fazla işlem yaptın, biraz bekle.", 'warning');
        return response;
    }

    // 5. Concurrency / Çakışma Yakalama (409):
    if (response.status === 409) {
        log(`⚡ [409 CONFLICT] Flaş indirim zırhı! Başkası sizden önce davrandı.`, 'danger');
    }

    return response;
}
// -------------------------------------------------------------
// ⚡ 4.1. SİGNALR GERÇEK ZAMANLI (REAL-TIME) BAĞLANTI & DİNLEYİCİLER
// -------------------------------------------------------------
async function initSignalR() {
    try {
        let ticketQuery = '';
        const accessToken = localStorage.getItem('accessToken');

        // 1. Eğer kullanıcının oturumu varsa, güvenli POST ile tek kullanımlık 30 sn'lik bilet iste:
        if (accessToken) {
            try {
                const ticketRes = await apiFetch('/auth/hub-ticket', { method: 'POST' });
                if (ticketRes.ok) {
                    const ticketData = await ticketRes.json();
                    ticketQuery = `?ticket=${ticketData.ticket}`;
                    log(`🎟️ [GÜVENLİ BİLET] SignalR için tek kullanımlık bilet alındı.`, 'info');
                }
            } catch (err) {
                console.warn("Bilet alınamadı, anonim bağlanılıyor:", err);
            }
        }

        // Varsa eski bağlantıyı temiz kapat:
        if (hubConnection) {
            await hubConnection.stop();
        }

        // 2. Hub'a bağlan (URL'de sadece anlamsız bilet var, JWT yok!):
        hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(`http://localhost:5041/hubs/commerce${ticketQuery}`)
            .withAutomaticReconnect() // Ağ koparsa kendi kendine otomatik tekrar bağlanır
            .build();

        // ---------------------------------------------------------
        // 📡 3 CANLI OLAYI (EVENT) DİNLEME FREKANSLARI:
        // ---------------------------------------------------------

        // 1️⃣ Frekans: STOK DEĞİŞTİ (Sipariş verilince veya Admin değiştirince)
        hubConnection.on("ReceiveStockUpdated", (data) => {
            log(`⚡ [CANLI STOK GÜNCELLEMESİ] Ürün ID: ${data.productId} ➔ Yeni Stok: ${data.newStock}`, 'warning');
            
            // F5 atmadan vitrindeki ve admin panelindeki ürünleri anında yenile:
            loadProducts();
            const adminSection = document.getElementById('admin-section');
            if (adminSection && adminSection.style.display !== 'none') {
                loadAdminProducts();
            }
        });

        // 2️⃣ Frekans: YENİ SİPARİŞ OLUŞTU
        hubConnection.on("ReceiveOrderCreated", (data) => {
            log(`🔔 [YENİ SİPARİŞ BİLDİRİMİ] ${data.orderNumber} numaralı sipariş geldi! Tutar: ₺${data.totalAmount} (${data.customerEmail})`, 'success');
            
            // Eğer Admin paneli açıksa sipariş listesini anında yenile:
            const adminSection = document.getElementById('admin-section');
            if (adminSection && adminSection.style.display !== 'none') {
                loadAdminOrders();
            }
        });

        // 3️⃣ Frekans: SİPARİŞ DURUMU DEĞİŞTİ (İptal vb.)
        hubConnection.on("ReceiveOrderStatusChanged", (data) => {
            log(`📢 [SİPARİŞ DURUM DEĞİŞİKLİĞİ] Sipariş ${data.orderId} yeni durum: ${data.status}`, 'info');
            
            // Profilde veya admin panelinde açık olan siparişleri yenile:
            const profileSection = document.getElementById('profile-section');
            if (profileSection && profileSection.style.display !== 'none') {
                loadProfileAndOrders();
            }
            const adminSection = document.getElementById('admin-section');
            if (adminSection && adminSection.style.display !== 'none') {
                loadAdminOrders();
            }
        });

        // Bağlantıyı başlat:
        await hubConnection.start();
        log(`🟢 [SignalR BAĞLANDI] Canlı çift yönlü WebSocket kanalı aktif!`, 'success');

    } catch (err) {
        log(`🔴 [SignalR BAĞLANTI HATASI] ${err.message}`, 'danger');
    }
}


// -------------------------------------------------------------
// 🔐 5. GİRİŞ VE ÇIKIŞ İŞLEMLERİ
// -------------------------------------------------------------
async function login(email, password) {
    try {
        log(`🔑 Giriş yapılıyor: ${email}...`, 'info');
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Giriş başarısız!');
        }

        const data = await response.json();
        // Anahtarları tarayıcının cebine koyuyoruz:
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify({
            fullName: data.fullName,
            email: data.email,
            role: data.role
        }));

        log(`✅ Hoş geldin, ${data.fullName}! (Rol: ${data.role})`, 'success');
        updateUI();
        loadProducts();
        initSignalR(); // 👈 Giriş yapınca bilet alıp yetkili bağlan!   
    } catch (error) {
        log(`❌ Giriş Hatası: ${error.message}`, 'danger');
        showToast(error.message, 'danger');
    }
}

async function logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
        // Sunucuya da haber verip DB'deki token'ı null yaptıralım:
        try {
            await fetch(`${API_BASE_URL}/auth/revoke`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
                
            });
            log(`🚪 Oturum sunucudan da başarıyla iptal edildi (Revoke).`, 'info');
        } catch (e) {
            console.error(e);
        }
    }

    localStorage.clear();
    cart = [];
    updateUI();
    renderCart();
    log(`👋 Çıkış yapıldı.`, 'warning');
    if (hubConnection) { hubConnection.stop(); }
    initSignalR(); // 👈 Ziyaretçi olarak tekrar bağlan
}

// -------------------------------------------------------------
// 📦 6. ÜRÜNLERİ LİSTELEME
// -------------------------------------------------------------
async function loadProducts() {
    const listEl = document.getElementById('products-list');
    listEl.innerHTML = '<p class="placeholder-text">Ürünler yükleniyor...</p>';

    try {
        const res = await apiFetch('/products');
        if (!res.ok) throw new Error('Ürünler getirilemedi.');
        
       const data = await res.json();
        const products = data.items || data; // 👈 Paketin içinden asıl ürünler listesini (items) çıkarıyoruz!
        log(`📦 ${products.length} adet ürün getirildi (Cache-Aside devrede).`, 'success');

        if (products.length === 0) {
            listEl.innerHTML = '<p class="placeholder-text">Hiç ürün bulunamadı.</p>';
            return;
        }

        listEl.innerHTML = products.map(p => `
            <div class="product-card">
                <div>
                    <div class="product-title">${p.name}</div>
                    <div class="product-desc">${p.description || 'Açıklama yok'}</div>
                </div>
                <div>
                    <div class="product-price">₺${p.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                    <div class="product-stock ${p.stockQuantity <= 3 ? 'low' : ''}">
                        Stok: <strong>${p.stockQuantity}</strong> adet ${p.stockQuantity <= 3 ? '(Tükeniyor!)' : ''}
                    </div>
                    <button class="btn btn-primary" onclick="window.addToCart('${p.id}', '${p.name}', ${p.price}, ${p.stockQuantity})" ${p.stockQuantity === 0 ? 'disabled' : ''}>
                        ${p.stockQuantity === 0 ? 'Tükendi' : 'Sepete Ekle'}
                    </button>
                </div>
            </div>
        `).join('');

    } catch (err) {
        log(`❌ Ürün Hatası: ${err.message}`, 'danger');
        listEl.innerHTML = '<p class="placeholder-text">Ürünler yüklenirken bir hata oluştu.</p>';
    }
}

// -------------------------------------------------------------
// 🛒 7. SEPET VE SİPARİŞ VERME (IDEMPOTENCY ZIRHI)
// -------------------------------------------------------------
window.addToCart = function(id, name, price, stock) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        if (existing.quantity >= stock) {
            showToast("Mevcut stoktan fazlasını sepete ekleyemezsiniz!", 'warning');
            return;
        }
        existing.quantity++;
    } else {
        cart.push({ id, name, price, quantity: 1, stock });
    }
    log(`🛒 Sepete eklendi: ${name}`, 'info');
    renderCart();
};

function renderCart() {
    const cartEl = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('btn-checkout');

    if (cart.length === 0) {
        cartEl.innerHTML = '<p class="placeholder-text">Sepetiniz boş.</p>';
        totalEl.textContent = '₺0.00';
        checkoutBtn.disabled = true;
        return;
    }

    let total = 0;
    cartEl.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="cart-item">
                <span><strong>${item.name}</strong> x ${item.quantity}</span>
                <span>₺${itemTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
        `;
    }).join('');

    totalEl.textContent = `₺${total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    checkoutBtn.disabled = false;
}

async function checkout() {
    if (cart.length === 0) return;

    const btn = document.getElementById('btn-checkout');
    btn.disabled = true;
    btn.textContent = 'Sipariş İletiliyor...';

    // 🛡️ AĞ KOPMASI ZIRHI (Idempotency Key):
    const idempotencyKey = crypto.randomUUID();
    log(`🛡️ Idempotency Key üretildi: ${idempotencyKey}`, 'info');

    const orderPayload = {
        items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity
        }))
    };

    try {
        const res = await apiFetch('/orders', {
            method: 'POST',
            body: JSON.stringify(orderPayload),
            headers: {
                'Idempotency-Key': idempotencyKey
            }
        });

        if (res.ok) {
            const data = await res.json();
            log(`🎉 [SİPARİŞ BAŞARILI] Sipariş No: ${data.orderId || 'Oluşturuldu'}`, 'success');
            showToast("🎉 Siparişiniz başarıyla alındı ve kuyruğa iletildi!", 'success');
            cart = [];
            renderCart();
            loadProducts(); // Güncel stokları yeniden çek
        } else {
            const err = await res.json();
            log(`❌ Sipariş Verilemedi: ${err.detail || err.title || 'Hata'}`, 'danger');
            showToast(`Sipariş Hatası: ${err.detail || 'Bir sorun oluştu'}`, 'danger');
        }
    } catch (e) {
        log(`❌ Ağ/Sipariş Hatası: ${e.message}`, 'danger');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Siparişi Tamamla (Idempotent)';
    }
}
async function loadProfileAndOrders() {
    const ordersListEl = document.getElementById('orders-list');
    ordersListEl.innerHTML = '<p class="placeholder-text">Siparişleriniz taranıyor...</p>';
    try {
        // 1. Profil Bilgilerini Çek:
        const profileRes = await apiFetch('/auth/me');
        if (profileRes.ok) {
            const profile = await profileRes.json();
            document.getElementById('prof-name').textContent = profile.fullName;
            document.getElementById('prof-email').textContent = profile.email;
            document.getElementById('prof-role').textContent = profile.role;
            document.getElementById('prof-date').textContent = new Date(profile.createdAt).toLocaleDateString('tr-TR');
            document.getElementById('prof-orders-count').textContent = profile.totalOrdersCount;
        }
        // 2. Kullanıcının Siparişlerini Çek:
        const ordersRes = await apiFetch('/orders/my-orders');
        if (!ordersRes.ok) throw new Error('Siparişler getirilemedi.');
        
        const orders = await ordersRes.json();
        log(`📋 ${orders.length} adet geçmiş sipariş listelendi.`, 'info');
        if (orders.length === 0) {
            ordersListEl.innerHTML = '<p class="placeholder-text">Henüz hiç sipariş vermediniz.</p>';
            return;
        }
        // Duruma göre rozet belirleme yardımcısı:
        const getBadge = (status) => {
            if (status === 'Paid') return '<span class="badge badge-paid">🟢 ÖDENDİ</span>';
            if (status === 'PaymentFailed') return '<span class="badge badge-failed">🔴 ÖDEME BAŞARISIZ (STOK İADE)</span>';
            if (status === 'Pending') return '<span class="badge badge-pending">🟡 BEKLİYOR</span>';
            return `<span class="badge badge-cancelled">${status}</span>`;
        };
        ordersListEl.innerHTML = orders.map(o => `
            <div class="order-card">
                <div class="order-header">
                    <span class="order-number">Sipariş No: ${o.orderNumber}</span>
                    <span class="order-date">${new Date(o.createdAt).toLocaleString('tr-TR')}</span>
                </div>
                <div class="order-body">
                    <div class="order-items-summary">
                        ${o.items.map(i => `<div>• ${i.productName} (x${i.quantity})</div>`).join('')}
                    </div>
                    <div style="text-align: right;">
                        <div class="order-amount">₺${o.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                        <div style="margin-top: 5px;">${getBadge(o.status)}</div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        log(`❌ Profil Hatası: ${err.message}`, 'danger');
        ordersListEl.innerHTML = '<p class="placeholder-text">Siparişler yüklenirken bir sorun oluştu.</p>';
    }
}
// -------------------------------------------------------------
// 👑 7.6. YÖNETİCİ (ADMIN) İŞLEMLERİ: ÜRÜN, STOK VE SİPARİŞ YÖNETİMİ
// -------------------------------------------------------------

// A. Admin Verilerini (Ürünler + Tüm Siparişler) Yükle
async function loadAdminData() {
    await loadAdminProducts();
    await loadAdminOrders();
}

// 1. Ürünleri ve Stok Düzenleme Tablosunu Doldur:
async function loadAdminProducts() {
    const tableBody = document.getElementById('admin-products-table-body');
    tableBody.innerHTML = '<tr><td colspan="5" class="placeholder-text">Ürünler yükleniyor...</td></tr>';

    try {
        const res = await apiFetch('/products');
        if (!res.ok) throw new Error('Ürünler getirilemedi.');
        const data = await res.json();
        const products = data.items || data;

        if (products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="placeholder-text">Hiç ürün yok.</td></tr>';
            return;
        }

        tableBody.innerHTML = products.map(p => `
            <tr>
                <td><strong>${p.name}</strong><br><small style="color:var(--text-muted)">${p.description || ''}</small></td>
                <td><code>${p.sku}</code></td>
                <td>
                    <input type="number" id="price-${p.id}" value="${p.price}" step="0.01" class="table-input">
                </td>
                <td>
                    <input type="number" id="stock-${p.id}" value="${p.stockQuantity}" class="table-input">
                </td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="window.updateProduct('${p.id}', '${p.name}', '${p.sku}', '${p.categoryId}')">💾 Kaydet</button>
                    <button class="btn btn-danger btn-sm" onclick="window.deleteProduct('${p.id}', '${p.name}')">🗑️ Sil</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        log(`❌ Admin Ürün Hatası: ${err.message}`, 'danger');
    }
}

// 2. Hızlı Stok / Fiyat Güncelleme (PUT /api/products/{id})
window.updateProduct = async function(id, name, sku, categoryId) {
    const newPrice = parseFloat(document.getElementById(`price-${id}`).value);
    const newStock = parseInt(document.getElementById(`stock-${id}`).value, 10);

    log(`⚙️ Ürün güncelleniyor: ${name} (Yeni Fiyat: ₺${newPrice}, Yeni Stok: ${newStock})...`, 'info');

    try {
        const res = await apiFetch(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                id: id,
                name: name,
                description: 'Yönetici tarafından güncellendi',
                price: newPrice,
                stockQuantity: newStock,
                sku: sku,
                categoryId: categoryId || '11111111-1111-1111-1111-111111111111'
            })
        });

        if (res.ok) {
            log(`✅ [STOK/FİYAT GÜNCELLENDİ] ${name} başarıyla güncellendi (RAM önbelleği temizlendi)!`, 'success');
            showToast(`'${name}' başarıyla güncellendi!`, 'success');
            loadAdminProducts();
        } else {
            const err = await res.json();
            throw new Error(err.detail || 'Güncelleme başarısız!');
        }
    } catch (err) {
        log(`❌ Güncelleme Hatası: ${err.message}`, 'danger');
        showToast(err.message, 'danger');
    }
};

// 3. Ürün Silme (DELETE /api/products/{id})
window.deleteProduct = async function(id, name) {
    if (!confirm(`'${name}' adlı ürünü silmek istediğinize emin misiniz?`)) return;

    try {
        const res = await apiFetch(`/products/${id}`, { method: 'DELETE' });
        if (res.ok) {
            log(`🗑️ [ÜRÜN SİLİNDİ] '${name}' mağazadan kaldırıldı.`, 'warning');
            loadAdminProducts();
        } else {
            throw new Error('Ürün silinemedi.');
        }
    } catch (err) {
        log(`❌ Silme Hatası: ${err.message}`, 'danger');
        alert(err.message);
    }
};

// 4. Yeni Ürün Ekleme (POST /api/products)
async function addNewProduct(e) {
    e.preventDefault();
    const name = document.getElementById('new-prod-name').value;
    const price = parseFloat(document.getElementById('new-prod-price').value);
    const stock = parseInt(document.getElementById('new-prod-stock').value, 10);
    const sku = document.getElementById('new-prod-sku').value;
    const desc = document.getElementById('new-prod-desc').value;

    log(`➕ Yeni ürün ekleniyor: ${name}...`, 'info');

    try {
        const res = await apiFetch('/products', {
            method: 'POST',
            body: JSON.stringify({
                name: name,
                description: desc,
                price: price,
                stockQuantity: stock,
                sku: sku,
                categoryId: '11111111-1111-1111-1111-111111111111' // Varsayılan Elektronik Kategorisi
            })
        });

        if (res.ok) {
            log(`🎉 [YENİ ÜRÜN EKLENDİ] ${name} vitrine girdi!`, 'success');
            showToast(`'${name}' başarıyla vitrine eklendi!`, 'success');
            document.getElementById('add-product-form').reset();
            loadAdminProducts();
        } else {
            const err = await res.json();
            throw new Error(err.detail || 'Ürün eklenemedi!');
        }
    } catch (err) {
        log(`❌ Ekleme Hatası: ${err.message}`, 'danger');
        showToast(err.message, 'danger');
    }
}

// 5. Tüm Müşterilerin Siparişlerini Listeleme (GET /api/orders/all)
async function loadAdminOrders() {
    const listEl = document.getElementById('admin-orders-list');
    listEl.innerHTML = '<p class="placeholder-text">Tüm müşteri siparişleri taranıyor...</p>';

    try {
        const res = await apiFetch('/orders/all');
        if (!res.ok) throw new Error('Siparişler getirilemedi.');
        const orders = await res.json();
        log(`📑 [ADMİN] Toplam ${orders.length} adet müşteri siparişi getirildi.`, 'info');

        if (orders.length === 0) {
            listEl.innerHTML = '<p class="placeholder-text">Sistemde henüz hiç sipariş yok.</p>';
            return;
        }

        const getBadge = (status) => {
            if (status === 'Paid') return '<span class="badge badge-paid">🟢 ÖDENDİ</span>';
            if (status === 'PaymentFailed') return '<span class="badge badge-failed">🔴 ÖDEME BAŞARISIZ</span>';
            if (status === 'Pending') return '<span class="badge badge-pending">🟡 BEKLİYOR</span>';
            return `<span class="badge badge-cancelled">${status}</span>`;
        };

        listEl.innerHTML = orders.map(o => `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <span class="order-number">${o.orderNumber}</span>
                        <span class="customer-tag">👤 ${o.customerEmail}</span>
                    </div>
                    <span class="order-date">${new Date(o.createdAt).toLocaleString('tr-TR')}</span>
                </div>
                <div class="order-body">
                    <div class="order-items-summary">
                        ${o.items.map(i => `<div>• ${i.productName} (x${i.quantity})</div>`).join('')}
                    </div>
                    <div style="text-align: right;">
                        <div class="order-amount">₺${o.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                        <div style="margin-top: 5px; display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                            ${getBadge(o.status)}
                            ${o.status !== 'Cancelled' ? `<button class="btn btn-danger btn-sm" onclick="window.cancelAdminOrder('${o.id}')">İptal Et & İade</button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (err) {
        log(`❌ Admin Sipariş Hatası: ${err.message}`, 'danger');
    }
}

// 6. Admin Tarafından Sipariş İptali ve Stok İadesi (POST /api/orders/{id}/cancel)
window.cancelAdminOrder = async function(id) {
    if (!confirm("Bu siparişi iptal edip stokları depoya iade etmek istiyor musunuz?")) return;

    try {
        const res = await apiFetch(`/orders/${id}/cancel`, { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            log(`🔄 [SİPARİŞ İPTAL EDİLDİ] ${data.message}`, 'warning');
            alert(data.message);
            loadAdminOrders();
            loadAdminProducts();
        } else {
            throw new Error('İptal işlemi başarısız.');
        }
    } catch (err) {
        log(`❌ İptal Hatası: ${err.message}`, 'danger');
        alert(err.message);
    }
};


// -------------------------------------------------------------
// 🖥️ 8. EKRAN GÖRÜNÜMÜNÜ GÜNCELLEME (Giriş/Çıkış Durumu)
// -------------------------------------------------------------
function updateUI() {
    const user = JSON.parse(localStorage.getItem('user'));
    const loginSection = document.getElementById('login-section');
    const userInfo = document.getElementById('user-info');
    const btnLogout = document.getElementById('btn-logout');
    const btnProfile = document.getElementById('btn-toggle-profile');
    const btnAdmin = document.getElementById('btn-toggle-admin');

    if (user) {
        loginSection.style.display = 'none';
        userInfo.innerHTML = `👤 <strong>${user.fullName}</strong> <small>(${user.role})</small>`;
        btnLogout.style.display = 'inline-block';
        btnProfile.style.display = 'inline-block';

        // 👑 Sadece ve Sadece Rolü ADMIN Olanlara Göster:
        if (user.role === 'Admin') {
            btnAdmin.style.display = 'inline-block';
        } else {
            btnAdmin.style.display = 'none';
        }
    } else {
        loginSection.style.display = 'block';
        userInfo.textContent = 'Giriş Yapılmadı';
        btnLogout.style.display = 'none';
        btnProfile.style.display = 'none';
        btnAdmin.style.display = 'none';
        document.getElementById('profile-section').style.display = 'none';
        document.getElementById('admin-section').style.display = 'none';
        document.getElementById('shop-section').style.display = 'grid';
    }
}



// -------------------------------------------------------------
// 🚀 9. SAYFA İLK AÇILDIĞINDA ÇALIŞACAK KODLAR
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Giriş formu dinleyicisi:
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const pass = document.getElementById('password').value;
        login(email, pass);
    });
        // Profil / Siparişler sekmesine geçiş butonu:
    document.getElementById('btn-toggle-profile').addEventListener('click', () => {
        document.getElementById('shop-section').style.display = 'none';
        document.getElementById('profile-section').style.display = 'block';
        loadProfileAndOrders();
    });
    // Vitrine geri dön butonu:
    document.getElementById('btn-back-to-shop').addEventListener('click', () => {
        document.getElementById('profile-section').style.display = 'none';
        document.getElementById('shop-section').style.display = 'grid';
        loadProducts();
    });
    initSignalR(); // 👈 Sayfa ilk açıldığında WebSocket hattını aç!


    // Çıkış butonu:
    document.getElementById('btn-logout').addEventListener('click', logout);

    // Ürünleri yenile butonu:
    document.getElementById('btn-refresh-products').addEventListener('click', loadProducts);

    // Sipariş ver butonu:
    document.getElementById('btn-checkout').addEventListener('click', checkout);

    // Konsol temizle:
    document.getElementById('btn-clear-log').addEventListener('click', () => {
        document.getElementById('live-console').innerHTML = '';
    });

        // Admin Paneline Geçiş Butonu:
    document.getElementById('btn-toggle-admin').addEventListener('click', () => {
        document.getElementById('shop-section').style.display = 'none';
        document.getElementById('profile-section').style.display = 'none';
        document.getElementById('admin-section').style.display = 'block';
        loadAdminData();
    });

    // Admin Panelinden Vitrine Dönüş:
    document.getElementById('btn-admin-back-to-shop').addEventListener('click', () => {
        document.getElementById('admin-section').style.display = 'none';
        document.getElementById('shop-section').style.display = 'grid';
        loadProducts();
    });

    // Yeni Ürün Ekleme Formu:
    document.getElementById('add-product-form').addEventListener('submit', addNewProduct);

    // Tablo ve Sipariş Yenileme Butonları:
    document.getElementById('btn-refresh-admin-products').addEventListener('click', loadAdminProducts);
    document.getElementById('btn-refresh-admin-orders').addEventListener('click', loadAdminOrders);


    // Açılışta UI'ı hazırla ve ürünleri getir:
    updateUI();
    loadProducts();
    initSignalR(); // 👈 Sayfa ilk açıldığında WebSocket hattını aç!
});

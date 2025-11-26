let rates = {};

// TCMB'den döviz kurlarını al (Türkiye Cumhuriyet Merkez Bankası - Resmi kaynak)
async function fetchRates() {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    // TCMB XML API
    const url = `https://www.tcmb.gov.tr/kurlar/${year}${month}/${day}${month}${year}.xml`;
    
    const response = await fetch(url);
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, 'text/xml');
    
    // USD kurunu al
    const usdNode = xml.querySelector('Currency[Kod="USD"] ForexSelling');
    if (usdNode) {
      rates.USD = parseFloat(usdNode.textContent);
      console.log('USD/TRY (TCMB):', rates.USD);
    }
    
    // EUR kurunu al
    const eurNode = xml.querySelector('Currency[Kod="EUR"] ForexSelling');
    if (eurNode) {
      rates.EUR = parseFloat(eurNode.textContent);
      console.log('EUR/TRY (TCMB):', rates.EUR);
    }
    
    // GBP kurunu al
    const gbpNode = xml.querySelector('Currency[Kod="GBP"] ForexSelling');
    if (gbpNode) {
      rates.GBP = parseFloat(gbpNode.textContent);
      console.log('GBP/TRY (TCMB):', rates.GBP);
    }
    
    console.log('TCMB kurları güncellendi:', rates);
  } catch (error) {
    console.error('TCMB kurları alınamadı, yedek API deneniyor...', error);
    // Yedek olarak ExchangeRate-API kullan
    await fetchRatesBackup();
  }
}

// Yedek API (TCMB erişilemezse)
async function fetchRatesBackup() {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    
    if (data && data.rates && data.rates.TRY) {
      rates.USD = data.rates.TRY;
      rates.EUR = data.rates.TRY / (data.rates.EUR || 1);
      rates.GBP = data.rates.TRY / (data.rates.GBP || 1);
      console.log('Yedek API kurları:', rates);
    }
  } catch (error) {
    console.error('Yedek API de başarısız:', error);
  }
}

// Para değerlerini algıla ve TL'ye çevir
function convertCurrencies() {
  // Daha geniş regex - virgüllü ve virgülsüz sayılar için
  const currencyRegex = /(\$|€|£)\s*(\d{1,3}(?:[,.\s]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/g;
  
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Script ve style etiketlerini atla
        if (node.parentElement.tagName === 'SCRIPT' || 
            node.parentElement.tagName === 'STYLE' ||
            node.parentElement.classList.contains('tl-converted')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    },
    false
  );

  const nodesToReplace = [];
  
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.nodeValue && node.nodeValue.match(currencyRegex)) {
      nodesToReplace.push(node);
    }
  }

  let convertedCount = 0;
  
  nodesToReplace.forEach(node => {
    const text = node.nodeValue;
    const newText = text.replace(currencyRegex, (match, symbol, amount) => {
      // Sayıyı temizle (virgül ve nokta işaretlerini kaldır)
      const cleanAmount = parseFloat(amount.replace(/[,\s]/g, '').replace(',', '.'));
      
      if (isNaN(cleanAmount)) return match;
      
      let tlValue = 0;
      
      if (symbol === '$' && rates.USD) {
        tlValue = cleanAmount * rates.USD;
      } else if (symbol === '€' && rates.EUR) {
        tlValue = cleanAmount * rates.EUR;
      } else if (symbol === '£' && rates.GBP) {
        tlValue = cleanAmount * rates.GBP;
      }
      
      if (tlValue > 0) {
        convertedCount++;
        return `${match} (≈${tlValue.toFixed(2)}₺)`;
      }
      return match;
    });
    
    if (text !== newText) {
      const span = document.createElement('span');
      span.className = 'tl-converted';
      span.innerHTML = newText;
      node.parentNode.replaceChild(span, node);
    }
  });
  
  console.log(`${convertedCount} adet para birimi çevrildi.`);
  return convertedCount;
}

// Popup'tan mesaj dinle
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'convert') {
    console.log('Çevirme işlemi başlatılıyor...');
    console.log('Mevcut kurlar:', rates);
    
    fetchRates().then(() => {
      console.log('Yeni kurlar alındı:', rates);
      createRatePanel(); // Kur panelini göster
      const count = convertCurrencies();
      sendResponse({ status: 'done', count: count });
    }).catch(error => {
      console.error('Hata:', error);
      sendResponse({ status: 'error', message: error.message });
    });
  }
  return true; // Asenkron yanıt için gerekli
});

// Kur bilgisi panelini oluştur
function createRatePanel() {
  // Eğer panel zaten varsa, kaldır
  const existingPanel = document.getElementById('tl-rate-panel');
  if (existingPanel) {
    existingPanel.remove();
  }

  const panel = document.createElement('div');
  panel.id = 'tl-rate-panel';
  panel.innerHTML = `
    <div style="position: fixed; top: 20px; right: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); z-index: 999999; font-family: 'Segoe UI', sans-serif; min-width: 200px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <strong style="font-size: 16px;">Güncel Kurlar</strong>
        <button id="tl-close-btn" style="background: rgba(255,255,255,0.3); border: none; color: white; cursor: pointer; border-radius: 50%; width: 24px; height: 24px; font-size: 16px; line-height: 1;">×</button>
      </div>
      <div id="tl-rates-content" style="font-size: 14px; line-height: 1.8;">
        <div style="opacity: 0.8;">Kurlar yükleniyor...</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Kapat butonu
  document.getElementById('tl-close-btn').addEventListener('click', () => {
    panel.remove();
  });
  
  // Kurları güncelle
  updateRatePanel();
}

// Panel içindeki kur bilgilerini güncelle
function updateRatePanel() {
  const content = document.getElementById('tl-rates-content');
  if (!content) return;
  
  if (rates.USD || rates.EUR || rates.GBP) {
    let html = '<div style="font-size: 11px; opacity: 0.7; margin-bottom: 5px;">TCMB (Resmi)</div>';
    if (rates.USD) html += `<div>1 USD = ${rates.USD.toFixed(4)}₺</div>`;
    if (rates.EUR) html += `<div>1 EUR = ${rates.EUR.toFixed(4)}₺</div>`;
    if (rates.GBP) html += `<div>1 GBP = ${rates.GBP.toFixed(4)}₺</div>`;
    content.innerHTML = html;
  } else {
    content.innerHTML = '<div style="opacity: 0.8;">Kurlar alınamadı</div>';
  }
}

// Sayfa yüklendiğinde kurları hazır tut
console.log('TL Çevirici yüklendi');
fetchRates();

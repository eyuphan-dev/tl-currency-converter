document.getElementById('convertBtn').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  const button = document.getElementById('convertBtn');
  
  button.disabled = true;
  statusDiv.textContent = 'Çeviriliyor...';
  statusDiv.style.color = '#666';
  
  try {
    // Aktif sekmeye mesaj gönder
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, { action: 'convert' }, (response) => {
      if (chrome.runtime.lastError) {
        statusDiv.textContent = 'Hata: Sayfa yeniden yüklenmelidir';
        statusDiv.style.color = 'red';
        button.disabled = false;
        return;
      }
      
      if (response && response.status === 'done') {
        statusDiv.textContent = `Başarılı: ${response.count || 0} değer çevrildi!`;
        statusDiv.style.color = 'green';
      } else {
        statusDiv.textContent = 'Hata oluştu';
        statusDiv.style.color = 'red';
      }
      button.disabled = false;
    });
  } catch (error) {
    statusDiv.textContent = 'Hata: ' + error.message;
    statusDiv.style.color = 'red';
    button.disabled = false;
  }
});

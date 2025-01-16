// background.js
let selectedResponse = '';

// Popup'tan gelen mesajları dinle
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startSurveys") {
        // selectedResponse 1'den başladığı için 1 eksiltiyoruz (index 0'dan başlayacak)
        selectedResponse = parseInt(message.response) - 1;
        startSurveyProcess();
    }
});

// Anket sürecini başlat
async function startSurveyProcess() {
    // Aktif tabı bul ve linklerini çek
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab) {
        // Aktif sayfadan linkleri çek
        const results = await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            function: () => {
                const linkElements = document.querySelectorAll('a.btn.btn-block.btn-primary');
                return Array.from(linkElements).map(link => link.href);
            }
        });
        
        const surveyLinks = results[0].result;
        console.log('Bulunan linkler:', surveyLinks);
        
        // Tüm anketleri aynı anda aç
        surveyLinks.forEach(link => openSurveyTab(link));
    }
}

// Anket sayfasını aç ve scripti enjekte et
function openSurveyTab(url) {
    chrome.tabs.create({ 
        url: url,
        active: true
    }, (tab) => {
        // Tab yüklendiğinde scripti enjekte et
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === tab.id && info.status === 'complete') {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: injectSurveyScript,
                    args: [selectedResponse]
                });
                // Listener'ı kaldır
                chrome.tabs.onUpdated.removeListener(listener);
            }
        });
    });
}

// Sayfalara enjekte edilecek script
function injectSurveyScript(selectedResponse) {
    // Biraz bekle ki sayfa tam yüklensin
    setTimeout(() => {
        try {
            // Seçenekleri seç
            const choice = document.querySelectorAll(".control-label");
            for(let i = 0; i <= 13; i++) { 
                choice[5*i + selectedResponse].click();
            }
            // Son seçeneği işaretle
            document.querySelector("#surveyParent > div:nth-child(2) > div:nth-child(3) > div:nth-child(16) > div:nth-child(3) > div > label").click();

            // Formu gönder
            setTimeout(() => {
                document.querySelector("#surveyParent > div:nth-child(5) > div > a").click();
            }, 500); // Butonları tıkladıktan 0.5 saniye sonra gönder

        } catch (error) {
            console.error('Script çalıştırılırken hata:', error);
        }
    }, 1000); // Sayfanın tam yüklenmesi için 1 saniye bekle
}
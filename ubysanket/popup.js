document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("startButton").addEventListener("click", () => {
        const response = document.getElementById("response").value;
        if (!response) {
            alert("Lütfen bir seçenek seçin!");
            return;
          }        
        chrome.runtime.sendMessage({ action: "startSurveys", response });
    });
});

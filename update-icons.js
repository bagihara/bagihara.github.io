const fs = require('fs');
const https = require('https');

async function fetchIcon(packageName) {
    return new Promise((resolve) => {
        const url = `https://play.google.com/store/apps/details?id=${packageName}&hl=tr`;
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const match = data.match(/https:\/\/play-lh\.googleusercontent\.com\/[^\s"<>]+/);
                if (match) {
                    // Genellikle ilk eşleşen yüksek çözünürlüklü ikondur
                    resolve(match[0]);
                } else {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

async function updateHtml() {
    let html = fs.readFileSync('index.html', 'utf8');

    // Paket adlarını bul ve ikonları güncelle
    const packageRegex = /packageName:\s*"([^"]+)",\s*iconUrl:\s*"([^"]*)"/g;
    let match;

    // Tüm paketleri bulup sırayla ikonlarını çekeceğiz
    const replacements = [];

    while ((match = packageRegex.exec(html)) !== null) {
        const packageName = match[1];
        console.log(`İkon aranıyor: ${packageName}...`);
        const iconUrl = await fetchIcon(packageName);
        if (iconUrl) {
            console.log(`Bulundu: ${iconUrl}`);
            replacements.push({
                oldStr: match[0],
                newStr: `packageName: "${packageName}",\n                iconUrl: "${iconUrl}"`
            });
        }
    }

    for (const r of replacements) {
        html = html.replace(r.oldStr, r.newStr);
    }

    fs.writeFileSync('index.html', html, 'utf8');
    console.log('index.html başarıyla güncellendi!');
}

updateHtml();
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('assets-form');
    const assetsContainer = document.getElementById('assets-container');
    const sendDataButton = document.getElementById('send-data');

    let aggregatedAssets = {};
    let saleCode = '';

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const fileInput = document.getElementById('csv-file');
        const file = fileInput.files[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                complete: function (results) {
                    processCSV(results.data);
                    generateAssetModule();
                    sendDataButton.style.display = 'block';
                }
            });
        }
    });

    sendDataButton.addEventListener('click', () => {
        const data = prepareDataForSending();
        sendData(data);
    });

    function processCSV(data) {
        aggregatedAssets = {};
        saleCode = data.length > 0 && data[0]['Sale Code'] ? data[0]['Sale Code'] : 'UnknownSaleCode';

        data.filter(row => row['Asset URL']).forEach(row => {
            const assetURL = row['Asset URL'];
            if (!aggregatedAssets[assetURL]) {
                aggregatedAssets[assetURL] = {
                    assetURL: assetURL,
                    saleCode: saleCode,
                    notes: '',
                    printType: 'Screenprint'
                };
            }
        });
    }

    function generateAssetModule() {
        assetsContainer.innerHTML = ''; // Clear previous assets
        Object.keys(aggregatedAssets).forEach(key => {
            const asset = aggregatedAssets[key];
            const assetDiv = document.createElement('div');
            assetDiv.className = 'asset';
            assetDiv.innerHTML = `
                <img src="${asset.assetURL}" alt="${key}" />
                <select class="print-type">
                    <option value="Screenprint">Screenprint</option>
                    <option value="HeatSeal / DTF">HeatSeal / DTF</option>
                    <option value="Embroidery">Embroidery</option>
                    <option value="Sublimated/NoArtNeeded">Sublimated/NoArtNeeded</option>
                </select>
                <input type="text" class="notes" placeholder="Notes" />
            `;
            assetsContainer.appendChild(assetDiv);
        });
    }

    function prepareDataForSending() {
        const assetDivs = document.querySelectorAll('.asset');
        const data = {
            assets: [],
            saleCode: saleCode
        };
        assetDivs.forEach(div => {
            const assetURL = div.querySelector('img').src;
            const printType = div.querySelector('.print-type').value;
            const notes = div.querySelector('.notes').value;
            data.assets.push({ assetURL, printType, notes });
        });
        return data;
    }

    async function sendData(data) {
        const endpoint = 'https://your-endpoint-url.com'; // Replace with your actual endpoint
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                const responseData = await response.json();
                console.log('Data sent successfully:', responseData);
                alert('Data sent successfully');
            } else {
                console.error('Failed to send data:', response.statusText);
                alert('Failed to send data');
            }
        } catch (error) {
            console.error('Error sending data:', error);
            alert('Error sending data');
        }
    }
});

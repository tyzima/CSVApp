document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('assets-form');
    const assetsContainer = document.getElementById('assets-container');
    const sendDataButton = document.getElementById('send-data');
    const fileDropArea = document.querySelector('.file-drop-area');
    const fileInput = document.getElementById('csv-file');

    let aggregatedAssets = {};
    let saleCode = '';

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const file = fileInput.files[0];
        if (file) {
            processFile(file);
        }
    });

    sendDataButton.addEventListener('click', () => {
        const data = prepareDataForSending();
        sendData(data);
    });

    assetsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('print-type-button')) {
            const buttons = event.target.parentElement.querySelectorAll('.print-type-button');
            buttons.forEach(button => button.classList.remove('active'));
            event.target.classList.add('active');
        }
    });

    // Drag and Drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      fileDropArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      fileDropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      fileDropArea.addEventListener(eventName, unhighlight, false);
    });

    fileDropArea.addEventListener('drop', handleDrop, false);

    function processFile(file) {
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
                    printType: 'Scrn'
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
                <div class="image-container">
                    <img src="${asset.assetURL}" alt="${key}" />
                </div>
                <div class="print-type-buttons">
                    <button data-value="Scrn" class="print-type-button active">Scrn</button>
                    <button data-value="Emb" class="print-type-button">Emb</button>
                    <button data-value="Heat" class="print-type-button">Heat</button>
                    <button data-value="" class="print-type-button">X</button>
                </div>
                <select class="additional-options">
                    <option value="" selected>Choose an option</option>
                    <option value="+ Number">+ Number</option>
                    <option value="+ Name">+ Name</option>
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
            const printTypeButton = div.querySelector('.print-type-button.active');
            const printType = printTypeButton ? printTypeButton.dataset.value : 'Scrn'; // Default to 'Scrn' if none selected
            const additionalOptions = div.querySelector('.additional-options').value;
            const notes = div.querySelector('.notes').value;
            data.assets.push({ assetURL, printType, additionalOptions, notes });
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

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        fileDropArea.classList.add('highlight');
    }

    function unhighlight(e) {
        fileDropArea.classList.remove('highlight');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        fileInput.files = dt.files;
        processFile(file);
    }
});

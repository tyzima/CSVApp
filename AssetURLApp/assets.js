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
    
        data.forEach(row => {
            const assetURL = row['Asset URL'];
            const quantity = parseInt(row['Quantity'], 10) || 0;
    
            if (assetURL && quantity > 0) {
                if (!aggregatedAssets[assetURL]) {
                    aggregatedAssets[assetURL] = {
                        assetURL: assetURL,
                        saleCode: saleCode,
                        notes: '',
                        printType: 'Scrn',
                        additionalOptions: '',
                        quantity: 0
                    };
                }
                aggregatedAssets[assetURL].quantity += quantity;
            }
        });
    }
    

    function generateAssetModule() {
        assetsContainer.innerHTML = ''; // Clear previous assets
        Object.keys(aggregatedAssets).forEach(key => {
            const asset = aggregatedAssets[key];
            const assetDiv = document.createElement('div');
            assetDiv.className = 'asset';
            assetDiv.style.position = 'relative';
    
            const qtyDiv = document.createElement('div');
            qtyDiv.innerText = `Qty: ${asset.quantity}`;
            qtyDiv.style.position = 'absolute';
            qtyDiv.style.bottom = '5px';
            qtyDiv.style.left = '5px';
            qtyDiv.style.padding = '2px 5px';
            qtyDiv.style.backgroundColor = asset.quantity < 6 ? 'rgba(255, 0, 0, 0.2)' : 'transparent';
            qtyDiv.style.borderRadius = '5px';
    
            assetDiv.innerHTML = `
                <div class="image-container">
                    <img src="${asset.assetURL}" alt="${key}" />
                </div>
                <div class="controls">
                    <div class="print-type-buttons">
                        <button class="print-type-button" data-value="Scrn">Scrn</button>
                        <button class="print-type-button" data-value="Emb">Emb</button>
                        <button class="print-type-button" data-value="Heat">Heat</button>
                        <button class="print-type-button" data-value="">X</button>
                    </div>
                    <select class="additional-options">
                        <option value="" selected></option>
                        <option value="+ Number">+ Number</option>
                        <option value="+ Name">+ Name</option>
                    </select>
                    <input type="text" class="notes" placeholder="Notes" />
                </div>
            `;
    
            assetDiv.querySelector(`.print-type-button[data-value="${asset.printType}"]`).classList.add('active');
            assetDiv.querySelector('.additional-options').value = asset.additionalOptions;
            assetDiv.querySelector('.notes').value = asset.notes;
    
            assetDiv.appendChild(qtyDiv);
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

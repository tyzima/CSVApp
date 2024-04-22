document.addEventListener('DOMContentLoaded', () => {
    const errorSound = new Audio('stop.mp3');
    const form = document.getElementById('csv-form');
    const statusDiv = document.getElementById('status');
    const summaryDiv = document.getElementById('order-summary');
    const sendToSalesforceButton = document.getElementById('send-to-salesforce');
    const fileDropArea = document.querySelector('.file-drop-area');

    if (fileDropArea) {
        // Unlock audio context on user interaction with the file drop area
        fileDropArea.addEventListener('dragover', () => {
            errorSound.play().then(() => {
                errorSound.pause(); // Pause immediately after play
                errorSound.currentTime = 0; // Reset the playback position
            }).catch(error => {
                console.error('Error trying to unlock the audio context:', error);
            });
        });
    } else {
        console.error('Element with class "file-drop-area" not found');
    }

    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            statusDiv.innerText = "Loading...";
            const fileInput = document.getElementById('csv-file');
            const file = fileInput.files[0];
            statusDiv.innerText = "Processing CSV...";

            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                complete: function (results) {
                    console.log("Debug: Papa.parse complete");
                    processCSV1(results.data);
                    setTimeout(() => {
                        const aggregatedData = processCSV2(results.data);
                        const totalProducts = results.data
                            .filter(row => row['Quantity'] || row['Product Name'])  
                            .reduce((acc, row) => acc + (row['Quantity'] || 1), 0);                    
                        summaryDiv.innerText = `Total Products Ordered: ${totalProducts}`;
                        summaryDiv.style.display = 'block';

                        // Show send to Salesforce button and attach click event
                        sendToSalesforceButton.style.display = 'block';
                        sendToSalesforceButton.onclick = () => sendToSalesforce(aggregatedData);
                    }, 2000);
                    statusDiv.innerText = "Processing complete. Check your downloads.";
                }
            });
        });
    } else {
        console.error('Form with ID "csv-form" not found');
    }
});


// Function to normalize sizes
function normalizeSize(size) {
    const sizeMap = {
        'OSFA': 'OSFA',
        'One Size Fits Most': 'OSFA', 'One Size Fits All': 'OSFA', 'Mens One Size Fits All': 'OSFA', 'Adjustable': 'OSFA', 'Unisex One Size Fits All': 'OSFA',
        'Youth Small': 'YS', 'youth small': 'YS',
        'Youth Medium': 'YM', 'Youth MD': 'YM', 'youth medium': 'YM', 'Youth  Medium': 'YM',
        'Youth Large': 'YL', 'Youth LG': 'YL', 'youth large': 'YL',
        'Youth XL': 'YXL', 'youth extra large': 'YXL', 'Youth X-Large': 'YXL',
        'Youth SM': 'YS', 'Girls Small': 'YS',
        'Adult X-Small': 'XS', 'X-Small': 'XS', 'XSmall': 'XS', 'x-small': 'XS', 'Unisex X-Small': 'XS',
        'Adult Small': 'S', 'adult small': 'S', 'Unisex Small': 'S',
        'Adult Medium': 'M', 'adult medium': 'M', 'unisex medium': 'M', 'Unisex Medium': 'M',
        'Adult Large': 'L', 'adult large': 'L', 'Unisex Large': 'L',
        'Adult X-Large': 'XL', 'adult x-large': 'XL', 'Unisex X-Large': 'XL',
        'Adult 2X-Large': 'XXL', 'adult 2x-large': 'XXL', 'Unisex 2X-Large': 'XXL',
        'Adult 3X-Large': 'XXXL', 'adult 3x-large': 'XXXL', 'Unisex 3X-Large': 'XXXL',
        'Adult 4X-Large': '4XL', 'adult 4x-large': '4XL',
        'Adult 5X-Large': '5XL', 'adult 5x-large': '5XL',
        'Men\'s Small': 'S', 'Mens Small': 'S', 'Adult - Men\'s Small': 'S',
        'Men\'s Medium': 'M', 'Mens Medium': 'M', 'Adult - Men\'s Medium': 'M',
        'Men\'s Large': 'L', 'Mens Large': 'L', 'Adult - Men\'s Large': 'L',
        'Men\'s X-Large': 'XL', 'Mens X-Large': 'XL', 'Adult - Men\'s X-Large': 'XL',
        'Men\'s 2X-Large': 'XXL', 'Mens 2X-Large': 'XXL', 'Adult - Men\'s 2X-Large': 'XXL',
        'Men\'s 3X-Large': 'XXXL', 'Mens 3X-Large': 'XXXL','Adult - Men\'s 3X-Large': 'XXXL',
        'Ladies X-Small': 'XS', 'Adult - Women\'s X-Small': 'S',
        'Women\'s Small': 'S', 'Women\'s SM': 'S', 'Womens Small': 'S', 'Ladies Small': 'S', 'Adult - Women\'s Small': 'S',
        'Women\'s Medium': 'M', 'Womens Medium': 'M', 'Women\'s MD': 'M', 'Ladies Medium': 'M', 'Adult - Women\'s Medium': 'M',
        'Women\'s Large': 'L', 'Women\'s LG': 'L', 'Ladies Large': 'L', 'Adult - Women\'s Large': 'L',
        'Women\'s X-Large': 'XL', 'Women\'s XL': 'XL', 'Womens X-Large': 'XL', 'Ladies X-Large': 'XL', 'Adult - Women\'s X-Large': 'XL',
        'Women\'s 2X-Large': 'XXL', 'Women\'s XXL': 'XXL', 'Ladies 2X-Large': 'XXL', 'Adult - Women\'s 2X-Large': 'XXL',
        'Unisex Large': 'L',
        'Unisex X-Large': 'XL'
    };
    return sizeMap[size] || size;
}

function processCSV1(data) {
    const saleCode = data.length > 0 && data[0]['Sale Code'] ? data[0]['Sale Code'] : 'UnknownSaleCode';
    const statusElement = document.getElementById('status');
    statusElement.innerText = "Generating Itemized CSV...";
    
    window.saleCode = saleCode;

    let storeName = data.length > 0 && data[0]['Store Name'] ? data[0]['Store Name'] : 'UnknownStore';

function isValidPlayerNumber(playerNumber) {
    // Check if playerNumber is strictly a non-empty numeric string
    return /^[0-9]+$/.test(playerNumber);
}

    let playerNumberErrorFound = false;

const filteredData = data.filter(row => row['Product Name'])
    .map(row => {
        let validPlayerNumber = '';
        const playerNumbers = [row['Player Number Input'], row['Player Number - Exclusive'], row['Player Number (input)']];
        for (let num of playerNumbers) {
            if (isValidPlayerNumber(num)) {
                validPlayerNumber = num;
                break;
            }
        }
        if (validPlayerNumber === '') {
            playerNumberErrorFound = true;
        }


const goalieThroatGuard = (row['Goalie Throat Guard?'] === 'Yes' || (row['Position'] && row['Position'] === 'Goalie')) ? 'Yes' : ' ';
            return {
                'Order ID': row['Order ID'] || '',
                'Billing Email': row['Billing Email'] || '',
                'Player Last Name': row['Player Last Name'] || '',
                'Color': row['Color'] || '',
                'Product Name': row['Product Name'],
                'Style': row['Style'] || 'UnknownStyle',
                'Size': normalizeSize(row['Size'] || row['SIZE'] || ''),
                'Player Number': validPlayerNumber,
                'Last Name': (row['Player Last Name (ALL CAPS)'] || '').toUpperCase(),
                'Grad Year': row['Grad Year'] || '',
                'Quantity': row['Quantity'] || 1,
                'Goalie?': goalieThroatGuard
            };
        });

    const expandedData = [];
    filteredData.forEach(row => {
        const quantity = parseInt(row.Quantity, 10) || 1;
        for (let i = 0; i < quantity; i++) {
            expandedData.push({ ...row, 'Quantity': 1 });
        }
    });

    function customSizeSort(a, b) {
        const sizeOrder = [
            'OSFA', '5XL', '4XL', '3XL', '2XL', 'XL', 'Extra Large (14")', 'L', 'Large (13")',
            'M', 'Medium (12")', 'S', 'Small (10")', 'XS', 'YXL', 'YL', 'YM', 'YS'
        ];
        return sizeOrder.indexOf(a) - sizeOrder.indexOf(b);
    }

    expandedData.sort((a, b) => {
        return b['Goalie?'].localeCompare(a['Goalie?']) ||
            String(a['Product Name'] || '').localeCompare(String(b['Product Name'] || '')) ||
            customSizeSort(a['Size'] || '', b['Size'] || '') ||
            (parseInt(a['Player Number'], 10) || 0) - (parseInt(b['Player Number'], 10) || 0);
    });

    const csv = Papa.unparse(expandedData);
    downloadCSV(`${storeName}_itemized.csv`, csv);

    if (playerNumberErrorFound) {
        statusElement.innerText = "Possible Number error or Zeroes in list ";
        statusElement.style.color = 'black';
    } else {
        statusElement.innerText = "Itemized CSV generated.";
        statusElement.style.color = 'black';
    }
}


function processCSV2(data) {
    // Update the status
    document.getElementById('status').innerText = "Generating Aggregated CSV...";

    // Capture the store name for the filename
    let storeName = data.length > 0 ? data[0]['Store Name'] : 'UnknownStore';
    const saleCode = data.length > 0 ? data[0]['Sale Code'] : 'UnknownSaleCode';

    window.saleCode = saleCode;



    const aggregatedData = {};

    // Filter rows and then aggregate
data.filter(row => row['Product Name']).forEach(row => {
    const normalizedSize = normalizeSize(row['Size'] || row['SIZE'] || '');
const goalieThroatGuard = (row['Goalie Throat Guard?'] === 'Yes' || (row['Position'] && row['Position'] === 'Goalie')) ? 'Yes' : ' ';
    const style = row['Style'] || 'UnknownStyle';
    const color = row['Color'] || ''; // Extract the color
    const styleSize = `${style}-${normalizedSize}`;
    const key = `${styleSize}-${goalieThroatGuard}-${color}`; // Include color in the key

    if (!aggregatedData[key]) {
        aggregatedData[key] = {
            'Product Name': row['Product Name'],
            'Style-Size': styleSize,
            'Color': color, // Add the "Color" column
            'Goalie?': goalieThroatGuard,
            'Aggregated Quantity': 0
        };
    }

    aggregatedData[key]['Aggregated Quantity'] += row['Quantity'] || 1;
});

    function customSizeSort(a, b) {
        const sizeOrder = [
            'OSFA',
            '5XL', '4XL', '3XL', '2XL', 'XL', 'L', 'M', 'S', 'XS',
            'YXL', 'YL', 'YM', 'YS'
        ];
        return sizeOrder.indexOf(a) - sizeOrder.indexOf(b);
    }

    // Convert the aggregated data to an array
    const aggregatedArray = Object.values(aggregatedData);

 // Sort the array by 'Style-Size', 'Color', and 'Goalie?'
aggregatedArray.sort((a, b) => {
    const styleSizeA = String(a['Style-Size'] || '');
    const styleSizeB = String(b['Style-Size'] || '');
    const colorA = String(a['Color'] || '');
    const colorB = String(b['Color'] || '');
    return b['Goalie?'].localeCompare(a['Goalie?']) ||
           styleSizeA.localeCompare(styleSizeB) ||
           customSizeSort(a['Size'], b['Size']) ||
           colorA.localeCompare(colorB); // Sort by color
});

    // Convert the sorted array back to CSV
    const csv = Papa.unparse(aggregatedArray);

    // Trigger download
    downloadCSV(`${storeName}_Aggregated.csv`, csv);

    // Update the status
    document.getElementById('status').innerText = "Aggregated CSV generated.";

    return aggregatedData;
}

function downloadCSV(filename, csvData) {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


document.addEventListener('DOMContentLoaded', () => {
    const fileDropArea = document.querySelector('.file-drop-area');
    
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
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  function highlight(e) {
    const fileDropArea = document.querySelector('.file-drop-area');
    fileDropArea.classList.add('dragover');
  }
  
  function unhighlight(e) {
    const fileDropArea = document.querySelector('.file-drop-area');
    fileDropArea.classList.remove('dragover');
  }
  
  function handleDrop(e) {
    const fileInput = document.getElementById('csv-file');
    const dt = e.dataTransfer;
    const files = dt.files;
    fileInput.files = files;
  
    document.getElementById('csv-form').dispatchEvent(new Event('submit', { 'bubbles': true }));
  }

 async function getProductJSON() {
    try {
        const response = await fetch('ProductJSON.json');
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching product JSON:', error);
        throw error; // Re-throw the error to be handled by the calling function
    }
}
async function sendToSalesforce(aggregatedData) {
    const saleCode = window.saleCode || 'UnknownSaleCode';
    const sendToSalesforceButton = document.getElementById('send-to-salesforce');
    sendToSalesforceButton.innerText = 'Sending to Salesforce...'; // Change button text to indicate progress
    sendToSalesforceButton.disabled = true; // Disable button to prevent multiple clicks
    const zapierWebhookUrl = 'https://hooks.zapier.com/hooks/catch/53953/3ktrj43/'; // Replace with your actual Zapier webhook URL
    try {
        const productJSON = await getProductJSON(); // Fetch ProductJSON.json

        // Extract 'Store Name' from the first item in aggregatedData
        const firstItem = Object.values(aggregatedData)[0];
        const storeName = firstItem && firstItem['Store Name'] ? firstItem['Store Name'] : 'Unknown';
        const projectCode = 'PROJ' + storeName.substring(0, 5);

        // Create an array to hold all the items
        const items = [];

        // Iterate through the aggregated data and create items
        for (const item of Object.values(aggregatedData)) {
            const productCode = item['Style-Size'];
            const quantityAggregated = item['Aggregated Quantity'];
            const product = productJSON.find(p => p['Product Code'] === productCode);
            const charID = product ? product['18CharID'] : '';
            const priceBookEntryId = product ? product['Price Book Entry ID'] : ''; // Get Price Book Entry ID from productJSON


            const payload = {
                'Style-Size': productCode,
                'Quantity Aggregated': quantityAggregated,
                '18CharID': charID,
                'Price Book Entry ID': priceBookEntryId, // Add Price Book Entry ID to payload
                'Sale Code': saleCode
            };

            items.push(payload);
        }

        // Send all items in a single request
        try {
            const response = await fetch(zapierWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ items }), // Send the items array
                mode: 'no-cors', // Add this if you are not interested in the response
            });

            if (response.ok) {
                const responseData = await response.json();
                console.log('Success:', responseData);
            }
        } catch (error) {
            console.error('Error sending data to Zapier:', error);
        }

    } catch (error) {
        console.error('Error processing data for Zapier:', error);
    }
}

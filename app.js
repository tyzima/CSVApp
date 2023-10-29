document.addEventListener('DOMContentLoaded', () => {
    // Create the audio object to play the error sound
    const errorSound = new Audio('stop.mp3');

    const form = document.getElementById('csv-form');
    const statusDiv = document.createElement('div');
    statusDiv.id = "status";
    document.body.appendChild(statusDiv);

    // Create a div for the order summary
    const summaryDiv = document.createElement('div');
    summaryDiv.id = "order-summary";
    summaryDiv.style.display = 'none';
    summaryDiv.style.backgroundColor = 'green';
    summaryDiv.style.color = 'white';
    summaryDiv.style.borderRadius = '12px';
    summaryDiv.style.padding = '10px';
    document.body.appendChild(summaryDiv);

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

            // Update the status
            document.getElementById('status').innerText = "Loading...";

            const fileInput = document.getElementById('csv-file');
            const file = fileInput.files[0];

            // Update the status
            document.getElementById('status').innerText = "Processing CSV...";

            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                complete: function(results) {
                    // Debug: Check if Papa.parse is complete
                    console.log("Debug: Papa.parse complete");
                    
                    // Call the first processing function and trigger its download
                    processCSV1(results.data);
                    
                    // Add a delay of 2 seconds before calling the second processing function
                    setTimeout(() => {
                        processCSV2(results.data);

                        // Calculate and display the order summary
                        const totalProducts = results.data
                        .filter(row => row['Quantity'] || row['Product Name'])  // Exclude empty or incomplete rows
                        .reduce((acc, row) => acc + (row['Quantity'] || 1), 0);                    
                        summaryDiv.innerText = `Total Products Ordered: ${totalProducts}`;
                        summaryDiv.style.display = 'block';  // Make the summary visible

                    }, 2000);

                    // Update the status
                    document.getElementById('status').innerText = "Processing complete. Check your downloads.";
                }
            });
        });

        const canvas = document.createElement('canvas');
        canvas.height = 64;
        canvas.width = 64;
        const ctx = canvas.getContext('2d');
        ctx.font = '64px serif';
        ctx.fillText('🧼', 0, 64);
        
        const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = canvas.toDataURL("image/x-icon");
        
        document.getElementsByTagName('head')[0].appendChild(link);
    } else {
        console.error('Form with ID "csv-form" not found');
    }
});


function showNotification(message, isError) {
    const notificationBar = document.createElement('div');
    
    const stopSignLeft = document.createElement('span');
    stopSignLeft.innerHTML = '🛑';
    stopSignLeft.style.marginRight = '10px'; // Add spacing to the right

    const text = document.createElement('span');
    text.innerHTML = message.toUpperCase(); // Convert message to uppercase
    text.style.marginRight = '10px'; // Add spacing to the right
    text.style.marginLeft = '10px'; // Add spacing to the left

    const stopSignRight = document.createElement('span');
    stopSignRight.innerHTML = '🛑';
    stopSignRight.style.marginLeft = '10px'; // Add spacing to the left

    notificationBar.appendChild(stopSignLeft);
    notificationBar.appendChild(text);
    notificationBar.appendChild(stopSignRight);

    notificationBar.style.position = 'fixed';
    notificationBar.style.top = '0';
    notificationBar.style.left = '0';
    notificationBar.style.width = '100%';
    notificationBar.style.textAlign = 'center';
    notificationBar.style.padding = '10px';
    notificationBar.style.background = isError ? 'linear-gradient(to right, #ff9999, #cc0000)' : 'linear-gradient(to right, lightgreen, darkgreen)';
    notificationBar.style.color = 'white';
    notificationBar.style.fontWeight = 'bold';
    notificationBar.style.fontSize = '16px';
    notificationBar.style.zIndex = '1000';
    document.body.appendChild(notificationBar);
}

const errorSound = new Audio('stop.mp3');


// Function to normalize sizes
function normalizeSize(size) {
    const sizeMap = {
        'OSFA': 'OSFA',
        'One Size Fits Most': 'OSFA',
        'Youth Small': 'YS', 'youth small': 'YS',
        'Youth Medium': 'YM', 'Youth MD': 'YM', 'youth medium': 'YM',
        'Youth Large': 'YL', 'Youth LG': 'YL', 'youth large': 'YL',
        'Youth XL': 'YXL', 'youth extra large': 'YXL', 'Youth X-Large': 'YXL',
        'Youth SM': 'YS',
        'Adult Small': 'S', 'adult small': 'S',
        'Adult Medium': 'M', 'adult medium': 'M',
        'Adult Large': 'L', 'adult large': 'L',
        'Adult X-Large': 'XL', 'adult x-large': 'XL',
        'Adult 2X-Large': '2XL', 'adult 2x-large': '2XL',
        'Adult 3X-Large': '3XL', 'adult 3x-large': '3XL',
        'Adult 4X-Large': '4XL', 'adult 4x-large': '4XL',
        'Adult 5X-Large': '5XL', 'adult 5x-large': '5XL',
        'Men\'s Small': 'S', 'Mens Small': 'S',
        'Men\'s Medium': 'M', 'Mens Medium': 'M',
        'Men\'s Large': 'L', 'Mens Large': 'L',
        'Men\'s X-Large': 'XL', 'Mens X-Large': 'XL',
        'Men\'s 2X-Large': '2XL', 'Mens 2X-Large': '2XL',
        'Men\'s 3X-Large': '3XL', 'Mens 3X-Large': '3XL',
        'Women\'s Small': 'S', 'Women\'s SM': 'S',
        'Women\'s Medium': 'M', 'Womens Medium': 'M', 'Women\'s MD': 'M',
        'Women\'s Large': 'L', 'Women\'s LG': 'L',
        'Women\'s X-Large': 'XL', 'Women\'s XL': 'XL',
        'Women\'s 2X-Large': '2XL', 'Women\'s XXL': '2XL',
        'Unisex Large': 'L',
        'Unisex X-Large': 'XL'
    };
    return sizeMap[size] || size;
}


function processCSV1(data) {
    // Update the status
    const statusElement = document.getElementById('status');
    statusElement.innerText = "Generating Itemized CSV...";
    
    // Store name for the filename
    let storeName = data.length > 0 && data[0]['Store Name'] ? data[0]['Store Name'] : 'UnknownStore';

    // Function to validate player numbers
    function isValidPlayerNumber(playerNumber) {
        if (!playerNumber) return true;  // Blank or undefined values are considered valid
        return /^[0-9]+$/.test(playerNumber);  // Only numbers are considered valid
    }

    // Flag to track if any invalid player numbers are found
    let playerNumberErrorFound = false;

    // Filter and map the data
    const filteredData = data.filter(row => row['Product Name'])
        .map(row => {
            // Check if the 'Player Number' fields are valid
            if (!isValidPlayerNumber(row['Player Number Input']) ||
                !isValidPlayerNumber(row['Player Number - Exclusive']) ||
                !isValidPlayerNumber(row['Player Number (input)'])) {
                playerNumberErrorFound = true;
            }

            const goalieThroatGuard = row['Product Name'].includes('Cascade XRS') && row['Goalie Throat Guard?'] === 'Yes' ? 'Yes' : ' ';
            return {
                'Order ID': row['Order ID'] || '',
                'Billing Email': row['Billing Email'] || '',
                'Player Last Name': row['Player Last Name'] || '',
                'Product Name': row['Product Name'],
                'Style': row['Style'] || 'UnknownStyle',
                'Size': normalizeSize(row['Size'] || row['SIZE'] || ''),
                'Player Number': row['Player Number Input'] || row['Player Number - Exclusive'] || row['Player Number (input)'] || '',
                'Last Name': (row['Player Last Name (ALL CAPS)'] || '').toUpperCase(),
                'Grad Year': row['Grad Year'] || '',
                'Quantity': row['Quantity'] || 1,
                'Goalie Throat Guard?': goalieThroatGuard
            };
        });

    // Expand data based on quantity
    const expandedData = [];
    filteredData.forEach(row => {
        const quantity = parseInt(row.Quantity, 10) || 1;
        for (let i = 0; i < quantity; i++) {
            expandedData.push({ ...row, 'Quantity': 1 });
        }
    });

    // Custom size sorting function
    function customSizeSort(a, b) {
        const sizeOrder = [
            'OSFA', '5XL', '4XL', '3XL', '2XL', 'XL', 'Extra Large (14")', 'L', 'Large (13")',
            'M', 'Medium (12")', 'S', 'Small (10")', 'XS', 'YXL', 'YL', 'YM', 'YS'
        ];
        return sizeOrder.indexOf(a) - sizeOrder.indexOf(b);
    }

    // Sort data
    expandedData.sort((a, b) => {
        return b['Goalie Throat Guard?'].localeCompare(a['Goalie Throat Guard?']) ||
            String(a['Product Name'] || '').localeCompare(String(b['Product Name'] || '')) ||
            customSizeSort(a['Size'] || '', b['Size'] || '') ||
            (parseInt(a['Player Number'], 10) || 0) - (parseInt(b['Player Number'], 10) || 0);
    });

    // Convert data to CSV format
    const csv = Papa.unparse(expandedData);

    // Download CSV file
    downloadCSV(`${storeName}_itemized.csv`, csv);


// Update the status and show notification if needed
if (playerNumberErrorFound) {
    statusElement.innerText = "Player Number Errors found";
    statusElement.style.color = 'red';
    showNotification("Player Number Error Found", true);
    errorSound.play();  // This should work after user interaction
} else {
    statusElement.innerText = "Itemized CSV generated.";
    statusElement.style.color = 'black'; // Reset to default color if needed
}


}


function processCSV2(data) {
    // Update the status
    document.getElementById('status').innerText = "Generating Aggregated CSV...";

    // Capture the store name for the filename
    let storeName = data.length > 0 ? data[0]['Store Name'] : 'UnknownStore';

    const aggregatedData = {};

    // Filter rows and then aggregate
    data.filter(row => row['Product Name']).forEach(row => {
        const normalizedSize = normalizeSize(row['Size'] || row['SIZE'] || '');
        const goalieThroatGuard = row['Product Name'].includes('Cascade XRS') && row['Goalie Throat Guard?'] === 'Yes' ? 'Yes' : '   ';
        const style = row['Style'] || 'UnknownStyle'; // Handle lines without a Style
        const key = `${style}-${normalizedSize}-${goalieThroatGuard}`;

        if (!aggregatedData[key]) {
            aggregatedData[key] = {
                'Product Name': row['Product Name'],
                'Style': style,
                'Size': normalizedSize,
                'Goalie Throat Guard': goalieThroatGuard,
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

    // Convert the aggregated data to an arrayy
    const aggregatedArray = Object.values(aggregatedData);

   // Sort the array by 'Style', 'Size', and 'Goalie Throat Guard'
   aggregatedArray.sort((a, b) => {
    const styleA = String(a['Style'] || '');
    const styleB = String(b['Style'] || '');
    return b['Goalie Throat Guard'].localeCompare(a['Goalie Throat Guard']) || // This line ensures "Yes" values come first
           styleA.localeCompare(styleB) || 
           customSizeSort(a['Size'], b['Size']);
});



    // Convert the sorted array back to CSV
    const csv = Papa.unparse(aggregatedArray);

    // Trigger download
    downloadCSV(`${storeName}_Aggregated.csv`, csv);

    // Update the status
    document.getElementById('status').innerText = "Aggregated CSV generated.";
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
  
document.addEventListener('DOMContentLoaded', () => {
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
                    .reduce((acc, row) => acc + (row['Quantity'] || 1), 0);                    summaryDiv.innerText = `Total Products Ordered: ${totalProducts}`;
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
});

// Function to normalize sizes
function normalizeSize(size) {
    const sizeMap = {
        'OSFA': 'OSFA',
        'One Size Fits Most': 'OSFA',
        'Youth Small': 'YS', 'youth small': 'YS',
        'Youth Medium': 'YM', 'Youth MD': 'YM', 'youth medium': 'YM',
        'Youth Large': 'YL', 'Youth LG': 'YL', 'youth large': 'YL',
        'Youth XL': 'YXL', 'youth extra large': 'YXL',
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
    document.getElementById('status').innerText = "Generating Itemized CSV...";
    
    // Store name for the filename
    let storeName = data.length > 0 ? data[0]['Store Name'] : 'UnknownStore';

    // Filter and map the data
    const filteredData = data.filter(row => row['Product Name']) // Adjusted filter condition
                             .map(row => {
        return {
            'Order ID': row['Order ID'] || '',
            'Billing Email': row['Billing Email'] || '',
            'Player Last Name': row['Player Last Name'] || '',
            'Product Name': row['Product Name'],
            'Style': row['Style'] || '', // Default to empty string if no style
            'Size': normalizeSize(row['Size'] || row['SIZE'] || ''),
            'Player Number': row['Player Number (input)'] || row['Player Number Input'] || row['Player Number - Exclusive'] || '',
            'Last Name': (row['Player Last Name (ALL CAPS)'] || '').toUpperCase(),
            'Grad Year': row['Grad Year'] || '',
            'Quantity': row['Quantity'] || 1,
            'Goalie Throat Guard?': row['Product Name'].toLowerCase().includes('Cascade XRS') && row['Goalie Throat Guard?'].toLowerCase() === 'Yes' ? 'Yes' : ''
        };
    });

    const expandedData = [];
    filteredData.forEach(row => {
        const quantity = parseInt(row.Quantity, 10) || 1;  // Ensure it's treated as a number
        for (let i = 0; i < quantity; i++) {
            expandedData.push({...row, 'Quantity': 1});
        }
    });

    function customSizeSort(a, b) {
        const sizeOrder = [
            'OSFA',
            '5XL', '4XL', '3XL', '2XL', 'XL', 'L', 'M', 'S', 'XS',
            'YXL', 'YL', 'YM', 'YS'
        ];
        return sizeOrder.indexOf(a) - sizeOrder.indexOf(b);
    }

    function goalieThroatGuardSort(a, b) {
        if (a === 'Yes' && b === 'No') return -1;
        if (a === 'No' && b === 'Yes') return 1;
        return 0;
    }

    // Sort data
    expandedData.sort((a, b) => {
        return goalieThroatGuardSort(a['Goalie Throat Guard?'], b['Goalie Throat Guard?']) ||
               String(a['Product Name'] || '').localeCompare(String(b['Product Name'] || '')) || 
               customSizeSort(a['Size'] || '', b['Size'] || '') || 
               String(a['Player Number'] || '').localeCompare(String(b['Player Number'] || ''));
    });

    const csv = Papa.unparse(expandedData);

    // Download
    downloadCSV(`${storeName}_itemized.csv`, csv);

    // Update the status
    document.getElementById('status').innerText = "Itemized CSV generated.";
}



function processCSV2(data) {
    // Update the status
    document.getElementById('status').innerText = "Generating Aggregated CSV...";

    // Capture the store name for the filename
    let storeName = data.length > 0 ? data[0]['Store Name'] : 'UnknownStore';

    const aggregatedData = {};

    // Filter rows and then aggregate
    data.filter(row => row['Product Name']).forEach(row => { // Adjusted filter condition
        const normalizedSize = normalizeSize(row['Size'] || row['SIZE'] || ''); // Default to empty string if no size
        const goalieThroatGuard = row['Product Name'].toLowerCase().includes('Cascade XRS') && row['Goalie Throat Guard?'].toLowerCase() === 'Yes' ? 'Yes' : 'No';
        const style = row['Style'] || ''; // Default to empty string if no style
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

    // Convert the aggregated data to an array
    const aggregatedArray = Object.values(aggregatedData);

    // Sort the array by 'Style', 'Size', and 'Goalie Throat Guard'
    aggregatedArray.sort((a, b) => {
        return a['Style'].localeCompare(b['Style']) || 
               customSizeSort(a['Size'], b['Size']) || 
               b['Goalie Throat Guard'].localeCompare(a['Goalie Throat Guard']);
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
  
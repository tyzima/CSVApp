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
});

function normalizeSize(size) {
    const sizeMap = {
        'OSFA': 'OSFA',
        'Youth Small': 'YS', 'youth small': 'YS',
        'Youth Medium': 'YM', 'youth medium': 'YM',
        'Youth Large': 'YL', 'youth large': 'YL',
        'Youth XL': 'YXL', 'youth extra large': 'YXL',
        'Adult Small': 'S', 'adult small': 'S',
        'Adult Medium': 'M', 'adult medium': 'M',
        'Adult Large': 'L', 'adult large': 'L',
        'Adult X-Large': 'XL', 'adult x-large': 'XL',
        'Adult 2X-Large': '2XL', 'adult 2x-large': '2XL',
        'Adult 3X-Large': '3XL', 'adult 3x-large': '3XL',
        'Adult 4X-Large': '4XL', 'adult 4x-large': '4XL',
        'Adult 5X-Large': '5XL', 'adult 5x-large': '5XL',
        'Men\'s Small': 'S',
        'Men\'s Medium': 'M',
        'Men\'s Large': 'L',
        'Men\'s X-Large': 'XL',
        'Men\'s 2X-Large': '2XL',
        'Men\'s 3X-Large': '3XL',
        'Women\'s Small': 'S',
        'Women\'s Medium': 'M',
        'Women\'s Large': 'L',
        'Women\'s X-Large': 'XL',
        'Women\'s 2X-Large': '2XL',
        'Women\'s 3X-Large': '3XL'
    };
    return sizeMap[size] || size;
}

// Function to process and create the first CSV
function processCSV1(data) {
    // Update the status
    document.getElementById('status').innerText = "Generating first CSV...";
    
    // Store name for the filename
    let storeName = data.length > 0 ? data[0]['Store Name'] : 'UnknownStore';

    // Filter and map the data
    const filteredData = data.filter(row => row['Product Name'] && row['Style'])
                             .map(row => {
        return {
            'Player Number': row['Player Number'] || row['Player Number Input'] || row['Player Number (Exclusive)'],
            'Player Last Name': row['Player Last Name'] || row['Last Name'] || row['Player Last Name (ALL CAPS)'],
            'Size': normalizeSize(row['Size'] || row['SIZE']),
            'Grad Year': row['Grad Year'],
            'Product Name': row['Product Name'],
            'Style': row['Style'],
            'Quantity': row['Quantity']
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
            // Women's sizes
            'Women\'s MD', 'Women\'s 5X', 'Women\'s 4X', 'Women\'s 3X', 'Women\'s 2X', 'Women\'s XL', 'Women\'s L', 'Women\'s M', 'Women\'s S', 'Women\'s XS',
            
            // Men's sizes
            'Men\'s 3X-Large', 'Men\'s 2X-Large', 'Men\'s X-Large', 'Men\'s Large', 'Men\'s Medium', 'Men\'s Small',
            
            // Adult sizes
            'Adult 3X-Large', 'Adult 2X-Large', 'Adult X-Large', 'Adult Large', 'Adult Medium', 'Adult Small',
            
            // Youth sizes
            'Youth XL', 'youth extra large', 'Youth LG', 'youth large', 'Youth MD', 'youth medium', 'Youth SM', 'youth small', 'Youth'
        ];
    
        const indexA = sizeOrder.indexOf(a);
        const indexB = sizeOrder.indexOf(b);
    
        if (indexA === -1 && indexB === -1) return 0; // Both sizes are unknown
        if (indexA === -1) return 1; // a is unknown, b comes first
        if (indexB === -1) return -1; // b is unknown, a comes first
    
        return indexA - indexB;
    }

    // Sort data
    expandedData.sort((a, b) => {
        return String(a['Product Name'] || '').localeCompare(String(b['Product Name'] || '')) || 
               customSizeSort(a['Size'] || '', b['Size'] || '') || 
               String(a['Player Number'] || '').localeCompare(String(b['Player Number'] || ''));
    });

    const csv = Papa.unparse(expandedData);

    // Download
    downloadCSV(`${storeName}_itemized.csv`, csv);

    // Update the status
    document.getElementById('status').innerText = "First CSV generated.";
}


function processCSV2(data) {
    // Update the status
    document.getElementById('status').innerText = "Generating second CSV...";

    // Capture the store name for the filename
    let storeName = data.length > 0 ? data[0]['Store Name'] : 'UnknownStore';

    const aggregatedData = {};

    // Filter rows and then aggregate
    data.filter(row => row['Product Name'] && row['Style']).forEach(row => {
        const normalizedSize = normalizeSize(row['Size'] || row['SIZE']);
        const key = `${row['Style']}-${normalizedSize}`;
        
        if (!aggregatedData[key]) {
            aggregatedData[key] = {
                'Product Name': row['Product Name'],
                'Style': row['Style'],
                'Size': normalizedSize,
                'Aggregated Quantity': 0
            };
        }
        
        aggregatedData[key]['Aggregated Quantity'] += row['Quantity'] || 1;
    });

    function customSizeSort(a, b) {
        const sizeOrder = [
            // Women's sizes
            'Women\'s MD', 'Women\'s 5X', 'Women\'s 4X', 'Women\'s 3X', 'Women\'s 2X', 'Women\'s XL', 'Women\'s L', 'Women\'s M', 'Women\'s S', 'Women\'s XS',
            
            // Men's sizes
            'Men\'s 3X-Large', 'Men\'s 2X-Large', 'Men\'s X-Large', 'Men\'s Large', 'Men\'s Medium', 'Men\'s Small',
            
            // Adult sizes
            'Adult 3X-Large', 'Adult 2X-Large', 'Adult X-Large', 'Adult Large', 'Adult Medium', 'Adult Small',
            
            // Youth sizes
            'Youth XL', 'youth extra large', 'Youth LG', 'youth large', 'Youth MD', 'youth medium', 'Youth SM', 'youth small', 'Youth'
        ];
    
        const indexA = sizeOrder.indexOf(a);
        const indexB = sizeOrder.indexOf(b);
    
        if (indexA === -1 && indexB === -1) return 0; // Both sizes are unknown
        if (indexA === -1) return 1; // a is unknown, b comes first
        if (indexB === -1) return -1; // b is unknown, a comes first
    
        return indexA - indexB;
    }
    
    // Convert the aggregated data to an array
    const aggregatedArray = Object.values(aggregatedData);

    // Sort the array by 'Style' and then by 'Size'
    aggregatedArray.sort((a, b) => {
        return a['Style'].localeCompare(b['Style']) || 
               customSizeSort(a['Size'], b['Size']);
    });

    // Convert the sorted array back to CSV
    const csv = Papa.unparse(aggregatedArray);

    // Trigger download
    downloadCSV(`${storeName}_Aggregated.csv`, csv);

    // Update the status
    document.getElementById('status').innerText = "Second CSV generated.";
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
  
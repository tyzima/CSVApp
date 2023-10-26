document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('csv-form');
    const statusDiv = document.createElement('div');
    statusDiv.id = "status";
    document.body.appendChild(statusDiv);
    
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
                processCSV1(results.data);
                processCSV2(results.data);
                
                // Update the status
                document.getElementById('status').innerText = "Processing complete. Check your downloads.";
            }
        });
    });
});

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
            'Size': row['Size'] || row['SIZE'],
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

    // Custom sort function for Size
    function customSizeSort(a, b) {
        const sizeOrder = ['YS', 'Youth Small', 'S', 'M', 'L', 'XL', '2XL', '2 X Large', '3XL', '3 X Large', '4XL', '4 X Large', '5XL', '5 X Large'];
        return sizeOrder.indexOf(a) - sizeOrder.indexOf(b);
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

    const aggregatedData = {};
    
    // Filter rows and then aggregate
    data.filter(row => row['Product Name'] && row['Style']).forEach(row => {
        const key = `${row['Style']}-${row['Size'] || row['SIZE']}`;
        if (!aggregatedData[key]) {
            aggregatedData[key] = {
                'Product Name': row['Product Name'],
                'Style': row['Style'],
                'Size': row['Size'] || row['SIZE'],
                'Aggregated Quantity': 0
            };
        }
        aggregatedData[key]['Aggregated Quantity'] += row['Quantity'] || 1;
    });

    const csv = Papa.unparse(Object.values(aggregatedData));
    downloadCSV(`AggregatedData.csv`, csv);

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
  
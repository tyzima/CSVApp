const Papa = require('papaparse');

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('csv-form');
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const fileInput = document.getElementById('csv-file');
        const file = fileInput.files[0];
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            complete: function(results) {
                processCSV1(results.data);
                processCSV2(results.data);
            }
        });
    });
});

function processCSV1(data) {
    const filteredData = data.map(row => {
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
        const quantity = row.Quantity || 1;
        for (let i = 0; i < quantity; i++) {
            expandedData.push({...row, 'Quantity': 1});
        }
    });

    expandedData.sort((a, b) => {
        return a['Product Name'].localeCompare(b['Product Name']) || 
               (a['Size'] || '').localeCompare(b['Size'] || '') || 
               (a['Player Number'] || '').localeCompare(b['Player Number'] || '');
    });

    const csv = Papa.unparse(expandedData);
    downloadCSV(`StoreName_itemized.csv`, csv);
}

function processCSV2(data) {
    const aggregatedData = {};
    data.forEach(row => {
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

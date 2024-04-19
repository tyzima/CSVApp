const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('fileInput');
const teamName = document.getElementById('teamName');
const poNumber = document.getElementById('poNumber');
const projNumber = document.getElementById('projNumber');
const reorderProjNumber = document.getElementById('reorderProjNumber');

teamName.addEventListener('input', () => {
  teamName.value = teamName.value.toUpperCase();
});

// Add event listener to make PO Number uppercase
poNumber.addEventListener('input', () => {
  poNumber.value = poNumber.value.toUpperCase();
});

// Add event listener to ensure PROJ Number starts with "PROJ"
projNumber.addEventListener('input', () => {
  if (!projNumber.value.startsWith('PROJ')) {
    projNumber.value = 'PROJ' + projNumber.value.replace(/[^0-9]/g, '');
  }
});

// Add event listener to ensure Reorder PROJ Number starts with "PROJ"
reorderProjNumber.addEventListener('input', () => {
  if (!reorderProjNumber.value.startsWith('PROJ')) {
    reorderProjNumber.value = 'PROJ' + reorderProjNumber.value.replace(/[^0-9]/g, '');
  }
});


dropArea.addEventListener('click', () => {
  if (validateForm()) {
    fileInput.click();
  }
});

dropArea.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropArea.classList.add('hover');
});

dropArea.addEventListener('dragleave', () => {
  dropArea.classList.remove('hover');
});

dropArea.addEventListener('drop', (event) => {
  event.preventDefault();
  if (validateForm()) {
    const files = event.dataTransfer.files;
    handleFiles(files);
  }
});

fileInput.addEventListener('change', (event) => {
  const files = event.target.files;
  handleFiles(files);
});

function handleFiles(files) {
  if (files.length > 0) {
    const file = files[0];
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.csv') && fileName.includes('itemized')) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        processWorkbook(workbook);
      };
      reader.readAsBinaryString(file);
    } else {
      alert('Please upload a valid CSV file with "itemized" in the name');
    }
  }
}


async function processWorkbook(workbook) {
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  const groupedData = data.reduce((acc, row) => {
    const productName = row['Product Name'];
    if (!acc[productName]) {
      acc[productName] = [];
    }
    acc[productName].push(row);
    return acc;
  }, {});

  const response = await fetch('NEWOct2023_SublimatedOrderForm.xlsx');
  const arrayBuffer = await response.arrayBuffer();
  const templateWorkbook = XLSX.read(arrayBuffer, { type: 'array' });
  const templateSheet = templateWorkbook.Sheets[templateWorkbook.SheetNames[0]];

  XLSX.utils.sheet_add_aoa(templateSheet, [
    [teamName.value], 
    [poNumber.value], 
    [projNumber.value], 
    [reorderProjNumber.value]
  ], { origin: 'B1' });



  const productColumns = ['E', 'L', 'S', 'Z', 'AH', 'AO', 'AV', 'BC', 'BJ', 'BQ'];
  productColumns.forEach((col, index) => {
    const productName = Object.keys(groupedData)[index];
    if (productName) {
      XLSX.utils.sheet_add_aoa(templateSheet, [[productName]], { origin: `${col}4` });
      const sizeCol = col;
      const productData = groupedData[productName].map(row => [
        row['Size'] || '', '', row['Player Number'] || '', row['Last Name'] || '', row['Grad Year'] || ''
      ]);
      XLSX.utils.sheet_add_aoa(templateSheet, productData, { origin: `${sizeCol}13` });
    }
  });

  const xlsxBlob = new Blob([XLSX.write(templateWorkbook, { type: 'array', bookType: 'xlsx' })], { type: 'application/octet-stream' });
  const excelWorkbook = new ExcelJS.Workbook();
  await excelWorkbook.xlsx.load(xlsxBlob);
  const excelSheet = excelWorkbook.getWorksheet(1);

  // Styles for Rows 1-6
  for (let rowNum = 1; rowNum <= 6; rowNum++) {
    const row = excelSheet.getRow(rowNum);
    row.eachCell(cell => {
      cell.font = { bold: true };
    });
    row.commit();
  }

  // Style for Row 7
  const row7 = excelSheet.getRow(7);
  row7.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' } // Very light blue fill
    };
    cell.font = { bold: true };
  });
  row7.commit();

    // Style for Row 6
  const row6 = excelSheet.getRow(6);
  row6.eachCell(cell => {
    cell.font = {
      size: 16,
      bold: true
    };
  });
  row6.commit();



  // Styles for Row 12
  const row12 = excelSheet.getRow(12);
  row12.height = 30; // Assuming the default height is 15, setting it to 30 will make it 2x taller
  row12.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF000000' } // Black fill
    };
    cell.font = {
      color: { argb: 'FFFFFFFF' }, // White font
      size: 12,
      bold: true
    };
  });
  row12.commit();

  // Style specific columns
const columnsToFill = ['D', 'K', 'R', 'Y', 'AF', 'AG', 'AN', 'AU', 'BB', 'BI', 'BP'];
columnsToFill.forEach(col => {
  for (let rowNum = 1; rowNum <= excelSheet.rowCount; rowNum++) {
    const row = excelSheet.getRow(rowNum);
    const cell = row.getCell(col);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF000000' } // Black fill
    };
    row.commit();
  }
});

// Set column width for specific columns
const columnsToShrink = ['D', 'K', 'R', 'Y', 'AF', 'AG', 'AN', 'AU', 'BB', 'BI', 'BP'];
columnsToShrink.forEach(col => {
  excelSheet.getColumn(col).width = 2;
});



  // Apply alternating colors
  applyAlternatingColors(excelSheet);

  // Insert the image
  await insertImage(excelWorkbook);

  const updatedBlob = await excelWorkbook.xlsx.writeBuffer();

  const downloadLink = document.createElement('a');
const projNumberValue = projNumber.value.trim();
const fileName = projNumberValue ? `${projNumberValue}_SubOrderForm.xlsx` : 'PROJ_SubOrderForm.xlsx';
downloadLink.href = URL.createObjectURL(new Blob([updatedBlob], { type: 'application/octet-stream' }));
downloadLink.download = fileName;
document.body.appendChild(downloadLink);
downloadLink.click();
document.body.removeChild(downloadLink);
}

function applyAlternatingColors(excelSheet) {
  const productColumns = ['E', 'L', 'S', 'Z', 'AH', 'AO', 'AV', 'BC', 'BJ', 'BQ'];
  const lightGrey = 'FFD3D3D3'; // Light grey color
  
  productColumns.forEach((startColumn) => {
    let colNum = XLSX.utils.decode_col(startColumn) + 1; // ExcelJS columns start at 1
    
    for (let rowNum = 8; rowNum <= 11; rowNum++) {
      const row = excelSheet.getRow(rowNum);
      
      if (rowNum === 8 || rowNum === 10) {
        row.getCell(colNum).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightGrey } };
        row.getCell(colNum + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightGrey } };
      } else if (rowNum === 9 || rowNum === 11) {
        row.getCell(colNum + 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightGrey } };
        row.getCell(colNum + 3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightGrey } };
      } else if (rowNum === 8) {
        row.getCell(colNum).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightGrey } };
        row.getCell(colNum + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightGrey } };
      }
      
      row.commit();
    }
  });
}




function validateForm() {
  if (!teamName.value.trim()) {
    alert('Team Name required');
    return false;
  }
  if (!projNumber.value.trim() && !reorderProjNumber.value.trim()) {
    alert('At least one of the PROJ# fields must be filled in');
    return false;
  }
  return true;
}

let records = [];
let editingIndex = -1;

// DOM References
const csvUpload = document.getElementById('csvUpload');
const uploadArea = document.getElementById('uploadArea');
const searchInput = document.getElementById('searchInput');
const recordsGrid = document.getElementById('recordsGrid');
const modal = document.getElementById('modal');
const closeBtn = document.querySelector('.close-btn');
const editForm = document.getElementById('editForm');
const genreFilter = document.getElementById('genreFilter');
const formatFilter = document.getElementById('formatFilter');
const collectionFilter = document.getElementById('collectionFilter');
const totalCount = document.getElementById('totalCount');
const displayCount = document.getElementById('displayCount');

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);

function init() {
    loadFromStorage();
    attachEventListeners();
    render();
}

function attachEventListeners() {
    // File upload - click handler
    uploadArea.addEventListener('click', () => {
        csvUpload.click();
    });

    // File upload - change handler (when file is selected)
    csvUpload.addEventListener('change', () => {
        console.log('CSV file selected:', csvUpload.files[0]);
        handleCSVUpload();
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('drag');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('drag');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('drag');
        
        const files = e.dataTransfer.files;
        console.log('Files dropped:', files);
        
        if (files.length > 0 && files[0].type === 'text/csv') {
            csvUpload.files = files;
            handleCSVUpload();
        } else {
            alert('Please drop a CSV file');
        }
    });

    // Search and filters
    searchInput.addEventListener('input', render);
    genreFilter.addEventListener('change', render);
    formatFilter.addEventListener('change', render);
    collectionFilter.addEventListener('change', render);

    // Modal controls
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Form submission
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveRecord();
    });

    // Cancel button
    document.querySelector('.btn-cancel').addEventListener('click', closeModal);
}

function handleCSVUpload() {
    const file = csvUpload.files[0];
    
    if (!file) {
        console.error('No file selected');
        alert('No file selected');
        return;
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        alert('Please select a CSV file');
        return;
    }

    console.log('Reading file:', file.name);

    const reader = new FileReader();

    reader.onload = (event) => {
        try {
            const csv = event.target.result;
            console.log('CSV content:', csv.substring(0, 200));
            
            const lines = csv.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            console.log('Total lines:', lines.length);

            if (lines.length < 2) {
                alert('CSV file appears to be empty or invalid');
                return;
            }

            // Parse headers
            const headers = lines[0].split(',').map(h => h.trim());
            console.log('Headers:', headers);

            records = [];

            // Parse data rows
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                const values = parseCSVLine(line);
                
                if (values.length === 0) continue;

                const record = {};
                headers.forEach((header, idx) => {
                    record[header] = values[idx] || '';
                });

                // Only add if has at least Artist or Album
                if (record.Artist || record.Album) {
                    records.push(record);
                }
            }

            console.log('Parsed records:', records.length);
            console.log('First record:', records[0]);

            if (records.length === 0) {
                alert('No valid records found in CSV');
                return;
            }

            saveToStorage();
            updateFilters();
            render();
            alert(`✅ Successfully imported ${records.length} records!`);
            csvUpload.value = ''; // Clear the input

        } catch (error) {
            console.error('Error parsing CSV:', error);
            alert('Error parsing CSV: ' + error.message);
        }
    };

    reader.onerror = () => {
        alert('Error reading file');
        console.error('File read error');
    };

    reader.readAsText(file);
}

// Parse CSV line handling quotes properly
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

function render() {
    const search = searchInput.value.toLowerCase();
    const selectedGenre = genreFilter.value;
    const selectedFormat = formatFilter.value;
    const selectedCollection = collectionFilter.value;

    let filtered = records.filter(record => {
        // Search filter
        const matchesSearch = !search ||
            (record.Artist && record.Artist.toLowerCase().includes(search)) ||
            (record.Album && record.Album.toLowerCase().includes(search));

        // Genre filter
        const matchesGenre = !selectedGenre || record.Genre === selectedGenre;

        // Format filter
        const matchesFormat = !selectedFormat || record.Format === selectedFormat;

        // Collection filter
        let matchesCollection = true;
        if (selectedCollection && record.Collections) {
            const collections = record.Collections.split(';').map(c => c.trim());
            matchesCollection = collections.includes(selectedCollection);
        }

        return matchesSearch && matchesGenre && matchesFormat && matchesCollection;
    });

    // Update stats
    totalCount.textContent = records.length;
    displayCount.textContent = filtered.length;

    // Render grid
    if (filtered.length === 0) {
        recordsGrid.innerHTML = '<div class="empty">📀 No albums match your criteria</div>';
        return;
    }

    recordsGrid.innerHTML = filtered.map((record, idx) => {
        const realIdx = records.indexOf(record);
        const imageUrl = record['image-url'] || '';
        const imageHtml = imageUrl 
            ? `<img src="${imageUrl}" alt="${record.Album}" onerror="this.parentElement.innerHTML='📀';">`
            : '📀';

        return `
            <div class="record-card">
                <div class="record-img">${imageHtml}</div>
                <div class="record-info">
                    <div class="record-artist">${record.Artist || 'Unknown'}</div>
                    <div class="record-album">${record.Album || 'Unknown Album'}</div>
                    <div class="record-meta">${record.Year || '?'} · ${record.Format || '?'}</div>
                    <div class="record-tags">
                        ${record.Genre ? `<span class="tag">${record.Genre}</span>` : ''}
                        ${record.Format ? `<span class="tag">${record.Format}</span>` : ''}
                    </div>
                    <div class="record-actions">
                        <button class="btn btn-edit" onclick="editRecord(${realIdx})">Edit</button>
                        <button class="btn btn-delete" onclick="deleteRecord(${realIdx})">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function editRecord(idx) {
    editingIndex = idx;
    const record = records[idx];

    document.getElementById('f-artist').value = record.Artist || '';
    document.getElementById('f-album').value = record.Album || '';
    document.getElementById('f-year').value = record.Year || '';
    document.getElementById('f-genre').value = record.Genre || '';
    document.getElementById('f-subgenre').value = record['Sub-Genre'] || '';
    document.getElementById('f-format').value = record.Format || '';
    document.getElementById('f-label').value = record.Label || '';
    document.getElementById('f-catalog').value = record['Catalog #'] || '';
    document.getElementById('f-rpm').value = record.RPM || '';
    document.getElementById('f-weight').value = record.Weight || '';
    document.getElementById('f-collections').value = record.Collections || '';
    document.getElementById('f-imageurl').value = record['image-url'] || '';
    document.getElementById('f-notes').value = record.Notes || '';

    modal.classList.add('show');
}

function saveRecord() {
    const record = {
        Artist: document.getElementById('f-artist').value,
        Album: document.getElementById('f-album').value,
        Year: document.getElementById('f-year').value,
        Genre: document.getElementById('f-genre').value,
        'Sub-Genre': document.getElementById('f-subgenre').value,
        Format: document.getElementById('f-format').value,
        Label: document.getElementById('f-label').value,
        'Catalog #': document.getElementById('f-catalog').value,
        RPM: document.getElementById('f-rpm').value,
        Weight: document.getElementById('f-weight').value,
        Collections: document.getElementById('f-collections').value,
        'image-url': document.getElementById('f-imageurl').value,
        Notes: document.getElementById('f-notes').value
    };

    records[editingIndex] = record;
    saveToStorage();
    updateFilters();
    render();
    closeModal();
    alert('Record saved!');
}

function deleteRecord(idx) {
    if (confirm('Delete this record?')) {
        records.splice(idx, 1);
        saveToStorage();
        updateFilters();
        render();
        alert('Record deleted!');
    }
}

function updateFilters() {
    const genres = new Set();
    const formats = new Set();
    const collections = new Set();

    records.forEach(record => {
        if (record.Genre) genres.add(record.Genre);
        if (record.Format) formats.add(record.Format);
        if (record.Collections) {
            record.Collections.split(';').forEach(c => {
                const trimmed = c.trim();
                if (trimmed) collections.add(trimmed);
            });
        }
    });

    genreFilter.innerHTML = '<option value="">Genre</option>' +
        Array.from(genres).sort().map(g => `<option value="${g}">${g}</option>`).join('');

    formatFilter.innerHTML = '<option value="">Format</option>' +
        Array.from(formats).sort().map(f => `<option value="${f}">${f}</option>`).join('');

    collectionFilter.innerHTML = '<option value="">Collection</option>' +
        Array.from(collections).sort().map(c => `<option value="${c}">${c}</option>`).join('');
}

function closeModal() {
    modal.classList.remove('show');
    editForm.reset();
    editingIndex = -1;
}

function saveToStorage() {
    localStorage.setItem('vinylVault', JSON.stringify(records));
}

function loadFromStorage() {
    const stored = localStorage.getItem('vinylVault');
    if (stored) {
        try {
            records = JSON.parse(stored);
            updateFilters();
        } catch (e) {
            console.error('Error loading from storage:', e);
            records = [];
        }
    }
}

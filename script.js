let records = [];
let editingIndex = -1;

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

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupListeners();
});

function setupListeners() {
    uploadArea.addEventListener('click', () => csvUpload.click());
    csvUpload.addEventListener('change', handleUpload);
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag');
        const files = e.dataTransfer.files;
        if (files.length) {
            csvUpload.files = files;
            handleUpload();
        }
    });

    searchInput.addEventListener('input', render);
    genreFilter.addEventListener('change', render);
    formatFilter.addEventListener('change', render);
    collectionFilter.addEventListener('change', render);
    closeBtn.addEventListener('click', () => modal.classList.remove('show'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('show');
    });
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveEdit();
    });
    document.querySelector('.btn-cancel').addEventListener('click', () => {
        modal.classList.remove('show');
    });
}

function handleUpload() {
    const file = csvUpload.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const lines = e.target.result.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim());

            records = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                const record = {};
                headers.forEach((h, idx) => {
                    record[h] = (values[idx] || '').trim();
                });
                if (record.Artist || record.Album) {
                    records.push(record);
                }
            }

            saveData();
            updateFilters();
            render();
            alert(`✅ Imported ${records.length} records!`);
        } catch (err) {
            alert('❌ Error parsing CSV: ' + err.message);
        }
    };
    reader.readAsText(file);
}

function render() {
    const search = searchInput.value.toLowerCase();
    const genre = genreFilter.value;
    const format = formatFilter.value;
    const collection = collectionFilter.value;

    let filtered = records.filter(r => {
        const matchSearch = !search || 
            r.Artist.toLowerCase().includes(search) ||
            r.Album.toLowerCase().includes(search);
        const matchGenre = !genre || r.Genre === genre;
        const matchFormat = !format || r.Format === format;
        const matchCollection = !collection || 
            (r.Collections && r.Collections.split(';').map(c => c.trim()).includes(collection));
        return matchSearch && matchGenre && matchFormat && matchCollection;
    });

    displayCount.textContent = filtered.length;
    totalCount.textContent = records.length;

    if (filtered.length === 0) {
        recordsGrid.innerHTML = '<div class="empty">📀 No albums match your search</div>';
        return;
    }

    recordsGrid.innerHTML = filtered.map((r, idx) => {
        const realIdx = records.indexOf(r);
        const img = r['image-url'] ? `<img src="${r['image-url']}" alt="${r.Album}" onerror="this.parentElement.innerHTML='📀'">` : '📀';
        return `
            <div class="record-card">
                <div class="record-img">${img}</div>
                <div class="record-info">
                    <div class="record-artist">${r.Artist}</div>
                    <div class="record-album">${r.Album}</div>
                    <div class="record-meta">${r.Year || '?'} · ${r.Format || '?'}</div>
                    <div class="record-tags">
                        ${r.Genre ? `<span class="tag">${r.Genre}</span>` : ''}
                        ${r.Format ? `<span class="tag">${r.Format}</span>` : ''}
                    </div>
                    <div class="record-actions">
                        <button class="btn btn-edit" onclick="openEdit(${realIdx})">Edit</button>
                        <button class="btn btn-delete" onclick="deleteRecord(${realIdx})">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateFilters() {
    const genres = new Set();
    const formats = new Set();
    const collections = new Set();

    records.forEach(r => {
        if (r.Genre) genres.add(r.Genre);
        if (r.Format) formats.add(r.Format);
        if (r.Collections) {
            r.Collections.split(';').forEach(c => {
                if (c.trim()) collections.add(c.trim());
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

function openEdit(idx) {
    editingIndex = idx;
    const r = records[idx];
    document.getElementById('f-artist').value = r.Artist || '';
    document.getElementById('f-album').value = r.Album || '';
    document.getElementById('f-year').value = r.Year || '';
    document.getElementById('f-genre').value = r.Genre || '';
    document.getElementById('f-subgenre').value = r['Sub-Genre'] || '';
    document.getElementById('f-format').value = r.Format || '';
    document.getElementById('f-label').value = r.Label || '';
    document.getElementById('f-catalog').value = r['Catalog #'] || '';
    document.getElementById('f-rpm').value = r.RPM || '';
    document.getElementById('f-weight').value = r.Weight || '';
    document.getElementById('f-collections').value = r.Collections || '';
    document.getElementById('f-imageurl').value = r['image-url'] || '';
    document.getElementById('f-notes').value = r.Notes || '';
    modal.classList.add('show');
}

function saveEdit() {
    records[editingIndex] = {
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
    saveData();
    updateFilters();
    render();
    modal.classList.remove('show');
}

function deleteRecord(idx) {
    if (confirm('Delete this record?')) {
        records.splice(idx, 1);
        saveData();
        updateFilters();
        render();
    }
}

function saveData() {
    localStorage.setItem('vinylVault', JSON.stringify(records));
}

function loadData() {
    const stored = localStorage.getItem('vinylVault');
    if (stored) {
        records = JSON.parse(stored);
        updateFilters();
        render();
    }
}

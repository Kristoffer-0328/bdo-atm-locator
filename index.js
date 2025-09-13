// BDO Branch Locator Application
let branchData = [];
let filteredBranches = [];
let map = null;
let modalMap = null;
let markers = [];
let isMapView = false;

// DOM Elements
const searchInput = document.getElementById('searchInput');
const locationFilter = document.getElementById('locationFilter');
const typeFilter = document.getElementById('typeFilter');
const clearFilters = document.getElementById('clearFilters');
const toggleMapView = document.getElementById('toggleMapView');
const mapToggleText = document.getElementById('mapToggleText');
const resultsCount = document.getElementById('resultsCount');
const branchesGrid = document.getElementById('branchesGrid');
const mapContainer = document.getElementById('mapContainer');
const listContainer = document.getElementById('listContainer');
const loading = document.getElementById('loading');
const noResults = document.getElementById('noResults');
const branchModal = document.getElementById('branchModal');
const closeModal = document.getElementById('closeModal');
const mapInfoText = document.getElementById('mapInfoText');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadBranchData();
    setupEventListeners();
});

// Load branch data from JSON file
async function loadBranchData() {
    try {
        const response = await fetch('./branchLocator.json');
        const data = await response.json();
        
        // Extract branches from the nested data structure
        branchData = data[0]?.data || [];
        filteredBranches = [...branchData];
        
        hideLoading();
        displayBranches(filteredBranches);
        updateResultsCount();
        
    } catch (error) {
        console.error('Error loading branch data:', error);
        hideLoading();
        showNoResults('Error loading branch data. Please try again later.');
    }
}

// Setup event listeners
function setupEventListeners() {
    searchInput.addEventListener('input', handleSearch);
    locationFilter.addEventListener('change', handleFilter);
    typeFilter.addEventListener('change', handleFilter);
    clearFilters.addEventListener('click', clearAllFilters);
    toggleMapView.addEventListener('click', toggleView);
    closeModal.addEventListener('click', closeBranchModal);
    
    // Close modal when clicking outside
    branchModal.addEventListener('click', function(e) {
        if (e.target === branchModal) {
            closeBranchModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeBranchModal();
        }
    });
}

// Handle search functionality
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    applyFilters(searchTerm);
}

// Handle filter changes
function handleFilter() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    applyFilters(searchTerm);
}

// Apply all filters and search
function applyFilters(searchTerm = '') {
    filteredBranches = branchData.filter(branch => {
        // Search filter
        const matchesSearch = !searchTerm || 
            branch.branchName?.toLowerCase().includes(searchTerm) ||
            branch.area1?.toLowerCase().includes(searchTerm) ||
            branch.branchAddress?.toLowerCase().includes(searchTerm);
        
        // Location filter
        const locationValue = locationFilter.value;
        const matchesLocation = !locationValue || branch.location === locationValue;
        
        // Type filter
        const typeValue = typeFilter.value;
        const matchesType = !typeValue || branch.subcategoryChild1 === typeValue;
        
        return matchesSearch && matchesLocation && matchesType;
    });
    
    if (isMapView) {
        updateMapMarkers(filteredBranches);
    } else {
        displayBranches(filteredBranches);
    }
    updateResultsCount();
}

// Display branches in the grid
function displayBranches(branches) {
    branchesGrid.innerHTML = '';
    
    if (branches.length === 0) {
        showNoResults();
        return;
    }
    
    hideNoResults();
    
    branches.forEach(branch => {
        const branchCard = createBranchCard(branch);
        branchesGrid.appendChild(branchCard);
    });
}

// Create a branch card element
function createBranchCard(branch) {
    const card = document.createElement('div');
    card.className = 'branch-card';
    card.addEventListener('click', () => openBranchModal(branch));
    
    const operatingHours = branch.operatingHoursOne || 'Not specified';
    const contactNumber = branch.contactNumber1 || 'Not available';
    const bankingDays = branch.bankingDays1 || 'Not specified';
    
    card.innerHTML = `
        <div class="branch-header">
            <div class="branch-name">${branch.branchName || 'Unknown Branch'}</div>
            <div class="branch-type">${branch.subcategoryChild1 || 'Branch'}</div>
        </div>
        <div class="branch-info">
            <div class="info-row">
                <i class="fas fa-map-marker-alt"></i>
                <div class="info-text">${branch.branchAddress || 'Address not available'}</div>
            </div>
            <div class="info-row">
                <i class="fas fa-clock"></i>
                <div class="info-text">${operatingHours}</div>
            </div>
            <div class="info-row">
                <i class="fas fa-phone"></i>
                <div class="info-text">${contactNumber}</div>
            </div>
            <div class="info-row">
                <i class="fas fa-calendar"></i>
                <div class="info-text">${bankingDays}</div>
            </div>
            <div class="location-badge">${branch.location || 'Unknown'} - ${branch.area1 || ''}</div>
        </div>
    `;
    
    return card;
}

// Open branch details modal
function openBranchModal(branch) {
    const modalBranchName = document.getElementById('modalBranchName');
    const modalBranchDetails = document.getElementById('modalBranchDetails');
    
    modalBranchName.textContent = branch.branchName || 'Unknown Branch';
    
    modalBranchDetails.innerHTML = `
        <div class="detail-group">
            <div class="detail-label">
                <i class="fas fa-map-marker-alt"></i> Address
            </div>
            <div class="detail-value">${branch.branchAddress || 'Not available'}</div>
        </div>
        
        <div class="detail-group">
            <div class="detail-label">
                <i class="fas fa-building"></i> Type
            </div>
            <div class="detail-value">${branch.subcategoryChild1 || 'Branch'}</div>
        </div>
        
        <div class="detail-group">
            <div class="detail-label">
                <i class="fas fa-clock"></i> Operating Hours
            </div>
            <div class="detail-value">${branch.operatingHoursOne || 'Not specified'}</div>
        </div>
        
        <div class="detail-group">
            <div class="detail-label">
                <i class="fas fa-calendar"></i> Banking Days
            </div>
            <div class="detail-value">${branch.bankingDays1 || 'Not specified'}</div>
        </div>
        
        <div class="detail-group">
            <div class="detail-label">
                <i class="fas fa-phone"></i> Contact Numbers
            </div>
            <div class="detail-value">
                ${branch.contactNumber1 ? `Primary: ${branch.contactNumber1}<br>` : ''}
                ${branch.contactNumber2 ? `Secondary: ${branch.contactNumber2}<br>` : ''}
                ${!branch.contactNumber1 && !branch.contactNumber2 ? 'Not available' : ''}
            </div>
        </div>
        
        ${branch.email1 ? `
        <div class="detail-group">
            <div class="detail-label">
                <i class="fas fa-envelope"></i> Email
            </div>
            <div class="detail-value">${branch.email1}</div>
        </div>
        ` : ''}
        
        <div class="detail-group">
            <div class="detail-label">
                <i class="fas fa-map"></i> Location
            </div>
            <div class="detail-value">${branch.location || 'Unknown'} - ${branch.area1 || ''}</div>
        </div>
        
        ${branch.latitude && branch.longitude ? `
        <div class="detail-group">
            <div class="detail-label">
                <i class="fas fa-crosshairs"></i> Coordinates
            </div>
            <div class="detail-value">
                Latitude: ${branch.latitude}<br>
                Longitude: ${branch.longitude}
            </div>
        </div>
        ` : ''}
        
        ${branch.serviceNote ? `
        <div class="detail-group">
            <div class="detail-label">
                <i class="fas fa-info-circle"></i> Service Notes
            </div>
            <div class="detail-value">${branch.serviceNote}</div>
        </div>
        ` : ''}
    `;
    
    branchModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Initialize modal map
    setTimeout(() => {
        initializeModalMap(branch);
    }, 100);
}

// Close branch details modal
function closeBranchModal() {
    branchModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Clear all filters and search
function clearAllFilters() {
    searchInput.value = '';
    locationFilter.value = '';
    typeFilter.value = '';
    filteredBranches = [...branchData];
    
    if (isMapView) {
        updateMapMarkers(filteredBranches);
    } else {
        displayBranches(filteredBranches);
    }
    updateResultsCount();
}

// Update results count display
function updateResultsCount() {
    const count = filteredBranches.length;
    const total = branchData.length;
    
    if (count === total) {
        resultsCount.textContent = `Showing all ${total} branches`;
    } else {
        resultsCount.textContent = `Showing ${count} of ${total} branches`;
    }
}

// Show loading state
function showLoading() {
    loading.style.display = 'block';
    branchesGrid.style.display = 'none';
    noResults.style.display = 'none';
}

// Hide loading state
function hideLoading() {
    loading.style.display = 'none';
    branchesGrid.style.display = 'grid';
}

// Show no results message
function showNoResults(message = 'No branches found matching your criteria.') {
    noResults.style.display = 'block';
    noResults.querySelector('p').textContent = message;
    branchesGrid.style.display = 'none';
}

// Hide no results message
function hideNoResults() {
    noResults.style.display = 'none';
    branchesGrid.style.display = 'grid';
}

// Toggle between map and list view
function toggleView() {
    isMapView = !isMapView;
    
    if (isMapView) {
        showMapView();
    } else {
        showListView();
    }
}

// Show map view
function showMapView() {
    mapContainer.style.display = 'block';
    listContainer.style.display = 'none';
    toggleMapView.classList.add('active');
    mapToggleText.textContent = 'Show List';
    toggleMapView.querySelector('i').className = 'fas fa-list';
    
    // Initialize map if not already done
    if (!map) {
        initializeMap();
    }
    
    // Update markers with current filtered branches
    updateMapMarkers(filteredBranches);
}

// Show list view
function showListView() {
    mapContainer.style.display = 'none';
    listContainer.style.display = 'block';
    toggleMapView.classList.remove('active');
    mapToggleText.textContent = 'Show Map';
    toggleMapView.querySelector('i').className = 'fas fa-map';
    
    displayBranches(filteredBranches);
}

// Initialize the main map
function initializeMap() {
    // Center map on Philippines
    map = L.map('map').setView([13.0, 122.0], 6);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);
}

// Update map markers
function updateMapMarkers(branches) {
    if (!map) return;
    
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Check if any filters are active
    const hasActiveFilters = searchInput.value.trim() !== '' || 
                           locationFilter.value !== '' || 
                           typeFilter.value !== '';
    
    // Only show markers if filters are applied and results are reasonable (less than 100)
    if (hasActiveFilters && branches.length > 0 && branches.length <= 100) {
        // Add new markers for filtered results
        branches.forEach(branch => {
            if (branch.latitude && branch.longitude) {
                const lat = parseFloat(branch.latitude);
                const lng = parseFloat(branch.longitude);
                
                if (!isNaN(lat) && !isNaN(lng)) {
                    const marker = L.marker([lat, lng])
                        .bindPopup(createPopupContent(branch), {
                            className: 'custom-popup',
                            maxWidth: 300
                        })
                        .addTo(map);
                    
                    markers.push(marker);
                }
            }
        });
        
        // Update info message
        mapInfoText.textContent = `Showing ${markers.length} branch locations - Click markers for details`;
        
        // Fit map to show filtered markers
        if (markers.length > 0) {
            const group = new L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.1));
        } else {
            // If no valid coordinates, show Philippines
            map.setView([13.0, 122.0], 6);
        }
    } else if (hasActiveFilters && branches.length > 100) {
        // Too many results - don't show markers
        map.setView([13.0, 122.0], 6);
        mapInfoText.textContent = `Too many results (${branches.length}) - Please narrow your search to see markers`;
    } else {
        // No filters active - just show Philippines overview
        map.setView([13.0, 122.0], 6);
        mapInfoText.textContent = 'Use search or filters to see branch locations on the map (max 100 results)';
    }
}

// Create popup content for map markers
function createPopupContent(branch) {
    const operatingHours = branch.operatingHoursOne || 'Not specified';
    const contactNumber = branch.contactNumber1 || 'Not available';
    
    return `
        <div class="popup-header">
            ${branch.branchName || 'Unknown Branch'}
        </div>
        <div class="popup-body">
            <div class="popup-info">
                <div class="popup-row">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${branch.branchAddress || 'Address not available'}</span>
                </div>
                <div class="popup-row">
                    <i class="fas fa-building"></i>
                    <span>${branch.subcategoryChild1 || 'Branch'}</span>
                </div>
                <div class="popup-row">
                    <i class="fas fa-clock"></i>
                    <span>${operatingHours}</span>
                </div>
                <div class="popup-row">
                    <i class="fas fa-phone"></i>
                    <span>${contactNumber}</span>
                </div>
            </div>
        </div>
    `;
}

// Initialize modal map
function initializeModalMap(branch) {
    const lat = parseFloat(branch.latitude);
    const lng = parseFloat(branch.longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
        document.querySelector('.modal-map-container').style.display = 'none';
        return;
    }
    
    document.querySelector('.modal-map-container').style.display = 'block';
    
    // Remove existing modal map
    if (modalMap) {
        modalMap.remove();
    }
    
    // Create new modal map
    modalMap = L.map('modalMap').setView([lat, lng], 15);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(modalMap);
    
    // Add marker for the branch
    L.marker([lat, lng])
        .bindPopup(`<strong>${branch.branchName}</strong><br>${branch.branchAddress}`)
        .addTo(modalMap)
        .openPopup();
}
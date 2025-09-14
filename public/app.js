// ProspectPro v2.0 Real API Client - Redesigned
class ProspectProRealAPI {
    constructor() {
        this.baseUrl = window.location.origin;
        this.selectedTool = 'business-discovery';
        this.searchResults = [];
        // Add authentication token - hardcode for personal use
        this.accessToken = '6ef913e6d21ad34cc9f68d91ec559c47797b1959a269a549eeef52ddf0af33d2';
        
        this.costPerLead = 0.084; // Estimated cost per lead with enrichment

        this.init();
    }

    async init() {
        console.log('🚀 ProspectPro Real API Client initialized');

        // Check API status
        await this.checkApiStatus();

        // Initialize business categories (only when on business page)
        if (document.getElementById('categorySelect')) {
            this.initBusinessCategories();
        }

        // Bind events
        this.bindEvents();
        
        // Update initial cost estimate
        this.updateCostEstimate();

        // Set initial lead quantity
        this.selectedQuantity = 5;
    }

    selectTemplate(templateType) {
        if (templateType === 'local-business') {
            this.showPage('localBusinessPage');
            this.initBusinessCategories();
        }
    }

    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.add('hidden');
        });
        
        // Show selected page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.remove('hidden');
        }
    }

    goHome() {
        this.showPage('homePage');
    }

    updateCostEstimate() {
        const leadCount = this.selectedQuantity || 5;
        const estimatedCost = (leadCount * this.costPerLead).toFixed(2);
        const costElement = document.getElementById('costEstimate');
        if (costElement) {
            costElement.textContent = `$${estimatedCost}`;
        }
    }

    async checkApiStatus() {
        try {
            // First check basic health
            const healthResponse = await fetch(`${this.baseUrl}/health`);
            const healthStatus = await healthResponse.json();
            
            // Then check detailed API status
            const statusResponse = await fetch(`${this.baseUrl}/api/status`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            const detailedStatus = await statusResponse.json();

            const statusElement = document.getElementById('apiStatus');
            const statusDot = statusElement.querySelector('.status-dot');
            const statusText = statusElement.querySelector('.status-text');

            console.log('Health Status:', healthStatus);
            console.log('API Status:', detailedStatus);

            // Check if all required APIs are configured
            const requiredAPIs = detailedStatus.api_keys;
            const criticalAPIs = ['google_places']; // At minimum, Google Places is required
            const allCriticalReady = criticalAPIs.every(api => requiredAPIs[api] === true);

            if (detailedStatus.configuration_complete && allCriticalReady) {
                statusDot.className = 'status-dot status-dot--success';
                statusText.textContent = 'All APIs Ready';
            } else if (allCriticalReady) {
                statusDot.className = 'status-dot status-dot--warning';
                statusText.textContent = 'Core APIs Ready';
            } else {
                statusDot.className = 'status-dot status-dot--warning';
                statusText.textContent = 'APIs Not Fully Configured';
            }

        } catch (error) {
            console.error('API status check failed:', error);
            const statusElement = document.getElementById('apiStatus');
            const statusDot = statusElement.querySelector('.status-dot');
            const statusText = statusElement.querySelector('.status-text');

            statusDot.className = 'status-dot status-dot--error';
            statusText.textContent = 'API Connection Failed';
        }
    }

    initBusinessCategories() {
        const categorySelect = document.getElementById('categorySelect');
        const typeSelect = document.getElementById('typeSelect');

        // Populate categories
        const categories = window.BusinessCategories.getCategories();
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });

        // Handle category change
        categorySelect.addEventListener('change', (e) => {
            const selectedCategory = e.target.value;
            typeSelect.innerHTML = '<option value="">Select business type...</option>';
            
            if (selectedCategory) {
                const types = window.BusinessCategories.getTypesForCategory(selectedCategory);
                typeSelect.disabled = false;
                
                types.forEach(type => {
                    const option = document.createElement('option');
                    option.value = type;
                    option.textContent = type;
                    typeSelect.appendChild(option);
                });
            } else {
                typeSelect.disabled = true;
            }
        });
    }

    bindEvents() {
        // Logo click to go home
        const logoLink = document.getElementById('logoLink');
        if (logoLink) {
            logoLink.addEventListener('click', () => this.goHome());
        }

        // Template tile clicks
        const localBusinessCard = document.getElementById('localBusinessCard');
        if (localBusinessCard) {
            localBusinessCard.addEventListener('click', () => this.selectTemplate('local-business'));
        }

        // Form submission (only bind if form exists)
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSearch();
            });
        }

        // Quantity button selection
        const quantityButtons = document.querySelectorAll('.quantity-btn');
        quantityButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove selected class from all buttons
                quantityButtons.forEach(b => b.classList.remove('selected'));
                // Add selected class to clicked button
                btn.classList.add('selected');
                // Update selected quantity
                this.selectedQuantity = parseInt(btn.dataset.value);
                // Update cost estimate
                this.updateCostEstimate();
            });
        });
    }

    updateCostEstimate() {
        const leadCount = this.selectedQuantity || 5;
        const estimatedCost = (leadCount * this.costPerLead).toFixed(2);
        const costElement = document.getElementById('costEstimate');
        if (costElement) {
            costElement.textContent = `$${estimatedCost}`;
        }
    }

    async handleSearch() {
        const categorySelect = document.getElementById('categorySelect');
        const typeSelect = document.getElementById('typeSelect');
        const locationInput = document.getElementById('locationInput');
        const radiusSelect = document.getElementById('radiusSelect');

        // Get form values
        const category = categorySelect.value;
        const businessTypeDisplay = typeSelect.value;
        const businessType = window.BusinessCategories.getRawTypeForDisplay(businessTypeDisplay);
        const location = locationInput.value.trim();
        const radius = parseInt(radiusSelect.value);
        const leadCount = this.selectedQuantity || 5;

        // Validate form
        if (!category || !businessType || !location) {
            alert('Please fill in all required fields');
            return;
        }

        console.log(`🔍 Starting business discovery: "${businessType}" in "${location}" (${radius} miles, ${leadCount} leads)`);

        // Show loading state
        this.setLoadingState(true);

        try {
            // Call the API with new parameters including radius
            const response = await fetch(`${this.baseUrl}/api/business/discover`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify({
                    query: businessType,
                    location: location,
                    radius: radius,
                    count: leadCount,
                    category: category
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('✅ API Response:', result);

            // Store results and show them
            this.searchResults = result.businesses || [];
            this.showResults(result);

        } catch (error) {
            console.error('❌ Business discovery failed:', error);
            this.showError(`Business discovery failed: ${error.message}`);
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(isLoading) {
        const searchButton = document.getElementById('searchButton');
        const btnText = searchButton.querySelector('.btn-text');
        const btnSpinner = searchButton.querySelector('.btn-spinner');

        if (isLoading) {
            searchButton.disabled = true;
            btnText.style.display = 'none';
            btnSpinner.classList.remove('hidden');
        } else {
            searchButton.disabled = false;
            btnText.style.display = 'inline';
            btnSpinner.classList.add('hidden');
        }
    }

    showResults(result) {
        const resultsSection = document.getElementById('resultsSection');
        const businesses = result.businesses || [];
        const stats = result.stats || {};

        // Create results HTML
        resultsSection.innerHTML = `
            <div class="results-header">
                <h2>Business Discovery Results</h2>
                <p>Found ${businesses.length} verified business leads</p>
            </div>

            <div class="results-stats">
                <div class="stat-item">
                    <div class="stat-value">${stats.returned || 0}</div>
                    <div class="stat-label">Results</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.enriched || 0}</div>
                    <div class="stat-label">Enriched</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.googleResults || 0}</div>
                    <div class="stat-label">Google Places</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.yellowPagesResults || 0}</div>
                    <div class="stat-label">Yellow Pages</div>
                </div>
            </div>

            <div class="results-grid">
                ${businesses.map(business => this.createBusinessCard(business)).join('')}
            </div>

            ${businesses.length > 0 ? `
                <div class="export-section">
                    <h3>Export Your Leads</h3>
                    <p>Download your verified business leads as a CSV file</p>
                    <div class="results-actions">
                        <button class="btn btn-outline" onclick="prospectProApp.goHome()">
                            ← New Search
                        </button>
                        <button class="btn btn-primary" onclick="prospectProApp.exportResults()">
                            📄 Export to CSV
                        </button>
                    </div>
                </div>
            ` : ''}
        `;

        resultsSection.classList.remove('hidden');
    }

    createBusinessCard(business) {
        return `
            <div class="business-card">
                <div class="business-header">
                    <div class="business-name">${business.name}</div>
                    <div class="business-address">${business.address || 'No address available'}</div>
                </div>
                <div class="business-contacts">
                    ${business.phone ? `
                        <div class="contact-item">
                            <span class="contact-label">Phone:</span> ${business.phone}
                        </div>
                    ` : ''}
                    ${business.website ? `
                        <div class="contact-item">
                            <span class="contact-label">Website:</span> 
                            <a href="${business.website}" target="_blank">${business.website}</a>
                        </div>
                    ` : ''}
                    ${business.rating ? `
                        <div class="contact-item">
                            <span class="contact-label">Rating:</span> ${business.rating}/5
                        </div>
                    ` : ''}
                </div>
                <div class="business-meta">
                    <span class="source-badge">${business.source || 'Unknown'}</span>
                    ${business.preValidationScore ? `
                        <span class="score-badge">${business.preValidationScore}% validated</span>
                    ` : ''}
                </div>
            </div>
        `;
    }

    showError(message) {
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.innerHTML = `
            <div class="error-message">
                <h3>Discovery Failed</h3>
                <p>${message}</p>
                <p>This system only returns real data from actual APIs. If discovery fails, no fake data will be generated.</p>
                <button class="btn btn-secondary" onclick="document.getElementById('resultsSection').classList.add('hidden')">
                    Try Again
                </button>
            </div>
        `;
        resultsSection.classList.remove('hidden');
    }

    exportResults() {
        console.log('Export function called');
        console.log('Search results:', this.searchResults);
        
        if (this.searchResults.length === 0) {
            alert('No data to export');
            return;
        }

        try {
            // Create CSV content
            const headers = ['Business Name', 'Address', 'Phone', 'Website', 'Source', 'Pre-validation Score'];
            const csvContent = [
                headers.join(','),
                ...this.searchResults.map(business => [
                    `"${business.name}"`,
                    `"${business.address || ''}"`,
                    `"${business.phone || ''}"`,
                    `"${business.website || ''}"`,
                    business.source || '',
                    business.preValidationScore || ''
                ].join(','))
            ].join('\n');

            console.log('CSV content generated:', csvContent.substring(0, 200) + '...');

            // Download CSV
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ProspectPro-Real-Data-${new Date().toISOString().split('T')[0]}.csv`;
            
            // Ensure the link is added to the DOM for some browsers
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            console.log('Export completed successfully');
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed: ' + error.message);
        }
    }
}

// Initialize the application
let prospectProApp;
document.addEventListener('DOMContentLoaded', () => {
    prospectProApp = new ProspectProRealAPI();
});
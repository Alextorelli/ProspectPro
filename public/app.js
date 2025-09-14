// ProspectPro v2.0 Real API Client
class ProspectProRealAPI {
    constructor() {
        this.baseUrl = window.location.origin;
        this.selectedTemplate = null;
        this.extractionResults = [];
        // Add authentication token - hardcode for personal use
        this.accessToken = '6ef913e6d21ad34cc9f68d91ec559c47797b1959a269a549eeef52ddf0af33d2';

        this.batchTemplates = {
            'micro-test': { 
                name: 'Micro Test',
                targetLeads: 3, 
                maxApiCalls: 15, 
                estimatedCost: 0.25,
                description: 'Quick validation test'
            },
            'small-batch': { 
                name: 'Small Batch',
                targetLeads: 5, 
                maxApiCalls: 25, 
                estimatedCost: 0.42,
                description: 'Standard testing batch'
            },
            'validation-batch': { 
                name: 'Validation Batch',
                targetLeads: 10, 
                maxApiCalls: 40, 
                estimatedCost: 0.68,
                description: 'Quality validation batch'
            },
            'production-batch': { 
                name: 'Production Batch',
                targetLeads: 25, 
                maxApiCalls: 75, 
                estimatedCost: 1.28,
                description: 'Full production run'
            }
        };

        this.init();
    }

    async init() {
        console.log('🚀 ProspectPro Real API Client initialized');

        // Check API status
        await this.checkApiStatus();

        // Render templates
        this.renderBatchTemplates();

        // Bind events
        this.bindEvents();
    }

    async checkApiStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            const status = await response.json();

            const statusElement = document.getElementById('apiStatus');
            const statusDot = statusElement.querySelector('.status-dot');
            const statusText = statusElement.querySelector('.status-text');

            const allAPIsReady = Object.values(status.apis).every(api => api === true);

            if (allAPIsReady) {
                statusDot.className = 'status-dot status-dot--success';
                statusText.textContent = 'All APIs Ready';
            } else {
                statusDot.className = 'status-dot status-dot--warning';
                statusText.textContent = 'Some APIs Not Configured';
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

    renderBatchTemplates() {
        const grid = document.getElementById('templatesGrid');
        if (!grid) return;

        grid.innerHTML = '';

        Object.entries(this.batchTemplates).forEach(([id, template]) => {
            const templateCard = document.createElement('div');
            templateCard.className = 'template-card';
            templateCard.dataset.templateId = id;

            templateCard.innerHTML = `
                <div class="template-header">
                    <h3>${template.name}</h3>
                    <div class="template-badge">Real API</div>
                </div>
                <div class="template-stats">
                    <div class="stat">
                        <span class="stat-value">${template.targetLeads}</span>
                        <span class="stat-label">Target Leads</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">$${template.estimatedCost}</span>
                        <span class="stat-label">Est. Cost</span>
                    </div>
                </div>
                <p class="template-description">${template.description}</p>
                <div class="template-details">
                    <small>Max API calls: ${template.maxApiCalls}</small>
                </div>
            `;

            templateCard.addEventListener('click', () => {
                this.selectTemplate(id, template);
            });

            grid.appendChild(templateCard);
        });
    }

    selectTemplate(templateId, template) {
        // Remove previous selections
        document.querySelectorAll('.template-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Select current template
        const selectedCard = document.querySelector(`[data-template-id="${templateId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }

        this.selectedTemplate = { id: templateId, ...template };

        // Show configuration panel
        this.showConfigPanel();
    }

    showConfigPanel() {
        const configPanel = document.getElementById('configPanel');
        const configTitle = document.getElementById('configTitle');

        if (configPanel && configTitle) {
            configTitle.textContent = `Configure ${this.selectedTemplate.name}`;
            configPanel.style.display = 'block';
            configPanel.scrollIntoView({ behavior: 'smooth' });
        }
    }

    bindEvents() {
        const startExtractionBtn = document.getElementById('startExtractionBtn');
        if (startExtractionBtn) {
            startExtractionBtn.addEventListener('click', () => {
                this.startRealDataExtraction();
            });
        }
    }

    async startRealDataExtraction() {
        if (!this.selectedTemplate) {
            alert('Please select a batch template first');
            return;
        }

        const location = document.getElementById('locationInput')?.value || 'Austin, TX';
        const industry = document.getElementById('industrySelect')?.value || 'restaurants';

        console.log(`🔍 Starting real data extraction: ${industry} in ${location}`);

        try {
            // Show loading state
            this.showLoadingState();

            // Call real API endpoint
            const response = await fetch(`${this.baseUrl}/api/business/discover`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify({
                    query: industry,
                    location: location,
                    count: this.selectedTemplate.targetLeads,
                    batchType: this.selectedTemplate.id
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                this.extractionResults = result.businesses;
                this.showResults(result);
            } else {
                throw new Error(result.message || 'Extraction failed');
            }

        } catch (error) {
            console.error('Real data extraction failed:', error);
            this.showError(error.message);
        }
    }

    showLoadingState() {
        const resultsPanel = document.getElementById('resultsPanel');
        const resultsContent = document.getElementById('resultsContent');

        if (resultsPanel && resultsContent) {
            resultsContent.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <h3>Extracting Real Business Data</h3>
                    <p>Making API calls to Google Places, Yellow Pages, and other sources...</p>
                </div>
            `;
            resultsPanel.style.display = 'block';
            resultsPanel.scrollIntoView({ behavior: 'smooth' });
        }
    }

    showResults(result) {
        const resultsContent = document.getElementById('resultsContent');
        if (!resultsContent) return;

        const businesses = result.businesses || [];
        const stats = result.stats || {};

        let resultsHTML = `
            <div class="results-summary">
                <h3>Real Data Extraction Complete</h3>
                <div class="summary-stats">
                    <div class="stat">
                        <span class="stat-value">${businesses.length}</span>
                        <span class="stat-label">Businesses Found</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${stats.googleResults || 0}</span>
                        <span class="stat-label">Google Places</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${stats.yellowPagesResults || 0}</span>
                        <span class="stat-label">Yellow Pages</span>
                    </div>
                </div>
            </div>
        `;

        if (businesses.length > 0) {
            resultsHTML += `
                <div class="results-list">
                    <h4>Real Business Contacts</h4>
                    ${businesses.map(business => `
                        <div class="business-card">
                            <div class="business-header">
                                <h5>${business.name}</h5>
                                <div class="source-badge">${business.source}</div>
                            </div>
                            <div class="business-details">
                                <p><strong>Address:</strong> ${business.address}</p>
                                ${business.phone ? `<p><strong>Phone:</strong> ${business.phone}</p>` : ''}
                                ${business.website ? `<p><strong>Website:</strong> <a href="${business.website}" target="_blank">${business.website}</a></p>` : ''}
                                ${business.rating ? `<p><strong>Rating:</strong> ${business.rating}/5</p>` : ''}
                                ${business.preValidationScore ? `<p><strong>Pre-validation Score:</strong> ${business.preValidationScore}%</p>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="results-actions">
                    <button class="btn btn--primary" onclick="prospectProApp.exportResults()">Export Real Data</button>
                </div>
            `;
        } else {
            resultsHTML += `
                <div class="no-results">
                    <h4>No businesses found</h4>
                    <p>Try adjusting your search parameters or selecting a different location.</p>
                    <p><strong>Note:</strong> We only return real, verified business data - no fake or placeholder results.</p>
                </div>
            `;
        }

        resultsContent.innerHTML = resultsHTML;
    }

    showError(message) {
        const resultsContent = document.getElementById('resultsContent');
        if (!resultsContent) return;

        resultsContent.innerHTML = `
            <div class="error-state">
                <h3>Extraction Failed</h3>
                <p><strong>Error:</strong> ${message}</p>
                <p>This system only returns real data from actual APIs. If extraction fails, no fake data will be generated.</p>
                <button class="btn btn--outline" onclick="location.reload()">Try Again</button>
            </div>
        `;
    }

    exportResults() {
        console.log('Export function called');
        console.log('Extraction results:', this.extractionResults);
        
        if (this.extractionResults.length === 0) {
            alert('No data to export');
            return;
        }

        try {
            // Create CSV content
            const headers = ['Business Name', 'Address', 'Phone', 'Website', 'Source', 'Pre-validation Score'];
            const csvContent = [
                headers.join(','),
                ...this.extractionResults.map(business => [
                    `"${business.name}"`,
                    `"${business.address}"`,
                    `"${business.phone || ''}"`,
                    `"${business.website || ''}"`,
                    business.source,
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
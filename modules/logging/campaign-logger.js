/**
 * Campaign Result Logger
 * 
 * Logs campaign results for admin review and algorithm improvement
 * Tracks success rates, cost efficiency, and data quality metrics
 */

const fs = require('fs').promises;
const path = require('path');

class CampaignLogger {
    constructor() {
        this.logDir = path.join(__dirname, '../../logs');
        this.campaignLogFile = path.join(this.logDir, 'campaign-results.json');
        this.statsFile = path.join(this.logDir, 'campaign-stats.json');
        
        this.ensureLogDirectory();
    }

    /**
     * Log a completed campaign with all results and metrics
     */
    async logCampaignResults(campaignData) {
        try {
            console.log('📊 Logging campaign results...');

            const logEntry = {
                campaignId: this.generateCampaignId(),
                timestamp: new Date().toISOString(),
                parameters: {
                    businessType: campaignData.businessType,
                    location: campaignData.location,
                    businessSize: campaignData.businessSize,
                    targetCount: campaignData.targetCount
                },
                results: {
                    totalBusinessesFound: campaignData.businesses?.length || 0,
                    businessesWithOwners: this.countBusinessesWithOwners(campaignData.businesses),
                    businessesWithEmails: this.countBusinessesWithEmails(campaignData.businesses),
                    businessesWithVerifiedEmails: this.countBusinessesWithVerifiedEmails(campaignData.businesses),
                    averageQualityGrade: this.calculateAverageQualityGrade(campaignData.businesses),
                    averageConfidenceScore: this.calculateAverageConfidence(campaignData.businesses)
                },
                costs: {
                    totalEstimatedCost: campaignData.estimatedCost || 0,
                    totalActualCost: this.calculateTotalCost(campaignData.businesses),
                    costPerQualifiedLead: this.calculateCostPerLead(campaignData.businesses),
                    apiUsage: this.summarizeApiUsage(campaignData.businesses)
                },
                performance: {
                    duration: campaignData.duration || 0,
                    businessesPerMinute: this.calculateProcessingRate(campaignData.businesses, campaignData.duration),
                    successRate: this.calculateSuccessRate(campaignData.businesses),
                    qualityDistribution: this.calculateQualityDistribution(campaignData.businesses)
                },
                sources: this.summarizeSources(campaignData.businesses)
            };

            // Add to campaign log
            await this.appendToCampaignLog(logEntry);

            // Update aggregate statistics
            await this.updateAggregateStats(logEntry);

            console.log(`✅ Campaign ${logEntry.campaignId} logged successfully`);
            return logEntry.campaignId;

        } catch (error) {
            console.error('Failed to log campaign results:', error);
            throw error;
        }
    }

    /**
     * Get campaign statistics for admin dashboard
     */
    async getCampaignStats() {
        try {
            const statsData = await fs.readFile(this.statsFile, 'utf8');
            return JSON.parse(statsData);
        } catch (error) {
            // Return default stats if file doesn't exist
            return this.getDefaultStats();
        }
    }

    /**
     * Get recent campaign results
     */
    async getRecentCampaigns(limit = 10) {
        try {
            const logData = await fs.readFile(this.campaignLogFile, 'utf8');
            const campaigns = JSON.parse(logData);
            
            // Return most recent campaigns
            return campaigns
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);
        } catch (error) {
            console.error('Failed to get recent campaigns:', error);
            return [];
        }
    }

    /**
     * Generate usage report for specific date range
     */
    async getUsageReport(startDate, endDate) {
        try {
            const campaigns = await this.getCampaignsBetweenDates(startDate, endDate);
            
            const report = {
                dateRange: { startDate, endDate },
                totalCampaigns: campaigns.length,
                totalBusinessesProcessed: campaigns.reduce((sum, c) => sum + c.results.totalBusinessesFound, 0),
                totalCost: campaigns.reduce((sum, c) => sum + c.costs.totalActualCost, 0),
                averageSuccessRate: this.calculateAverageSuccessRateForCampaigns(campaigns),
                costTrends: this.calculateCostTrends(campaigns),
                qualityTrends: this.calculateQualityTrends(campaigns),
                apiUsageSummary: this.summarizeApiUsageForCampaigns(campaigns)
            };

            return report;

        } catch (error) {
            console.error('Failed to generate usage report:', error);
            return null;
        }
    }

    /**
     * Utility methods for calculating metrics
     */
    countBusinessesWithOwners(businesses) {
        if (!businesses) return 0;
        return businesses.filter(b => b.ownerName).length;
    }

    countBusinessesWithEmails(businesses) {
        if (!businesses) return 0;
        return businesses.filter(b => b.ownerEmail).length;
    }

    countBusinessesWithVerifiedEmails(businesses) {
        if (!businesses) return 0;
        return businesses.filter(b => 
            b.ownerEmail && 
            b.emailVerification && 
            b.emailVerification.isValid
        ).length;
    }

    calculateAverageQualityGrade(businesses) {
        if (!businesses || businesses.length === 0) return 'F';
        
        const gradeValues = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'F': 1 };
        const reverseGrades = { 5: 'A', 4: 'B', 3: 'C', 2: 'D', 1: 'F' };
        
        const totalValue = businesses.reduce((sum, b) => {
            const grade = b.qualityGrade || 'F';
            return sum + (gradeValues[grade] || 1);
        }, 0);
        
        const averageValue = Math.round(totalValue / businesses.length);
        return reverseGrades[averageValue] || 'F';
    }

    calculateAverageConfidence(businesses) {
        if (!businesses || businesses.length === 0) return 0;
        
        const totalConfidence = businesses.reduce((sum, b) => sum + (b.confidence || 0), 0);
        return Math.round(totalConfidence / businesses.length);
    }

    calculateTotalCost(businesses) {
        if (!businesses) return 0;
        return businesses.reduce((sum, b) => sum + (b.actualCost || 0), 0);
    }

    calculateCostPerLead(businesses) {
        const qualifiedBusinesses = this.countBusinessesWithOwners(businesses);
        const totalCost = this.calculateTotalCost(businesses);
        
        return qualifiedBusinesses > 0 ? totalCost / qualifiedBusinesses : 0;
    }

    calculateProcessingRate(businesses, duration) {
        if (!businesses || !duration || duration === 0) return 0;
        return Math.round((businesses.length / duration) * 60); // businesses per minute
    }

    calculateSuccessRate(businesses) {
        if (!businesses || businesses.length === 0) return 0;
        const successful = this.countBusinessesWithOwners(businesses);
        return Math.round((successful / businesses.length) * 100);
    }

    calculateQualityDistribution(businesses) {
        if (!businesses) return { A: 0, B: 0, C: 0, D: 0, F: 0 };
        
        const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
        businesses.forEach(b => {
            const grade = b.qualityGrade || 'F';
            if (distribution[grade] !== undefined) {
                distribution[grade]++;
            }
        });
        
        return distribution;
    }

    summarizeApiUsage(businesses) {
        if (!businesses) return { free: 0, lowCost: 0, expensive: 0 };
        
        const usage = { free: 0, lowCost: 0, expensive: 0 };
        businesses.forEach(b => {
            if (b.sources) {
                b.sources.forEach(source => {
                    if (source.includes('state_registries') || source.includes('opencorporates')) {
                        usage.free++;
                    } else if (source.includes('hunter') || source.includes('neverbounce')) {
                        usage.lowCost++;
                    } else if (source.includes('linkedin')) {
                        usage.expensive++;
                    }
                });
            }
        });
        
        return usage;
    }

    summarizeSources(businesses) {
        if (!businesses) return {};
        
        const sources = {};
        businesses.forEach(b => {
            if (b.sources) {
                b.sources.forEach(source => {
                    sources[source] = (sources[source] || 0) + 1;
                });
            }
        });
        
        return sources;
    }

    /**
     * File operations
     */
    async ensureLogDirectory() {
        try {
            await fs.access(this.logDir);
        } catch (error) {
            await fs.mkdir(this.logDir, { recursive: true });
        }
    }

    async appendToCampaignLog(logEntry) {
        try {
            let existingData = [];
            
            try {
                const data = await fs.readFile(this.campaignLogFile, 'utf8');
                existingData = JSON.parse(data);
            } catch (error) {
                // File doesn't exist yet, start with empty array
            }
            
            existingData.push(logEntry);
            
            // Keep only last 1000 campaigns to prevent file from growing too large
            if (existingData.length > 1000) {
                existingData = existingData.slice(-1000);
            }
            
            await fs.writeFile(this.campaignLogFile, JSON.stringify(existingData, null, 2));
        } catch (error) {
            console.error('Failed to append to campaign log:', error);
        }
    }

    async updateAggregateStats(logEntry) {
        try {
            let stats = await this.getCampaignStats();
            
            // Update aggregate statistics
            stats.totalCampaigns++;
            stats.totalBusinessesProcessed += logEntry.results.totalBusinessesFound;
            stats.totalCost += logEntry.costs.totalActualCost;
            stats.totalOwnerFound += logEntry.results.businessesWithOwners;
            stats.totalEmailsFound += logEntry.results.businessesWithEmails;
            stats.totalEmailsVerified += logEntry.results.businessesWithVerifiedEmails;
            
            // Update averages
            stats.averageCostPerLead = stats.totalOwnerFound > 0 ? 
                stats.totalCost / stats.totalOwnerFound : 0;
            stats.averageSuccessRate = stats.totalBusinessesProcessed > 0 ? 
                (stats.totalOwnerFound / stats.totalBusinessesProcessed) * 100 : 0;
            
            // Update API usage
            const apiUsage = logEntry.costs.apiUsage;
            stats.apiUsage.free += apiUsage.free;
            stats.apiUsage.lowCost += apiUsage.lowCost;
            stats.apiUsage.expensive += apiUsage.expensive;
            
            stats.lastUpdated = new Date().toISOString();
            
            await fs.writeFile(this.statsFile, JSON.stringify(stats, null, 2));
        } catch (error) {
            console.error('Failed to update aggregate stats:', error);
        }
    }

    getDefaultStats() {
        return {
            totalCampaigns: 0,
            totalBusinessesProcessed: 0,
            totalCost: 0,
            totalOwnerFound: 0,
            totalEmailsFound: 0,
            totalEmailsVerified: 0,
            averageCostPerLead: 0,
            averageSuccessRate: 0,
            apiUsage: { free: 0, lowCost: 0, expensive: 0 },
            lastUpdated: new Date().toISOString()
        };
    }

    generateCampaignId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `campaign_${timestamp}_${random}`;
    }

    async getCampaignsBetweenDates(startDate, endDate) {
        try {
            const campaigns = await this.getRecentCampaigns(1000);
            return campaigns.filter(c => {
                const campaignDate = new Date(c.timestamp);
                return campaignDate >= new Date(startDate) && campaignDate <= new Date(endDate);
            });
        } catch (error) {
            console.error('Failed to get campaigns between dates:', error);
            return [];
        }
    }

    calculateAverageSuccessRateForCampaigns(campaigns) {
        if (campaigns.length === 0) return 0;
        const totalRate = campaigns.reduce((sum, c) => sum + c.performance.successRate, 0);
        return Math.round(totalRate / campaigns.length);
    }

    calculateCostTrends(campaigns) {
        return campaigns.map(c => ({
            date: c.timestamp,
            totalCost: c.costs.totalActualCost,
            costPerLead: c.costs.costPerQualifiedLead
        }));
    }

    calculateQualityTrends(campaigns) {
        return campaigns.map(c => ({
            date: c.timestamp,
            averageGrade: c.results.averageQualityGrade,
            successRate: c.performance.successRate
        }));
    }

    summarizeApiUsageForCampaigns(campaigns) {
        const summary = { free: 0, lowCost: 0, expensive: 0 };
        campaigns.forEach(c => {
            summary.free += c.costs.apiUsage.free;
            summary.lowCost += c.costs.apiUsage.lowCost;
            summary.expensive += c.costs.apiUsage.expensive;
        });
        return summary;
    }
}

module.exports = CampaignLogger;
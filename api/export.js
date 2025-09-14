const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs').promises;

async function exportQualifiedLeads(validatedBusinesses, batchInfo) {
  // CRITICAL: Only export businesses that passed ALL validation
  const qualifiedLeads = validatedBusinesses.filter(business => 
    business.isQualified && 
    business.confidenceScore >= 80
  );

  if (qualifiedLeads.length === 0) {
    throw new Error('No qualified leads found. All businesses failed validation checks.');
  }

  // Ensure exports directory exists
  const exportsDir = path.join(__dirname, '../exports');
  try {
    await fs.mkdir(exportsDir, { recursive: true });
  } catch (error) {
    console.error('Error creating exports directory:', error);
  }

  // Create timestamp for unique filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `ProspectPro-Real-Leads-${timestamp}.csv`;
  const filepath = path.join(exportsDir, filename);

  // Define CSV structure with full transparency
  const csvWriter = createCsvWriter({
    path: filepath,
    header: [
      { id: 'name', title: 'Business Name' },
      { id: 'address', title: 'Address' },
      { id: 'phone', title: 'Phone' },
      { id: 'website', title: 'Website' },
      { id: 'email', title: 'Email' },
      { id: 'confidenceScore', title: 'Confidence Score' },
      { id: 'businessSource', title: 'Business Source' },
      { id: 'emailSource', title: 'Email Source' },
      { id: 'websiteStatus', title: 'Website Status' },
      { id: 'emailDeliverable', title: 'Email Deliverable' },
      { id: 'contactNames', title: 'Contact Names' },
      { id: 'socialLinks', title: 'Social Links' },
      { id: 'businessDescription', title: 'Description' },
      { id: 'validationNotes', title: 'Validation Notes' }
    ]
  });

  // Map validated businesses to CSV format
  const csvData = qualifiedLeads.map(business => ({
    name: business.businessData.name,
    address: business.businessData.address,
    phone: business.businessData.phone,
    website: business.businessData.website,
    email: business.businessData.email,
    confidenceScore: `${business.confidenceScore}%`,
    businessSource: business.sources ? business.sources.join(', ') : 'Unknown',
    emailSource: business.enrichmentData?.emailSource || 'Website Scraping',
    websiteStatus: business.validation.website.accessible ? 'Accessible' : 'Not Accessible',
    emailDeliverable: business.validation.email.deliverable ? 'Yes' : 'No',
    contactNames: business.enrichmentData?.contactNames?.join('; ') || '',
    socialLinks: formatSocialLinks(business.enrichmentData?.socialLinks),
    businessDescription: business.enrichmentData?.businessDescription || '',
    validationNotes: generateValidationNotes(business.validation)
  }));

  // Write CSV file
  await csvWriter.writeRecords(csvData);

  // Generate summary report
  const summary = generateExportSummary(qualifiedLeads, validatedBusinesses, batchInfo);

  console.log(`✅ Export complete: ${qualifiedLeads.length} qualified leads exported to ${filename}`);

  return {
    filename: filename,
    filepath: filepath,
    leadCount: qualifiedLeads.length,
    summary: summary,
    csvData: csvData
  };
}

function formatSocialLinks(socialLinks) {
  if (!socialLinks || Object.keys(socialLinks).length === 0) {
    return '';
  }

  return Object.entries(socialLinks)
    .map(([platform, url]) => `${platform}: ${url}`)
    .join('; ');
}

function generateValidationNotes(validation) {
  const notes = [];
  
  Object.entries(validation).forEach(([field, result]) => {
    if (!result.isValid) {
      notes.push(`${field}: ${result.reason}`);
    }
  });

  return notes.length > 0 ? notes.join('; ') : 'All validations passed';
}

function generateExportSummary(qualifiedLeads, allBusinesses, batchInfo) {
  const totalProcessed = allBusinesses.length;
  const qualificationRate = Math.round((qualifiedLeads.length / totalProcessed) * 100);
  
  const validationStats = {
    totalProcessed: totalProcessed,
    qualifiedLeads: qualifiedLeads.length,
    qualificationRate: `${qualificationRate}%`,
    averageConfidence: calculateAverageConfidence(qualifiedLeads),
    sourceBreakdown: calculateSourceBreakdown(qualifiedLeads),
    validationBreakdown: calculateValidationBreakdown(allBusinesses),
    estimatedCost: calculateEstimatedCost(batchInfo),
    exportDate: new Date().toISOString(),
    batchTemplate: batchInfo.template || 'unknown'
  };

  return validationStats;
}

function calculateAverageConfidence(qualifiedLeads) {
  if (qualifiedLeads.length === 0) return 0;
  
  const total = qualifiedLeads.reduce((sum, lead) => sum + lead.confidenceScore, 0);
  return Math.round(total / qualifiedLeads.length);
}

function calculateSourceBreakdown(qualifiedLeads) {
  const breakdown = {};
  
  qualifiedLeads.forEach(lead => {
    const sources = lead.sources || ['Unknown'];
    sources.forEach(source => {
      breakdown[source] = (breakdown[source] || 0) + 1;
    });
  });

  return breakdown;
}

function calculateValidationBreakdown(allBusinesses) {
  const breakdown = {
    businessName: { passed: 0, failed: 0 },
    address: { passed: 0, failed: 0 },
    phone: { passed: 0, failed: 0 },
    website: { passed: 0, failed: 0 },
    email: { passed: 0, failed: 0 }
  };

  allBusinesses.forEach(business => {
    if (business.validation) {
      Object.entries(business.validation).forEach(([field, result]) => {
        if (breakdown[field]) {
          if (result.isValid) {
            breakdown[field].passed++;
          } else {
            breakdown[field].failed++;
          }
        }
      });
    }
  });

  return breakdown;
}

function calculateEstimatedCost(batchInfo) {
  // Estimate API costs based on usage
  const costs = {
    googlePlaces: (batchInfo.googlePlacesCalls || 0) * 0.032,
    scrapingdog: (batchInfo.websitesScrapped || 0) * 0.002,
    hunterIO: (batchInfo.emailSearches || 0) * 0.04,
    neverBounce: (batchInfo.emailVerifications || 0) * 0.008
  };

  const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
  
  return {
    breakdown: costs,
    total: Math.round(totalCost * 100) / 100, // Round to 2 decimal places
    costPerLead: batchInfo.leadCount > 0 ? Math.round((totalCost / batchInfo.leadCount) * 100) / 100 : 0
  };
}

async function createExportSummaryReport(exportResult) {
  const summaryFilename = `ProspectPro-Summary-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const summaryPath = path.join(path.dirname(exportResult.filepath), summaryFilename);
  
  await fs.writeFile(summaryPath, JSON.stringify(exportResult.summary, null, 2));
  
  return summaryPath;
}

module.exports = {
  exportQualifiedLeads,
  generateExportSummary,
  createExportSummaryReport
};
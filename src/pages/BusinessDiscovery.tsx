import React, { useState } from "react";

const businessCategories = [
  "Professional Services",
  "Financial Services",
  "Healthcare & Medical",
  "Personal Care & Beauty",
  "Home & Property Services",
  "Automotive Services",
  "Food & Dining",
  "Retail & Shopping",
  "Technology & IT Services",
  "Education & Training",
  "Entertainment & Recreation",
  "Hospitality & Lodging",
  "Transportation & Transit",
  "Religious & Community",
  "Government & Public Services",
];

const businessTypesByCategory: Record<string, string[]> = {
  "Automotive Services": [
    "Car Repair",
    "Auto Dealership",
    "Car Wash",
    "Tire Service",
    "Auto Parts Store",
  ],
  "Professional Services": [
    "Law Firm",
    "Accounting Firm",
    "Consulting",
    "Marketing Agency",
    "Real Estate",
  ],
  // Add more categories as needed
};

export const BusinessDiscovery: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState(
    "Automotive Services"
  );
  const [selectedBusinessType, setSelectedBusinessType] =
    useState("Car Repair");
  const [keywords, setKeywords] = useState("");
  const [location, setLocation] = useState("New York, NY");
  const [searchRadius, setSearchRadius] = useState("10 miles");
  const [expandGeography, setExpandGeography] = useState(false);
  const [numberOfLeads, setNumberOfLeads] = useState(3);

  const availableBusinessTypes =
    businessTypesByCategory[selectedCategory] || [];

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 space-y-6">
        {/* Business Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              const types = businessTypesByCategory[e.target.value];
              if (types && types.length > 0) {
                setSelectedBusinessType(types[0]);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {businessCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Business Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Type
          </label>
          <select
            value={selectedBusinessType}
            onChange={(e) => setSelectedBusinessType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {availableBusinessTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Additional Keywords */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Keywords (Optional)
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g., luxury, organic, 24-hour (comma-separated)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Add comma-separated keywords to refine your search
          </p>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., San Francisco, CA or New York, NY"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
          />

          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Radius:
              </label>
              <select
                value={searchRadius}
                onChange={(e) => setSearchRadius(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="5 miles">5 miles</option>
                <option value="10 miles">10 miles</option>
                <option value="25 miles">25 miles</option>
                <option value="50 miles">50 miles</option>
                <option value="100 miles">100 miles</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="expandGeography"
                checked={expandGeography}
                onChange={(e) => setExpandGeography(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="expandGeography"
                className="ml-2 text-sm text-gray-700"
              >
                Expand geography automatically if initial results are limited
              </label>
            </div>
          </div>
        </div>

        {/* Number of Leads */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Leads
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="1"
              max="10"
              value={numberOfLeads}
              onChange={(e) => setNumberOfLeads(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${
                  numberOfLeads * 10
                }%, #e5e7eb ${numberOfLeads * 10}%, #e5e7eb 100%)`,
              }}
            />
            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium min-w-fit">
              {numberOfLeads} leads
            </div>
          </div>
        </div>

        {/* Start Discovery Button */}
        <div className="pt-4">
          <button
            type="button"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            🚀 Search Businesses
          </button>
        </div>
      </div>
    </div>
  );
};

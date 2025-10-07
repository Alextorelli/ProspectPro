import React, { useState } from "react";
import {
  BUSINESS_CATEGORIES,
  BUSINESS_TYPES_BY_CATEGORY,
} from "../constants/businessTaxonomy";

interface MultiSelectBusinessTypesProps {
  selectedCategories: string[];
  selectedBusinessTypes: string[];
  onCategoriesChange: (categories: string[]) => void;
  onBusinessTypesChange: (types: string[]) => void;
}

export const MultiSelectBusinessTypes: React.FC<
  MultiSelectBusinessTypesProps
> = ({
  selectedCategories,
  selectedBusinessTypes,
  onCategoriesChange,
  onBusinessTypesChange,
}) => {
  const [showBusinessTypes, setShowBusinessTypes] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Get available business types based on selected categories
  const availableBusinessTypes = selectedCategories.reduce(
    (acc: string[], category) => {
      const types = BUSINESS_TYPES_BY_CATEGORY[category] || [];
      return [...acc, ...types];
    },
    []
  );

  // Filter business types by search term
  const filteredBusinessTypes = availableBusinessTypes.filter((type) =>
    type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];

    onCategoriesChange(newCategories);

    // Remove business types from deselected categories
    if (!selectedCategories.includes(category)) {
      // Category was added, no need to remove business types
    } else {
      // Category was removed, remove its business types
      const removedCategoryTypes = BUSINESS_TYPES_BY_CATEGORY[category] || [];
      const newBusinessTypes = selectedBusinessTypes.filter(
        (type) => !removedCategoryTypes.includes(type)
      );
      onBusinessTypesChange(newBusinessTypes);
    }
  };

  const handleBusinessTypeToggle = (businessType: string) => {
    const newBusinessTypes = selectedBusinessTypes.includes(businessType)
      ? selectedBusinessTypes.filter((t) => t !== businessType)
      : [...selectedBusinessTypes, businessType];

    onBusinessTypesChange(newBusinessTypes);
  };

  const selectAllInCategory = (category: string) => {
    const categoryTypes = BUSINESS_TYPES_BY_CATEGORY[category] || [];
    const newTypes = [...new Set([...selectedBusinessTypes, ...categoryTypes])];
    onBusinessTypesChange(newTypes);
  };

  const clearCategory = (category: string) => {
    const categoryTypes = BUSINESS_TYPES_BY_CATEGORY[category] || [];
    const newTypes = selectedBusinessTypes.filter(
      (type) => !categoryTypes.includes(type)
    );
    onBusinessTypesChange(newTypes);
  };

  return (
    <div className="space-y-4">
      {/* Business Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Business Categories ({selectedCategories.length} selected)
        </label>
        <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-800">
          <div className="grid grid-cols-2 gap-2">
            {BUSINESS_CATEGORIES.map((category) => {
              const isSelected = selectedCategories.includes(category);
              return (
                <label
                  key={category}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleCategoryToggle(category)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {category}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Business Types */}
      {selectedCategories.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Business Types ({selectedBusinessTypes.length} selected)
            </label>
            <button
              onClick={() => setShowBusinessTypes(!showBusinessTypes)}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              {showBusinessTypes ? "Hide Types" : "Show Types"}
            </button>
          </div>

          {showBusinessTypes && (
            <div className="space-y-3">
              {/* Search */}
              <input
                type="text"
                placeholder="Search business types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              />

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map((category) => (
                  <div key={category} className="flex items-center space-x-1">
                    <button
                      onClick={() => selectAllInCategory(category)}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      All {category}
                    </button>
                    <button
                      onClick={() => clearCategory(category)}
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Clear {category}
                    </button>
                  </div>
                ))}
              </div>

              {/* Business Types List */}
              <div className="max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-800">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {filteredBusinessTypes.map((businessType) => {
                    const isSelected =
                      selectedBusinessTypes.includes(businessType);
                    return (
                      <label
                        key={businessType}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            handleBusinessTypeToggle(businessType)
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {businessType}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {filteredBusinessTypes.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No business types found for "{searchTerm}"
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Summary */}
      {selectedBusinessTypes.length > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Selected:</strong>{" "}
            {selectedBusinessTypes.slice(0, 5).join(", ")}
            {selectedBusinessTypes.length > 5 &&
              ` +${selectedBusinessTypes.length - 5} more`}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from "react";
import { BUSINESS_TYPES_BY_CATEGORY } from "../constants/businessTaxonomy";

interface MultiSelectBusinessTypesProps {
  selectedCategories: string[];
  selectedBusinessTypes: string[];
  onCategoriesChange: (categories: string[]) => void;
  onBusinessTypesChange: (types: string[]) => void;
  disabled?: boolean;
}

export const MultiSelectBusinessTypes: React.FC<
  MultiSelectBusinessTypesProps
> = ({
  selectedCategories,
  selectedBusinessTypes,
  onCategoriesChange,
  onBusinessTypesChange,
  disabled = false,
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleCategoryClick = (category: string) => {
    setExpandedCategory((prev) => (prev === category ? null : category));
  };

  const handleTypeToggle = (type: string) => {
    if (selectedBusinessTypes.includes(type)) {
      onBusinessTypesChange(selectedBusinessTypes.filter((t) => t !== type));
    } else {
      onBusinessTypesChange([...selectedBusinessTypes, type]);
    }
  };

  return (
    <div className="space-y-2">
      {Object.entries(BUSINESS_TYPES_BY_CATEGORY).map(([category, types]) => (
        <div key={category}>
          <button
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md focus:outline-none"
            disabled={disabled}
            type="button"
            onClick={() => handleCategoryClick(category)}
          >
            <span className="font-medium">{category}</span>
            <span className="text-xs text-gray-500">
              {expandedCategory === category ? "▲" : "▼"}
            </span>
          </button>
          {expandedCategory === category && (
            <div className="pl-4 mt-1 space-y-1">
              {types.map((type) => (
                <label key={type} className="flex items-center space-x-2">
                  <input
                    checked={selectedBusinessTypes.includes(type)}
                    disabled={disabled}
                    type="checkbox"
                    onChange={() => handleTypeToggle(type)}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProgressDisplay } from "../components/ProgressDisplay";
import { TierSelector } from "../components/TierSelector";
import { useBusinessDiscovery } from "../hooks/useBusinessDiscovery";
import { ENRICHMENT_TIERS } from "../lib/supabase";

const businessCategories = [
  "Automotive Services",
  "Education & Training",
  "Entertainment & Recreation",
  "Financial Services",
  "Food & Dining",
  "Government & Public Services",
  "Healthcare & Medical",
  "Home & Property Services",
  "Hospitality & Lodging",
  "Personal Care & Beauty",
  "Professional Services",
  "Religious & Community",
  "Retail & Shopping",
  "Technology & IT Services",
  "Transportation & Transit",
];

const businessTypesByCategory: Record<string, string[]> = {
  "Automotive Services": [
    "Auto Body Shop",
    "Auto Detailing",
    "Auto Parts Store",
    "Automotive Glass Service",
    "Car Dealer",
    "Car Rental",
    "Car Repair",
    "Car Wash",
    "Electric Vehicle Charging Station",
    "Gas Station",
    "Motorcycle Dealer",
    "Oil Change Service",
    "Rv Dealer",
    "Smog Check Station",
    "Tire Shop",
    "Towing Service",
    "Transmission Shop",
    "Truck Dealer",
  ],
  "Education & Training": [
    "Art School",
    "Charter School",
    "College",
    "Community College",
    "Cooking School",
    "Dance Studio",
    "Daycare",
    "Driving School",
    "Kindergarten",
    "Language School",
    "Library",
    "Music School",
    "Preschool",
    "Primary School",
    "Private School",
    "Public School",
    "School",
    "Secondary School",
    "Summer Camp Organizer",
    "Technical School",
    "Training Center",
    "Tutoring Center",
    "University",
    "Vocational School",
  ],
  "Entertainment & Recreation": [
    "Amusement Park",
    "Aquarium",
    "Arcade",
    "Arena",
    "Art Gallery",
    "Banquet Hall",
    "Beach",
    "Botanical Garden",
    "Bowling Alley",
    "Casino",
    "Comedy Club",
    "Concert Hall",
    "Convention Center",
    "Escape Room",
    "Event Venue",
    "Fitness Center",
    "Golf Course",
    "Gym",
    "Karaoke Venue",
    "Marina",
    "Mini Golf",
    "Movie Theater",
    "Museum",
    "Night Club",
    "Paintball",
    "Park",
    "Rock Climbing Gym",
    "Ski Resort",
    "Sports Complex",
    "Stadium",
    "Swimming Pool",
    "Tennis Court",
    "Theater",
    "Tourist Attraction",
    "Trampoline Park",
    "Wedding Venue",
    "Yoga Studio",
    "Zoo",
  ],
  "Financial Services": [
    "Atm",
    "Bank",
    "Check Cashing Service",
    "Credit Union",
    "Cryptocurrency Exchange",
    "Financial Planner",
    "Investment Firm",
    "Money Transfer Service",
    "Mortgage Broker",
    "Payday Lender",
    "Stock Broker",
  ],
  "Food & Dining": [
    "Bakery",
    "Bar",
    "Barbecue Restaurant",
    "Brewery",
    "Brunch Restaurant",
    "Buffet",
    "Burger Joint",
    "Cafe",
    "Catering Service",
    "Chinese Restaurant",
    "Cocktail Bar",
    "Coffee Shop",
    "Deli",
    "Dessert Shop",
    "Distillery",
    "Donut Shop",
    "Fast Food Restaurant",
    "Food Court",
    "Food Stand",
    "Food Truck",
    "Ice Cream Shop",
    "Indian Restaurant",
    "Italian Restaurant",
    "Japanese Restaurant",
    "Juice Bar",
    "Meal Delivery",
    "Meal Takeaway",
    "Mexican Restaurant",
    "Pizza Restaurant",
    "Pub",
    "Restaurant",
    "Sandwich Shop",
    "Seafood Restaurant",
    "Smoothie Shop",
    "Steakhouse",
    "Sushi Restaurant",
    "Taco Place",
    "Tea House",
    "Wine Bar",
    "Winery",
  ],
  "Government & Public Services": [
    "City Hall",
    "Consulate",
    "Courthouse",
    "County Office",
    "Dmv",
    "Embassy",
    "Fire Station",
    "Government Office",
    "Municipal Building",
    "Passport Office",
    "Police Station",
    "Post Office",
    "Public Library",
    "Public School",
    "Public Works",
    "Social Services Office",
    "Tax Office",
    "Voter Registration Office",
  ],
  "Healthcare & Medical": [
    "Acupuncture Clinic",
    "Chiropractor",
    "Dental Clinic",
    "Dentist",
    "Doctor",
    "Drugstore",
    "Health Insurance Office",
    "Hospital",
    "Medical Center",
    "Medical Equipment Supplier",
    "Medical Lab",
    "Mental Health Clinic",
    "Occupational Therapist",
    "Optical Clinic",
    "Optometrist",
    "Orthodontist",
    "Pharmacy",
    "Physical Therapy",
    "Physiotherapist",
    "Psychiatrist",
    "Psychologist",
    "Skin Care Clinic",
    "Speech Therapist",
    "Urgent Care",
    "Veterinary Care",
    "Wellness Center",
  ],
  "Home & Property Services": [
    "Appliance Repair",
    "Carpet Cleaning",
    "Cleaning Service",
    "Dry Cleaning",
    "Electrician",
    "Fence Contractor",
    "Flooring Contractor",
    "Gardener",
    "General Contractor",
    "Gutter Service",
    "Handyman",
    "Home Inspector",
    "Hvac Contractor",
    "Landscaping",
    "Laundry",
    "Locksmith",
    "Moving Company",
    "Painter",
    "Pest Control",
    "Plumber",
    "Pool Service",
    "Property Management",
    "Roofing Contractor",
    "Storage",
    "Window Cleaning",
  ],
  "Hospitality & Lodging": [
    "Bed And Breakfast",
    "Boutique Hotel",
    "Campground",
    "Extended Stay Hotel",
    "Guest House",
    "Hostel",
    "Hotel",
    "Inn",
    "Lodge",
    "Motel",
    "Resort",
    "Rv Park",
    "Vacation Rental",
  ],
  "Personal Care & Beauty": [
    "Barber Shop",
    "Beauty Salon",
    "Beautician",
    "Body Art Service",
    "Cosmetics Store",
    "Day Spa",
    "Eyebrow Threading",
    "Facial Spa",
    "Hair Care",
    "Hair Salon",
    "Makeup Artist",
    "Massage",
    "Nail Salon",
    "Piercing Shop",
    "Sauna",
    "Spa",
    "Tanning Studio",
    "Tattoo Parlor",
    "Waxing Salon",
  ],
  "Professional Services": [
    "Accounting",
    "Advertising Agency",
    "Architecture Firm",
    "Attorney",
    "Business Center",
    "Consultant",
    "Corporate Office",
    "Employment Agency",
    "Engineering Office",
    "Financial Advisor",
    "Insurance Agency",
    "Lawyer",
    "Marketing Agency",
    "Notary",
    "Real Estate Agency",
    "Recruiter",
    "Tax Preparation",
  ],
  "Religious & Community": [
    "Cemetery",
    "Church",
    "Civic Organization",
    "Community Center",
    "Crematorium",
    "Funeral Home",
    "Meditation Center",
    "Mosque",
    "Non-Profit Organization",
    "Place Of Worship",
    "Religious Center",
    "Social Club",
    "Spiritual Center",
    "Synagogue",
    "Temple",
  ],
  "Retail & Shopping": [
    "Antique Shop",
    "Art Supply Store",
    "Bicycle Store",
    "Book Store",
    "Boutique",
    "Clothing Store",
    "Convenience Store",
    "Craft Store",
    "Department Store",
    "Discount Store",
    "Dollar Store",
    "Electronics Store",
    "Florist",
    "Furniture Store",
    "Garden Center",
    "Gift Shop",
    "Grocery Store",
    "Hardware Store",
    "Hobby Shop",
    "Home Goods Store",
    "Jewelry Store",
    "Liquor Store",
    "Music Store",
    "Office Supply Store",
    "Optical Store",
    "Outlet Store",
    "Party Supply Store",
    "Pet Store",
    "Second Hand Store",
    "Shoe Store",
    "Shopping Mall",
    "Sporting Goods Store",
    "Supermarket",
    "Thrift Store",
    "Tobacco Shop",
    "Toy Store",
    "Vape Shop",
  ],
  "Technology & IT Services": [
    "App Development",
    "Cell Phone Store",
    "Co-Working Space",
    "Computer Repair",
    "Cybersecurity Firm",
    "Data Center",
    "Internet Cafe",
    "It Services",
    "Managed Services Provider",
    "Software Company",
    "Tech Support",
    "Telecommunications Service Provider",
    "Web Design",
  ],
  "Transportation & Transit": [
    "Airport",
    "Bike Rental",
    "Bus Station",
    "Bus Tour Agency",
    "Car Sharing",
    "Cruise Agency",
    "Ferry Terminal",
    "Limousine Service",
    "Parking Garage",
    "Parking Lot",
    "Rest Area",
    "Ride Share Location",
    "Scooter Rental",
    "Shuttle Service",
    "Subway Station",
    "Taxi Stand",
    "Train Station",
    "Travel Agency",
    "Truck Stop",
  ],
};

export const BusinessDiscovery: React.FC = () => {
  const navigate = useNavigate();
  const {
    startDiscovery,
    isDiscovering,
    progress,
    currentStage,
    cacheStats,
    error,
  } = useBusinessDiscovery();

  const [selectedCategory, setSelectedCategory] = useState(
    "Home & Property Services"
  );
  const [selectedBusinessType, setSelectedBusinessType] =
    useState("Electrician");
  const [keywords, setKeywords] = useState("");
  const [location, setLocation] = useState("New York, NY");
  const [searchRadius, setSearchRadius] = useState("10 miles");
  const [expandGeography, setExpandGeography] = useState(false);
  const [numberOfLeads, setNumberOfLeads] = useState(3);

  // Progressive enrichment tier selection
  const [selectedTier, setSelectedTier] =
    useState<keyof typeof ENRICHMENT_TIERS>("PROFESSIONAL");

  // Navigate to campaign page when discovery starts
  useEffect(() => {
    if (isDiscovering) {
      console.log("🚀 Campaign started, navigating to campaign page...");
      navigate("/campaign");
    }
  }, [isDiscovering, navigate]);

  const availableBusinessTypes =
    businessTypesByCategory[selectedCategory] || [];

  const currentTierConfig = ENRICHMENT_TIERS[selectedTier];
  const estimatedCost = numberOfLeads * currentTierConfig.price;

  const handleSearch = () => {
    if (!location.trim()) {
      alert("Please enter a location");
      return;
    }

    const config = {
      search_terms: `${selectedBusinessType} ${keywords}`.trim(),
      location: location.trim(),
      business_type: selectedBusinessType,
      budget_limit: estimatedCost,
      max_results: numberOfLeads,
      include_email_validation:
        selectedTier === "ENTERPRISE" || selectedTier === "COMPLIANCE",
      include_website_validation: true,
      min_confidence_score: 70,
      chamber_verification: true, // Always enabled based on tier
      trade_association: true, // Always enabled based on tier
      professional_license: true, // Always enabled based on tier
      selectedTier: selectedTier,
    };

    console.log("🚀 Starting campaign:", config);
    startDiscovery(config);
  };

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

        {/* Progressive Enrichment Tier Selection */}
        <TierSelector
          selectedTier={selectedTier}
          onTierChange={setSelectedTier}
          numberOfLeads={numberOfLeads}
        />

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

        {/* Actual Cost Display */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                Actual Cost ({currentTierConfig.name} Tier)
              </h3>
              <div className="text-xs text-gray-600">
                {numberOfLeads} leads × ${currentTierConfig.price} per lead
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                ${estimatedCost.toFixed(2)}
              </div>
              <div className="text-xs text-gray-600">Transparent pricing</div>
            </div>
          </div>
        </div>

        {/* Progress Display */}
        <ProgressDisplay
          isDiscovering={isDiscovering}
          progress={progress}
          currentStage={currentStage}
          cacheStats={cacheStats}
        />

        {/* Start Discovery Button */}
        <div className="pt-4">
          <button
            type="button"
            onClick={handleSearch}
            disabled={isDiscovering}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDiscovering ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Running Campaign ({progress}%)
              </>
            ) : (
              "Run Campaign"
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Discovery Failed
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    {error instanceof Error ? error.message : String(error)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

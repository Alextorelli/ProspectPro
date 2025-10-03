import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBusinessDiscovery } from "../hooks/useBusinessDiscovery";

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
  "Professional Services": [
    "Accounting",
    "Lawyer",
    "Attorney",
    "Consultant",
    "Real Estate Agency",
    "Insurance Agency",
    "Corporate Office",
    "Business Center",
    "Financial Advisor",
    "Tax Preparation",
    "Notary",
    "Employment Agency",
    "Marketing Agency",
    "Advertising Agency",
    "Architecture Firm",
    "Engineering Office",
    "Recruiter",
  ],
  "Financial Services": [
    "Bank",
    "Credit Union",
    "Atm",
    "Mortgage Broker",
    "Investment Firm",
    "Stock Broker",
    "Cryptocurrency Exchange",
    "Check Cashing Service",
    "Money Transfer Service",
    "Payday Lender",
    "Financial Planner",
  ],
  "Healthcare & Medical": [
    "Doctor",
    "Dentist",
    "Hospital",
    "Pharmacy",
    "Drugstore",
    "Chiropractor",
    "Physiotherapist",
    "Dental Clinic",
    "Medical Lab",
    "Veterinary Care",
    "Wellness Center",
    "Skin Care Clinic",
    "Optical Clinic",
    "Mental Health Clinic",
    "Urgent Care",
    "Medical Center",
    "Health Insurance Office",
    "Medical Equipment Supplier",
    "Optometrist",
    "Orthodontist",
    "Psychologist",
    "Psychiatrist",
    "Acupuncture Clinic",
    "Physical Therapy",
    "Occupational Therapist",
    "Speech Therapist",
  ],
  "Personal Care & Beauty": [
    "Hair Salon",
    "Hair Care",
    "Beauty Salon",
    "Barber Shop",
    "Nail Salon",
    "Spa",
    "Massage",
    "Beautician",
    "Makeup Artist",
    "Body Art Service",
    "Tanning Studio",
    "Sauna",
    "Tattoo Parlor",
    "Piercing Shop",
    "Waxing Salon",
    "Eyebrow Threading",
    "Cosmetics Store",
    "Day Spa",
    "Facial Spa",
  ],
  "Home & Property Services": [
    "Electrician",
    "Plumber",
    "Painter",
    "Roofing Contractor",
    "General Contractor",
    "Locksmith",
    "Moving Company",
    "Laundry",
    "Dry Cleaning",
    "Storage",
    "Hvac Contractor",
    "Landscaping",
    "Pest Control",
    "Cleaning Service",
    "Home Inspector",
    "Flooring Contractor",
    "Handyman",
    "Property Management",
    "Gardener",
    "Pool Service",
    "Window Cleaning",
    "Carpet Cleaning",
    "Appliance Repair",
    "Fence Contractor",
    "Gutter Service",
  ],
  "Automotive Services": [
    "Car Repair",
    "Car Wash",
    "Car Dealer",
    "Car Rental",
    "Gas Station",
    "Electric Vehicle Charging Station",
    "Auto Parts Store",
    "Tire Shop",
    "Auto Body Shop",
    "Motorcycle Dealer",
    "Truck Dealer",
    "Rv Dealer",
    "Automotive Glass Service",
    "Oil Change Service",
    "Towing Service",
    "Auto Detailing",
    "Smog Check Station",
    "Transmission Shop",
  ],
  "Food & Dining": [
    "Restaurant",
    "Cafe",
    "Bakery",
    "Bar",
    "Fast Food Restaurant",
    "Pizza Restaurant",
    "Chinese Restaurant",
    "Mexican Restaurant",
    "Italian Restaurant",
    "Japanese Restaurant",
    "Indian Restaurant",
    "Meal Delivery",
    "Meal Takeaway",
    "Catering Service",
    "Pub",
    "Wine Bar",
    "Cocktail Bar",
    "Coffee Shop",
    "Ice Cream Shop",
    "Food Court",
    "Donut Shop",
    "Deli",
    "Steakhouse",
    "Sushi Restaurant",
    "Seafood Restaurant",
    "Burger Joint",
    "Taco Place",
    "Food Truck",
    "Brewery",
    "Distillery",
    "Winery",
    "Juice Bar",
    "Smoothie Shop",
    "Tea House",
    "Dessert Shop",
    "Sandwich Shop",
    "Barbecue Restaurant",
    "Brunch Restaurant",
    "Buffet",
    "Food Stand",
  ],
  "Retail & Shopping": [
    "Clothing Store",
    "Shoe Store",
    "Electronics Store",
    "Furniture Store",
    "Home Goods Store",
    "Jewelry Store",
    "Book Store",
    "Gift Shop",
    "Department Store",
    "Shopping Mall",
    "Supermarket",
    "Grocery Store",
    "Convenience Store",
    "Pet Store",
    "Sporting Goods Store",
    "Bicycle Store",
    "Toy Store",
    "Hardware Store",
    "Garden Center",
    "Liquor Store",
    "Music Store",
    "Art Supply Store",
    "Office Supply Store",
    "Optical Store",
    "Antique Shop",
    "Thrift Store",
    "Hobby Shop",
    "Vape Shop",
    "Tobacco Shop",
    "Florist",
    "Craft Store",
    "Party Supply Store",
    "Dollar Store",
    "Discount Store",
    "Outlet Store",
    "Boutique",
    "Second Hand Store",
  ],
  "Technology & IT Services": [
    "Cell Phone Store",
    "Telecommunications Service Provider",
    "Internet Cafe",
    "Computer Repair",
    "It Services",
    "Software Company",
    "Data Center",
    "Co-Working Space",
    "Tech Support",
    "Web Design",
    "App Development",
    "Cybersecurity Firm",
    "Managed Services Provider",
  ],
  "Education & Training": [
    "School",
    "University",
    "Primary School",
    "Secondary School",
    "Preschool",
    "Library",
    "Summer Camp Organizer",
    "Tutoring Center",
    "Vocational School",
    "College",
    "Driving School",
    "Language School",
    "Music School",
    "Art School",
    "Dance Studio",
    "Cooking School",
    "Training Center",
    "Daycare",
    "Kindergarten",
    "Charter School",
    "Private School",
    "Public School",
    "Community College",
    "Technical School",
  ],
  "Entertainment & Recreation": [
    "Event Venue",
    "Wedding Venue",
    "Banquet Hall",
    "Movie Theater",
    "Bowling Alley",
    "Amusement Park",
    "Casino",
    "Night Club",
    "Tourist Attraction",
    "Museum",
    "Zoo",
    "Aquarium",
    "Park",
    "Sports Complex",
    "Gym",
    "Fitness Center",
    "Yoga Studio",
    "Golf Course",
    "Tennis Court",
    "Swimming Pool",
    "Arcade",
    "Karaoke Venue",
    "Comedy Club",
    "Theater",
    "Concert Hall",
    "Art Gallery",
    "Botanical Garden",
    "Beach",
    "Ski Resort",
    "Marina",
    "Stadium",
    "Arena",
    "Convention Center",
    "Escape Room",
    "Paintball",
    "Trampoline Park",
    "Mini Golf",
    "Rock Climbing Gym",
  ],
  "Hospitality & Lodging": [
    "Hotel",
    "Motel",
    "Resort",
    "Bed And Breakfast",
    "Hostel",
    "Vacation Rental",
    "Campground",
    "Rv Park",
    "Inn",
    "Lodge",
    "Extended Stay Hotel",
    "Boutique Hotel",
    "Guest House",
  ],
  "Transportation & Transit": [
    "Airport",
    "Train Station",
    "Bus Station",
    "Subway Station",
    "Taxi Stand",
    "Parking Lot",
    "Parking Garage",
    "Ferry Terminal",
    "Bike Rental",
    "Scooter Rental",
    "Limousine Service",
    "Shuttle Service",
    "Travel Agency",
    "Bus Tour Agency",
    "Cruise Agency",
    "Car Sharing",
    "Ride Share Location",
    "Truck Stop",
    "Rest Area",
  ],
  "Religious & Community": [
    "Church",
    "Mosque",
    "Synagogue",
    "Temple",
    "Religious Center",
    "Community Center",
    "Non-Profit Organization",
    "Social Club",
    "Civic Organization",
    "Funeral Home",
    "Cemetery",
    "Crematorium",
    "Place Of Worship",
    "Spiritual Center",
    "Meditation Center",
  ],
  "Government & Public Services": [
    "City Hall",
    "Courthouse",
    "Police Station",
    "Fire Station",
    "Post Office",
    "Embassy",
    "Consulate",
    "Dmv",
    "Public Library",
    "Public School",
    "Government Office",
    "Social Services Office",
    "Municipal Building",
    "County Office",
    "Public Works",
    "Tax Office",
    "Passport Office",
    "Voter Registration Office",
  ],
};

export const BusinessDiscovery: React.FC = () => {
  const navigate = useNavigate();
  const { startDiscovery, isDiscovering, progress, error, data } =
    useBusinessDiscovery();

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

  // Verification options
  const [chamberVerification, setChamberVerification] = useState(true);
  const [tradeAssociation, setTradeAssociation] = useState(true);
  const [professionalLicense, setProfessionalLicense] = useState(true);
  const [apolloDiscovery, setApolloDiscovery] = useState(false);

  // Navigate to results when discovery is successful
  useEffect(() => {
    if (data && data.businesses && data.businesses.length > 0) {
      console.log("✅ Discovery completed, navigating to results...");
      navigate("/results");
    }
  }, [data, navigate]);

  const availableBusinessTypes =
    businessTypesByCategory[selectedCategory] || [];

  const handleSearch = () => {
    if (!location.trim()) {
      alert("Please enter a location");
      return;
    }

    const config = {
      search_terms: `${selectedBusinessType} ${keywords}`.trim(),
      location: location.trim(),
      business_type: selectedBusinessType,
      budget_limit: apolloDiscovery
        ? numberOfLeads * 1.05
        : numberOfLeads * 0.14,
      max_results: numberOfLeads, // Use exact number requested
      include_email_validation: apolloDiscovery,
      include_website_validation: true,
      min_confidence_score: 70,
      chamber_verification: chamberVerification,
      trade_association: tradeAssociation,
      professional_license: professionalLicense,
    };

    console.log("🚀 Starting discovery with config:", config);
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

        {/* Verification Sources */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Contact Verification Sources
          </label>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="chamberOfCommerce"
                checked={chamberVerification}
                onChange={(e) => setChamberVerification(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="chamberOfCommerce"
                className="ml-2 text-sm text-gray-700"
              >
                Chamber of Commerce Directory{" "}
                <span className="text-green-600 font-medium">(+15 pts)</span>
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="tradeAssociation"
                checked={tradeAssociation}
                onChange={(e) => setTradeAssociation(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="tradeAssociation"
                className="ml-2 text-sm text-gray-700"
              >
                Trade Association Membership{" "}
                <span className="text-green-600 font-medium">(+15-20 pts)</span>
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="professionalLicense"
                checked={professionalLicense}
                onChange={(e) => setProfessionalLicense(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="professionalLicense"
                className="ml-2 text-sm text-gray-700"
              >
                Professional License Verification{" "}
                <span className="text-green-600 font-medium">(+25 pts)</span>
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="apolloDiscovery"
                checked={apolloDiscovery}
                onChange={(e) => setApolloDiscovery(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="apolloDiscovery"
                className="ml-2 text-sm text-gray-700"
              >
                Apollo Executive Discovery{" "}
                <span className="text-green-600 font-medium">
                  (+30 pts, $1.00 per contact)
                </span>
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

        {/* Verification Sources */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Verification Sources
          </label>
          <div className="space-y-4">
            {/* Chamber of Commerce */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Chamber of Commerce Verification
                </div>
                <div className="text-xs text-gray-500">
                  Validate membership and contact details from chamber
                  directories
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Auto</span>
                <span className="text-xs font-medium text-green-600">
                  +15 pts
                </span>
              </div>
            </div>

            {/* Trade Association */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Trade Association Verification
                </div>
                <div className="text-xs text-gray-500">
                  Cross-reference with industry association directories (Spa,
                  Beauty, Professional)
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Auto</span>
                <span className="text-xs font-medium text-green-600">
                  +15-20 pts
                </span>
              </div>
            </div>

            {/* Professional License */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Professional License Verification
                </div>
                <div className="text-xs text-gray-500">
                  Verify with state licensing boards (CPA, Healthcare, Legal)
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Auto</span>
                <span className="text-xs font-medium text-green-600">
                  +25 pts
                </span>
              </div>
            </div>

            {/* Apollo Discovery */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-200">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  Apollo Owner/Executive Discovery
                </div>
                <div className="text-xs text-gray-500">
                  Direct owner and executive email verification ($1.00 per
                  verified contact)
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="apolloDiscovery"
                  checked={apolloDiscovery}
                  onChange={(e) => setApolloDiscovery(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-xs text-blue-600 font-medium">
                  Premium
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-600">
            &gt; Find verified owner and executive contacts with email/LinkedIn
            profiles $1.00 per verified contact +30 confidence boost
          </div>
        </div>

        {/* Estimated Cost */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Estimated Cost
          </h3>
          <div className="text-2xl font-bold text-gray-900">
            $
            {apolloDiscovery
              ? (numberOfLeads * 1.05).toFixed(2)
              : (numberOfLeads * 0.14).toFixed(2)}
          </div>
        </div>

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
                Discovering ({progress}%)
              </>
            ) : (
              "🚀 Search Businesses"
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

import { Link } from "react-router-dom";
import { locationData } from "../../Data/locations";

const LocationsMapper: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Browse by Location</h1>
          <p className="text-gray-600">Select a country, state, or city to view cosplay collaborations in that area</p>
        </div>

        {Object.entries(locationData.countries).map(([country, countryData]) => (
          <div key={country} className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 pb-3 border-b-2 border-purple-200">
              {country}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(countryData.states).map(([state, cities]) => (
                <div key={state} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <Link 
                    to={`/places/${encodeURIComponent(country)}/${encodeURIComponent(state)}`}
                    className="block mb-4"
                  >
                    <h3 className="text-xl font-semibold text-purple-700 hover:text-purple-800 transition-colors mb-3 flex items-center gap-2">
                      <span className="text-2xl">📍</span>
                      {state}
                    </h3>
                  </Link>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 mb-2">Cities:</p>
                    <div className="flex flex-wrap gap-2">
                      {cities.map((city) => (
                        <Link
                          key={city}
                          to={`/places/${encodeURIComponent(country)}/${encodeURIComponent(state)}/${encodeURIComponent(city)}`}
                          className="inline-block px-4 py-2 bg-white border border-purple-300 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-50 hover:border-purple-400 hover:shadow-md transition-all duration-200"
                        >
                          {city}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocationsMapper;

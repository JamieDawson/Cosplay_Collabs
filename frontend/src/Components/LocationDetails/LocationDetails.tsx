import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import InstagramComponent from "../InstagramComponent/InstagramComponent.component";
import Masonry from "react-masonry-css";

interface Ad {
  _id: string;
  id: number;
  user_id: string;
  title: string;
  description: string;
  country: string;
  state: string;
  city: string;
  instagram_post_url: string;
  keywords: string[];
  created_at: string;
}

const LocationDetails: React.FC = () => {
  const { country, state, city } = useParams<{
    country: string;
    state: string;
    city: string;
  }>();

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:3000/api/ads/${country}/${state}/${city}`
        );
        const data = await response.json();

        if (data.success) {
          setAds(data.data);
        }
      } catch (error) {
        console.error("Error fetching ads:", error);
      } finally {
        setLoading(false);
      }
    };

    if (country && state && city) {
      fetchAds();
    }
  }, [country, state, city]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Details for {city}, {state}, {country}
            </h1>
            <Link to="/places">
              <button
                type="button"
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Back to Places
              </button>
            </Link>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-xl text-gray-600">Loading ads...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Details for {city}, {state}, {country}
            </h1>
            <Link to="/places">
              <button
                type="button"
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Back to Places
              </button>
            </Link>
          </div>

          {ads.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <p className="text-xl text-gray-600">No ads found for {city}.</p>
            </div>
          ) : (
            <Masonry
              breakpointCols={{ default: 3, 1024: 3, 768: 2, 640: 1 }}
              className="my-masonry-grid"
              columnClassName="my-masonry-grid_column"
            >
              {ads.map((ad) => (
                <InstagramComponent
                  key={ad.id.toString()}
                  ad={ad}
                  onDelete={() => {}}
                />
              ))}
            </Masonry>
          )}
        </div>
      </div>
    </>
  );
};

export default LocationDetails;

/*
I need to run a query to get the ads for this location.

SQL example:
SELECT * FROM ads
WHERE country = 'USA' AND state = 'CA' AND city = 'San Francisco'

*/

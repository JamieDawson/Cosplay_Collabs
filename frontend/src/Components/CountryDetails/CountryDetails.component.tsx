import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import InstagramComponent from "../InstagramComponent/InstagramComponent.component";
import Masonry from "react-masonry-css";
import { apiUrl } from "../../config/api";

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

const CountryDetails: React.FC = () => {
  const { country } = useParams<{ country: string }>();
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    const fetchAds = async () => {
      if (!country) return;
      try {
        const response = await fetch(
          apiUrl(`/api/ads/by-country/${encodeURIComponent(country)}`),
        );
        const data = await response.json();
        if (data.success) {
          setAds(data.data);
        }
      } catch (error) {
        console.error("Error fetching ads:", error);
      }
    };

    fetchAds();
  }, [country]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            All ads for {country}
          </h1>
        </div>

        {ads.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-xl text-gray-600">No ads found for {country}.</p>
          </div>
        ) : (
          <Masonry
            breakpointCols={{ default: 3, 1024: 3, 768: 2, 640: 1 }}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
          >
            {ads.map((ad) => (
              <InstagramComponent key={ad.id.toString()} ad={ad} />
            ))}
          </Masonry>
        )}
      </div>
    </div>
  );
};

export default CountryDetails;

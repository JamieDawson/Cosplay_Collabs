import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import InstagramComponent from "../../Components/InstagramComponent/InstagramComponent.component";
import Masonry from "react-masonry-css";

interface Ad {
  id: number;
  user_id: string;
  title: string;
  description: string;
  instagram_post_url: string;
  keywords: string[];
  country?: string;
  state?: string;
  city?: string;
}

// ✅ Normalize tag globally
const normalizeTag = (tag: string) => tag.toLowerCase().replace(/\s+/g, "");

const TagsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryKeyword = searchParams.get("q") || "";
  const [typedTag, setTypedTag] = useState(queryKeyword);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAds = async () => {
      if (!queryKeyword) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const cleanTag = normalizeTag(decodeURIComponent(queryKeyword));

      try {
        const response = await fetch(
          `http://localhost:3000/api/ads/ads-by-tag/${cleanTag}`
        );
        const json = await response.json();
        setAds(json.data || []);
      } catch (error) {
        console.error("Error fetching ads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [queryKeyword]);

  const handleTagChange = (value: string) => {
    setTypedTag(value);
  };

  const lookupTag = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeTag(typedTag);
    setSearchParams({ q: normalized });
  };

  // ✅ When a tag is clicked, update search and input field
  const handleTagClick = (tag: string) => {
    setTypedTag(tag); // Display original tag
    const normalized = normalizeTag(tag);
    setSearchParams({ q: normalized }); // Trigger search
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Tags Page</h2>
          {queryKeyword && (
            <h3 className="text-xl text-gray-600">
              Selected keyword: {decodeURIComponent(queryKeyword)}
            </h3>
          )}
        </div>

        <form
          onSubmit={lookupTag}
          className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <input
              value={typedTag}
              onChange={(e) => handleTagChange(e.target.value)}
              placeholder="Search by tag"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm md:text-base"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm md:text-base"
            >
              Search Tag
            </button>
          </div>
        </form>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-xl text-gray-600">Loading ads...</p>
            </div>
          </div>
        ) : ads.length > 0 ? (
          <Masonry
            breakpointCols={{ default: 3, 1024: 3, 768: 2, 640: 1 }}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
          >
            {ads.map((ad) => (
              <InstagramComponent
                key={ad.id.toString()}
                ad={ad}
                onTagClick={handleTagClick}
              />
            ))}
          </Masonry>
        ) : queryKeyword ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-xl text-gray-600">No ads found for this tag.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TagsPage;

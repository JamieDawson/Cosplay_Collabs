import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useS3Image } from "../../hooks/useS3Image";
import { InstagramEmbed } from "react-social-media-embed";

interface Ad {
  _id?: string;
  id: number;
  user_id: string;
  title: string;
  description: string;
  instagram_post_url: string; // Stores S3 image key/fileName, Instagram URL, or JSON array of images
  keywords: string[];
}

/**
 * Check if a string is an Instagram URL (legacy data)
 */
const isInstagramUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return url.includes("instagram.com") || (url.startsWith("http://") && !url.includes("s3.")) || (url.startsWith("https://") && !url.includes("s3."));
};

/**
 * Parse images from instagram_post_url field
 * Can be: string (single image) or JSON array (multiple images)
 */
const parseImages = (instagramPostUrl: string): string[] => {
  if (!instagramPostUrl) return [];
  
  // Try to parse as JSON array
  try {
    const parsed = JSON.parse(instagramPostUrl);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Not JSON, treat as single string
  }
  
  // Single image (string)
  return [instagramPostUrl];
};

interface InstagramComponentProps {
  ad: Ad;
  onDelete?: (deletedId: number) => void; // Optional - defaults to no-op
  onTagClick?: (tag: string) => void; // ✅ optional prop
}

// Default no-op function - stable reference, doesn't create new function on each render
const defaultOnDelete = () => {
  // No-op: deletion handled internally, parent doesn't need to update
};

const InstagramComponent: React.FC<InstagramComponentProps> = ({
  ad,
  onDelete = defaultOnDelete,
  onTagClick,
}) => {
  const { user } = useAuth0();
  const navigate = useNavigate();
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [confirmDeletedPopup, setConfirmDeletedPopup] = useState(false);
  const [adToDelete, setAdToDelete] = useState<number | null>(null);
  
  // Parse images from instagram_post_url (can be single string or JSON array)
  const images = useMemo(() => parseImages(ad.instagram_post_url), [ad.instagram_post_url]);
  
  // For backward compatibility: if single image, use existing hook
  const singleImage = images.length === 1 ? images[0] : null;
  const { imageUrl: singleImageUrl, loading: singleImageLoading, error: singleImageError } = useS3Image(
    singleImage && !isInstagramUrl(singleImage) ? singleImage : null
  );

  const goToUpdateForm = (ad: Ad) => {
    navigate("/update-post", { state: { ad } });
  };

  const goToTagPage = (keyword: string) => {
    if (onTagClick) {
      onTagClick(keyword); // ✅ Notify parent
    } else {
      const encodedKeyword = encodeURIComponent(keyword);
      navigate(`/tags-page?q=${encodedKeyword}`);
    }
  };

  const handleDeleteAd = async (id: number) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/users/delete/${id}`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();
      if (data.success) {
        setShowDeletePopup(false);
        setConfirmDeletedPopup(true);
        setAdToDelete(id);
      } else {
        console.error("Delete failed:", data.message);
      }
    } catch (error) {
      console.error("Error deleting ad:", error);
    }
  };

  const handleConfirmDeletedPopup = () => {
    setConfirmDeletedPopup(false);
    if (adToDelete !== null) {
      onDelete(adToDelete);
      setAdToDelete(null);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col w-full max-w-sm transition-transform hover:scale-[1.02] hover:shadow-xl">
        {user?.sub === ad.user_id && (
          <div className="flex gap-2 p-3 justify-end">
            <button
              onClick={() => setShowDeletePopup(true)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
            >
              Delete
            </button>
            <button
              onClick={() => goToUpdateForm(ad)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              Update
            </button>
          </div>
        )}

        <div className="flex justify-center items-center p-1 bg-gradient-to-br from-purple-50 to-pink-50 min-h-[400px]">
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center w-full h-full text-gray-500">
              <p className="text-sm">No images available</p>
            </div>
          ) : images.length === 1 ? (
            // Single image display (backward compatible)
            isInstagramUrl(images[0]) ? (
              // Legacy Instagram embed for old posts
              <div className="w-full max-w-[350px] transform scale-95 origin-center">
                <InstagramEmbed url={images[0]} />
              </div>
            ) : singleImageLoading ? (
              <div className="flex flex-col items-center justify-center w-full h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                <p className="text-gray-600">Loading image...</p>
              </div>
            ) : singleImageError || !singleImageUrl ? (
              <div className="flex flex-col items-center justify-center w-full h-full text-gray-500">
                <p className="text-sm">Failed to load image</p>
              </div>
            ) : (
              <img
                src={singleImageUrl}
                alt={ad.title}
                className="w-full max-w-[350px] h-auto object-contain rounded-lg"
                onError={(e) => {
                  console.error("Image failed to load:", singleImageUrl);
                  e.currentTarget.style.display = "none";
                }}
              />
            )
          ) : (
            // Multiple images: display in a grid/carousel
            <div className="w-full max-w-[350px] grid grid-cols-2 gap-2 p-2">
              {images.map((image, index) => (
                <ImageItem key={index} image={image} title={ad.title} index={index} />
              ))}
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col gap-3">
          <h3 className="text-xl font-bold text-gray-800 text-center">
            {ad.title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed text-center">
            {ad.description}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {ad.keywords.map((keyword, index) =>
              keyword.length > 0 ? (
                <button
                  onClick={() => goToTagPage(keyword)}
                  key={index}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors"
                >
                  #{keyword}
                </button>
              ) : null
            )}
          </div>
        </div>
      </div>

      {showDeletePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <p className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Are you sure you want to delete this ad?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handleDeleteAd(ad.id)}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeletePopup(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeletedPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <p className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Your ad has been deleted!
            </p>
            <div className="flex justify-center">
              <button
                onClick={handleConfirmDeletedPopup}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Component to display a single image (S3 or Instagram)
 */
const ImageItem: React.FC<{ image: string; title: string; index: number }> = ({ image, title, index }) => {
  const isInstagram = isInstagramUrl(image);
  const { imageUrl, loading, error } = useS3Image(
    !isInstagram ? image : null
  );

  if (isInstagram) {
    return (
      <div className="w-full aspect-square transform scale-95 origin-center">
        <InstagramEmbed url={image} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full aspect-square flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="w-full aspect-square flex items-center justify-center bg-gray-100 rounded-lg text-gray-500 text-xs">
        Failed to load
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={`${title} - Image ${index + 1}`}
      className="w-full h-full object-cover rounded-lg"
      onError={(e) => {
        console.error("Image failed to load:", imageUrl);
        e.currentTarget.style.display = "none";
      }}
    />
  );
};

export default InstagramComponent;

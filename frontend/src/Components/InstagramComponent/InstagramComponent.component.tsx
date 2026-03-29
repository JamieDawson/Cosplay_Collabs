import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { InstagramEmbed } from "react-social-media-embed";
import { apiUrl } from "../../config/api";

interface Ad {
  _id?: string;
  id: number;
  user_id: string;
  title: string;
  description: string;
  instagram_post_url: string; // Stores Instagram URL or JSON array of Instagram URLs
  keywords: string[];
  username?: string | null; // Optional username for linking to profile
  country?: string | null;
  state?: string | null;
  city?: string | null;
}

/**
 * Parse Instagram URLs from instagram_post_url field
 * Can be: string (single URL) or JSON array (multiple URLs)
 */
const parseInstagramUrls = (instagramPostUrl: string): string[] => {
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
  
  // Single URL (string)
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
  
  // Parse Instagram URLs from instagram_post_url (can be single string or JSON array)
  const instagramUrls = parseInstagramUrls(ad.instagram_post_url);

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

  const goToUserProfile = () => {
    if (ad.username && ad.username.trim().length > 0) {
      navigate(`/profile/${encodeURIComponent(ad.username.trim())}`);
    }
  };

  const goToStatePage = () => {
    if (ad.country && ad.state) {
      navigate(
        `/places/${encodeURIComponent(ad.country)}/${encodeURIComponent(ad.state)}`
      );
    }
  };

  const goToCityPage = () => {
    if (ad.country && ad.state && ad.city) {
      navigate(
        `/places/${encodeURIComponent(ad.country)}/${encodeURIComponent(ad.state)}/${encodeURIComponent(ad.city)}`
      );
    }
  };

  const handleDeleteAd = async (id: number) => {
    try {
      const response = await fetch(apiUrl(`/api/users/delete/${id}`), {
        method: "DELETE",
      });
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
      <article className="surface-card-strong flex w-full max-w-sm flex-col overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-brand-lg">
        <div className="flex items-center justify-between gap-2 p-3">
          <div className="flex items-center gap-2">
            {ad.username && ad.username.trim().length > 0 && (
              <button
                type="button"
                onClick={goToUserProfile}
                aria-label={`View profile for ${ad.username}`}
                className="rounded-full bg-gradient-to-r from-sky-100 to-pink-100 px-3 py-1.5 text-xs font-semibold text-slate-800 ring-1 ring-sky-200/60 transition-colors hover:from-sky-200 hover:to-pink-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
              >
                @{ad.username}
              </button>
            )}
          </div>
          {user?.sub === ad.user_id && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeletePopup(true)}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => goToUpdateForm(ad)}
                className="rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-sky-400/30 transition-all hover:from-sky-400 hover:to-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
              >
                Update
              </button>
            </div>
          )}
        </div>

        <div className="flex min-h-[400px] items-center justify-center bg-gradient-to-br from-sky-50 via-white to-pink-50 p-1">
          {instagramUrls.length === 0 ? (
            <div className="flex flex-col items-center justify-center w-full h-full text-gray-500">
              <p className="text-sm">No Instagram post available</p>
            </div>
          ) : instagramUrls.length === 1 ? (
            // Single Instagram embed
            <div className="w-full max-w-[350px] transform scale-95 origin-center">
              <InstagramEmbed url={instagramUrls[0]} />
            </div>
          ) : (
            // Multiple Instagram embeds: display in a grid
            <div className="w-full max-w-[350px] grid grid-cols-2 gap-2 p-2">
              {instagramUrls.map((url, index) => (
                <div key={index} className="w-full aspect-square transform scale-95 origin-center">
                  <InstagramEmbed url={url} />
                </div>
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
                  type="button"
                  onClick={() => goToTagPage(keyword)}
                  key={index}
                  aria-label={`View posts tagged ${keyword}`}
                  className="rounded-full bg-gradient-to-r from-fuchsia-100 to-pink-100 px-3 py-1 text-xs font-semibold text-fuchsia-800 ring-1 ring-pink-200/60 transition-colors hover:from-fuchsia-200 hover:to-pink-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 focus-visible:ring-offset-2"
                >
                  #{keyword}
                </button>
              ) : null
            )}
          </div>
          {(ad.state || ad.city) && (
            <div className="flex flex-wrap gap-2 justify-center pt-2 border-t border-gray-100">
              {ad.state && (
                <button
                  type="button"
                  onClick={goToStatePage}
                  aria-label={`Browse ads in ${ad.state}`}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                >
                  {ad.state}
                </button>
              )}
              {ad.city && (
                <button
                  type="button"
                  onClick={goToCityPage}
                  aria-label={`Browse ads in ${ad.city}`}
                  className="rounded-lg bg-sky-100 px-3 py-1.5 text-xs font-medium text-sky-700 transition-colors hover:bg-sky-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
                >
                  {ad.city}
                </button>
              )}
            </div>
          )}
        </div>
      </article>

      {showDeletePopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-ad-heading"
            className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
          >
            <p
              id="delete-ad-heading"
              className="mb-4 text-center text-lg font-semibold text-gray-800"
            >
              Are you sure you want to delete this ad?
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => handleDeleteAd(ad.id)}
                className="rounded-lg bg-red-500 px-6 py-2 font-medium text-white transition-colors hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setShowDeletePopup(false)}
                className="rounded-lg bg-gray-300 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeletedPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="deleted-ad-heading"
            className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
          >
            <p
              id="deleted-ad-heading"
              className="mb-4 text-center text-lg font-semibold text-gray-800"
            >
              Your ad has been deleted!
            </p>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleConfirmDeletedPopup}
                className="rounded-lg bg-blue-500 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
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

export default InstagramComponent;

import { InstagramEmbed } from "react-social-media-embed";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface Ad {
  _id?: string;
  id: number;
  user_id: string;
  title: string;
  description: string;
  instagram_post_url: string;
  keywords: string[];
}

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

        <div className="flex justify-center items-center p-1 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="w-full max-w-[350px] transform scale-95 origin-center">
            <InstagramEmbed url={ad.instagram_post_url} />
          </div>
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

export default InstagramComponent;

// ProfilePage.tsx
import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate, useParams } from "react-router-dom";
import InstagramComponent from "../../Components/InstagramComponent/InstagramComponent.component";
import axios from "axios";
import { useUser } from "../../UserContext";
import Masonry from "react-masonry-css";
import { useToast } from "../../hooks/useToast";

// Define the interface for custom user data from your PostgreSQL DB
interface CustomUserData {
  id: number;
  auth0_id: string;
  email: string;
  full_name: string;
  username: string | null;
  created_at: string;
  updated_at: string;
}

// Define interface for Ads
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

function Profile() {
  const { logout, isAuthenticated, user } = useAuth0(); // Auth0 context
  const { setUsername } = useUser(); // Our global context for username
  const { username } = useParams<{ username: string }>(); // Username from URL params
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  const [ads, setProfileAds] = useState<Ad[]>([]);
  const [customUserData, setCustomUserData] = useState<CustomUserData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [finalWarningPopup, setFinalWarningPopup] = useState(false);
  const [popUpAfterDeleting, setPopUpAfterDeleting] = useState(false);

  /**
   * Fetch user data based on the username in URL
   * We'll query PostgreSQL by username, which should be indexed for performance.
   * - If user is viewing their own profile, we'll also update the context username.
   */
  useEffect(() => {
    if (!username) return;

    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/users/username/${encodeURIComponent(
            username
          )}`
        );
        const userData: CustomUserData = response.data.user;
        setCustomUserData(userData);

        // Only set username if logged in and it's the user's own profile
        if (isAuthenticated && user && userData?.auth0_id === user.sub) {
          setUsername(userData.username || "");
        }
      } catch (error: any) {
        console.error("Error fetching custom user data:", error);

        // If not found and it's the logged-in user's own profile
        if (
          error.response?.status === 404 &&
          isAuthenticated &&
          user?.nickname === username
        ) {
          navigate("/complete-profile");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isAuthenticated, user, username, navigate, setUsername]);

  /**
   * Fetch ads created by this user.
   * - If viewing own profile, use user.sub (auth0_id).
   * - If viewing someone else's profile, use customUserData.auth0_id.
   */
  useEffect(() => {
    const getAdsForProfile = async (auth0Id: string) => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/ads/user/${encodeURIComponent(auth0Id)}`
        );
        const data = await response.json();
        if (data.success) {
          // Sort ads by created_at date, newest first
          const sortedAds = [...data.data].sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateB - dateA; // Descending order (newest first)
          });
          setProfileAds(sortedAds);
        }
      } catch (error) {
        console.error("Error fetching ads:", error);
      }
    };

    // Only fetch ads if we have customUserData (loaded) or own profile (user.sub)
    if (customUserData?.auth0_id) {
      getAdsForProfile(customUserData.auth0_id);
    } else if (user?.sub && user?.nickname === username) {
      getAdsForProfile(user.sub);
    }
  }, [customUserData?.auth0_id, user?.sub, username]);

  /**
   * Show the warning popup for account deletion
   */
  const showFinalWarning = () => {
    setFinalWarningPopup((prev) => !prev);
  };

  /**
   * Delete the user's account from PostgreSQL using auth0_id
   */
  const deleteCurrentUserProfile = async () => {
    if (!user?.sub) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/users/delete-account/${encodeURIComponent(
          user.sub
        )}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        setPopUpAfterDeleting(true);
      } else {
        showToast("Failed to delete account. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      showToast(
        "An error occurred while deleting your account. Please try again.",
        "error"
      );
    }
  };

  /**
   * After deletion, log out and navigate home
   */
  const sendToHomePageAfterDeletingUser = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  // Handle loading state
  //if (!isAuthenticated) return <div>Please log in.</div>;
  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-700">
          Loading profile...
        </div>
      </div>
    );

  const breakpointColumnsObj = {
    default: 3,
    1024: 3,
    768: 2,
    640: 1,
  };

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {isAuthenticated && customUserData?.auth0_id === user?.sub && (
                <span>
                  Welcome,{" "}
                  {customUserData?.full_name || user?.name || "unknown"}
                </span>
              )}
            </h2>
            <div className="space-y-2 text-gray-600">
              <p className="text-lg">
                <span className="font-semibold">Username:</span>{" "}
                {customUserData?.username || "Not set"}
              </p>
              <p className="text-sm text-gray-500">
                <span className="font-semibold">ID:</span>{" "}
                {customUserData?.auth0_id || user?.sub || "unknown"}
              </p>
              <p className="text-sm text-gray-500">
                <span className="font-semibold">Email:</span>{" "}
                {customUserData?.email || user?.email || "unknown"}
              </p>
            </div>

            {customUserData?.auth0_id === user?.sub && (
              <button
                onClick={showFinalWarning}
                className="mt-6 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Delete your profile
              </button>
            )}
          </div>

          {/* Render user's ads */}
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
          >
            {ads.map((ad) => (
              <InstagramComponent key={ad._id} ad={ad} onDelete={() => {}} />
            ))}
          </Masonry>
        </div>

        {finalWarningPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 relative">
              <button
                className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 rounded-lg p-2 transition-colors text-gray-700 font-bold"
                onClick={showFinalWarning}
              >
                ✕
              </button>
              <p className="text-lg font-semibold text-gray-800 mb-6 text-center">
                Are you sure you want to delete your profile? This cannot be
                reversed.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                  onClick={deleteCurrentUserProfile}
                >
                  Yes, delete it
                </button>
                <button
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                  onClick={showFinalWarning}
                >
                  No, keep it
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Post-deletion popup */}
        {popUpAfterDeleting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
              <p className="text-lg font-semibold text-gray-800 mb-6 text-center">
                Your account has been deleted.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={sendToHomePageAfterDeletingUser}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Profile;

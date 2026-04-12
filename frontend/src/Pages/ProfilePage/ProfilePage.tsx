// ProfilePage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate, useParams } from "react-router-dom";
import InstagramComponent from "../../Components/InstagramComponent/InstagramComponent.component";
import Pagination from "../../Components/Pagination/Pagination.component";
import axios from "axios";
import { useUser } from "../../UserContext";
import Masonry from "react-masonry-css";
import { useToast } from "../../hooks/useToast";
import { apiUrl } from "../../config/api";
import { POSTS_PER_PAGE, type PaginationMeta } from "../../config/pagination";

const MAX_ABOUT_ME_LENGTH = 200;

// Define the interface for custom user data from your PostgreSQL DB
interface CustomUserData {
  id: number;
  auth0_id: string;
  email: string;
  full_name: string;
  username: string | null;
  about_me?: string | null;
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
  const [adsPagination, setAdsPagination] = useState<PaginationMeta | null>(
    null,
  );
  const [adsPage, setAdsPage] = useState(1);
  const [adsLoading, setAdsLoading] = useState(false);
  const [customUserData, setCustomUserData] = useState<CustomUserData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [finalWarningPopup, setFinalWarningPopup] = useState(false);
  const [popUpAfterDeleting, setPopUpAfterDeleting] = useState(false);
  /** Must match username exactly before delete is allowed */
  const [deleteUsernameConfirm, setDeleteUsernameConfirm] = useState("");
  const [aboutMeEditorOpen, setAboutMeEditorOpen] = useState(false);
  const [aboutMeDraft, setAboutMeDraft] = useState("");
  const [aboutMeSaving, setAboutMeSaving] = useState(false);

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
          apiUrl(`/api/users/username/${encodeURIComponent(username)}`),
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

  const auth0ForAds = useMemo(() => {
    if (customUserData?.auth0_id) return customUserData.auth0_id;
    if (user?.sub && user?.nickname === username) return user.sub;
    return null;
  }, [customUserData?.auth0_id, user?.sub, user?.nickname, username]);

  /** Reset to page 1 when opening a different profile (URL username) */
  useEffect(() => {
    setAdsPage(1);
  }, [username]);

  /**
   * Fetch ads for this profile (paginated, 6 per page).
   */
  useEffect(() => {
    if (!auth0ForAds) {
      setProfileAds([]);
      setAdsPagination(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setAdsLoading(true);
      try {
        const response = await fetch(
          apiUrl(
            `/api/ads/user/${encodeURIComponent(auth0ForAds)}?page=${adsPage}&limit=${POSTS_PER_PAGE}`,
          ),
        );
        const data = await response.json();
        if (cancelled) return;
        if (data.success) {
          setProfileAds(data.data);
          if (data.pagination) {
            setAdsPagination(data.pagination);
            const tp = data.pagination.totalPages as number;
            if (adsPage > tp && tp >= 1) {
              setAdsPage(tp);
            }
          } else {
            setAdsPagination(null);
          }
        }
      } catch (error) {
        console.error("Error fetching ads:", error);
      } finally {
        if (!cancelled) setAdsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [auth0ForAds, adsPage]);

  const openAboutMeEditor = () => {
    const current = String(customUserData?.about_me ?? "");
    setAboutMeDraft(current.slice(0, MAX_ABOUT_ME_LENGTH));
    setAboutMeEditorOpen(true);
  };

  const closeAboutMeEditor = () => {
    setAboutMeEditorOpen(false);
    setAboutMeDraft("");
  };

  const saveAboutMe = async () => {
    if (!user?.sub) return;
    const trimmed = aboutMeDraft.trim();
    if (trimmed.length > MAX_ABOUT_ME_LENGTH) {
      showToast(
        `About me must be ${MAX_ABOUT_ME_LENGTH} characters or less.`,
        "error",
      );
      return;
    }
    setAboutMeSaving(true);
    try {
      const response = await fetch(apiUrl("/api/users/about-me"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth0_id: user.sub, about_me: trimmed }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to update about me");
      }
      setCustomUserData((prev) =>
        prev ? { ...prev, about_me: data.user?.about_me ?? trimmed } : prev,
      );
      closeAboutMeEditor();
      showToast("About me saved!", "success");
    } catch (err) {
      console.error(err);
      showToast(
        err instanceof Error ? err.message : "Could not save about me.",
        "error",
      );
    } finally {
      setAboutMeSaving(false);
    }
  };

  const openDeleteModal = () => {
    setDeleteUsernameConfirm("");
    setFinalWarningPopup(true);
  };

  const closeDeleteModal = () => {
    setDeleteUsernameConfirm("");
    setFinalWarningPopup(false);
  };

  /**
   * Delete the user's account from PostgreSQL using auth0_id
   */
  const deleteCurrentUserProfile = async () => {
    if (!user?.sub) return;

    const expected = customUserData?.username?.trim() || username?.trim() || "";
    if (!expected || deleteUsernameConfirm.trim() !== expected) {
      return;
    }

    try {
      const response = await fetch(
        apiUrl(`/api/users/delete-account/${encodeURIComponent(user.sub)}`),
        {
          method: "DELETE",
        },
      );
      if (response.ok) {
        setFinalWarningPopup(false);
        setDeleteUsernameConfirm("");
        setPopUpAfterDeleting(true);
      } else {
        showToast("Failed to delete account. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      showToast(
        "An error occurred while deleting your account. Please try again.",
        "error",
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
      <div className="page-shell flex items-center justify-center">
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

  const isOwnProfile = Boolean(
    isAuthenticated && customUserData?.auth0_id === user?.sub,
  );
  const displayUsername =
    customUserData?.username?.trim() || username?.trim() || "cosplayer";
  const usernameToConfirmDeletion =
    customUserData?.username?.trim() || username?.trim() || "";
  const deleteNameMatches =
    usernameToConfirmDeletion.length > 0 &&
    deleteUsernameConfirm.trim() === usernameToConfirmDeletion;

  const aboutMeText = (customUserData?.about_me ?? "").trim();

  return (
    <>
      <ToastContainer />
      <div className="page-shell">
        <div className="max-w-7xl mx-auto">
          {/* Profile header — username hero, no full name */}
          <header className="mb-10 rounded-2xl bg-white shadow-lg shadow-gray-200/60 border border-white/80 overflow-hidden ring-1 ring-gray-100">
            <div
              className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-violet-500 to-pink-500"
              aria-hidden
            />
            <div className="px-6 py-8 sm:px-10 sm:py-10">
              <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Profile
                  </p>
                  <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 break-words">
                    <span className="bg-gradient-to-r from-sky-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
                      @{displayUsername}
                    </span>
                  </h1>
                  {isOwnProfile && (
                    <p className="text-sm text-gray-500 max-w-md">
                      You&apos;re viewing your public profile — posts below are
                      what others see here.
                    </p>
                  )}
                </div>
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={openDeleteModal}
                    className="shrink-0 self-start sm:self-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-red-700 bg-red-50 border border-red-100 hover:bg-red-100 hover:border-red-200 transition-colors"
                  >
                    Delete profile
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* About me — everyone can read; only owner can edit (via modal + API) */}
          <section
            className="mb-10 rounded-2xl bg-white shadow-lg shadow-gray-200/60 border border-white/80 ring-1 ring-gray-100 overflow-hidden"
            aria-labelledby="about-me-heading"
          >
            <div className="px-6 py-6 sm:px-8 sm:py-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h2
                    id="about-me-heading"
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-3"
                  >
                    About me
                  </h2>
                  {aboutMeText ? (
                    <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap break-words">
                      {aboutMeText}
                    </p>
                  ) : (
                    <p className="text-gray-400 text-base italic">
                      {isOwnProfile
                        ? "You haven’t written anything here yet — tell the community a bit about yourself!"
                        : "This cosplayer hasn’t added an about me yet."}
                    </p>
                  )}
                </div>
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={openAboutMeEditor}
                    className="shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold text-sky-700 bg-sky-50 border border-sky-100 hover:bg-sky-100 hover:border-sky-200 transition-colors"
                  >
                    {aboutMeText ? "Edit about me" : "Add about me"}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* User's ads (paginated) */}
          {adsLoading && ads.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Loading posts. This may take a few seconds.
            </p>
          ) : (
            <>
              {adsLoading && ads.length > 0 && (
                <p className="text-center text-sm text-gray-500 mb-4">
                  Updating…
                </p>
              )}
              <Masonry
                breakpointCols={breakpointColumnsObj}
                className="my-masonry-grid"
                columnClassName="my-masonry-grid_column"
              >
                {ads.map((ad) => (
                  <InstagramComponent key={ad.id} ad={ad} />
                ))}
              </Masonry>
              {adsPagination && (
                <Pagination
                  pagination={adsPagination}
                  onPageChange={setAdsPage}
                  disabled={adsLoading}
                />
              )}
              {!adsLoading && ads.length === 0 && (
                <p className="text-center text-gray-500 py-8">No posts yet.</p>
              )}
            </>
          )}
        </div>

        {aboutMeEditorOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-lg w-full relative"
              role="dialog"
              aria-labelledby="about-me-editor-title"
            >
              <button
                type="button"
                className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 rounded-lg p-2 transition-colors text-gray-700 font-bold"
                onClick={closeAboutMeEditor}
                aria-label="Close"
              >
                ✕
              </button>
              <h2
                id="about-me-editor-title"
                className="text-lg font-semibold text-gray-900 mb-1 pr-10"
              >
                About me
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Max {MAX_ABOUT_ME_LENGTH} characters. This text is public on
                your profile.
              </p>
              <textarea
                id="about-me-textarea"
                value={aboutMeDraft}
                onChange={(e) =>
                  setAboutMeDraft(e.target.value.slice(0, MAX_ABOUT_ME_LENGTH))
                }
                rows={5}
                maxLength={MAX_ABOUT_ME_LENGTH}
                placeholder="Costumes you love, cons you attend, collab ideas…"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none text-gray-900 resize-y min-h-[120px] text-sm"
              />
              <div className="flex justify-between items-center mt-2 mb-5 text-xs text-gray-500">
                <span>
                  {aboutMeDraft.length}/{MAX_ABOUT_ME_LENGTH}
                </span>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
                <button
                  type="button"
                  className="px-5 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  onClick={closeAboutMeEditor}
                  disabled={aboutMeSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-violet-600 hover:from-sky-600 hover:to-violet-700 disabled:opacity-50 transition-colors"
                  onClick={saveAboutMe}
                  disabled={aboutMeSaving}
                >
                  {aboutMeSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {finalWarningPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full relative"
              role="dialog"
              aria-labelledby="delete-profile-title"
              aria-describedby="delete-profile-desc"
            >
              <button
                type="button"
                className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 rounded-lg p-2 transition-colors text-gray-700 font-bold"
                onClick={closeDeleteModal}
                aria-label="Close"
              >
                ✕
              </button>
              <h2
                id="delete-profile-title"
                className="text-lg font-semibold text-gray-800 mb-2 text-center pr-8"
              >
                Delete your profile?
              </h2>
              <p
                id="delete-profile-desc"
                className="text-sm text-gray-600 mb-5 text-center"
              >
                This cannot be undone. Type your username{" "}
                <span className="font-mono font-semibold text-gray-900">
                  {usernameToConfirmDeletion || displayUsername}
                </span>{" "}
                below to confirm.
              </p>
              <label
                htmlFor="delete-username-input"
                className="block text-xs font-medium text-gray-500 mb-1.5"
              >
                Your username
              </label>
              <input
                id="delete-username-input"
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={deleteUsernameConfirm}
                onChange={(e) => setDeleteUsernameConfirm(e.target.value)}
                placeholder={usernameToConfirmDeletion || displayUsername}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 focus:outline-none text-gray-900 mb-6"
              />
              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  onClick={closeDeleteModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-6 py-2 rounded-lg transition-colors font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-red-500"
                  onClick={deleteCurrentUserProfile}
                  disabled={!deleteNameMatches}
                >
                  Yes, delete my profile
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

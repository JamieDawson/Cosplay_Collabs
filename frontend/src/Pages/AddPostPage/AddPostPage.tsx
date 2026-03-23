import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useToast } from "../../hooks/useToast";
import {
  geocodeLocationWithCanonical,
  mergeUserLocationWithCanonical,
} from "../../utils/nominatimGeocode";
import { apiUrl } from "../../config/api";

const AddPostPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth0();
  const { showToast, ToastContainer } = useToast();
  const [adCreatedPopup, setAdCreatedPopUp] = useState(false);
  const maxLengthDescription = 200;
  const maxLengthTitle = 65;

  const [formData, setFormData] = useState({
    user_id: user?.sub || "", // User ID creating the ad
    title: "",
    description: "",
    country: "",
    state: "",
    city: "",
    imageUrl: "", // For single image (legacy support)
    keywords: ["", "", "", ""],
  });

  // Instagram links: array of URLs (max 10)
  const [instagramUrls, setInstagramUrls] = useState<string[]>([""]);

  const [uploading, setUploading] = useState(false);

  // Upload tracking (Instagram only)
  const [instagramUrlCount, setInstagramUrlCount] = useState<number | null>(
    null,
  );
  const [uploadCountsLoading, setUploadCountsLoading] = useState(false);
  const maxInstagramUrls = 10;

  // Keep user_id in sync with current user
  useEffect(() => {
    if (user?.sub) {
      setFormData((prev) => ({ ...prev, user_id: user.sub || "" }));
    }
  }, [user?.sub]);

  // Fetch upload counts (Instagram only) when user is authenticated
  useEffect(() => {
    const fetchUploadCounts = async () => {
      if (!user?.sub) {
        setInstagramUrlCount(null);
        return;
      }

      setUploadCountsLoading(true);
      try {
        const response = await fetch(
          apiUrl(`/api/ads/upload-counts/${encodeURIComponent(user.sub)}`),
        );
        if (response.ok) {
          const data = await response.json();
          setInstagramUrlCount(data.instagram?.count || 0);
        } else {
          console.error("Failed to fetch upload counts");
          setInstagramUrlCount(0);
        }
      } catch (error) {
        console.error("Error fetching upload counts:", error);
        setInstagramUrlCount(0);
      } finally {
        setUploadCountsLoading(false);
      }
    };

    fetchUploadCounts();
  }, [user?.sub]);

  // Calculate remaining uploads
  const remainingInstagramUrls =
    instagramUrlCount !== null
      ? Math.max(0, maxInstagramUrls - instagramUrlCount)
      : null;
  const canUploadInstagram =
    remainingInstagramUrls !== null && remainingInstagramUrls > 0;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    // Use functional update to avoid stale closures
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Clear dependent fields when higher-level fields change
      if (name === "country") {
        updated.state = "";
        updated.city = "";
      } else if (name === "state") {
        updated.city = "";
      }

      return updated;
    });
  };

  const handleKeywordChange = (index: number, value: string) => {
    // Use functional update to avoid stale closures
    setFormData((prev) => {
      const updatedKeywords = [...prev.keywords];
      updatedKeywords[index] = value;
      return { ...prev, keywords: updatedKeywords };
    });
  };

  const handleInstagramUrlChange = (index: number, value: string) => {
    const newUrls = [...instagramUrls];
    newUrls[index] = value;
    setInstagramUrls(newUrls);
  };

  const addInstagramUrlField = () => {
    if (instagramUrls.length < 10) {
      setInstagramUrls([...instagramUrls, ""]);
    }
  };

  const removeInstagramUrl = (index: number) => {
    if (instagramUrls.length > 1) {
      const newUrls = instagramUrls.filter((_, i) => i !== index);
      setInstagramUrls(newUrls);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure we use the current user?.sub value, not a potentially stale one
    if (!user?.sub) {
      showToast("User not authenticated. Please log in.", "error");
      return;
    }

    setUploading(true);

    try {
      // Frontend validation: Check if user can upload more Instagram URLs
      if (!canUploadInstagram) {
        showToast(
          "You have reached your Instagram URL limit (10 URLs).",
          "error",
        );
        setUploading(false);
        return;
      }

      // Validate Instagram URLs
      const validUrls = instagramUrls.filter((url) => url.trim() !== "");
      if (validUrls.length === 0) {
        showToast("Please enter at least one Instagram URL.", "error");
        setUploading(false);
        return;
      }

      // Check if adding these URLs would exceed the limit
      if (
        instagramUrlCount !== null &&
        instagramUrlCount + validUrls.length > maxInstagramUrls
      ) {
        const remaining = maxInstagramUrls - instagramUrlCount;
        showToast(
          `You can only add ${remaining} more Instagram URL${remaining !== 1 ? "s" : ""}. You have ${instagramUrlCount} URLs already.`,
          "error",
        );
        setUploading(false);
        return;
      }

      // Validate Instagram URL format
      const instagramUrlPattern =
        /^https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+\/?/;
      for (const url of validUrls) {
        if (!instagramUrlPattern.test(url.trim())) {
          showToast("Please enter valid Instagram post URLs.", "error");
          setUploading(false);
          return;
        }
      }

      const images = validUrls.map((url) => url.trim());

      // Update local count after successful upload
      if (instagramUrlCount !== null) {
        setInstagramUrlCount(instagramUrlCount + images.length);
      }

      // Geocode: store lat/lng and canonical country/state/city from Nominatim for consistent /places/... URLs
      let lat: number | null = null;
      let lng: number | null = null;
      let country = formData.country.trim();
      let state = formData.state.trim();
      let city = formData.city.trim();
      if (formData.city && formData.state && formData.country) {
        const geo = await geocodeLocationWithCanonical(
          formData.city,
          formData.state,
          formData.country,
        );
        if (geo) {
          lat = geo.lat;
          lng = geo.lng;
          const merged = mergeUserLocationWithCanonical(
            {
              country: formData.country,
              state: formData.state,
              city: formData.city,
            },
            geo.canonicalPartial,
          );
          country = merged.country;
          state = merged.state;
          city = merged.city;
        }
      }

      // Use current user?.sub instead of potentially stale formData.user_id
      const adData = {
        ...formData,
        user_id: user.sub, // Always use current user.sub value
        country,
        state,
        city,
        images, // Array of Instagram URLs
        imageType: "instagram", // Always Instagram
        // Keep imageUrl for backward compatibility (use first image)
        imageUrl: images[0] || "",
        ...(lat != null && lng != null ? { lat, lng } : {}),
      };

      // Create the ad with the images
      const response = await fetch(apiUrl("/api/ads"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adData),
      });

      if (response.ok) {
        setAdCreatedPopUp(true);
        showToast("Ad created successfully!", "success");

        // Refresh upload counts after successful upload
        if (user?.sub) {
          try {
            const countResponse = await fetch(
              apiUrl(`/api/ads/upload-counts/${encodeURIComponent(user.sub)}`),
            );
            if (countResponse.ok) {
              const countData = await countResponse.json();
              setInstagramUrlCount(countData.instagram?.count || 0);
            }
          } catch (error) {
            console.error("Error refreshing upload counts:", error);
          }
        }

        // Reset the form data after successful ad creation
        setFormData({
          user_id: user?.sub || "",
          title: "",
          description: "",
          country: "",
          state: "",
          city: "",
          imageUrl: "",
          keywords: ["", "", "", ""],
        });
        setInstagramUrls([""]);
      } else {
        const errorData = await response.json();
        showToast(
          errorData.error || "Failed to create ad. Please try again.",
          "error",
        );
      }
    } catch (error) {
      console.error("Error creating ad:", error);
      showToast(
        error instanceof Error
          ? error.message
          : "An error occurred while creating the ad. Please try again.",
        "error",
      );
    } finally {
      setUploading(false);
    }
  };

  const closeAdCreatedPopup = () => {
    setAdCreatedPopUp(false);
  };

  return (
    <>
      <ToastContainer />
      {adCreatedPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <p className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Ad created!
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => closeAdCreatedPopup()}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                OK!
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 py-8 px-4">
        {!isAuthenticated ? (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800">
              You need an account to create an ad.
            </h2>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8 flex flex-col gap-4"
          >
            <input
              maxLength={maxLengthTitle}
              name="title"
              placeholder="Title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm md:text-base"
            />
            <p className="text-sm text-gray-500 text-right">
              {formData.title.length}/{maxLengthTitle}
            </p>
            <textarea
              maxLength={maxLengthDescription}
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-y min-h-[80px] text-sm md:text-base"
            />
            <p className="text-sm text-gray-500 text-right">
              {formData.description.length} / {maxLengthDescription}
            </p>
            <input
              name="country"
              placeholder="Country (e.g., USA, Canada, UK)"
              value={formData.country}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm md:text-base"
            />
            <input
              name="state"
              placeholder="State / Region (e.g., CA, Ontario)"
              value={formData.state}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm md:text-base"
            />
            <input
              name="city"
              placeholder="City (e.g., San Francisco)"
              value={formData.city}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm md:text-base"
            />
            <p className="text-xs text-gray-500 -mt-2">
              We verify your location with OpenStreetMap and save the official place names so
              everyone lands on the same city/country pages.
            </p>

            {/* Instagram URLs Section */}
            <div className="flex flex-col gap-4">
              <label className="text-sm font-medium text-gray-700">
                Instagram Post URLs * (Max 10)
              </label>
              {uploadCountsLoading ? (
                <p className="text-xs text-gray-500">
                  Loading upload counts...
                </p>
              ) : (
                remainingInstagramUrls !== null && (
                  <p
                    className={`text-xs ${remainingInstagramUrls === 0 ? "text-red-600 font-semibold" : "text-gray-600"}`}
                  >
                    {remainingInstagramUrls === 0
                      ? "You've reached your Instagram URL limit (10 URLs)."
                      : `You're allowed ${remainingInstagramUrls} more Instagram URL${remainingInstagramUrls !== 1 ? "s" : ""} (${instagramUrlCount}/${maxInstagramUrls} used)`}
                  </p>
                )
              )}
              {instagramUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    placeholder={`Instagram URL ${index + 1} (e.g., https://www.instagram.com/p/ABC123/)`}
                    value={url}
                    onChange={(e) =>
                      handleInstagramUrlChange(index, e.target.value)
                    }
                    disabled={!canUploadInstagram && url === ""}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm md:text-base"
                  />
                  {instagramUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInstagramUrl(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}

              <p className="text-xs text-gray-500">
                Enter Instagram post URLs (e.g.,
                https://www.instagram.com/p/ABC123/)
              </p>
            </div>
            {formData.keywords.map((keyword, index) => (
              <input
                key={index}
                placeholder={`Keyword ${index + 1}`}
                value={keyword}
                onChange={(e) => handleKeywordChange(index, e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm md:text-base"
              />
            ))}
            <button
              type="submit"
              disabled={uploading}
              className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-bold text-base md:text-lg mt-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading..." : "Create Ad"}
            </button>
          </form>
        )}
      </div>
    </>
  );
};

export default AddPostPage;

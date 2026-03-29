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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ad-created-heading"
            className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
          >
            <p
              id="ad-created-heading"
              className="mb-4 text-center text-lg font-semibold text-gray-800"
            >
              Ad created!
            </p>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => closeAdCreatedPopup()}
                className="rounded-lg bg-blue-500 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
              >
                OK!
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="page-shell">
        {!isAuthenticated ? (
          <div className="surface-card-strong mx-auto max-w-2xl p-8 text-center">
            <h2 className="text-2xl font-extrabold text-slate-800">
              You need an account to create an ad.
            </h2>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="surface-card-strong mx-auto flex max-w-2xl flex-col gap-4 p-6 md:p-8"
            aria-busy={uploading}
          >
            <h1 className="text-2xl font-extrabold text-slate-800 md:text-3xl">
              Create an ad
            </h1>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="add-post-title"
                className="text-sm font-medium text-slate-700"
              >
                Title <span className="text-red-600">*</span>
              </label>
              <input
                id="add-post-title"
                maxLength={maxLengthTitle}
                name="title"
                placeholder="Title"
                value={formData.title}
                onChange={handleChange}
                required
                aria-describedby="add-post-title-count"
                className="w-full rounded-xl border border-slate-200/90 bg-white/90 p-3 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 md:text-base"
              />
              <p
                id="add-post-title-count"
                className="text-right text-sm text-gray-500"
              >
                {formData.title.length}/{maxLengthTitle}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="add-post-description"
                className="text-sm font-medium text-slate-700"
              >
                Description <span className="text-red-600">*</span>
              </label>
              <textarea
                id="add-post-description"
                maxLength={maxLengthDescription}
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
                required
                aria-describedby="add-post-description-count"
                className="min-h-[80px] w-full resize-y rounded-xl border border-slate-200/90 bg-white/90 p-3 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 md:text-base"
              />
              <p
                id="add-post-description-count"
                className="text-right text-sm text-gray-500"
              >
                {formData.description.length} / {maxLengthDescription}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="add-post-country"
                className="text-sm font-medium text-slate-700"
              >
                Country <span className="text-red-600">*</span>
              </label>
              <input
                id="add-post-country"
                name="country"
                placeholder="Country (e.g., USA, Canada, UK)"
                value={formData.country}
                onChange={handleChange}
                required
                autoComplete="country-name"
                className="w-full rounded-xl border border-slate-200/90 bg-white/90 p-3 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 md:text-base"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="add-post-state"
                className="text-sm font-medium text-slate-700"
              >
                State / region <span className="text-red-600">*</span>
              </label>
              <input
                id="add-post-state"
                name="state"
                placeholder="State / Region (e.g., CA, Ontario)"
                value={formData.state}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200/90 bg-white/90 p-3 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 md:text-base"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="add-post-city"
                className="text-sm font-medium text-slate-700"
              >
                City <span className="text-red-600">*</span>
              </label>
              <input
                id="add-post-city"
                name="city"
                placeholder="City (e.g., San Francisco)"
                value={formData.city}
                onChange={handleChange}
                required
                autoComplete="address-level2"
                aria-describedby="add-post-location-hint"
                className="w-full rounded-xl border border-slate-200/90 bg-white/90 p-3 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 md:text-base"
              />
              <p id="add-post-location-hint" className="-mt-1 text-xs text-gray-500">
                We verify your location with OpenStreetMap and save the official place names so
                everyone lands on the same city/country pages.
              </p>
            </div>

            {/* Instagram URLs Section */}
            <fieldset className="flex flex-col gap-4 border-0 p-0">
              <legend className="text-sm font-medium text-gray-700">
                Instagram post URLs <span className="text-red-600">*</span> (max
                10)
              </legend>
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
                    id={`add-post-instagram-${index}`}
                    type="url"
                    placeholder={`Instagram URL ${index + 1} (e.g., https://www.instagram.com/p/ABC123/)`}
                    value={url}
                    onChange={(e) =>
                      handleInstagramUrlChange(index, e.target.value)
                    }
                    disabled={!canUploadInstagram && url === ""}
                    aria-label={`Instagram post URL ${index + 1}`}
                    className="flex-1 rounded-xl border border-slate-200/90 bg-white/90 p-3 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-gray-100 md:text-base"
                  />
                  {instagramUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInstagramUrl(index)}
                      className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2"
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
            </fieldset>
            <fieldset className="flex flex-col gap-3 border-0 p-0">
              <legend className="text-sm font-medium text-slate-700">
                Tags (optional keywords)
              </legend>
            {formData.keywords.map((keyword, index) => (
              <div key={index} className="flex flex-col gap-1">
                <label
                  htmlFor={`add-post-keyword-${index}`}
                  className="sr-only"
                >
                  Keyword {index + 1}
                </label>
                <input
                  id={`add-post-keyword-${index}`}
                  placeholder={`Keyword ${index + 1}`}
                  value={keyword}
                  onChange={(e) => handleKeywordChange(index, e.target.value)}
                  className="w-full rounded-xl border border-slate-200/90 bg-white/90 p-3 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 md:text-base"
                />
              </div>
            ))}
            </fieldset>
            <button
              type="submit"
              disabled={uploading}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-sky-500 to-pink-500 py-3 text-base font-bold text-white shadow-md shadow-sky-400/25 transition-all hover:from-sky-400 hover:to-pink-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-400 disabled:shadow-none md:text-lg"
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

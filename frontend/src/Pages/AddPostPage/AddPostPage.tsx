import { useState, useEffect } from "react";
import { locationData } from "../../Data/locations";
import { useAuth0 } from "@auth0/auth0-react";
import { useToast } from "../../hooks/useToast";

const AddPostPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth0();
  const { showToast, ToastContainer } = useToast();
  const [adCreatedPopup, setAdCreatedPopUp] = useState(false);
  const maxLengthDescription = 200;
  const maxLengthTitle = 65;

  // Toggle between S3 uploads and Instagram links
  const [imageType, setImageType] = useState<"s3" | "instagram">("s3");
  
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
  
  // S3 uploads: array of files (max 3)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // Instagram links: array of URLs (max 10)
  const [instagramUrls, setInstagramUrls] = useState<string[]>([""]);
  
  const [uploading, setUploading] = useState(false);
  
  // S3 upload tracking
  const [s3UploadCount, setS3UploadCount] = useState<number | null>(null);
  const [s3UploadLoading, setS3UploadLoading] = useState(false);
  const maxS3Uploads = 3;

  // Keep user_id in sync with current user
  useEffect(() => {
    if (user?.sub) {
      setFormData((prev) => ({ ...prev, user_id: user.sub || "" }));
    }
  }, [user?.sub]);

  // Fetch S3 upload count when user is authenticated
  useEffect(() => {
    const fetchS3UploadCount = async () => {
      if (!user?.sub) {
        setS3UploadCount(null);
        return;
      }

      setS3UploadLoading(true);
      try {
        const response = await fetch(
          `http://localhost:3000/api/ads/s3-upload-count/${encodeURIComponent(user.sub)}`
        );
        if (response.ok) {
          const data = await response.json();
          setS3UploadCount(data.count || 0);
        } else {
          console.error("Failed to fetch S3 upload count");
          setS3UploadCount(0); // Default to 0 on error
        }
      } catch (error) {
        console.error("Error fetching S3 upload count:", error);
        setS3UploadCount(0); // Default to 0 on error
      } finally {
        setS3UploadLoading(false);
      }
    };

    fetchS3UploadCount();
  }, [user?.sub]);

  // Calculate remaining uploads
  const remainingUploads = s3UploadCount !== null ? Math.max(0, maxS3Uploads - s3UploadCount) : null;
  const canUploadS3 = remainingUploads !== null && remainingUploads > 0;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        showToast("Please select an image file.", "error");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image size must be less than 5MB.", "error");
        return;
      }

      // Update files array
      const newFiles = [...selectedFiles];
      newFiles[index] = file;
      setSelectedFiles(newFiles);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPreviews = [...imagePreviews];
        newPreviews[index] = reader.result as string;
        setImagePreviews(newPreviews);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setImagePreviews(newPreviews);
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

  const uploadImageToS3 = async (file: File): Promise<string> => {
    if (!user?.sub) {
      throw new Error("User not authenticated");
    }

    // Step 1: Get pre-signed URL from backend
    const uploadUrlResponse = await fetch(
      "http://localhost:3000/api/s3/upload-url",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          userId: user.sub,
        }),
      }
    );

    if (!uploadUrlResponse.ok) {
      const error = await uploadUrlResponse.json();
      throw new Error(error.error || "Failed to get upload URL");
    }

    const { uploadUrl, fileName } = await uploadUrlResponse.json();

    // Step 2: Upload file directly to S3 using pre-signed URL
    // Note: Don't set Content-Type header - it's already in the pre-signed URL
    // Setting it again can cause CORS issues
    const s3Response = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      // Don't set headers - the pre-signed URL already includes Content-Type
    });

    if (!s3Response.ok) {
      throw new Error("Failed to upload image to S3");
    }

    // Step 3: Return the S3 file name/key (we'll use this to generate view URLs)
    return fileName;
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
      let images: string[] = [];

      if (imageType === "s3") {
        // Frontend validation: Check if user can upload more S3 images
        if (!canUploadS3) {
          showToast("You have reached your S3 upload limit (3 uploads). Please use Instagram links instead.", "error");
          setUploading(false);
          return;
        }

        // Validate S3 uploads
        const validFiles = selectedFiles.filter((file) => file !== null && file !== undefined);
        if (validFiles.length === 0) {
          showToast("Please select at least one image to upload.", "error");
          setUploading(false);
          return;
        }

        // Check if adding these files would exceed the limit
        if (s3UploadCount !== null && s3UploadCount + validFiles.length > maxS3Uploads) {
          const remaining = maxS3Uploads - s3UploadCount;
          showToast(
            `You can only upload ${remaining} more image${remaining !== 1 ? 's' : ''}. You have ${s3UploadCount} uploads already.`,
            "error"
          );
          setUploading(false);
          return;
        }

        // Upload all files to S3
        const uploadPromises = validFiles.map((file) => uploadImageToS3(file));
        const s3FileNames = await Promise.all(uploadPromises);
        images = s3FileNames;
        
        // Update local count after successful upload
        if (s3UploadCount !== null) {
          setS3UploadCount(s3UploadCount + s3FileNames.length);
        }
      } else {
        // Validate Instagram URLs
        const validUrls = instagramUrls.filter((url) => url.trim() !== "");
        if (validUrls.length === 0) {
          showToast("Please enter at least one Instagram URL.", "error");
          setUploading(false);
          return;
        }

        // Validate Instagram URL format
        const instagramUrlPattern = /^https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+\/?/;
        for (const url of validUrls) {
          if (!instagramUrlPattern.test(url.trim())) {
            showToast("Please enter valid Instagram post URLs.", "error");
            setUploading(false);
            return;
          }
        }

        images = validUrls.map((url) => url.trim());
      }

      // Use current user?.sub instead of potentially stale formData.user_id
      const adData = {
        ...formData,
        user_id: user.sub, // Always use current user.sub value
        images, // Array of S3 keys or Instagram URLs
        imageType, // "s3" or "instagram"
        // Keep imageUrl for backward compatibility (use first image)
        imageUrl: images[0] || "",
      };

      // Create the ad with the images
      const response = await fetch("http://localhost:3000/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adData),
      });

      if (response.ok) {
        setAdCreatedPopUp(true);
        showToast("Ad created successfully!", "success");
        
        // Refresh S3 upload count if S3 images were uploaded
        if (imageType === "s3" && user?.sub) {
          try {
            const countResponse = await fetch(
              `http://localhost:3000/api/ads/s3-upload-count/${encodeURIComponent(user.sub)}`
            );
            if (countResponse.ok) {
              const countData = await countResponse.json();
              setS3UploadCount(countData.count || 0);
            }
          } catch (error) {
            console.error("Error refreshing S3 upload count:", error);
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
        setSelectedFiles([]);
        setImagePreviews([]);
        setInstagramUrls([""]);
        // Reset file inputs
        document.querySelectorAll('input[type="file"]').forEach((input) => {
          (input as HTMLInputElement).value = "";
        });
      } else {
        const errorData = await response.json();
        showToast(
          errorData.error || "Failed to create ad. Please try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error creating ad:", error);
      showToast(
        error instanceof Error
          ? error.message
          : "An error occurred while creating the ad. Please try again.",
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  // Get dynamic options based on selections
  const countryOptions = Object.keys(locationData.countries);

  // Safely access state options
  const stateOptions =
    formData.country && formData.country in locationData.countries
      ? Object.keys(
          (
            locationData.countries as {
              [key: string]: { states: Record<string, string[]> };
            }
          )[formData.country].states
        )
      : [];

  const cityOptions =
    formData.state &&
    formData.country &&
    formData.country in locationData.countries &&
    formData.state in
      (
        locationData.countries as {
          [key: string]: { states: Record<string, string[]> };
        }
      )[formData.country].states
      ? (
          locationData.countries as {
            [key: string]: { states: Record<string, string[]> };
          }
        )[formData.country].states[formData.state]
      : [];

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
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm md:text-base"
            >
              <option value="">Select Country</option>
              {countryOptions.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <select
              name="state"
              value={formData.state}
              onChange={handleChange}
              disabled={!formData.country}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm md:text-base"
            >
              <option value="">Select State</option>
              {stateOptions.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <select
              name="city"
              value={formData.city}
              onChange={handleChange}
              disabled={!formData.state}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm md:text-base"
            >
              <option value="">Select City</option>
              {cityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            
            {/* Image Type Toggle */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Image Type *
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (canUploadS3) {
                      setImageType("s3");
                      setSelectedFiles([]);
                      setImagePreviews([]);
                    } else {
                      showToast("You have reached your S3 upload limit (3 uploads). Please use Instagram links instead.", "error");
                    }
                  }}
                  disabled={!canUploadS3}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    !canUploadS3
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : imageType === "s3"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Upload Images {!canUploadS3 && "(Limit Reached)"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImageType("instagram");
                    setSelectedFiles([]);
                    setImagePreviews([]);
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    imageType === "instagram"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Instagram Links (Max 10)
                </button>
              </div>
              {/* Display remaining S3 uploads */}
              {s3UploadLoading ? (
                <p className="text-xs text-gray-500">Loading upload count...</p>
              ) : remainingUploads !== null && (
                <p className={`text-xs ${remainingUploads === 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                  {remainingUploads === 0 
                    ? "You've reached your original image upload limit (3 uploads). Please use Instagram links."
                    : `You're allowed ${remainingUploads} more original upload${remainingUploads !== 1 ? 's' : ''} (${s3UploadCount}/${maxS3Uploads} used)`
                  }
                </p>
              )}
            </div>

            {/* S3 Upload Section */}
            {imageType === "s3" && (
              <div className="flex flex-col gap-4">
                <label className="text-sm font-medium text-gray-700">
                  Upload Images * (Max 3)
                </label>
                {Array.from({ length: 1 }).map((_, index) => (
                  <div key={index} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        id={`image-upload-${index}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(index, e)}
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm md:text-base file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                      />
                      {imagePreviews[index] && (
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {imagePreviews[index] && (
                      <div className="mt-2">
                        <img
                          src={imagePreviews[index]}
                          alt={`Preview ${index + 1}`}
                          className="max-w-full h-48 object-contain rounded-lg border border-gray-300"
                        />
                      </div>
                    )}
                  </div>
                ))}
                <p className="text-xs text-gray-500">
                  Accepted formats: JPG, PNG, GIF. Max size: 5MB per image
                </p>
              </div>
            )}

            {/* Instagram URLs Section */}
            {imageType === "instagram" && (
              <div className="flex flex-col gap-4">
                <label className="text-sm font-medium text-gray-700">
                  Instagram Post URLs * (Max 10)
                </label>
                {instagramUrls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="url"
                      placeholder={`Instagram URL ${index + 1} (e.g., https://www.instagram.com/p/ABC123/)`}
                      value={url}
                      onChange={(e) => handleInstagramUrlChange(index, e.target.value)}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm md:text-base"
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
                  Enter Instagram post URLs (e.g., https://www.instagram.com/p/ABC123/)
                </p>
              </div>
            )}
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

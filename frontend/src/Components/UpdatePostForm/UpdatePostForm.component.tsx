import { useLocation, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { locationData } from "../../Data/locations";
import { useEffect, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { useS3Image } from "../../hooks/useS3Image";

interface Ad {
  id: number;
  user_id: string;
  title: string;
  description: string;
  instagram_post_url: string; // Now stores S3 image key/fileName
  keywords: string[];
  country?: string;
  state?: string;
  city?: string;
}

const UpdatePostForm = () => {
  const { isAuthenticated, user } = useAuth0();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const { ad } = location.state as { ad: Ad };
  const countryOptions = Object.keys(locationData.countries);
  const [updateButtonClicked, setUpdateButtonClicked] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Get current image URL for preview
  const { imageUrl: currentImageUrl } = useS3Image(ad.instagram_post_url);

  const [formData, setFormData] = useState({
    id: ad.id,
    user_id: ad.user_id,
    title: ad.title,
    description: ad.description,
    country: ad.country || "",
    state: ad.state || "",
    city: ad.city || "",
    imageUrl: ad.instagram_post_url, // S3 image key/fileName
    keywords: ad.keywords || ["", "", "", ""],
  });

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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

    // Step 3: Return the S3 file name/key
    return fileName;
  };

  useEffect(() => {
    console.log("Formdata is: ", formData);
  }, [formData]);

  const handleKeywordChange = (index: number, value: string) => {
    // Use functional update to avoid stale closures
    setFormData((prev) => {
      const updatedKeywords = [...prev.keywords];
      updatedKeywords[index] = value;
      return { ...prev, keywords: updatedKeywords };
    });
  };

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

  const updateAd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.sub || user.sub !== ad.user_id) {
      showToast("You don't have permission to update this ad.", "error");
      return;
    }

    setUploading(true);

    try {
      let imageUrl = formData.imageUrl;

      // If a new file is selected, upload it first
      if (selectedFile) {
        const s3FileName = await uploadImageToS3(selectedFile);
        imageUrl = s3FileName;
      }

      const updateData = {
        ...formData,
        imageUrl, // S3 file name/key
      };

      const response = await fetch(
        `http://localhost:3000/api/users/update/${formData.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Ad updated", data);
      showToast("Ad updated successfully!", "success");
      setUpdateButtonClicked(true);
      
      // Optionally navigate back to profile after a delay
      setTimeout(() => {
        navigate(-1); // Go back to previous page
      }, 1500);
    } catch (error) {
      console.error("Failed to update ad:", error);
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to update ad. Please try again.",
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  const showPopupForUpdatedAd = () => {
    console.log("showPopupForUpdateAd");
    if (updateButtonClicked === true) {
      setUpdateButtonClicked(false);
    } else {
      setUpdateButtonClicked(true);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 py-8 px-4">
        {!isAuthenticated ? (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800">
              You don't have permission to update this ad. Log in to update the ad.
            </h2>
          </div>
        ) : (
          <form
            onSubmit={updateAd}
            className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8 flex flex-col gap-4"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Update Post</h2>

            <input
              type="text"
              placeholder="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm md:text-base"
            />

            <textarea
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-y min-h-[80px] text-sm md:text-base"
            />

            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm md:text-base"
            >
              <option value="">Select City</option>
              {cityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="image-upload-update"
                className="text-sm font-medium text-gray-700"
              >
                Update Image (optional - leave empty to keep current image)
              </label>
              {currentImageUrl && !imagePreview && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-2">Current image:</p>
                  <img
                    src={currentImageUrl}
                    alt="Current"
                    className="max-w-full h-48 object-contain rounded-lg border border-gray-300"
                  />
                </div>
              )}
              <input
                id="image-upload-update"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm md:text-base file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              {imagePreview && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-2">New image preview:</p>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full h-48 object-contain rounded-lg border border-gray-300"
                  />
                </div>
              )}
              <p className="text-xs text-gray-500">
                Accepted formats: JPG, PNG, GIF. Max size: 5MB
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
              {uploading ? "Updating..." : "Update Ad"}
            </button>
          </form>
        )}
      </div>

      {updateButtonClicked && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <p className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Your ad has been updated!
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setUpdateButtonClicked(false);
                  navigate(-1);
                }}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UpdatePostForm;

/*
Steps needed:
Create form.  
Create state for form.  
Apply ad to state when it comes in.
Give users ability to update state for every input.  
Submit button runs backend function for updating.
*/

import { useLocation, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { locationData } from "../../Data/locations";
import { useEffect, useState } from "react";
import { useToast } from "../../hooks/useToast";

interface Ad {
  id: number;
  user_id: string;
  title: string;
  description: string;
  instagram_post_url: string; // Stores Instagram URL
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
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    id: ad.id,
    user_id: ad.user_id,
    title: ad.title,
    description: ad.description,
    country: ad.country || "",
    state: ad.state || "",
    city: ad.city || "",
    imageUrl: ad.instagram_post_url, // Instagram URL
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
      // Validate Instagram URL format if provided
      if (formData.imageUrl && formData.imageUrl.trim() !== "") {
        const instagramUrlPattern = /^https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+\/?/;
        if (!instagramUrlPattern.test(formData.imageUrl.trim())) {
          showToast("Please enter a valid Instagram post URL.", "error");
          setUploading(false);
          return;
        }
      }

      const updateData = {
        ...formData,
        imageUrl: formData.imageUrl.trim(), // Instagram URL
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
                htmlFor="instagram-url-update"
                className="text-sm font-medium text-gray-700"
              >
                Instagram Post URL *
              </label>
              <input
                id="instagram-url-update"
                type="url"
                name="imageUrl"
                placeholder="https://www.instagram.com/p/ABC123/"
                value={formData.imageUrl}
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm md:text-base"
              />
              <p className="text-xs text-gray-500">
                Enter an Instagram post URL (e.g., https://www.instagram.com/p/ABC123/)
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

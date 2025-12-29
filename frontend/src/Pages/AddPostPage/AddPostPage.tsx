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

  const [formData, setFormData] = useState({
    user_id: user?.sub || "", // User ID creating the ad
    title: "",
    description: "",
    country: "",
    state: "",
    city: "",
    instagramPostUrl: "",
    keywords: ["", "", "", ""],
  });

  // Keep user_id in sync with current user
  useEffect(() => {
    if (user?.sub) {
      setFormData((prev) => ({ ...prev, user_id: user.sub || "" }));
    }
  }, [user?.sub]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure we use the current user?.sub value, not a potentially stale one
    if (!user?.sub) {
      showToast("User not authenticated. Please log in.", "error");
      return;
    }

    // Use current user?.sub instead of potentially stale formData.user_id
    const adData = {
      ...formData,
      user_id: user.sub, // Always use current user.sub value
    };

    try {
      // Change URL to your backend's full address
      const response = await fetch("http://localhost:3000/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adData),
      });

      if (response.ok) {
        setAdCreatedPopUp(true);
        showToast("Ad created successfully!", "success");
        // Reset the form data after successful ad creation
        setFormData({
          user_id: user?.sub || "", // User ID creating the ad
          title: "",
          description: "",
          country: "",
          state: "",
          city: "",
          instagramPostUrl: "",
          keywords: ["", "", "", ""],
        });
      } else {
        showToast("Failed to create ad. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error creating ad:", error);
      showToast(
        "An error occurred while creating the ad. Please try again.",
        "error"
      );
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
            <input
              name="instagramPostUrl"
              placeholder="Instagram Post URL"
              value={formData.instagramPostUrl}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm md:text-base"
            />
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
              className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-bold text-base md:text-lg mt-2"
            >
              Create Ad
            </button>
          </form>
        )}
      </div>
    </>
  );
};

export default AddPostPage;

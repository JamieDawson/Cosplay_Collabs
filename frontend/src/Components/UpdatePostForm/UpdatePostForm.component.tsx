import { useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { locationData } from "../../Data/locations";
import { useEffect, useState } from "react";

interface Ad {
  id: number;
  user_id: string;
  title: string;
  description: string;
  instagram_post_url: string;
  keywords: string[];
  country?: string;
  state?: string;
  city?: string;
}

const UpdatePostForm = () => {
  const { isAuthenticated, user } = useAuth0();
  const location = useLocation();
  const { ad } = location.state as { ad: Ad };
  const countryOptions = Object.keys(locationData.countries);
  const [updateButtonClicked, setUpdateButtonClicked] = useState(false);

  const [formData, setFormData] = useState({
    id: ad.id,
    user_id: ad.user_id, // User ID creating the ad
    title: ad.title,
    description: ad.description,
    country: ad.country,
    state: ad.state,
    city: ad.city,
    instagramPostUrl: ad.instagram_post_url,
    keywords: ad.keywords || ["", "", "", ""],
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear dependent fields when higher-level fields change
    if (name === "country") {
      setFormData({ ...formData, country: value, state: "", city: "" });
    } else if (name === "state") {
      setFormData({ ...formData, state: value, city: "" });
    }
  };

  useEffect(() => {
    console.log("Formdata is: ", formData);
  }, [formData]);

  const handleKeywordChange = (index: number, value: string) => {
    const updatedKeywords = [...formData.keywords];
    updatedKeywords[index] = value;
    setFormData({ ...formData, keywords: updatedKeywords });
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

  const updateAd = async (e: any) => {
    e.preventDefault();
    console.log("update ad");

    try {
      const response = await fetch(
        "http://localhost:3000/api/users/update/" + formData.id,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Ad updated", data);
    } catch (error) {
      console.error("Failed to update ad:", error);
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
      {!isAuthenticated ? (
        <div>
          You don't have permission to update this ad. Log in to update the ad.
        </div>
      ) : (
        <>
          <div>
            <h2>Update Post</h2>
          </div>
          <form onSubmit={updateAd}>
            <input
              type="text"
              placeholder="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
            <textarea
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleChange}
            />
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
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
            />
            {formData.keywords.map((keyword, index) => (
              <input
                key={index}
                placeholder={`Keyword ${index + 1}`}
                value={keyword}
                onChange={(e) => handleKeywordChange(index, e.target.value)}
              />
            ))}
            <button type="submit" onClick={() => showPopupForUpdatedAd()}>
              Update Ad
            </button>
          </form>
        </>
      )}
      {updateButtonClicked ? (
        <div className="popup-overlay">
          <div className="popup">
            <button className="xbutton" onClick={() => showPopupForUpdatedAd()}>
              X
            </button>
            <p>Your ad as been updated!</p>
            <button
              className="bothButtons"
              onClick={() => showPopupForUpdatedAd()}
            >
              Ok
            </button>
          </div>
        </div>
      ) : (
        ""
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

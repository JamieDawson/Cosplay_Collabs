import React, { useState } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../UserContext"; // ✅ Make sure path is correct

const ProfileCompletion: React.FC = () => {
  const { user } = useAuth0();
  const [username, setUsernameInput] = useState("");
  const navigate = useNavigate();
  const { setUsername } = useUser(); // ✅ Get context setter

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !user) return;

    const trimmedUsername = username.trim();

    try {
      const userData = {
        auth0_id: user.sub,
        email: user.email,
        full_name: user.name,
        username: trimmedUsername,
      };

      const response = await axios.post(
        "http://localhost:3000/api/users/complete-profile",
        userData
      );

      console.log("Profile updated successfully:", response.data);

      // ✅ Update context (which handles localStorage internally)
      setUsername(trimmedUsername);

      // ✅ Navigate to /profile/:username
      navigate(`/profile/${trimmedUsername}`);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to complete profile. Please try again.");
    }
  };

  return (
    <div>
      <h2>Complete Your Profile</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Custom Username:</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsernameInput(e.target.value)}
          required
        />
        <button type="submit">Save Profile</button>
      </form>
    </div>
  );
};

export default ProfileCompletion;

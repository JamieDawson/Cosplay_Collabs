import React, { useState } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../UserContext"; // ✅ Make sure path is correct
import { useToast } from "../../hooks/useToast";
import { apiUrl } from "../../config/api";

const ProfileCompletion: React.FC = () => {
  const { user } = useAuth0();
  const [username, setUsernameInput] = useState("");
  const navigate = useNavigate();
  const { setUsername } = useUser(); // ✅ Get context setter
  const { showToast, ToastContainer } = useToast();

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
        apiUrl("/api/users/complete-profile"),
        userData,
      );

      console.log("Profile updated successfully:", response.data);

      // ✅ Update context (which handles localStorage internally)
      setUsername(trimmedUsername);

      // ✅ Navigate to /profile/:username
      navigate(`/profile/${trimmedUsername}`);
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast("Failed to complete profile. Please try again.", "error");
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-pink-50 to-blue-100 py-10 px-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-sky-100/90 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-sky-500 to-pink-500 px-6 py-8 text-center">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Choose your username
              </h1>
              <p className="mt-2 text-sm text-white/90">
                This is how others find you on Cosplay Collabs.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 md:p-8 flex flex-col gap-5"
            >
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="username"
                  className="text-sm font-semibold text-gray-800"
                >
                  Custom username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="e.g. neon_cosplayer"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/80 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-pink-300 transition-shadow"
                />
                <p className="text-xs text-gray-500 leading-relaxed">
                  Letters, numbers, and underscores work well. You’ll use this in
                  your profile URL.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-pink-500 text-white font-semibold shadow-md hover:from-blue-700 hover:via-sky-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all"
              >
                Save &amp; continue
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileCompletion;

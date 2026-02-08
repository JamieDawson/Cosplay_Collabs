import { useEffect, useRef, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from "./UserContext";

//Purpose: Handles where to send the user after they log in.

const PostLoginRedirect = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const { setUsername } = useUser();
  const navigate = useNavigate();
  const isMountedRef = useRef(true);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Reset mounted ref when component mounts
    isMountedRef.current = true;

    const handleRedirect = async () => {
      // Wait for Auth0 to finish loading
      if (isLoading) {
        return;
      }

      // If not authenticated, redirect to home
      if (!isAuthenticated) {
        if (isMountedRef.current && !hasRedirected) {
          setHasRedirected(true);
          navigate("/");
        }
        return;
      }

      // If authenticated but user data not ready yet, wait
      if (!user || !user.sub) {
        return;
      }

      // Prevent multiple redirects
      if (hasRedirected) {
        return;
      }

      console.log("user sub is: ", user.sub);

      try {
        const response = await axios.get(
          `http://localhost:3000/api/users/${encodeURIComponent(user.sub)}`
        );
        const customUser = response.data.user;
        console.log(customUser);

        // Check if component is still mounted before updating state/navigating
        if (!isMountedRef.current) return;

        setHasRedirected(true);

        if (customUser?.username) {
          setUsername(customUser.username);
          navigate(`/profile/${customUser.username}`);
        } else {
          navigate("/complete-profile");
        }
      } catch (err) {
        console.error("Error in PostLoginRedirect:", err);

        // Check if component is still mounted before navigating
        if (!isMountedRef.current) return;

        setHasRedirected(true);
        navigate("/complete-profile");
      }
    };

    handleRedirect();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMountedRef.current = false;
    };
  }, [user, isAuthenticated, isLoading, setUsername, navigate, hasRedirected]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-xl text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
};

export default PostLoginRedirect;

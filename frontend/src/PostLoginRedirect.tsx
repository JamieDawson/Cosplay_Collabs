import { useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from "./UserContext";

//Purpose: Handles where to send the user after they log in.

const PostLoginRedirect = () => {
  const { user, isAuthenticated } = useAuth0();
  const { setUsername } = useUser();
  const navigate = useNavigate();
  const isMountedRef = useRef(true);

  useEffect(() => {
    const handleRedirect = async () => {
      if (isAuthenticated && user && user.sub) {
        console.log("user sub is: ", user.sub);

        try {
          const response = await axios.get(
            `http://localhost:3000/api/users/${encodeURIComponent(user.sub)}`
          );
          const customUser = response.data.user;
          console.log(customUser);

          // Check if component is still mounted before updating state/navigating
          if (!isMountedRef.current) return;

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

          navigate("/complete-profile");
        }
      }
    };

    handleRedirect();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMountedRef.current = false;
    };
  }, [user, isAuthenticated, setUsername, navigate]);

  return <div>Redirecting...</div>;
};

export default PostLoginRedirect;

import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from "./UserContext";

const PostLoginRedirect = () => {
  const { user, isAuthenticated } = useAuth0();
  const { setUsername } = useUser();
  const navigate = useNavigate();

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

          if (customUser?.username) {
            setUsername(customUser.username);
            navigate(`/profile/${customUser.username}`);
          } else {
            navigate("/complete-profile");
          }
        } catch (err) {
          console.error("Error in PostLoginRedirect:", err);
          navigate("/complete-profile");
        }
      }
    };

    handleRedirect();
  }, [user, isAuthenticated, setUsername, navigate]);

  return <div>Redirecting...</div>;
};

export default PostLoginRedirect;

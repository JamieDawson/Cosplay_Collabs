// src/UserContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";

type UserContextType = {
  username: string | null;
  setUsername: (name: string | null) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsernameState] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth0();

  // Fetch username from backend when user is authenticated
  useEffect(() => {
    const fetchUsername = async () => {
      if (isAuthenticated && user?.sub) {
        try {
          // Fetch from backend (source of truth)
          const response = await axios.get(
            `http://localhost:3000/api/users/${encodeURIComponent(user.sub)}`
          );

          if (response.data.success && response.data.user?.username) {
            const fetchedUsername = response.data.user.username;
            setUsernameState(fetchedUsername);
            // Cache in localStorage for performance
            localStorage.setItem("username", fetchedUsername);
          } else {
            // User exists but no username yet
            setUsernameState(null);
            localStorage.removeItem("username");
          }
        } catch (error) {
          // If backend fetch fails, try localStorage as fallback
          console.warn(
            "Failed to fetch username from backend, using localStorage cache:",
            error
          );
          const cachedUsername = localStorage.getItem("username");
          if (cachedUsername) {
            setUsernameState(cachedUsername);
          } else {
            setUsernameState(null);
          }
        }
      } else {
        // Not authenticated - clear username
        setUsernameState(null);
        localStorage.removeItem("username");
      }
    };

    fetchUsername();
  }, [isAuthenticated, user?.sub]);

  const setUsername = (name: string | null) => {
    if (name) {
      localStorage.setItem("username", name);
    } else {
      localStorage.removeItem("username");
    }
    setUsernameState(name);
  };

  return (
    <UserContext.Provider value={{ username, setUsername }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};

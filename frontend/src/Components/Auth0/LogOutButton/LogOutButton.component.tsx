import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useUser } from "../../../UserContext";

function LogOutButton() {
  const { isAuthenticated, logout } = useAuth0();
  const { setUsername } = useUser();

  const handleLogout = () => {
    setUsername(null);
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  return isAuthenticated ? (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
    >
      Log Out
    </button>
  ) : null;
}

export default LogOutButton;

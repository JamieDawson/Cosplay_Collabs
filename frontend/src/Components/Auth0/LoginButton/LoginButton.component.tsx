import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

function LoginButton() {
  const { isAuthenticated, loginWithRedirect } = useAuth0();

  const handleClick = () => {
    loginWithRedirect();
  };

  return !isAuthenticated ? (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
    >
      Log in
    </button>
  ) : null;
}

export default LoginButton;

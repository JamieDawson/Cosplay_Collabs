import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

function SignUpButton() {
  const { isAuthenticated, loginWithRedirect } = useAuth0();

  const handleClick = () => {
    loginWithRedirect({
      authorizationParams: {
        screen_hint: "signup",
      },
    });
  };

  return !isAuthenticated ? (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
    >
      Sign Up
    </button>
  ) : null;
}

export default SignUpButton;

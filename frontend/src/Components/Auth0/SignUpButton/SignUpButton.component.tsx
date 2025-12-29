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
      onClick={handleClick}
      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors shadow-md"
    >
      Sign Up
    </button>
  ) : null;
}

export default SignUpButton;

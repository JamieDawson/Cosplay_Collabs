import React from "react";
import { createRoot } from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App";
import { UserProvider } from "./UserContext";
import ErrorBoundary from "./Components/ErrorBoundary/ErrorBoundary.component";
import "./index.css";

const domain = process.env.REACT_APP_AUTH0_DOMAIN!;
const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID!;

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{
          redirect_uri: window.location.origin + "/post-login",
        }}
        cacheLocation="localstorage"
        useRefreshTokens={true}
      >
        <UserProvider>
          <App />
        </UserProvider>
      </Auth0Provider>
    </ErrorBoundary>
  </React.StrictMode>
);

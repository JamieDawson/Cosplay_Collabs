import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavBar from "./Components/NavBar/NavBar.component";
import ErrorBoundary from "./Components/ErrorBoundary/ErrorBoundary.component";
import HomePage from "./Pages/HomePage/HomePage";
import AboutPage from "./Pages/AboutPage/AboutPage";
import AddPostPage from "./Pages/AddPostPage/AddPostPage";
import PlacesPage from "./Pages/PlacesPage/PlacesPage";
import LocationDetails from "./Components/LocationDetails/LocationDetails.component";
import ProfilePage from "./Pages/ProfilePage/ProfilePage";
import ProfileCompletion from "./Components/ProfileComplete/ProfileComplete.component";
import UpdatePostForm from "./Components/UpdatePostForm/UpdatePostForm.component";
import TagsPage from "./Pages/TagsPage/TagsPage";
import StateDetails from "./Components/StateDetails/StateDetails.component";
import PostLoginRedirect from "./PostLoginRedirect";

function App() {
  return (
    <Router>
      <div className="App">
        <ErrorBoundary>
          <NavBar />
        </ErrorBoundary>
        <Routes>
          <Route
            path="/"
            element={
              <ErrorBoundary>
                <HomePage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/about"
            element={
              <ErrorBoundary>
                <AboutPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/add-post"
            element={
              <ErrorBoundary>
                <AddPostPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/places"
            element={
              <ErrorBoundary>
                <PlacesPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/places/:country/:state/:city"
            element={
              <ErrorBoundary>
                <LocationDetails />
              </ErrorBoundary>
            }
          />
          <Route
            path="/places/:country/:state"
            element={
              <ErrorBoundary>
                <StateDetails />
              </ErrorBoundary>
            }
          />
          <Route
            path="/profile/:username"
            element={
              <ErrorBoundary>
                <ProfilePage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/update-post"
            element={
              <ErrorBoundary>
                <UpdatePostForm />
              </ErrorBoundary>
            }
          />
          <Route
            path="/complete-profile"
            element={
              <ErrorBoundary>
                <ProfileCompletion />
              </ErrorBoundary>
            }
          />
          <Route
            path="/tags-page"
            element={
              <ErrorBoundary>
                <TagsPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/post-login"
            element={
              <ErrorBoundary>
                <PostLoginRedirect />
              </ErrorBoundary>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

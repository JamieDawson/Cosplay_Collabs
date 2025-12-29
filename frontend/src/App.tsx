import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavBar from "./Components/NavBar/NavBar.component";
import HomePage from "./Pages/HomePage/HomePage";
import AboutPage from "./Pages/AboutPage/AboutPage";
import AddPostPage from "./Pages/AddPostPage/AddPostPage";
import PlacesPage from "./Pages/PlacesPage/PlacesPage";
import LocationDetails from "./Components/LocationDetails/LocationDetails";
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
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/add-post" element={<AddPostPage />} />
          <Route path="/places" element={<PlacesPage />} />
          <Route
            path="/places/:country/:state/:city"
            element={<LocationDetails />}
          />
          <Route path="/places/:country/:state" element={<StateDetails />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/UpdatePostForm" element={<UpdatePostForm />} />
          <Route path="/complete-profile" element={<ProfileCompletion />} />
          <Route path="/tags-page" element={<TagsPage />} />
          <Route path="/post-login" element={<PostLoginRedirect />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

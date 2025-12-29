import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavBar from "./Components/NavBar/NavBar.component";
import InstagramComponent from "./Components/InstagramComponent/InstagramComponent.component";
import CreateAdForm from "./Components/CreateAdForm/CreateAdForm";
import HomePage from "./Pages/HomePage/HomePage";
import AboutPage from "./Pages/AboutPage/AboutPage";
import LocationsMapper from "./Components/LocationsMapper/LocationsMapper.component";
import LocationDetails from "./Components/LocationDetails/LocationDetails";
import Profile from "./Pages/ProfilePage/Profile";
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
          <Route path="/add-post" element={<CreateAdForm />} />
          <Route path="/places" element={<LocationsMapper />} />
          <Route
            path="/places/:country/:state/:city"
            element={<LocationDetails />}
          />
          <Route path="/places/:country/:state" element={<StateDetails />} />
          <Route path="/profile/:username" element={<Profile />} />
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

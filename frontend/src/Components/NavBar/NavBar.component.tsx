import { Link } from "react-router-dom";
import LoginButton from "../Auth0/LoginButton/LoginButton.component";
import LogOutButton from "../Auth0/LogOutButton/LogOutButton.component";
import SignUpButton from "../Auth0/SignUpButton/SignUpButton.component";
import { useAuth0 } from "@auth0/auth0-react";
import { useUser } from "../../UserContext";

const NavBar: React.FC = () => {
  const { user } = useAuth0();
  const { username } = useUser();
  console.log(JSON.stringify(user));
  return (
    <nav className="sticky top-0 z-50 w-full bg-gray-800 text-white shadow-lg">
      <div className="flex justify-between items-center py-3 px-4 md:px-8">
        <div className="text-2xl font-bold">
          <Link
            to="/"
            className="text-white hover:text-cyan-400 transition-colors"
          >
            Cosplay Collabs
          </Link>
        </div>
        <ul className="flex flex-wrap gap-4 md:gap-5 list-none m-0 p-0 pr-4 md:pr-8 items-center">
          {user && (
            <li className="hidden md:block">
              <Link
                to={`/profile/${username}`}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-full text-white text-sm font-medium transition-colors shadow-md"
              >
                <span>👤</span>
                <span>{username}</span>
              </Link>
            </li>
          )}
          <li>
            <SignUpButton />
          </li>
          <li>
            <LoginButton />
          </li>
          <li>
            <LogOutButton />
          </li>
          <li>
            <Link
              to="/"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium text-sm transition-colors shadow-md"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/about"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium text-sm transition-colors shadow-md"
            >
              About
            </Link>
          </li>
          <li>
            <Link
              to="/places"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium text-sm transition-colors shadow-md"
            >
              Places
            </Link>
          </li>
          <li>
            <Link
              to="/tags-page"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium text-sm transition-colors shadow-md"
            >
              Search tags
            </Link>
          </li>
          <li>
            <Link
              to="/add-post"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-colors shadow-md"
            >
              Add Post
            </Link>
          </li>

          {user && (
            <li>
              <Link
                to={`/profile/${username}`}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium text-sm transition-colors shadow-md"
              >
                Profile
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;

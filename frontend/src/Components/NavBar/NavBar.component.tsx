import { Link, useLocation } from "react-router-dom";
import LoginButton from "../Auth0/LoginButton/LoginButton.component";
import LogOutButton from "../Auth0/LogOutButton/LogOutButton.component";
import SignUpButton from "../Auth0/SignUpButton/SignUpButton.component";
import { useAuth0 } from "@auth0/auth0-react";
import { useUser } from "../../UserContext";

const linkBase =
  "inline-flex items-center justify-center rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

const NavBar: React.FC = () => {
  const { user } = useAuth0();
  const { username } = useUser();
  const { pathname } = useLocation();

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b border-white/10 bg-gradient-nav shadow-lg shadow-sky-500/5 backdrop-blur-xl"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="text-xl font-extrabold tracking-tight md:text-2xl">
          <Link
            to="/"
            className="bg-gradient-to-r from-sky-300 via-fuchsia-300 to-pink-400 bg-clip-text text-transparent transition-opacity hover:opacity-90"
          >
            Cosplay Collabs
          </Link>
        </div>

        <ul className="m-0 flex list-none flex-wrap items-center justify-end gap-2 p-0 md:gap-2.5">
          {user && username && (
            <li className="hidden md:block">
              <Link
                to={`/profile/${username}`}
                className={`${linkBase}  gap-1.5 border border-pink-400/30 bg-gradient-to-r from-pink-500/90 to-fuchsia-600/90 text-white shadow-md shadow-pink-500/20 hover:from-pink-400 hover:to-fuchsia-500`}
              >
                <span aria-hidden>👤</span>
                <span className="max-w-[10rem] truncate">{username}</span>
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
              className={`${linkBase} border border-sky-400/40 bg-sky-500/15 text-sky-100 hover:border-sky-300/60 hover:bg-sky-400/25`}
              aria-current={pathname === "/" ? "page" : undefined}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/about"
              className={`${linkBase} border border-sky-400/40 bg-sky-500/15 text-sky-100 hover:border-sky-300/60 hover:bg-sky-400/25`}
              aria-current={pathname === "/about" ? "page" : undefined}
            >
              About
            </Link>
          </li>
          <li>
            <Link
              to="/cosplay-map"
              className={`${linkBase} border border-sky-400/40 bg-sky-500/15 text-sky-100 hover:border-sky-300/60 hover:bg-sky-400/25`}
            >
              Map
            </Link>
          </li>
          <li>
            <Link
              to="/tags-page"
              className={`${linkBase} border border-sky-400/40 bg-sky-500/15 text-sky-100 hover:border-sky-300/60 hover:bg-sky-400/25`}
              aria-current={pathname === "/tags-page" ? "page" : undefined}
            >
              Tags
            </Link>
          </li>
          <li>
            <Link
              to="/add-post"
              className={`${linkBase} overflow-hidden border-0 bg-gradient-to-br from-sky-500 to-pink-500 text-white shadow-md shadow-pink-500/25 hover:from-sky-400 hover:to-pink-400`}
            >
              Add Post
            </Link>
          </li>

          {user && username && (
            <li className="md:hidden">
              <Link
                to={`/profile/${username}`}
                className={`${linkBase} border border-pink-400/30 bg-gradient-to-r from-pink-500/90 to-fuchsia-600/90 text-white`}
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

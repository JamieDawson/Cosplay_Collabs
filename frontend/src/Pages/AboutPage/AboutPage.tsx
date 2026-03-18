import { Link } from "react-router-dom";

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Find Your Next Cosplay Collab
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Post a cosplay ad, pin yourself on the map, and team up with cosplayers anywhere.
          </p>
        </div>

        {/* Getting Started Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center text-xl font-bold">1</span>
            Getting Started
          </h2>
          <div className="space-y-4 text-gray-700">
            <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
              <span className="text-2xl">👤</span>
              <div>
                <h3 className="font-semibold text-lg mb-2">Create an Account</h3>
                <p className="text-gray-600">
                  Hit <strong>Sign Up</strong> in the top bar and log in.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-pink-50 rounded-lg">
              <span className="text-2xl">✏️</span>
              <div>
                <h3 className="font-semibold text-lg mb-2">Pick a Username</h3>
                <p className="text-gray-600">
                  Finish the profile step so others can click your name and find you.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Creating Ads Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center text-xl font-bold">2</span>
            Creating Your First Ad
          </h2>
          <div className="space-y-4 text-gray-700">
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-500">
              <h3 className="font-semibold text-lg mb-3">Go to “Add Post”</h3>
              <p className="text-gray-600 mb-3">
                Click <Link to="/add-post" className="text-purple-600 hover:text-purple-700 font-semibold underline">Add Post</Link> to start a new cosplay ad in seconds.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-blue-600">📸</span> Instagram post
                </h4>
                <p className="text-sm text-gray-600">
                  Paste a public Instagram post and we’ll embed it automatically.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-green-600">📝</span> Title & blurb
                </h4>
                <p className="text-sm text-gray-600">
                  Write a short title and a quick description of the collab you want.
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-yellow-600">📍</span> Location
                </h4>
                <p className="text-sm text-gray-600">
                  Type your country, state, and city and we’ll drop a pin on the map.
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-purple-600">🏷️</span> Tags
                </h4>
                <p className="text-sm text-gray-600">
                  Add a few simple tags (like “anime” or “photoshoot”) so people can find you fast.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Browsing & Searching Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center text-xl font-bold">3</span>
            Finding Cosplay Collaborations
          </h2>
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl">
              <h3 className="font-semibold text-xl mb-3 flex items-center gap-2">
                <span className="text-2xl">🏠</span> Home
              </h3>
              <p className="text-gray-700 mb-3">
                The <Link to="/" className="text-purple-600 hover:text-purple-700 font-semibold underline">Home</Link> feed shows the newest cosplay ads from everyone.
              </p>
            </div>
            <div className="p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl">
              <h3 className="font-semibold text-xl mb-3 flex items-center gap-2">
                <span className="text-2xl">🔍</span> Search by tags
              </h3>
              <p className="text-gray-700 mb-3">
                Use <Link to="/tags-page" className="text-purple-600 hover:text-purple-700 font-semibold underline">Search tags</Link> to jump straight to ads that match a keyword.
              </p>
            </div>
            <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
              <h3 className="font-semibold text-xl mb-3 flex items-center gap-2">
                <span className="text-2xl">🗺️</span> Map
              </h3>
              <p className="text-gray-700 mb-3">
                Open the <Link to="/cosplay-map" className="text-purple-600 hover:text-purple-700 font-semibold underline">map</Link> to see every ad as a pin and tap a city to view its posts.
              </p>
            </div>
          </div>
        </div>

        {/* Managing Your Content Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center text-xl font-bold">4</span>
            Managing Your Content
          </h2>
          <div className="space-y-4">
            <div className="p-5 bg-gray-50 rounded-lg border-l-4 border-gray-400">
              <h3 className="font-semibold text-lg mb-2">📋 Your profile</h3>
              <p className="text-gray-600 mb-3">
                Your profile shows all your ads so you can quickly update or delete them.
              </p>
            </div>
            <div className="p-5 bg-red-50 rounded-lg border-l-4 border-red-400">
              <h3 className="font-semibold text-lg mb-2">⚠️ Quick notes</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                <li>You can only edit or delete your own ads.</li>
                <li>Make sure your Instagram post is public so it loads.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-lg p-8 md:p-12 text-white">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <span className="text-3xl">💡</span> Pro Tips
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="font-semibold mb-2">Use clear tags</p>
              <p className="text-sm opacity-90">Short, specific tags help the right people find you.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="font-semibold mb-2">Say what you need</p>
              <p className="text-sm opacity-90">One or two sentences about the collab is plenty.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="font-semibold mb-2">Keep it fresh</p>
              <p className="text-sm opacity-90">Edit or remove old ads so people see what’s current.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="font-semibold mb-2">Follow tags</p>
              <p className="text-sm opacity-90">Click tags you like to discover more similar ads.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;

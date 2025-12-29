import { Link } from "react-router-dom";

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            About Cosplay Collabs
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Welcome to Cosplay Collabs! This platform is designed for cosplayers to collaborate and connect. 
            Showcase your cosplay through ads and find like-minded cosplayers to join forces with. 
            Perfect for sharing your passion, forming groups, or planning themed events!
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
                  Click the <strong>Sign Up</strong> button in the navigation bar to create your account. 
                  You'll need to complete your profile after signing up to start creating ads.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-pink-50 rounded-lg">
              <span className="text-2xl">✏️</span>
              <div>
                <h3 className="font-semibold text-lg mb-2">Complete Your Profile</h3>
                <p className="text-gray-600">
                  After signing up, you'll be prompted to complete your profile. Add your username and other details 
                  to personalize your account and make it easier for others to find you.
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
              <h3 className="font-semibold text-lg mb-3">Navigate to "Add Post"</h3>
              <p className="text-gray-600 mb-3">
                Click on <Link to="/add-post" className="text-purple-600 hover:text-purple-700 font-semibold underline">Add Post</Link> in the navigation bar to create a new cosplay collaboration ad.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-blue-600">📸</span> Instagram Post URL
                </h4>
                <p className="text-sm text-gray-600">
                  Paste the URL of your Instagram post showcasing your cosplay. This will be displayed as an embed on your ad.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-green-600">📝</span> Title & Description
                </h4>
                <p className="text-sm text-gray-600">
                  Give your ad a catchy title (max 65 characters) and describe what you're looking for (max 200 characters).
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-yellow-600">📍</span> Location
                </h4>
                <p className="text-sm text-gray-600">
                  Select your country, state, and city so others can find cosplayers in their area.
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-purple-600">🏷️</span> Keywords/Tags
                </h4>
                <p className="text-sm text-gray-600">
                  Add up to 4 keywords or tags (e.g., "anime", "convention", "photoshoot") to help others find your ad.
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
                <span className="text-2xl">🏠</span> Home Page
              </h3>
              <p className="text-gray-700 mb-3">
                The <Link to="/" className="text-purple-600 hover:text-purple-700 font-semibold underline">Home page</Link> displays the most recent ads from all users. 
                Browse through cosplay posts and click on any that interest you to see more details.
              </p>
            </div>
            <div className="p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl">
              <h3 className="font-semibold text-xl mb-3 flex items-center gap-2">
                <span className="text-2xl">🔍</span> Search by Tags
              </h3>
              <p className="text-gray-700 mb-3">
                Use the <Link to="/tags-page" className="text-purple-600 hover:text-purple-700 font-semibold underline">Search for ads</Link> feature to find collaborations by keywords. 
                Simply type in a tag (like "anime" or "convention") and browse matching ads. You can also click on any tag 
                in an ad to see other posts with the same tag.
              </p>
            </div>
            <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
              <h3 className="font-semibold text-xl mb-3 flex items-center gap-2">
                <span className="text-2xl">🗺️</span> Browse by Location
              </h3>
              <p className="text-gray-700 mb-3">
                Visit the <Link to="/places" className="text-purple-600 hover:text-purple-700 font-semibold underline">Places</Link> page to find cosplayers in specific locations. 
                Navigate by country → state → city to see all ads in that area. Perfect for finding local collaborations!
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
              <h3 className="font-semibold text-lg mb-2">📋 Your Profile</h3>
              <p className="text-gray-600 mb-3">
                Visit your <strong>Profile</strong> page to see all your ads in one place. From here you can:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                <li>View all your posted collaborations</li>
                <li>Update your existing ads</li>
                <li>Delete ads you no longer need</li>
                <li>Manage your account settings</li>
              </ul>
            </div>
            <div className="p-5 bg-red-50 rounded-lg border-l-4 border-red-400">
              <h3 className="font-semibold text-lg mb-2">⚠️ Important Notes</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                <li>You can only edit or delete your own ads</li>
                <li>Deleting your profile is permanent and cannot be undone</li>
                <li>Make sure your Instagram post is set to public for the embed to work</li>
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
              <p className="font-semibold mb-2">Use Specific Tags</p>
              <p className="text-sm opacity-90">Be specific with your keywords to attract the right collaborators.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="font-semibold mb-2">Keep Descriptions Clear</p>
              <p className="text-sm opacity-90">Clearly state what kind of collaboration you're looking for.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="font-semibold mb-2">Update Regularly</p>
              <p className="text-sm opacity-90">Keep your ads current and update them as your needs change.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="font-semibold mb-2">Engage with Tags</p>
              <p className="text-sm opacity-90">Click on tags in ads to discover similar collaborations.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;

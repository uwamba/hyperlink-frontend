"use client";

import { useRouter } from "next/navigation";

const Header = () => {
  const router = useRouter(); // Next.js router to navigate programmatically

  // Logout function to clear the authentication token and redirect
  const handleLogout = () => {
    // Clear auth token and user data from localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");

    // Redirect to the login page after logout
    router.push("/signin");
  };

  return (
    <header className="bg-gray-900 text-white p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold">CRM Dashboard</h1>
      <div className="flex items-center space-x-4">
        <button className="lg:hidden p-2">
          <span className="material-icons">menu</span>
        </button>
        <div className="hidden lg:flex space-x-4">
          <button className="p-2 hover:bg-gray-700 rounded">Profile</button>
          <button
            className="p-2 hover:bg-gray-700 rounded"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

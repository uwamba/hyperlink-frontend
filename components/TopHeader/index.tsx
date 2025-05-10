"use client";

const TopHeader = () => {
  return (
    <header className="bg-blue-600 text-white py-2 sm:py-3">
      <div className="max-w-screen-xl mx-auto px-4 flex justify-between items-center">
        {/* Address */}
        <div className="text-sm sm:text-base">
          <span className="mr-6">
            <strong>Address:</strong> 1234 Street Name, City, Country
          </span>
        </div>

        {/* Email */}
        <div className="text-sm sm:text-base">
          <span className="mr-6">
            <strong>Email:</strong> contact@yourdomain.com
          </span>
        </div>

        {/* Contact Number */}
        <div className="text-sm sm:text-base">
          <span>
            <strong>Call Us:</strong> +123 456 789
          </span>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;

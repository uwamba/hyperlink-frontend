import SectionTitle from "../Common/SectionTitle";

const AboutPage = () => {
  return (
    <section id="about" className="py-16  bg-white">

        {/* About Section */}

        {/* Our Values Section */}
        <div className="container flex justify-center">
        <div className="bg-gray-100 py-16 w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-10">
              Our Values
            </h2>
          </div>


          <div className="w-full max-w-[1200px] px-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
                {/* Value Item 1 */}
                <div className="flex flex-col items-left text-left">
                  <div className="mb-6 p-4 rounded-full bg-blue-600 text-white w-20 h-20 flex items-left justify-left">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-12 h-12">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-12V7h-2V5h2V3h2v2h2v2h-2v2h-2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-left">Innovation</h3>
                  <p className="text-base text-left">We continuously innovate and adapt to new technologies, ensuring your business stays ahead in a fast-changing world.</p>
                </div>

                {/* Value Item 2 */}
                <div className="flex flex-col items-left text-left">
                  <div className="mb-6 p-4 rounded-full bg-green-600 text-white w-20 h-20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-12 h-12">
                      <path d="M10 2v6H4V2H2v12h2v-6h6v6h2V2h-2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-left">Reliability</h3>
                  <p className="text-base text-left">Our solutions are built to last, providing reliable services that ensure smooth business operations, every day.</p>
                </div>

                {/* Value Item 3 */}
                <div className="flex flex-col items-left text-left">
                  <div className="mb-6 p-4 rounded-full bg-orange-600 text-white w-20 h-20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-12 h-12">
                      <path d="M16 12H8v5H3v-5H0v-3h3V4h5V0h3v4h5v3h-5z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-left">Customer-Centric</h3>
                  <p className="text-base text-left">We put our customers first, ensuring our solutions are tailored to meet your specific needs and business goals.</p>
                </div>
              </div>
            </div>
            </div>
        </div>

        {/* Team Section */}

        {/* Contact Section */}
        <div className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white ">
              Get In Touch
            </h2>
          </div>

          <div className="flex items-center justify-center space-x-4">
            <p className="text-md">Feel free to contact us for a consultation or more details about our services.</p>
            <a
              href="mailto:info@yourcompany.com"
              className="inline-block px-8 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Contact Us
            </a>
          </div>

        </div>
        

    </section>
  );
};

export default AboutPage;

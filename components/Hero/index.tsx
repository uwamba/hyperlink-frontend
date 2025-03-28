"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const images = [
  "/images/hero/bg1.jpg",
  "/images/hero/bg2.jpg",
  "/images/hero/bg3.jpg",
];

const Hero = () => {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);
  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };


  return (
    <section
      id="Home"
      className="relative z-0 bg-white min-h-screen flex flex-col justify-center items-center pt-[100px] md:pt-[140px] overflow-visible"
    >
      {/* Background Image Slider */}
      <div className="absolute inset-0 z-[-10]">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentImage ? "opacity-100" : "opacity-0"
            }`}
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ))}
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black opacity-40" />
      </div>

      {/* Hero Content */}
      <div className="container relative z-10 text-center px-4">
        <h1 className="mb-4 text-3xl font-bold text-white sm:text-4xl md:text-5xl max-w-[90%] sm:max-w-[80%] md:max-w-[60%] mx-auto">
          Experience Lightning-Fast Internet & Smart Solutions!
        </h1>
        <p className="mb-8 text-lg text-white sm:text-xl md:text-2xl max-w-[85%] sm:max-w-[75%] md:max-w-[55%] mx-auto">
          Enjoy seamless connectivity with high-speed internet, smart home automation, 
          and top-tier networking solutions.
        </p>
      </div>

      {/* Overlapping Call to Action Section */}
      <section className="absolute w-[90%] sm:w-[80%] md:w-[70%] left-1/2 transform -translate-x-1/2 bottom-[-100px] sm:bottom-[-120px] md:bottom-[-150px] text-center bg-primary py-8 sm:py-10 md:py-12 rounded-lg shadow-lg">
        <div className="cta-content px-4 flex flex-col items-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3 sm:mb-4">
            Get Started Today!
          </h2>
          <p className="text-sm sm:text-lg text-white mb-4 sm:mb-6 max-w-[90%] sm:max-w-[75%]">
          Our competitive edge lies in our 
          advanced technology, which detects 
          disruptions before they impact our 
          clients, allowing us to address issues 
          proactively. Backed by over a decade of 
          experience in networking and customer 
          service, we ensure that our clients 
          receive the full value of their investment, 
          with service quality they can rely on.

          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <button
              onClick={() => scrollToSection("pricing")}
              className="rounded-lg bg-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold text-primary duration-300 ease-in-out hover:bg-gray-200"
            >
              Check our prices
            </button>
           
          </div>
        </div>
      </section>
    </section>
  );
};

export default Hero;

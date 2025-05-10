"use client";

import { useState, useEffect } from "react";

// Array containing objects with image and corresponding text content
const slides = [
  {
    image: "/images/hero/bg1.jpg",
    heading: "Experience Lightning-Fast Internet & Smart Solutions!",
    description:
      "Enjoy seamless connectivity with high-speed internet, smart home automation, and top-tier networking solutions.",
  },
  {
    image: "/images/hero/bg2.jpg",
    heading: "Stay Connected, Anytime, Anywhere!",
    description:
      "Reliable internet and smart solutions for your home or business—never miss a beat.",
  },
  {
    image: "/images/hero/bg3.jpg",
    heading: "Innovative Technology for a Better Tomorrow",
    description:
      "Empowering your life with cutting-edge technology and seamless connectivity. Future-ready solutions.",
  },
];

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      id="Home"
      className="relative z-0 pt-24 pb-40 sm:pt-28 sm:pb-48 md:pt-32 md:pb-56 bg-white"
    >
      {/* Background Slider */}
      <div className="absolute inset-0 z-[-10]">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ))}
        <div className="absolute inset-0 bg-black bg-opacity-60" />
      </div>

      {/* Hero Content */}
      <div
        className={`relative z-10 text-center px-4 max-w-screen-xl mx-auto transition-transform duration-1000 ${
          currentSlide === 0 ? "transform translate-x-0" : "transform translate-x-4"
        }`}
      >
        <h1 className="mb-4 text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-snug drop-shadow">
          {slides[currentSlide].heading}
        </h1>
        <p className="mb-8 text-sm sm:text-base md:text-lg text-white max-w-xl mx-auto leading-relaxed">
          {slides[currentSlide].description}
        </p>
      </div>

      {/* CTA Section */}
      <div className="absolute w-full bottom-[-110px] px-4">
        <div className="bg-blue-600 rounded-xl shadow-lg px-6 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12 text-white text-center max-w-xl mx-auto">
          <h2 className="text-base sm:text-lg font-semibold mb-3">
          Our Mission
          </h2>
          <p className="text-xs sm:text-sm md:text-base mb-4 leading-relaxed">
          Our mission is to empower businesses with cutting-edge technology, delivering innovative and scalable solutions that drive growth and success.
          </p>
          
        </div>
        
      </div>

      {/* Divider */}
    </section>
  );
};

export default Hero;

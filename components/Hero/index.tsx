"use client";
import { useState, useEffect } from "react";

const slides = [
  {
    image: "/images/hero/bg1.jpg",
    heading: "Experience Lightning-Fast Internet & Smart Solutions",
    description: "Seamless connectivity with high-speed internet, smart home automation, and top-tier networking solutions.",
    tag: "High Speed Internet",
  },
  {
    image: "/images/hero/bg2.jpg",
    heading: "Stay Connected, Anytime, Anywhere",
    description: "Reliable internet and smart solutions for your home or business — never miss a beat.",
    tag: "Always Online",
  },
  {
    image: "/images/hero/bg3.jpg",
    heading: "Innovative Technology for a Better Tomorrow",
    description: "Empowering your life with cutting-edge technology and seamless connectivity. Future-ready solutions.",
    tag: "Future Ready",
  },
];

const stats = [
  { value: "10K+", label: "Happy Clients" },
  { value: "99.9%", label: "Uptime" },
  { value: "24/7", label: "Support" },
  { value: "15+", label: "Years Experience" },
];

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setAnimating(false);
      }, 500);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="Home" className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* Background Slider */}
      <div className="absolute inset-0 z-0">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${i === currentSlide ? "opacity-100" : "opacity-0"}`}
            style={{ backgroundImage: `url(${slide.image})`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
        ))}
        {/* Multi-layer overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
      </div>

      {/* Decorative grid pattern */}
      <div className="absolute inset-0 z-0 opacity-10"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* Main Content */}
      <div className="relative z-10 max-w-screen-xl mx-auto px-6 pt-32 pb-20 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 text-white">
          {/* Tag */}
          <div className={`inline-flex items-center gap-2 mb-6 transition-all duration-500 ${animating ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"}`}>
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-blue-300">
              {slides[currentSlide].tag}
            </span>
          </div>

          {/* Heading */}
          <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 transition-all duration-500 ${animating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}>
            {slides[currentSlide].heading.split(" ").map((word, i) => (
              <span key={i} className={i % 4 === 3 ? "text-blue-400" : ""}>{word} </span>
            ))}
          </h1>

          {/* Description */}
          <p className={`text-base sm:text-lg text-gray-300 max-w-lg mb-10 leading-relaxed transition-all duration-500 delay-100 ${animating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}>
            {slides[currentSlide].description}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => scrollTo("Services")}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
            >
              Explore Services
            </button>
            <button
              onClick={() => scrollTo("Contact Us")}
              className="px-8 py-3.5 border border-white/30 hover:border-white/60 text-white font-semibold rounded-full backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
            >
              Get in Touch →
            </button>
          </div>
        </div>

        {/* Stats card */}
        <div className="flex-shrink-0 w-full lg:w-72">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 grid grid-cols-2 gap-4">
            {stats.map((s, i) => (
              <div key={i} className="text-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <div className="text-2xl font-black text-white mb-1">{s.value}</div>
                <div className="text-xs text-gray-400 font-medium">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Mission card */}
          <div className="mt-4 bg-blue-600/90 backdrop-blur-md border border-blue-500/50 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🎯</span>
              <h3 className="font-bold text-sm">Our Mission</h3>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed">
              Empowering businesses with cutting-edge technology, delivering innovative and scalable solutions that drive growth and success.
            </p>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`transition-all duration-300 rounded-full ${i === currentSlide ? "w-8 h-2 bg-blue-400" : "w-2 h-2 bg-white/40 hover:bg-white/60"}`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
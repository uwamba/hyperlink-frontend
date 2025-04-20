import AboutSectionOne from "@/components/About/AboutSectionOne";
import AboutSectionTwo from "@/components/About/AboutSectionTwo";
import Blog from "@/components/Blog";
import Brands from "@/components/Brands";
import ScrollUp from "@/components/Common/ScrollUp";
import Contact from "@/components/Contact";
import Features from "@/components/Features";
import Hero from "@/components/Hero";
import Pricing from "@/components/Pricing";
import WebsiteLayout from '@/components/layouts/WebsiteLayout';
import Testimonials from "@/components/Testimonials";
import Video from "@/components/Video";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hyperlink Network",
  description: "Hyperlink Network",
  // other metadata
};

export default function Home() {
  return (
    <WebsiteLayout>
      <ScrollUp />
      <Hero />
      <Features />     
      <Pricing />
      <Contact />
      <Brands />
      </WebsiteLayout>
  );
}

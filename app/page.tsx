
import Brands from "@/components/Brands";
import Contact from "@/components/Contact";
import Features from "@/components/Features";
import Hero from "@/components/Hero";
import WebsiteLayout from '@/components/layouts/WebsiteLayout';
import { Metadata } from "next";
import AboutPage from "./about/page";
import Chatbot from "@/components/Chatbot";

export const metadata: Metadata = {
  title: "Hyperlink Network",
  description: "Hyperlink Network",
  // other metadata
};

export default function Home() {
  return (
    <WebsiteLayout>
      <Hero />
      <AboutPage />
      <Features />     
      <Contact />
      <Brands />
      <Chatbot /> 
      </WebsiteLayout>
  );
}

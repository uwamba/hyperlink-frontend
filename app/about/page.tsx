import AboutSectionOne from "@/components/About";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Page | Free Next.js Template for Startup and SaaS",
  description: "This is About Page for Startup Nextjs Template",
  // other metadata
};

const AboutPage = () => {
  return (
    <>
      
      <AboutSectionOne />

    </>
  );
};

export default AboutPage;

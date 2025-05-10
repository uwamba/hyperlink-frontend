import { Feature } from "@/types/feature";

const featuresData: Feature[] = [
  {
    id: 1,
    icon: <i className="fas fa-user-tie text-2xl"></i>,  // IT Consultancy
    title: "IT Consultancy",
    paragraph:
      "We offer professional IT consultancy services to help businesses and organizations make strategic technology decisions. From infrastructure planning to cybersecurity assessments, our experts provide tailored solutions to align IT systems with your goals.",
  },
  {
    id: 2,
    icon: <i className="fas fa-home text-2xl"></i>,  // Smart Home
    title: "Smart Home Solutions",
    paragraph:
      "Transform your home with intelligent automation systems. Our smart home solutions include security cameras, smart lighting, remote-controlled appliances, and voice integration — all designed for convenience, safety, and energy efficiency.",
  },
  {
    id: 3,
    icon: <i className="fas fa-network-wired text-2xl"></i>,  // Network Installations
    title: "Network Installations",
    paragraph:
      "We design and implement secure and scalable network infrastructures for homes, businesses, and institutions. Our services include cabling, router/switch configuration, wireless access point setup, and performance optimization.",
  },
  {
    id: 4,
    icon: <i className="fas fa-vials text-2xl"></i>,  // Lab Setup
    title: "Computer Lab Setup",
    paragraph:
      "We offer end-to-end computer lab setup services for schools, training centers, and offices. Our team handles hardware procurement, network layout, system installation, and configuration for a smooth learning or working environment.",
  },
  {
    id: 5,
    icon: <i className="fas fa-server text-2xl"></i>,  // Server Room
    title: "Server Room Installations",
    paragraph:
      "Ensure stability and efficiency with our expert server room design and installation services. We manage layout planning, cabling, cooling systems, and rack setup to support business-critical infrastructure.",
  },
  {
    id: 6,
    icon: <i className="fas fa-truck text-2xl"></i>,  // Server Delivery
    title: "Server & Network Equipment Delivery",
    paragraph:
      "We deliver and install servers and networking hardware with professional care and precision. From small business setups to enterprise-scale deployments, our logistics and technical team ensure everything is ready to run.",
  },
  {
    id: 7,
    icon: <i className="fas fa-tools text-2xl"></i>,  // Configuration
    title: "Equipment Configuration",
    paragraph:
      "Our technicians configure routers, firewalls, switches, and access points to ensure optimal network performance and security. Whether deploying new infrastructure or upgrading existing setups, we tailor configurations to your environment.",
  },
];

export default featuresData;

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupStorageBuckets } from "./utils/setupStorage";

const root = document.getElementById("root");

// Add title and meta tags
document.title = "Chefy - Chef-first Freelance Booking Platform";
const metaDescription = document.createElement("meta");
metaDescription.name = "description";
metaDescription.content = "Chefy is a chef-first platform connecting freelance chefs with hospitality businesses. Find culinary talent or your next booking opportunity.";
document.head.appendChild(metaDescription);

// Add Open Graph tags
const ogTitle = document.createElement("meta");
ogTitle.setAttribute("property", "og:title");
ogTitle.content = "Chefy - Chef-first Freelance Booking Platform";
document.head.appendChild(ogTitle);

const ogDescription = document.createElement("meta");
ogDescription.setAttribute("property", "og:description");
ogDescription.content = "Connect culinary talent with hospitality businesses. Find your next chef or booking opportunity with Chefy.";
document.head.appendChild(ogDescription);

const ogType = document.createElement("meta");
ogType.setAttribute("property", "og:type");
ogType.content = "website";
document.head.appendChild(ogType);

// Include Inter and Poppins fonts
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;600;700&display=swap";
document.head.appendChild(fontLink);

// Initialize storage buckets
setupStorageBuckets().catch(err => {
  console.error('Failed to initialize storage buckets:', err);
});

createRoot(root!).render(<App />);

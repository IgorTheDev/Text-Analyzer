import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log('=== MAIN.TSX EXECUTING ===');
console.log('Document readyState:', document.readyState);
console.log('Root element:', document.getElementById("root"));

// Simple mobile test
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  console.log('📱 Mobile device detected');
}

// Set dark theme by default
document.documentElement.classList.add("dark");

console.log('=== CREATING REACT ROOT ===');
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('Root element not found!');
} else {
  console.log('Root element found, creating React root...');
  const root = createRoot(rootElement);
  console.log('React root created, rendering App...');
  root.render(<App />);
  console.log('App rendered successfully');
}

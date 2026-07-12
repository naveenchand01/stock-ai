import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import '@/lib/firebase-test' // Firebase connection diagnostics (dev only)";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

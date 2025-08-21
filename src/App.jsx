import React, { useState, useCallback, useEffect, useRef } from "react";
import ImagePlaceholder from "./components/ImagePlaceholder";
import Header from "./components/Header";

// Main application component
export default function App() {
  // State management for the application
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("img3");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const models = [
    { id: "img3", name: "imagen 3" },
    { id: "img4", name: "imagen 4" },
    { id: "uncen", name: "uncen" },
    { id: "qwen", name: "qwen" },
    { id: "gemini2.0", name: "gemini2.0" },
  ];

  // Effect hook to load the Remix Icons stylesheet dynamically
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Effect hook to handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  /**
   * Makes the actual API call to the infip.pro image generation endpoint.
   */
  const callImageGenerationAPI = async (prompt, model, timeout = 30000) => {
    if (!prompt?.trim()) throw new Error("Prompt required");
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      try {
        const res = await fetch(`http://localhost:5000/generate-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: prompt.trim(), model }),
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.message || `Status ${res.status}`);
        }
        const json = await res.json();
        if (!json?.url) throw new Error("No image returned");
        return json.url;
      } catch (err) {
        clearTimeout(timer);
        attempt++;
        if (attempt >= maxRetries) throw err;
        const jitter = Math.random() * 500;
        await new Promise((r) =>
          setTimeout(r, Math.pow(2, attempt) * 1000 + jitter)
        );
      }
    }
  };

  /**
   * Handles the form submission to generate an image, with retry logic.
   */
  const handleGenerateClick = useCallback(async () => {
    if (!prompt) {
      setError("Please enter a prompt.");
      return;
    }
    setError(null);
    setIsLoading(true);
    setImageUrl("");

    let attempt = 0;
    const maxRetries = 3;

    while (attempt < maxRetries) {
      try {
        const resultUrl = await callImageGenerationAPI(prompt, model);
        setImageUrl(resultUrl);
        setIsLoading(false);
        return;
      } catch (err) {
        attempt++;
        if (attempt >= maxRetries) {
          console.error("Error generating image:", err);
          setError("Failed to generate image. Please try again.");
          setIsLoading(false);
          return;
        }
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }, [prompt, model]);

  const handleModelSelect = (modelId) => {
    setModel(modelId);
    setIsDropdownOpen(false);
  };

  return (
    <div className="main-page bg-neutral-950 text-gray-200 min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-16 max-w-7xl ">
        {/* Header */}
        <Header />
        {/* Main */}
        <main className="grid gap-8 lg:grid-cols-2">
          {/* Left: Form */}
          <div className="bg-zinc-900/50 rounded-2xl p-6 shadow-lg backdrop-blur-sm border border-zinc-800 h-full">
            <div className="w-full mb-4">
              <label
                htmlFor="prompt-input"
                className="flex items-center mb-2 text-sm font-medium text-gray-300"
              >
                <i className="ri-keyboard-box-line mr-2 text-lg"></i>Enter your
                prompt
              </label>
              <textarea
                id="prompt-input"
                rows="4"
                maxLength={200}
                className="block p-2.5 w-full text-sm text-gray-200 bg-zinc-800 rounded-lg border border-zinc-700 focus:ring-lime-500 focus:border-lime-500 placeholder-zinc-500"
                placeholder="e.g., A majestic lion in a field of wildflowers"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <div className="text-right text-xs text-gray-400 mt-1">
                {prompt.length}/200
              </div>
            </div>

            {/* Dropdown */}
            <div className="w-full mb-4 relative" ref={dropdownRef}>
              <label className="flex items-center mb-2 text-sm font-medium text-gray-300">
                <i className="ri-list-settings-line mr-2 text-lg"></i>Choose a
                model
              </label>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="bg-zinc-800 border border-zinc-700 text-gray-200 text-sm rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 w-full p-2.5 flex justify-between items-center"
              >
                {models.find((m) => m.id === model)?.name || "Select a model"}
                <i
                  className={`ri-arrow-down-s-line transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                ></i>
              </button>
              {isDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg">
                  <ul className="py-1">
                    {models.map((m) => (
                      <li
                        key={m.id}
                        onClick={() => handleModelSelect(m.id)}
                        className="px-4 py-2 text-sm text-gray-200 hover:bg-lime-400 hover:text-black cursor-pointer"
                      >
                        {m.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Button */}
              <button
                onClick={handleGenerateClick}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-black bg-lime-400 rounded-lg hover:bg-lime-500 focus:ring-4 focus:ring-lime-300/50 transition-all duration-300 disabled:bg-zinc-500 disabled:cursor-not-allowed"
              >
                <i className="ri-magic-line mr-2"></i>
                {isLoading ? "Generating..." : "Generate Image"}
              </button>
          </div>

          {/* Right: Output */}
          <div className="flex items-center justify-center h-full">
            {isLoading || error || imageUrl ? (
              <div className="w-full aspect-square bg-zinc-900/50 rounded-2xl flex items-center justify-center border border-zinc-800">
                {isLoading && (
                  <div className="loader-div flex flex-col items-center justify-center gap-2">
                    <div className="loader animate-spin"></div>
                    <p className="text-gray-500 mt-2">
                      Generating your image...
                    </p>
                  </div>
                )}
                {error && (
                  <div className="text-center text-red-400 p-4">{error}</div>
                )}
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Generated art"
                    className="rounded-lg max-w-full max-h-full"
                  />
                )}
              </div>
            ) : (
              <ImagePlaceholder />
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center mt-12 pt-6 border-t border-zinc-800">
          <p className="text-zinc-600 text-sm font-montserrat">
            Powered by{" "}
            <a
              href="https://infip.pro/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lime-700 hover:text-lime-400 hover:underline"
            >
              Infip Pro
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

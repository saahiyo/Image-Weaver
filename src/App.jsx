import React, { useState, useCallback, useEffect, useRef } from "react";

// This component injects the global styles, including the custom font and loader animation.
const GlobalStyles = () => (
  <style>{`
        .loader {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #a3e635; /* lime-400 */
            border-radius: 50%;
            width: 40px;
            height: 40px;
        }
    `}</style>
);

// Placeholder component for when no image has been generated yet.
const ImagePlaceholder = () => (
  <div className=" mt-8 w-full aspect-square bg-zinc-900/50 rounded-2xl flex items-center justify-center border border-zinc-800">
    <div className="text-center text-zinc-500">
      <svg
        className="mx-auto h-12 w-12"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
        />
      </svg>
      <p className="mt-2 text-sm font-raneva">
        Your generated image will appear here
      </p>
    </div>
  </div>
);

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
    { id: "img3", name: "img3" },
    { id: "img4", name: "img4" },
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
  const callImageGenerationAPI = async (currentPrompt, currentModel) => {
    const response = await fetch("http://localhost:5000/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: currentPrompt, model: currentModel }),
    });
    // Input validation
    if (!currentPrompt || !currentModel) {
      throw new Error("Prompt and model are required");
    }

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Backend Error Response:", errorBody);
      throw new Error(`Backend request failed with status ${response.status}`);
    }

    const result = await response.json();

    if (result.url) {
      return result.url;
    } else {
      console.error("Unexpected backend response:", result);
      throw new Error("Image URL not found in backend response.");
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
    <div className="main-page bg-neutral-950 text-gray-200">
      <GlobalStyles />
      <div className="container mx-auto px-4 py-8 md:py-16 max-w-2xl">
        <header className="text-center mb-10">
          <h1 className="font-raneva text-5xl md:text-6xl font-bold text-lime-400 tracking-wider">
            Image Weaver
          </h1>
          <p className="font-raneva-italic text-lg md:text-xl text-gray-500 mt-2">
            Bring your words to life
          </p>
        </header>

        <main>
          <div className="bg-zinc-900/50 rounded-2xl p-6 shadow-lg backdrop-blur-sm border border-zinc-800">
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
                className="block p-2.5 w-full text-sm text-gray-200 bg-zinc-800 rounded-lg border border-zinc-700 focus:ring-lime-500 focus:border-lime-500 placeholder-zinc-500"
                placeholder="e.g., A majestic lion in a field of wildflowers"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
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
                {model}
                <i
                  className={`ri-arrow-down-s-line transition-transform duration-200 ${
                    isDropdownOpen ? "transform rotate-180" : ""
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
            <button
              onClick={handleGenerateClick}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-black bg-lime-400 rounded-lg hover:bg-lime-500 focus:ring-4 focus:ring-lime-300/50 transition-all duration-300 disabled:bg-zinc-500 disabled:cursor-not-allowed"
            >
              <i className="ri-magic-line mr-2"></i>
              {isLoading ? "Generating..." : "Generate Image"}
            </button>
          </div>

          {isLoading || error || imageUrl ? (
            <div className="mt-8 w-full aspect-square bg-zinc-900/50 rounded-2xl flex items-center justify-center border border-zinc-800">
              {isLoading && <div className="loader animate-spin"></div>}
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
        </main>

        <footer className="text-center mt-12 pt-6 border-t border-zinc-800">
          <p className="text-zinc-600 text-sm">Powered by infip.pro</p>
        </footer>
      </div>
    </div>
  );
}

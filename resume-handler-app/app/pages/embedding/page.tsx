"use client";

import { useState } from "react";

export default function EmbeddingTestPage() {
  const [id, setId] = useState("test123");
  const [name, setName] = useState("Test User");
  const [email, setEmail] = useState("test@example.com");
  const [linkedin, setLinkedin] = useState("https://linkedin.com/in/test");
  const [text, setText] = useState("");

  const [embedding, setEmbedding] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchEmbedding = async () => {
    setLoading(true);
    setError("");
    setEmbedding(null);

    try {
      const response = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name, email, linkedin, text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch embedding.");
      }

      setEmbedding(data.embedding);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Test Embedding API</h1>

      <div className="mb-4">
        <label className="block font-medium">ID:</label>
        <input
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block font-medium">Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block font-medium">Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block font-medium">LinkedIn:</label>
        <input
          type="url"
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block font-medium">Text:</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to generate embedding..."
          className="w-full p-3 border rounded-lg"
        />
      </div>

      <button
        onClick={fetchEmbedding}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
      >
        {loading ? "Generating..." : "Get Embedding"}
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {embedding && (
        <div className="mt-4 p-3 border rounded bg-gray-100">
          <h2 className="text-lg font-medium">Embedding Output:</h2>
          <pre className="text-sm break-words">{JSON.stringify(embedding, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

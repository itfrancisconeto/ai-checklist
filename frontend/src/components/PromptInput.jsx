import React, { useState } from "react";

function PromptInput({ onGenerate, loading }) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const value = prompt.trim();

    if (value && !loading) {
      onGenerate(value);
    }
  };

  return (
    <form className="prompt-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Ex: estudar para uma entrevista de React"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        disabled={loading}
      />
      <button type="submit" disabled={loading || !prompt.trim()}>
        {loading ? "Gerando..." : "Gerar checklist"}
      </button>
    </form>
  );
}

export default PromptInput;

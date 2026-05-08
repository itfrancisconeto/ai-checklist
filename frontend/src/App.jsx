import React, { useMemo, useState } from "react";
import PromptInput from "./components/PromptInput";
import ChecklistItem from "./components/ChecklistItem";
import ProgressBar from "./components/ProgressBar";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const completedCount = useMemo(
    () => items.filter((item) => item.done).length,
    [items]
  );

  const handleGenerate = async (prompt) => {
    setLoading(true);
    setError("");
    setItems([]);

    try {
      const res = await fetch(`${API_URL}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Não foi possível gerar o checklist.");
      }

      const parsedItems = (data.items || [])
        .filter(Boolean)
        .map((task, index) => ({
          id: crypto.randomUUID?.() || `${Date.now()}-${index}`,
          task,
          done: false,
        }));

      setItems(parsedItems);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (id) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };

  return (
    <main className="app">
      <section className="hero">
        <span className="badge">AI Checklist Generator</span>
        <h1>Checklist AI</h1>
        <p>
          Digite um objetivo e gere uma lista prática de tarefas com apoio de um
          modelo local executado pelo Ollama.
        </p>
      </section>

      <section className="card">
        <PromptInput onGenerate={handleGenerate} loading={loading} />

        {error && <p className="error">{error}</p>}
        {loading && <p className="status">Gerando checklist...</p>}

        {items.length > 0 && (
          <>
            <ProgressBar items={items} />
            <p className="summary">
              {completedCount} de {items.length} tarefas concluídas
            </p>
            <div className="checklist">
              {items.map((item) => (
                <ChecklistItem key={item.id} item={item} onToggle={toggleItem} />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default App;

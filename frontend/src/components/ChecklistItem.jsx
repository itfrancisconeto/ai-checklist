import React from "react";

function ChecklistItem({ item, onToggle }) {
  return (
    <label className={`item ${item.done ? "item-done" : ""}`}>
      <input
        type="checkbox"
        checked={item.done}
        onChange={() => onToggle(item.id)}
      />
      <span>{item.task}</span>
    </label>
  );
}

export default ChecklistItem;

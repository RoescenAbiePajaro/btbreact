import React from "react";

export default function Toolbar({
  isEraser,
  setIsEraser,
  clearCanvas,
  undo,
  redo,
  downloadImage,
  zoom,
  zoomIn,
  zoomOut,
  color,
  setColor,
  brushSize,
  setBrushSize,
  handleFileInsert
}) {
  return (
    <aside className="w-full sm:w-20 bg-black rounded-2xl p-3 shadow flex sm:flex-col flex-row items-center gap-3 sm:gap-2 overflow-x-auto">
      <div className="flex sm:flex-col gap-2 w-full items-center justify-center">
        <div className="text-xs text-white hidden sm:block">Tools</div>
        <button
          title="Brush / Marker"
          onClick={() => setIsEraser(false)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            !isEraser ? "ring-2 ring-indigo-200" : ""
          }`}
        >
          ✏️
        </button>
        <button
          title="Eraser"
          onClick={() => setIsEraser(true)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isEraser ? "ring-2 ring-indigo-200" : ""
          }`}
        >
          🧽
        </button>
        <button
          title="Clear"
          onClick={clearCanvas}
          className="w-10 h-10 rounded-lg flex items-center justify-center"
        >
          🗑️
        </button>
        <button
          title="Undo"
          onClick={undo}
          className="w-10 h-10 rounded-lg flex items-center justify-center"
        >
          ↩️
        </button>
        <button
          title="Redo"
          onClick={redo}
          className="w-10 h-10 rounded-lg flex items-center justify-center"
        >
          ↪️
        </button>
        <button
          title="Save"
          onClick={downloadImage}
          className="w-10 h-10 rounded-lg flex items-center justify-center"
        >
          💾
        </button>
      </div>

      <div className="hidden sm:block w-full text-center text-xs text-white">
        Zoom
      </div>
      <div className="flex sm:flex-col items-center gap-2 text-white">
        <button onClick={zoomIn} className="w-10 h-10 rounded-lg">
          ＋
        </button>
        <div className="text-sm text-white">{Math.round(zoom * 100)}%</div>
        <button onClick={zoomOut} className="w-10 h-10 rounded-lg">
          －
        </button>
      </div>
    </aside>
  );
}
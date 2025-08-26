// Toolbar.jsx
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
  handleFileInsert,
  toolMode,
  setToolMode,
  textData,
  setTextData,
  drawTextOnCanvas,
  // Add new props for translate
  translate,
  setTranslate,
  resetTransform,
  // Add placeholder props
  placeholderText,
  setPlaceholderText,
}) {
  return (
    <aside className="w-full sm:w-20 bg-black rounded-2xl p-3 shadow flex sm:flex-col flex-row items-center gap-3 sm:gap-2 overflow-x-auto">
      <div className="flex sm:flex-col gap-2 w-full items-center justify-center">
        <button
          title="Add Text"
          onClick={() => {
            setToolMode("text");
            setIsEraser(false);
          }}
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            toolMode === "text" ? "ring-2 ring-indigo-200" : ""
          }`}
        >
          📝
        </button>
        <button
          title="Brush / Brush"
          onClick={() => {
            setToolMode("draw");
            setIsEraser(false);
          }}
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            !isEraser && toolMode === "draw" ? "ring-2 ring-indigo-200" : ""
          }`}
        >
          🖌️
        </button>
        <button
          title="Eraser"
          onClick={() => {
            setToolMode("draw");
            setIsEraser(true);
          }}
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isEraser ? "ring-2 ring-indigo-200" : ""
          }`}
        >
          🧽
        </button>
        <button
          title="Translate"
          onClick={() => setToolMode("translate")}
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            toolMode === "translate" ? "ring-2 ring-indigo-200" : ""
          }`}
        >
          🚚
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
      
      
      
      {/* Display current transform values */}
      {toolMode === "translate" && (
        <div className="text-white text-xs mt-2">
          X: {Math.round(translate.x)}<br />
          Y: {Math.round(translate.y)}
        </div>
      )}
    </aside>
  );
}
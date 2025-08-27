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
  translate,
  setTranslate,
  resetTransform,
  placeholderText,
  setPlaceholderText,
}) {
  return (
    <aside className="w-full sm:w-20 rounded-2xl p-3 shadow flex sm:flex-col flex-row items-center gap-3 sm:gap-2 overflow-x-auto">
      <div className="flex sm:flex-col gap-2 w-full items-center justify-center">
        <button
          title="Add Text"
          onClick={() => {
            setToolMode("text");
            setIsEraser(false);
          }}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            toolMode === "text" 
              ? "bg-blue-500 text-white" 
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          <i className="fas fa-font text-sm"></i>
        </button>
        <button
          title="Brush / Brush"
          onClick={() => {
            setToolMode("draw");
            setIsEraser(false);
          }}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            !isEraser && toolMode === "draw" 
              ? "bg-blue-500 text-white" 
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          <i className="fas fa-paint-brush text-sm"></i>
        </button>
        <button
          title="Eraser"
          onClick={() => {
            setToolMode("draw");
            setIsEraser(true);
          }}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            isEraser 
              ? "bg-blue-500 text-white" 
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          <i className="fas fa-eraser text-sm"></i>
        </button>
        <button
          title="Translate"
          onClick={() => setToolMode("translate")}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            toolMode === "translate" 
              ? "bg-blue-500 text-white" 
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          <i className="fas fa-arrows-alt text-sm"></i>
        </button>
        <button
          title="Undo"
          onClick={undo}
          className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
        >
          <i className="fas fa-undo text-sm"></i>
        </button>
        <button
          title="Redo"
          onClick={redo}
          className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
        >
          <i className="fas fa-redo text-sm"></i>
        </button>
        <button
          title="Save"
          onClick={downloadImage}
          className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
        >
          <i className="fas fa-save text-sm"></i>
        </button>
      </div>

      <div className="hidden sm:block w-full text-center text-xs text-gray-400">
        Zoom
      </div>
      <div className="flex sm:flex-col items-center gap-2 text-white">
        <button 
          onClick={zoomIn} 
          className="w-10 h-10 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors flex items-center justify-center"
        >
          <i className="fas fa-plus text-sm"></i>
        </button>
        <div className="text-sm text-gray-300">{Math.round(zoom * 100)}%</div>
        <button 
          onClick={zoomOut} 
          className="w-10 h-10 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors flex items-center justify-center"
        >
          <i className="fas fa-minus text-sm"></i>
        </button>
      </div>
      
      {/* Display current transform values */}
      {toolMode === "translate" && (
        <div className="text-gray-300 text-xs mt-2 text-center">
          X: {Math.round(translate.x)}<br />
          Y: {Math.round(translate.y)}
        </div>
      )}
    </aside>
  );
}
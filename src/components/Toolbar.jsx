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
  toolMode,
  setToolMode,
  textData,
  setTextData,
  drawTextOnCanvas,
  cancelTextInput,
  isTyping,
  translate,
  setTranslate,
  resetTransform,
}) {
  return (
    <aside className="w-full sm:w-64 rounded-2xl p-3 shadow flex sm:flex-col flex-row items-center gap-3 sm:gap-2 overflow-x-auto">
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

      {/* Text input controls - only show when in text mode or typing */}
      {(toolMode === "text" || isTyping) && (
        <div className="bg-gray-800 p-3 rounded-lg mt-2 w-full">
          <div className="text-xs text-gray-300 mb-2">Text Options</div>
          
          <div className="mb-2">
            <label className="text-xs text-gray-300 block mb-1">Font Size</label>
            <input
              type="range"
              min="8"
              max="72"
              value={textData.fontSize}
              onChange={(e) => setTextData({ ...textData, fontSize: Number(e.target.value) })}
              className="w-full"
            />
            <input
              type="number"
              min="8"
              max="72"
              value={textData.fontSize}
              onChange={(e) => setTextData({ ...textData, fontSize: Number(e.target.value) })}
              className="w-full px-1 py-0.5 rounded text-black text-sm mt-1"
            />
          </div>
          
          <div className="mb-2">
            <label className="text-xs text-gray-300 block mb-1">Font Family</label>
            <select
              value={textData.font}
              onChange={(e) => setTextData({ ...textData, font: e.target.value })}
              className="w-full px-1 py-0.5 rounded text-black text-sm"
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Verdana">Verdana</option>
              <option value="Georgia">Georgia</option>
            </select>
          </div>
          
          {isTyping && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={drawTextOnCanvas}
                className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Add Text
              </button>
              <button
                onClick={cancelTextInput}
                className="flex-1 px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      <div className="hidden sm:block w-full text-center text-xs text-gray-400 mt-4">
        Zoom
      </div>
      <div className="flex sm:flex-col items-center gap-2 text-white mt-2">
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
        <div className="text-gray-300 text-xs mt-2 text-center bg-gray-800 p-2 rounded-lg w-full">
          <div>Position</div>
          <div>X: {Math.round(translate.x)}</div>
          <div>Y: {Math.round(translate.y)}</div>
          <button
            onClick={resetTransform}
            className="mt-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 w-full"
          >
            Reset Position
          </button>
        </div>
      )}
    </aside>
  );
}
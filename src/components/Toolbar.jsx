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
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-2 shadow-lg z-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-center gap-2">
        {/* Text input controls - only show when in text mode or typing */}
        {(toolMode === "text" || isTyping) && (
          <div className="bg-gray-700 p-3 rounded-lg flex flex-col md:flex-row md:items-center md:justify-center gap-2 w-full">
            <div className="text-xs text-gray-300">Text Options:</div>
            
            <div className="flex items-center gap-1">
              <label className="text-xs text-gray-300">Font Size</label>
              <input
                type="range"
                min="8"
                max="72"
                value={textData.fontSize}
                onChange={(e) => setTextData({ ...textData, fontSize: Number(e.target.value) })}
                className="w-24"
              />
              <input
                type="number"
                min="8"
                max="72"
                value={textData.fontSize}
                onChange={(e) => setTextData({ ...textData, fontSize: Number(e.target.value) })}
                className="w-12 px-1 py-0.5 rounded text-black text-sm"
              />
            </div>
            
            <div className="flex items-center gap-1">
              <label className="text-xs text-gray-300">Font</label>
              <select
                value={textData.font}
                onChange={(e) => setTextData({ ...textData, font: e.target.value })}
                className="w-28 px-1 py-0.5 rounded text-black text-sm"
              >
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Verdana">Verdana</option>
                <option value="Georgia">Georgia</option>
              </select>
            </div>
            
            {isTyping && (
              <div className="flex gap-2 mt-3 md:mt-0">
                <button
                  onClick={drawTextOnCanvas}
                  className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Add
                </button>
                <button
                  onClick={cancelTextInput}
                  className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Display current transform values */}
        {toolMode === "translate" && (
          <div className="text-gray-300 text-xs text-center bg-gray-700 p-2 rounded-lg w-full md:w-auto flex md:flex-row md:gap-2 justify-center items-center">
            <div>Position:</div>
            <div className="flex gap-2">
              <span>X: {Math.round(translate.x)}</span>
              <span>Y: {Math.round(translate.y)}</span>
            </div>
            <button
              onClick={resetTransform}
              className="mt-2 md:mt-0 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 w-full md:w-auto"
            >
              Reset Position
            </button>
          </div>
        )}

        {/* Main toolbar buttons - combined and centered */}
        <div className="flex items-center justify-center gap-2 flex-wrap w-full overflow-x-auto">
          {/* Tool Modes */}
          <div className="flex gap-2">
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
              title="Brush"
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
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
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
          
          {/* Zoom Controls */}
          <div className="flex items-center gap-2 text-white">
            <button 
              onClick={zoomOut} 
              className="w-10 h-10 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
              <i className="fas fa-minus text-sm"></i>
            </button>
            <div className="text-sm text-gray-300">{Math.round(zoom * 100)}%</div>
            <button 
              onClick={zoomIn} 
              className="w-10 h-10 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
              <i className="fas fa-plus text-sm"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
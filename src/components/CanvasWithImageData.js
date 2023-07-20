import React, { useEffect, useRef } from "react";

const CanvasWithImageData = ({ imageData }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && imageData) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      const image = new Image();
      image.src = imageData;
      image.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
      };
    }
  }, [canvasRef, imageData]);

  return <canvas ref={canvasRef} className="w-auto h-auto" />;
};

export default CanvasWithImageData;

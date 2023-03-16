import Image from "next/image";
import { useRouter } from "next/router";
import useKeypress from "react-use-keypress";
import type { ImageProps } from "../utils/types";
import { useLastViewedPhoto } from "../utils/useLastViewedPhoto";
import SharedModal from "./SharedModal";
import { useEffect, useState } from "react";
import { fabric } from "fabric";
import { FabricJSCanvas, useFabricJSEditor } from "fabricjs-react";

export default function Carousel({
  index,
  currentPhoto,
}: {
  index: number;
  currentPhoto: ImageProps;
}) {
  const router = useRouter();
  const [, setLastViewedPhoto] = useLastViewedPhoto();

  function closeModal() {
    setLastViewedPhoto(currentPhoto.id);
    router.push("/", undefined, { shallow: true });
  }

  function changePhotoId(newVal: number) {
    return newVal;
  }

  useKeypress("Escape", () => {
    closeModal();
  });

  const { editor, onReady } = useFabricJSEditor();

  // An array to store the strokes added to the canvas
  const [strokes, setStrokes] = useState([]);

  const addImage = () => {
    // Load the image and add it to the canvas
    fabric.Image.fromURL("/ape.jpeg", function (oImg) {
      // Scale the image to fit the width of the canvas
      const scaleFactor = editor?.canvas.width;
      oImg.scaleToWidth(editor?.canvas.width);
      oImg.scaleToHeight(editor?.canvas.height);
  
      // Set the zoom level so that the entire image is visible
      const zoom = Math.max(
        editor?.canvas.getWidth() / oImg.getScaledWidth(),
        editor?.canvas.getHeight() / oImg.getScaledHeight()
      );
      editor?.canvas.setZoom(zoom);
  
      editor?.canvas.add(oImg);
    });
  };
  
  const addStrokeToCanvas = (path) => {
    // Add the stroke to the canvas and the strokes array
    editor?.canvas.add(path);
    setStrokes((prevStrokes) => [...prevStrokes, path]);
  };
  
  const removeLastStrokeFromCanvas = () => {
    // Remove the last stroke from the canvas and the strokes array
    const lastStroke = strokes.pop();
    editor?.canvas.clear();
    setStrokes([]);
  };
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      editor?.canvas.setWidth(512);
      editor?.canvas.setHeight(512);
    }
  
    if (!editor?.canvas.getObjects().length) {
      addImage();
    }
  
    // Enable drawing mode
    if (editor?.canvas) {
      editor.canvas.isDrawingMode = true;
      // create free drawing brush and set properties
      const brush = new fabric.PencilBrush(editor?.canvas);
      brush.color = "#000";
      brush.width = 50;
      editor.canvas.freeDrawingBrush = brush;

      // Add event listener to listen for ctrl-z keydown events
      document.addEventListener("keydown", function (e) {
        if ((e.metaKey || e.ctrlKey) && e.keyCode === 90) {
          // Remove the last stroke from the canvas and the strokes array
          if(strokes.length > 0){
            console.log("path removed");
            console.log(strokes);
            removeLastStrokeFromCanvas();
          }
        }
      });
  
      // Add event listener to listen for new path added to canvas
      editor?.canvas.on("path:created", (e) => {
        // Add the new path to the canvas and the strokes array
        console.log("path created");
        console.log(strokes);
        addStrokeToCanvas(e.path);
      });
    }
  }, [editor,strokes]);
  
  
  return (
    <div className="fixed flex items-center justify-center">
    <div className="centerr">
    <button onClick={() => {
        const canvas = editor?.canvas;
        if (canvas) {
          const dataUrl = canvas.toDataURL();
          const link = document.createElement('a');
          link.download = 'canvas-image.png';
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }}>Save Image</button>
    </div>
      <FabricJSCanvas className="sample-canvas" onReady={onReady} />
    </div>
  );
}

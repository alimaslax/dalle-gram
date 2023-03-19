import { useRouter } from "next/router";
import useKeypress from "react-use-keypress";
import Image from "next/image";
import type { ImageProps } from "../utils/types";
import { useLastViewedPhoto } from "../utils/useLastViewedPhoto";
import { useEffect, useState } from "react";
import { fabric } from "fabric";
import React, { useCallback, useRef } from "react";
import "./elements_parser";
import "./parser";
import "./EraserBrush";
import * as data from "./import.json";
import * as data2 from "./import2.json";
import * as data3 from "./import3.json";
import { Configuration, OpenAIApi } from "openai";
import Edit from "./Icons/Erase";
import Download from "./Icons/Download";
import Move from "./Icons/Move";
import Brush from "./Icons/Brush";
import Erase from "./Icons/Erase";

fabric.Object.NUM_FRACTION_DIGITS = 12;
fabric.Object.prototype.erasable = true;

const __onResize = fabric.Canvas.prototype._onResize;

if (typeof window !== "undefined") {
  // fabric.util.object.extend(fabric.Canvas.prototype, {
  //   _onResize(this: fabric.Canvas) {
  //     this.setDimensions(
  //       { width: window.innerWidth, height: window.innerHeight },
  //       false
  //     );
  //     __onResize.call(this);
  //   },
  // });
}

const JSON_DATA = [data, data2, data3];

export default function Carousel({
  index,
  currentPhoto,
}: {
  index: number;
  currentPhoto: ImageProps;
}) {
  const router = useRouter();
  const [, setLastViewedPhoto] = useLastViewedPhoto();
  const [canvasUrl, setCanvasUrl] = useState<string | null>(
    currentPhoto.public_id
  );
  const [base64, setBase64] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean | null>(false);

  function closeModal() {
    setLastViewedPhoto(currentPhoto.id);
    router.push("/", undefined, { shallow: true });
  }

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const apiKey = process.env.OPENAI_API_KEY;
  const openai = new OpenAIApi(configuration);

  useKeypress("Escape", () => {
    closeModal();
  });

  const [action, setAction] = useState(2);
  const [isNotErasable] = useState(false);
  const [erasable, setErasable] = useState(true);
  const ref = useRef<fabric.Canvas>(null);
  const i = useRef<number>(2);

  useEffect(() => {
    console.log("state Changed", canvasUrl);
  }, [base64, canvasUrl, loading]);

  useEffect(() => {
    const canvas = new fabric.Canvas("c", {
      width: 512,
      height: 512,
      backgroundColor: "rgb(255, 255, 255)",
    });

    canvas.on("selection:created", async (e) => {});
    canvas.on("selection:updated", (e) => {
      //console.log(e.target.getEraser());
    });
    console.log(currentPhoto.public_id);
    fabric.Image.fromURL(
      `/proxy?url=${encodeURIComponent(currentPhoto.public_id)}`,
      function (img) {
        img.set({
          erasable1: erasable,
          selectable: true,
        });
        // Calculate the scale factor to fit the image on the canvas
        const scaleFactor = Math.min(
          (canvas.width / img.width) * 1.9,
          (canvas.height / img.height) * 1.9
        );

        // Scale the image to fit the canvas
        img.scale(scaleFactor);
        // Center the image on the canvas
        img.set({
          left: canvas.width / 2,
          top: canvas.height / 2,
          originX: "center",
          originY: "center",
          erasable: erasable,
        });
        canvas.add(img);

        canvas.on("erasing:end", ({ targets, drawables }) => {
          console.log(
            "objects:",
            targets.map((t) => t.type),
            "drawables:",
            Object.keys(drawables)
          );
          targets.map((t) => t.getEraser());
        });
        canvas.renderAll();
        setBase64(
          canvas.toDataURL({
            format: "png",
            enableRetinaScaling: true,
          })
        );
      }
      //{ crossOrigin: "anonymous" }
    );
    ref.current = canvas;
  }, []);

  useEffect(() => {
    const fc = ref.current!;
    switch (action) {
      case 0:
        fc.freeDrawingBrush = new fabric.EraserBrush(fc);
        fc.freeDrawingBrush.width = 100;
        fc.isDrawingMode = true;
        break;
      case 1:
        fc.isDrawingMode = false;
        break;
      case 2:
        fc.freeDrawingBrush = new fabric.SprayBrush(fc);
        fc.freeDrawingBrush.color = "rgb(204,204,204)";
        fc.freeDrawingBrush.width = 80;
        fc.freeDrawingBrush.density = 80;
        fc.freeDrawingBrush.dotWidth = 3;
        fc.isDrawingMode = true;
        break;
      default:
        break;
    }
  }, [action]);

  useEffect(() => {
    const d = ref.current!.get("backgroundImage");
    d?.set({ erasable: isNotErasable });
  }, [isNotErasable]);

  useEffect(() => {
    const d = ref.current!.get("overlayColor");
    d?.set({ erasable: erasable });
  }, [erasable]);

  function showPicture(edit64, prompt) {
    setLoading(true);
    // Create a FormData object
    const form = new FormData();
    form.append("image", base64);
    form.append("mask", edit64);
    console.log(prompt + "prompt");
    form.append("prompt", prompt);

    // Send a POST request to the server
    fetch("/api/dream-edit", {
      method: "POST",
      body: form,
    })
      .then((response) => response.json())
      .then((data) => {
        setLoading(false);
        setCanvasUrl(data.data[0].url);
      })
      .catch((error) => {
        setLoading(false);
        console.error(error);
      });
  }

  const handleSubmit = (event) => {
    event.preventDefault(); // this will prevent the default action of navigating the page
    const ext = "png";
    let canvas = ref.current!;
    // Bring the bottom layer to the front
    const bottomObject = canvas.getObjects()[0];
    canvas.remove(bottomObject);

    const base64 = canvas.toDataURL({
      format: ext,
      enableRetinaScaling: false,
    });
    showPicture(base64, prompt);
  };
  const handleDownload = (event) => {
    event.preventDefault(); // this will prevent the default action of navigating the page
    const ext = "png";
    let canvas = ref.current!;
    // Bring the bottom layer to the front
    const bottomObject = canvas.getObjects()[0];
    canvas.remove(bottomObject);

    const base64 = canvas.toDataURL({
      format: ext,
      enableRetinaScaling: false,
    });
    const link = document.createElement("a");
    link.href = base64;
    link.download = `eraser_example.${ext}`;
    link.click();
  };
  const changeAction = (tool) => {
    switch(tool){
      case 'erase':
        setAction(0);
        break;
      case 'move':
        setAction(1);
        break;
      case 'brush':
        setAction(2);
        break;
    }
  };
  return (
    <div className="relative z-50 flex aspect-[4/3] items-center md:aspect-[3/2]">
      {loading ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
          <image xlinkHref="/loading.svg" width="100%" height="100%" />
        </svg>
      ) : (
        <Image src={canvasUrl} alt="Canvas Image" width={512} height={512} />
      )}
      <div className="flex flex-col px-10">
        <canvas className="canvas" id="c" />
        <div className="input-container">
          <input
            type="text"
            placeholder="Enter text here"
            className="input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit(e);
              }
            }}
          />
        </div>
        <div className="button-container">
          <div className="download-container" onClick={handleDownload}>
            <Download className="download-button" />
          </div>
          <div className="move-container" onClick={() => changeAction("move")}>
            <Move className="move-button" />
          </div>
          <div
            className="erase-container"
            onClick={() => changeAction("erase")}
          >
            <Erase className="edit-button" />
          </div>

          <div
            className="brush-container"
            onClick={() => changeAction("brush")}
          >
            <Brush className="edit-button" />
          </div>
        </div>
      </div>
    </div>
  );
}

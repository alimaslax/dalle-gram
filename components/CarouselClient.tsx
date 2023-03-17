import { useRouter } from "next/router";
import useKeypress from "react-use-keypress";
import Image from 'next/image'
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

fabric.Object.NUM_FRACTION_DIGITS = 12;
fabric.Object.prototype.erasable = true;


const __onResize = fabric.Canvas.prototype._onResize;

if (typeof window !== "undefined") {
  fabric.util.object.extend(fabric.Canvas.prototype, {
    _onResize(this: fabric.Canvas) {
      this.setDimensions(
        { width: window.innerWidth, height: window.innerHeight },
        false
      );
      __onResize.call(this);
    },
  });
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
  const [canvasUrl, setCanvasUrl] = useState<string | null>(currentPhoto.public_id);

  function closeModal() {
    setLastViewedPhoto(currentPhoto.id);
    router.push("/", undefined, { shallow: true });
  }

  function showPicture(link){
    fetch(link)
    // .then(response => response.json())
    // .then(data => {
    //     setCanvasUrl(data.url);
    // })
    // .catch(error => console.error(error));
  }

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const apiKey = process.env.OPENAI_API_KEY;
  const openai = new OpenAIApi(configuration);

  useKeypress("Escape", () => {
    closeModal();
  });

  const [action, setAction] = useState(0);
  const [erasable, setErasable] = useState(true);
  const [erasable1, setErasable1] = useState(false);
  const ref = useRef<fabric.Canvas>(null);
  const i = useRef<number>(2);

  const load = useCallback(() => {
    const canvas = ref.current!;
    canvas.loadFromJSON(
      JSON_DATA[i.current % 3],
      () => {
        canvas.renderAll();
        const d = canvas.get("backgroundImage");
        d?.set({ erasable });
        const d2 = canvas.get("overlayColor");
        d2?.set({ erasable: erasable1 });
      },
      function (o, object) {
        fabric.log(o, object);
        /*
         */
      }
    );
    i.current = i.current + 1;
  }, []);

  useEffect(() => {
    const canvas = new fabric.Canvas("c", {
      //overlayColor: "rgba(0,0,255,0.4)",
    });
    canvas.on("selection:created", async (e) => {});
    canvas.on("selection:updated", (e) => {
      //console.log(e.target.getEraser());
    });
    console.log(currentPhoto.public_id);
    fabric.Image.fromURL(
      `/proxy?url=${encodeURIComponent(currentPhoto.public_id)}`,
      function (img) {
        // Scale the image to fit the width of the canvas
        const scaleFactor = canvas.width;
        img.scaleToWidth(canvas.width);
        img.scaleToHeight(canvas.height);
        //img.set({ opacity: 0.7 });
        canvas.setBackgroundImage(img);
        img.set({ erasable });
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
      }
      //{ crossOrigin: "anonymous" }
    );
    ref.current = canvas;
  }, [canvasUrl]);

  useEffect(() => {
    const fc = ref.current!;
    switch (action) {
      case 0:
        fc.freeDrawingBrush = new fabric.EraserBrush(fc);
        fc.freeDrawingBrush.shadow = new fabric.Shadow({
          blur: 5,
          offsetX: 0,
          offsetY: 0,
          affectStroke: true,
          color: "white",
        });
        fc.freeDrawingBrush.width = 40;
        fc.isDrawingMode = true;
        break;
      case 1:
        fc.isDrawingMode = false;
        break;
      default:
        break;
    }
  }, [action]);

  useEffect(() => {
    const d = ref.current!.get("backgroundImage");
    d?.set({ erasable });
  }, [erasable]);

  useEffect(() => {
    const d = ref.current!.get("overlayColor");
    d?.set({ erasable: erasable1 });
  }, [erasable1]);

  return (
    <div
    className="relative z-50 flex aspect-[3/2] w-full max-w-7xl items-center wide:h-full xl:taller-than-854:h-auto"
  >
    {/* Main image */}
      <canvas id="c" width={800} height={600} />
      <input>
      </input>
        <Image
        src = {canvasUrl}
        alt = "Picture of the author"
        width = {500}
        height = {500}
        >
          
        </Image>
        <button
          onClick={() => {
            const ext = "png";
            const canvas = ref.current!;
            const base64 = canvas.toDataURL({
              format: ext,
              enableRetinaScaling: true,
            });
            const link = document.createElement("a");
            link.href = base64;
            link.download = `eraser_example.${ext}`;
            link.click();
            showPicture(link.href);
          }}
        >
          Change Me
        </button>
  </div>
  );
}

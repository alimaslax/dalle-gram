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
  const [canvasUrl, setCanvasUrl] = useState<string | null>(
    currentPhoto.public_id
  );
  const [base64, setBase64] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);

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
    console.log("base64", base64);
  }, [base64, canvasUrl]);

  useEffect(() => {
    const canvas = new fabric.Canvas("c", {
      width: 500,
      height: 500,
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
        img.set({
          erasable,
          selectable: true,
          scaleX: (canvas.width) / img.width,
          scaleY: (canvas.height) / img.height,
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

  function showPicture(edit64, prompt) {
    // Create a FormData object
    const form = new FormData();
    form.append("image", base64);
    form.append("mask", edit64);
    console.log(prompt + "prompt");
    form.append("prompt", prompt);

    // Send a POST request to the server
    fetch("/api/image-edit", {
      method: "POST",
      body: form,
    })
      .then((response) => response.json())
      .then((data) => {
        setCanvasUrl(data.data[0].url);
      })
      .catch((error) => console.error(error));
  }

  const handleSubmit = (event) => {
    event.preventDefault(); // this will prevent the default action of navigating the page
    const ext = "png";
    const canvas = ref.current!;
    canvas.width = 500;
    canvas.height = 500;
    const base64 = canvas.toDataURL({
      format: ext,
      enableRetinaScaling: true,
    });
    showPicture(base64, prompt);
  };
  const handleDownload = () => {
    event.preventDefault(); // this will prevent the default action of navigating the page
    const ext = "png";
    const canvas = ref.current!;
    canvas.width = 512;
    canvas.height = 512;
    const base64 = canvas.toDataURL({
      format: ext,
      enableRetinaScaling: true,
    });
    const link = document.createElement("a");
    link.href = base64;
    link.download = `eraser_example.${ext}`;
    link.click();
  };
  const changeAction = (curr_action) => {
    curr_action == 0 ? setAction(1) : null;
    curr_action == 1 ? setAction(0) : null;
  };
  return (
    <div className="relative z-50 flex aspect-[3/2] w-full max-w-7xl items-center wide:h-full xl:taller-than-854:h-auto">
      {/* Main image */}
      <Image
        src={canvasUrl}
        alt="Picture of the author"
        width={412}
        height={412}
      />
      <div className="flex flex-col">
        {" "}
        {/* Wrap the form in a new flex container */}
        <div style={{ padding: "5px" }}>
          <canvas id="c" />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <input
            style={{
              padding: "0.5rem",
              borderRadius: "0.3rem",
              border: "1px solid #ccc",
              marginLeft: "1rem",
              marginRight: "1rem",
            }}
            id="prompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit(e);
              }
            }}
          />
          <button
            style={{
              padding: "0.5rem 2rem",
              backgroundColor: "#0077c2",
              color: "#fff",
              border: "none",
              borderRadius: "0.3rem",
              fontSize: "1.2rem",
              cursor: "pointer",
            }}
            type="submit"
            onClick={handleDownload}
          >
            Download Edit
          </button>
          <button
            style={{
              padding: "0.5rem 2rem",
              backgroundColor: `${action == 0 ? "red" : "green"}`,
              color: "#fff",
              border: "none",
              borderRadius: "0.3rem",
              fontSize: "1.2rem",
              cursor: "pointer",
            }}
            type="submit"
            onClick={() => changeAction(action)}
          >
            {action == 0 ? "Erase" : "Select"}
          </button>
        </form>
      </div>
    </div>
  );
}

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
import Edit from "./Icons/Edit";
import Download from "./Icons/Download";
import Move from "./Icons/Move";

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

  const [action, setAction] = useState(0);
  const [erasable, setErasable] = useState(true);
  const [erasable1, setErasable1] = useState(false);
  const ref = useRef<fabric.Canvas>(null);
  const i = useRef<number>(2);

  useEffect(() => {
    console.log("state Changed", canvasUrl);
  }, [base64, canvasUrl, loading]);

  useEffect(() => {
    const canvas = new fabric.Canvas("c", {
      width: 512,
      height: 512,
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
          scaleX: canvas.width / img.width,
          scaleY: canvas.height / img.height,
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
    const canvas = ref.current!;
    canvas.width = 512;
    canvas.height = 512;
    const base64 = canvas.toDataURL({
      format: ext,
      enableRetinaScaling: true,
    });
    showPicture(base64, prompt);
  };
  const handleDownload = (event) => {
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
    <div className="relative z-50 flex aspect-[4/3] items-center md:aspect-[3/2]">
      {loading ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
          <image xlinkHref="/loading.svg" width="100%" height="100%" />
        </svg>
      ) : (
        <Image
          src={canvasUrl}
          alt="Canvas Image"
          width={512}
          height={512}
        />
      )}
      <div className="flex flex-col px-10">
        <canvas id="c" />
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
          <div
            className="editor-container"
            onClick={() => changeAction(action)}
          >
            {action == 0 ? (
              <Edit className="edit-button" />
            ) : (
              <Move className="move-button" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

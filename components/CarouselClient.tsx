import Image from "next/image";
import { useRouter } from "next/router";
import useKeypress from "react-use-keypress";
import type { ImageProps } from "../utils/types";
import { useLastViewedPhoto } from "../utils/useLastViewedPhoto";
import SharedModal from "./SharedModal";
import { useEffect, useState } from "react";
import { fabric } from "fabric";
import React, { useCallback, useRef } from "react";
import "./elements_parser";
import "./parser";
import "./EraserBrush";
import * as data from "./import.json";
import * as data2 from "./import2.json";
import * as data3 from "./import3.json";
import svg from "./svg.svg";
import svg2 from "./svg2.svg";

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
      width: 1200,
      height: 800,
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

  return (
    <div >
      {/* Edit image */}
      <canvas id="c" width={500} height={500} />
    </div>
  );
}

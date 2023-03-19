//@ts-nocheck

import { fabric } from "fabric";
import React, { useCallback, useEffect, useRef, useState } from "react";
import "./elements_parser";
import "./parser";
import "./EraserBrush";
import * as data from "./import.json";
import * as data2 from "./import2.json";
import * as data3 from "./import3.json";
import svg from "./svg.svg";
import svg2 from "./svg2.svg";
import { assert } from "chai";

fabric.Object.NUM_FRACTION_DIGITS = 12;
fabric.Object.prototype.erasable = true;

const __onResize = fabric.Canvas.prototype._onResize;
fabric.util.object.extend(fabric.Canvas.prototype, {
  _onResize(this: fabric.Canvas) {
    this.setDimensions(
      { width: window.innerWidth, height: window.innerHeight },
      false
    );
    __onResize.call(this);
  }
});

const JSON_DATA = [data, data2, data3];

export default function App() {
  const [action, setAction] = useState(0);
  const [erasable, setErasable] = useState(false);
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

    fabric.Image.fromURL(
      "https://i.imgur.com/zCokFrK.jpeg",
      function (img) {
        // img.set("erasable", false);

        img.clone((img) => {
          canvas.add(
            img
              .set({
                left: 400,
                top: 350,
                clipPath: new fabric.Circle({
                  radius: 200,
                  originX: "center",
                  originY: "center"
                }),
                angle: 30
              })
              .scale(0.25)
          );
          img.on("selected", () => {
            img.setClipPath(
              new fabric.Circle({
                radius: img.getClipPath().radius + 5,
                originX: "center",
                originY: "center"
              })
            );
            canvas.renderAll();
          });
          canvas.renderAll();
        });

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

    function animate() {
      try {
        canvas
          .item(0)
          .animate("top", canvas.item(0).get("top") === 500 ? "100" : "500", {
            duration: 1000,
            onChange: canvas.renderAll.bind(canvas),
            onComplete: animate
          });
      } catch (error) {
        setTimeout(animate, 500);
      }
    }
    animate();
    ref.current = canvas;
  }, []);
  useEffect(() => {
    const fc = ref.current!;
    switch (action) {
      case 0:
        fc.isDrawingMode = false;
        break;
      case 1:
        fc.freeDrawingBrush = new fabric.EraserBrush(fc);
        fc.freeDrawingBrush.shadow = new fabric.Shadow({
          blur: 5,
          offsetX: 0,
          offsetY: 0,
          affectStroke: true,
          color: "black"
        });
        fc.freeDrawingBrush.width = 10;
        fc.isDrawingMode = true;
        break;
      case 2:
        fc.freeDrawingBrush = new fabric.SprayBrush(fc);
        fc.freeDrawingBrush.width = 35;
        fc.isDrawingMode = true;
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

  const getTitle = useCallback((action) => {
    switch (action % 3) {
      case 0:
        return "select";
      case 1:
        return "erase";
      case 2:
        return "spray";
      default:
        return "";
    }
  }, []);

  return (
    <div className="App">
      <div>
        {[1, 2, 3].map((action) => (
          <button key={`action${action}`} onClick={() => setAction(action % 3)}>
            {getTitle(action)}
          </button>
        ))}
      </div>
      <div>
        <div>
          <label htmlFor="a">
            background image <code>erasable</code>
          </label>
          <input
            id="a"
            type="checkbox"
            onChange={(e) => setErasable(e.currentTarget.checked)}
            value={erasable}
          />
        </div>
        <div>
          <label htmlFor="b">
            overlay color <code>erasable</code>
          </label>
          <input
            id="b"
            type="checkbox"
            onChange={(e) => setErasable1(e.currentTarget.checked)}
            value={erasable1}
          />
        </div>
      </div>
      <div>
        <button
          onClick={async () => {
            const json = ref.current!.toDatalessJSON(["clipPath"]);
            const out = JSON.stringify(json, null, "\t");
            console.log(out);
            const blob = new Blob([out], { type: "text/plain" });
            const clipboardItemData = { [blob.type]: blob };
            try {
              navigator.clipboard &&
                (await navigator.clipboard.write([
                  new ClipboardItem(clipboardItemData)
                ]));
            } catch (error) {
              console.log(error);
            }
            /*
              try {
              assert.deepEqual(out, data);
            } catch (error) {
              console.error(error);
            }
            */
          }}
        >
          toJSON
        </button>
        <button onClick={load}>from JSON</button>
        <button
          onClick={() => {
            const ext = "png";
            const canvas = ref.current!;
            const bg = canvas.backgroundImage;
            canvas.setBackgroundImage(null);
            const image = canvas.getObjects("image")[0];
            canvas.remove(image);
            const base64 = canvas.toDataURL({
              format: ext,
              enableRetinaScaling: true
            });
            canvas.setBackgroundImage(bg);
            canvas.add(image);
            const link = document.createElement("a");
            link.href = base64;
            link.download = `eraser_example.${ext}`;
            link.click();
          }}
        >
          to Image
        </button>
        <button
          onClick={() => {
            const svg = ref.current!.toSVG();
            const a = document.createElement("a");
            const blob = new Blob([svg], { type: "image/svg+xml" });
            const blobURL = URL.createObjectURL(blob);
            a.href = blobURL;
            a.download = "eraser_example.svg";
            a.click();
            URL.revokeObjectURL(blobURL);
          }}
        >
          toSVG
        </button>
        <button
          onClick={() => {
            fabric.loadSVGFromURL(svg2, (result) => {
              console.log(result);
              ref.current?.clear();
              const canvas = ref.current!;
              const bg = result.shift();
              const overlay = result.pop();
              canvas.setBackgroundImage(bg, null, { erasable });
              canvas.setOverlayColor(overlay, null, { erasable: erasable1 });
              canvas.add(...result);
            });
          }}
        >
          from SVG
        </button>
      </div>
      <canvas id="c" width={500} height={500} />
    </div>
  );
}

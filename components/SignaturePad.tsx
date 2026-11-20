"use client";

import { useEffect, useId, useRef, useState } from "react";

interface Props {
  signerName: string;
  /** Called with a PNG data URL, or null when the signature is empty. */
  onChange: (value: { image: string; method: "drawn" | "typed" } | null) => void;
}

const WIDTH = 600;
const HEIGHT = 200;

/**
 * Two ways to sign, so it works for everyone:
 *  - "Écrire mon nom": keyboard / screen-reader friendly, generates the image from the name
 *  - "Dessiner": mouse, finger or stylus on a canvas
 */
export function SignaturePad({ signerName, onChange }: Props) {
  const [method, setMethod] = useState<"typed" | "drawn">("typed");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);
  const groupId = useId();

  function ctx() {
    const c = canvasRef.current?.getContext("2d");
    if (c) {
      c.lineWidth = 3;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.strokeStyle = "#050c0d";
      c.fillStyle = "#050c0d";
    }
    return c;
  }

  function clear() {
    const c = ctx();
    if (!c || !canvasRef.current) return;
    c.clearRect(0, 0, WIDTH, HEIGHT);
    hasInk.current = false;
  }

  // Typed mode: redraw the name each time it changes
  useEffect(() => {
    if (method !== "typed") return;
    clear();
    const name = signerName.trim();
    const c = ctx();
    if (!c || !name) {
      onChange(null);
      return;
    }
    c.font = 'italic 56px "Brush Script MT", "Segoe Script", cursive';
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(name, WIDTH / 2, HEIGHT / 2, WIDTH - 40);
    onChange({ image: canvasRef.current!.toDataURL("image/png"), method: "typed" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signerName, method]);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * WIDTH,
      y: ((e.clientY - rect.top) / rect.height) * HEIGHT,
    };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (method !== "drawn") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const c = ctx();
    const p = point(e);
    c?.beginPath();
    c?.moveTo(p.x, p.y);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const c = ctx();
    const p = point(e);
    c?.lineTo(p.x, p.y);
    c?.stroke();
    hasInk.current = true;
  }

  function onPointerUp() {
    if (!drawing.current) return;
    drawing.current = false;
    if (hasInk.current && canvasRef.current) {
      onChange({ image: canvasRef.current.toDataURL("image/png"), method: "drawn" });
    }
  }

  function switchTo(m: "typed" | "drawn") {
    setMethod(m);
    clear();
    onChange(null);
  }

  return (
    <fieldset className="space-y-3">
      <legend className="field-label">Votre signature</legend>

      <div role="radiogroup" aria-label="Méthode de signature" className="flex flex-wrap gap-2">
        {(
          [
            ["typed", "Écrire mon nom"],
            ["drawn", "Dessiner ma signature"],
          ] as const
        ).map(([value, label]) => (
          <label
            key={value}
            className={`cursor-pointer rounded-md border-2 border-text px-3 py-2 font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 ${
              method === value ? "bg-primary" : "bg-surface hover:bg-primary-soft"
            }`}
          >
            <input
              type="radio"
              name={groupId}
              value={value}
              checked={method === value}
              onChange={() => switchTo(value)}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </div>

      <p id={`${groupId}-hint`} className="field-hint">
        {method === "typed"
          ? "Votre signature est générée à partir du nom saisi ci-dessus."
          : "Signez dans le cadre avec la souris, le doigt ou un stylet."}
      </p>

      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        role="img"
        aria-label={
          method === "typed"
            ? signerName
              ? `Aperçu de la signature : ${signerName}`
              : "Aperçu de la signature, vide"
            : "Zone de signature manuscrite"
        }
        aria-describedby={`${groupId}-hint`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className={`block aspect-[3/1] w-full max-w-xl touch-none rounded-md border-2 border-text bg-surface ${
          method === "drawn" ? "cursor-crosshair" : ""
        }`}
      />

      {method === "drawn" && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            clear();
            onChange(null);
          }}
        >
          Effacer
        </button>
      )}
    </fieldset>
  );
}

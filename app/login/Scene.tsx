"use client";

import { useEffect } from "react";
import { festive } from "../festive";
import { RUDOLF } from "../quiz-client";

// Where each Rudolf flies during the splash: from, to (in vw / vh), spin and delay.
const FLIGHTS = [
  [-30, 10, 120, 60, 720, 0],
  [120, 30, -40, 5, -540, 0.1],
  [20, -20, 60, 120, 900, 0.2],
  [-30, 80, 130, 20, -720, 0.3],
  [70, 120, 10, -30, 600, 0.45],
  [130, 70, -40, 90, -900, 0.6],
  [-30, 45, 130, 45, 1080, 0.8],
  [50, -25, 30, 125, -600, 1.0],
];

/**
 * The moving Christmas backdrop behind the sign-in form (see app/festive.js).
 * With `splash`, it opens with two seconds of chaos first.
 */
export function Scene({ splash = false }: { splash?: boolean }) {
  useEffect(() => festive(), []);

  return (
    <>
      {splash && (
        <div id="splash" aria-hidden="true">
          <div className="disco" />
          {FLIGHTS.map(([x0, y0, x1, y1, spin, delay], i) => (
            <span
              key={i}
              className="fly run"
              style={{ "--x0": `${x0}vw`, "--y0": `${y0}vh`, "--x1": `${x1}vw`, "--y1": `${y1}vh`, "--spin": `${spin}deg`, animationDelay: `${delay}s` } as React.CSSProperties}
              dangerouslySetInnerHTML={{ __html: RUDOLF }}
            />
          ))}
          <div className="boom">
            <span><b>HO</b></span>
            <span><b>HO</b></span>
            <span><b>HO</b></span>
          </div>
          <div className="boom-sub">Julefrokost!</div>
        </div>
      )}
      <div className="hill" aria-hidden="true" />
      <svg id="garland" aria-hidden="true" />
      <div id="runner" aria-hidden="true" />
      <canvas id="fx" aria-hidden="true" />
    </>
  );
}

/** Rudolf, who walks in above the form. Tap his nose. */
export function Rudolf() {
  return (
    <div>
      <button type="button" className="hero" id="hero" aria-label="Boop Rudolf on the nose">
        <span className="hopper" dangerouslySetInnerHTML={{ __html: RUDOLF }} />
      </button>
    </div>
  );
}

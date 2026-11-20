"use client";

import { useEffect } from "react";
import { start } from "./quiz-client";

// The shell the quiz draws into. Everything inside is built and animated by
// app/quiz-client.js, which also follows the shared game on the server.
export default function Quiz({ master }: { master: boolean }) {
  useEffect(() => start(master), [master]);

  return (
    <>
      <div className="hill" aria-hidden="true" />
      <svg id="garland" aria-hidden="true" />
      <main id="deck" />
      <div id="runner" aria-hidden="true" />
      <div id="toast" role="status" />
      <canvas id="fx" aria-hidden="true" />
      <div id="shade" className="hostonly" />
      <section id="sheet" className="hostonly" aria-label="Points" />
      <nav className="nav" aria-label="Slides">
        <button id="prev" className="hostonly" aria-label="Previous slide">
          ←
        </button>
        <button id="pts" className="hostonly" aria-label="Open the points panel">
          Pts
        </button>
        <div className="prog">
          <span id="count">01</span>
          <div className="bar">
            <i id="bar" />
          </div>
        </div>
        <button id="next" className="hostonly" aria-label="Next slide">
          →
        </button>
      </nav>
    </>
  );
}

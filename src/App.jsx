import { useState } from "react";
import Scene1 from "./components/scene1";
import EndScene from "./components/endscene";
import useScaleUI from "./hooks/useScaleUI";
import portraitVideo from "./video/portrait.mp4";
import landscapeVideo from "./video/landscape.mp4";

function App() {
  const [showEnd, setShowEnd] = useState(false);

  const stageW = 1080;
  const stageH = 1920;

  const { appRef, wrapperRef, centerRef } = useScaleUI(stageW, stageH);

  return (
    <>
      {showEnd && (
        <EndScene srcPortrait={portraitVideo} srcLandscape={landscapeVideo} />
      )}

      {!showEnd && (
        <div ref={wrapperRef} className="app-wrapper bioma-viewport-bg">
          <div ref={appRef} className="app">
            <Scene1 onResultComplete={() => setShowEnd(true)} centerRef={centerRef} />
          </div>
        </div>
      )}
    </>
  );
}

export default App;

import { useState } from "react";
import "../styles/GuideLine.css";

function Cse() {
  const [cse, setCse] = useState("AYU - CSE");
  return (
    <div>
      <h1>{cse}</h1>
    </div>
  );
}
function GuideLine() {
  return (
    <>
      <Cse />
    </>
  );
}

export default GuideLine;

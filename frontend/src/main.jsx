import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import PublicView from "./PublicView";
import Summary from "./Summary";

const path = window.location.pathname;

let Component = App;

if (path === "/public") Component = PublicView;
if (path === "/summary") Component = Summary;

ReactDOM.createRoot(document.getElementById("root")).render(<Component />);

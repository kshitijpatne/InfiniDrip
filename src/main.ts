// Browser entry: draft a t-shirt and draw it on the Blueprint canvas.
import { draftTshirt, STANDARD_M } from "./drafting";
import { renderBlueprint } from "./render";

document.body.style.margin = "0";
document.body.style.background = "#0A1422";
document.body.style.padding = "24px";

const block = draftTshirt(STANDARD_M);
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = renderBlueprint([block.front, block.back, block.sleeve], { active: "front" });

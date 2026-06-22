// Browser entry: mount the interactive app.
import { mountApp } from "./ui";

document.body.style.cssText = "margin:0;background:#0A1422;padding:24px";
mountApp(document.querySelector<HTMLDivElement>("#app")!);

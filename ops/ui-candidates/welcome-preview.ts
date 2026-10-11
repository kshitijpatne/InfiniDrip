import { mountWelcomePanel } from "../../src/ui/enhancements/entry/welcome-panel";

const host = document.getElementById("welcome-preview");
if (!host) throw new Error("UIQ-07 preview host is missing.");

mountWelcomePanel(host);

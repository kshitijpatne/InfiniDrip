// Browser entry: open or migrate the local project before mounting editing controls.
import { defaultArtworkAssetStore, mountApp } from "./ui";
import { openProjectWorkflow } from "./ui/project-workflow";

const rootCandidate = document.querySelector<HTMLDivElement>("#app");
if (!rootCandidate) throw new Error("InfiniDrip application host is missing.");
const root: HTMLDivElement = rootCandidate;

async function start(): Promise<void> {
  root.replaceChildren();
  try {
    const artworkAssetStore = defaultArtworkAssetStore();
    const projectWorkflow = await openProjectWorkflow({
      repositoryOptions: { onVersionChange: () => { root.dataset.projectStorageChanged = "true"; } },
      artworkStore: artworkAssetStore,
    });
    mountApp(root, { projectWorkflow, artworkAssetStore });
  } catch (error) {
    const main = document.createElement("main");
    main.className = "project-startup-error";
    const heading = document.createElement("h1");
    heading.textContent = "Local project could not be opened";
    const message = document.createElement("p");
    message.textContent = error instanceof Error
      ? `${error.message} Existing saved data was not intentionally replaced.`
      : "Project storage failed. Existing saved data was not intentionally replaced.";
    const retry = document.createElement("button");
    retry.type = "button";
    retry.textContent = "Retry opening the project";
    retry.addEventListener("click", () => { void start(); });
    main.append(heading, message, retry);
    root.replaceChildren(main);
  }
}

void start();

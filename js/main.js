import { mount } from "./ui.js";
import { applySceneBackground } from "./assets.js";

applySceneBackground();
const root = document.getElementById("app");
if (root) mount(root);

/** Chemins des médias livrés, avec version de cache. */

export const ASSET_VERSION = "20261106-media1";

export function assetUrl(path) {
  return `${path}?v=${ASSET_VERSION}`;
}

export const IMAGES = {
  logo: "media/logo-titre.png",
  fondPaysage: "media/fond-paysage.webp",
  fondPortrait: "media/fond-portrait.webp",
  win: "media/ecran-victoire.webp",
  lose: "media/ecran-echec.webp",
  firewalls: {
    A: "media/pare-feu-A.png",
    B: "media/pare-feu-B.png",
    C: "media/pare-feu-C.png",
    D: "media/pare-feu-D.png",
    E: "media/pare-feu-E.png",
    F: "media/pare-feu-F.png",
  },
};

export function firewallIcon(letter) {
  return IMAGES.firewalls[letter] || null;
}

export function applySceneBackground(target = typeof document !== "undefined" ? document.documentElement : null) {
  if (!target || !target.style) return;
  target.style.setProperty("--scene-landscape", `url("${assetUrl(IMAGES.fondPaysage)}")`);
  target.style.setProperty("--scene-portrait", `url("${assetUrl(IMAGES.fondPortrait)}")`);
}

# Provenance des médias

## Visuels

Fichiers d’illustration fournis pour le jeu (source d’atelier : dossier `neon-breach-assets`). Aucune nouvelle image n’a été générée ici.

| Fichier dans le jeu | Source | Notes |
| --- | --- | --- |
| `media/logo-titre.png` | `logo-titre.png` (1200×300, transparent) | recompression PNG sans recréer l’art |
| `media/fond-paysage.webp` | `fond-paysage.webp` (1920×1080) | copie à l’identique |
| `media/fond-portrait.webp` | `fond-portrait.webp` (1080×1920) | copie à l’identique |
| `media/pare-feu-A.png` … `pare-feu-F.png` | mêmes noms (256×256, transparent) | recompression PNG sans recréer l’art |
| `media/ecran-victoire.webp` | `ecran-victoire.png` (1200×600) | WebP q90 pour alléger la livraison ; le PNG source est aussi conservé |
| `media/ecran-echec.webp` | `ecran-echec.png` (1200×600) | idem |
| `media/ecran-victoire.png` / `ecran-echec.png` | fichiers approuvés | originaux conservés à côté des WebP |

`apercu.png` (planche contact) n’est **pas** utilisé dans le jeu.

Les fonds sont affichés en filigrane (paysage en large, portrait en étroit / orientation portrait) sous un voile sombre, pour garder le contraste du texte.

## Audio

Fichiers MP3 **fournis par l’utilisateur** (Pascal) après une demande de vraie musique Suno. Ils ont été copiés tels quels (pas de ré-encodage).

Identification faite uniquement à partir des balises ID3 `title` (plus la durée rapportée par ffprobe). Personne n’a « écouté » les fichiers pour en déduire le rôle. Les titres distinguent clairement les trois pistes :

| Fichier livré | Titre ID3 | Durée ffprobe | Rôle |
| --- | --- | --- | --- |
| `media/audio/silent-circuit.mp3` | Neon Breach — Silent Circuit | 199.632 s | fond (boucle, volume doux) |
| `media/audio/access-granted.mp3` | Neon Breach — Access Granted | 18.720 s | jingle de victoire |
| `media/audio/access-denied.mp3` | Neon Breach — Access Denied | 7.272 s | jingle d’échec |

Autres balises présentes : `artist=passcool17` ; `comment` contient `made with suno` et un identifiant de création (2026-11-06).

**Audio fourni par l’utilisateur. Les droits n’ont pas été vérifiés.** Aucune licence commerciale n’est inférée ou revendiquée.

Les fichiers déjà présents dans `neon-breach-assets/audio/` (sans titre ID3, dont deux jingles de même taille) n’ont **pas** été utilisés.

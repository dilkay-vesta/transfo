# Transfo

Application web personnelle de suivi de transformation physique (recomposition corporelle) : programme PPL modifiable, mode séance avec chronomètre de repos, records et suggestions de progression, nutrition (avec recherche Open Food Facts), pas, hydratation, check-in, poids et mensurations, photos privées, calendrier, missions hebdomadaires et niveaux.

## Installer sur Android

1. Ouvre l’adresse GitHub Pages du dépôt dans **Chrome**.
2. Menu **⋮ → Installer l’application** (ou **Ajouter à l’écran d’accueil**).
3. L’appli s’ouvre en plein écran et fonctionne hors ligne.

## Données

- Tout est enregistré **sur le téléphone** (IndexedDB), automatiquement, à chaque action. Rien n’est envoyé sur un serveur.
- Seule exception : la recherche d’aliments interroge Open Food Facts avec le texte tapé.
- Sauvegarde : **Profil → Export JSON + photos**, puis garde le fichier (Drive…). **Profil → Restaurer** pour le réimporter.

## Technique

- Aucune étape de build : HTML + JavaScript (Preact + htm, fournis dans `vendor/`).
- `sw.js` met l’appli en cache pour le hors-ligne. **Incrémente `VERSION` dans `sw.js` à chaque modification** pour que les téléphones reçoivent la mise à jour.
- Lancer en local : `python3 -m http.server` puis ouvrir `http://localhost:8000`.

Bibliothèques : Preact (MIT) et htm (Apache-2.0), via `htm/preact/standalone` 3.1.1.

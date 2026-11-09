# SBC

SBC est une application web progressive (PWA) pensée pour être installée sur Android et publiée sur GitHub Pages. Elle couvre les fléchettes acier et soft-tip, en France et à l’international.

## Lancer en local

Ouvrir `site/index.html` dans un navigateur pour consulter l’interface. L’installation PWA et le mode hors ligne nécessitent une origine HTTPS, comme GitHub Pages, ou un serveur local.

## Publier sur GitHub Pages

1. Créer un dépôt GitHub et y envoyer le contenu de ce projet.
2. Dans **Settings → Pages**, choisir **GitHub Actions** comme source de publication.
3. La workflow `.github/workflows/pages.yml` publiera automatiquement le dossier `site` après chaque envoi sur `main`.
4. Ouvrir l’adresse Pages sur Android dans Chrome, puis choisir **Installer l’application** ou **Ajouter à l’écran d’accueil**.

GitHub Pages héberge les fichiers statiques. Les données de cette première version sont des liens vers les sources, pas des flux actualisés automatiquement. Voir [SOURCES.md](SOURCES.md) pour l’inventaire.

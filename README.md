# Sullias Bull Club (SBC)

Sullias Bull Club est une application web progressive (PWA) pensée pour Android et publiée sur [GitHub Pages](https://barbutix.github.io/SBC/). Elle réunit des sources d’actualités, des calendriers de tournois, du live score et des offres pour les fléchettes acier et soft-tip.

## Lancer en local

Ouvrir `site/index.html` dans un navigateur. L’installation PWA et le mode hors ligne nécessitent une origine HTTPS, comme GitHub Pages, ou un serveur local.

## Publication

Le dépôt [Barbutix/SBC](https://github.com/Barbutix/SBC) publie automatiquement le dossier `site` après chaque envoi sur `main`, avec le workflow `.github/workflows/pages.yml`.

Sur Android, ouvrir l’adresse Pages dans Chrome, puis choisir **Installer l’application** ou **Ajouter à l’écran d’accueil**. Le blason du club sert d’icône d’installation.

Les calendriers et les offres sont des liens vers leurs sources d’origine; cette première version ne collecte pas encore automatiquement les publications sociales, prix ou stocks. Voir [SOURCES.md](SOURCES.md) pour l’inventaire et les pistes d’automatisation.

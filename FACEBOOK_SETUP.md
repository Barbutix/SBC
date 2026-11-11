# Activer la veille de la Page Facebook du club

Le collecteur lit en lecture seule les publications récentes de la Page Facebook du club. Il repère celles dont le texte contient des mots liés aux tournois et les ajoute à la file de vérification dans `site/event-candidates.json`.

## Préparer l’accès Meta

Il faut une application Meta Developers et un jeton d’accès de la Page du Sullias Bull Club, obtenu par un administrateur de cette Page. L’application doit avoir l’autorisation de lecture `pages_read_engagement`. Aucun droit de publication ou de réponse n’est demandé.

L’accès et les autorisations accordées à l’application dépendent de sa configuration Meta. Meta peut demander une validation de l’application pour l’utiliser au-delà de ses personnes de test.

## Ajouter les réglages dans GitHub

Dans le dépôt SBC, ouvre **Settings → Secrets and variables → Actions**.

1. Dans **Variables**, ajoute `SBC_FB_PAGE_ID` avec l’identifiant numérique de la Page du club.
2. Dans **Secrets**, ajoute `SBC_FB_PAGE_ACCESS_TOKEN` avec le jeton d’accès de cette Page.

Ne place jamais le jeton dans le code, un ticket public ou le site. Il doit rester dans les secrets GitHub. Si Meta invalide ou fait expirer le jeton, il faudra le renouveler ici.

## Vérifier le démarrage

Dans **Actions → Veille tournois SBC**, lance **Run workflow** après avoir ajouté les deux réglages. Ensuite, le collecteur Facebook est appelé à chaque passage horaire du workflow.

Le collecteur examine les textes publiés au cours des 7 derniers jours. Les publications qui ne contiennent que des images sans texte ne sont pas repérées automatiquement. Chaque trouvaille reste marquée `pending` : elle doit être vérifiée avant d’être traitée comme un tournoi confirmé.

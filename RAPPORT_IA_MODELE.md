# Rapport d'usage de l'IA - TP1 - EL DADA Acile & DOUGHANE Saadeddine

## Mission 0 — Cartographie

Objectif : comprendre le code existant avant d'y toucher.

On a listé les fichiers de `frontend-starter/src` et demandé à l'IA d'expliquer le rôle de chacun (routes.ts, main.ts, auth.service.ts, auth.interceptor.ts, auth.guard.ts), puis de nous faire un schéma du flux de connexion.

On a vérifié en lisant nous-mêmes chaque fichier proposé, et en testant en vrai dans DevTools (Network) que la requête de login correspondait bien à ce qui était décrit.

Fichiers modifiés : aucun, c'était juste de la lecture.

Preuve : capture Network de la requête login (200 OK) + les deux schémas en pièce jointe.


#### Requête Login exécutée avec succès : 

![Requête login (200 OK)](./docs/login-200.png)

#### Cartographie du frontend :
![Cartographie du frontend](./docs/tp1_cartographie_frontend.svg)

#### Flux de connexion :
![Flux de connexion](./docs/tp1_flux_connexion.svg)

On sait maintenant expliquer : où se trouve quoi dans le projet Angular, et le trajet complet d'une connexion (composant → service → HttpClient → backend → JWT → redirection).

## Mission 1 — Connexion et profil


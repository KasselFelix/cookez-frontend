# Flows Maestro

Tous les flows pilotent **Cookez Dev** (`appId: com.v2.cookez.dev`), le build de debug local branché sur le backend local et la base de dev. Jamais `com.v2.cookez` : c'est l'APK preview, qui vise la prod.

- `common/` : sous-flows.
  - `launch` : état propre, permissions accordées, accueil. Utilisé par les flows `e2e/` et par `ui-check/login`.
  - `relaunch` : redémarre l'app sans effacer ses données (la session reste ouverte), remet le thème clair. Utilisé par les autres flows `ui-check/`, pour ne pas se reconnecter à chaque écran.
  - `login` : compte de test lu dans `MAESTRO_USERNAME` et `MAESTRO_PASSWORD`. Ne saisit rien si l'app est déjà connectée.
  - `search` : « egg » avec une quantité, jusqu'aux résultats.
  - `theme` : lien profond de dev `cookez-dev://dev/theme?name=<thème>`.
  - `capture` et `shoot` : une capture par thème.
- `ui-check/<écran>.yaml` : va jusqu'à un écran, le capture dans les cinq thèmes ou seulement dans `THEME` (`-e THEME=dark`), puis remet le thème clair. Écrans : `login`, `kickoff`, `result`, `recipe`, `profile`, `dashboard`, `gallery`.
- `e2e/` : un flow par parcours utilisateur (`launch`, `login`, `search`, `profile`), rejoués par la CI E2E. Ils restent en lecture seule : pas de publication, de vote ni de suppression.
- `reference/` : captures de référence validées, comparées par l'agent `ui-verifier`.

Les sélecteurs sont des `testID` nommés `<écran>-<élément>` (`home-connect`, `kickoff-next`, `recipe-card`, `tabbar-Profile`…). Ce ne sont jamais des textes visibles, qui suivent la langue de l'appareil.

En local, depuis la racine de `cookez-workspace`, avec la stack lancée par `/verify` :

```bash
node .claude/skills/verify/verify.mjs flow ui-check/kickoff [--theme dark]
node .claude/skills/verify/verify.mjs flow e2e/search
```

Le driver prouve que le backend est local, passe le compte de test sans l'afficher et range les captures dans `.claude/state/ui-check/<écran>/<date>/`.

En CI, `.github/workflows/e2e-android.yml` rejoue `e2e/` puis `ui-check/` (script `.github/scripts/e2e-run.sh`) sur une base remplie par le seed du backend, et publie seulement les captures et les rapports JUnit.

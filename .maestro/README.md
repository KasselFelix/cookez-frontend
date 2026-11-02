# Flows Maestro

- `e2e/` : un flow par parcours utilisateur (5 à 8), rejoués en CI par `e2e-android.yml`. Ils restent en lecture seule : pas de publication, de vote ni de suppression.
- `ui-check/<écran>.yaml` : va jusqu'à un écran et le capture, pour `/ui-check`. Le thème passe par la variable `THEME` (`maestro test -e THEME=dark …`).
- `reference/` : captures de référence validées, comparées par l'agent `ui-verifier`.

En local (PowerShell, depuis `cookez-frontend`) : `maestro test .maestro/e2e/launch.yaml`, avec l'émulateur lancé et l'app installée.

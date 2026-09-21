# Cookez — Application mobile de recettes personnalisées  
Frontend développé avec **Expo + React Native**

Cookez est une application mobile qui propose des **recettes intelligentes et personnalisées** selon les besoins de chaque utilisateur :  
- ingrédients disponibles,
- temps de préparation,  
- préférences culinaires,
- besoins caloriques,  
- restrictions alimentaires.

Elle s’appuie sur une interface simple, moderne et accessible, ainsi qu’une architecture pensée pour évoluer rapidement. L’objectif est de **réduire la charge mentale liée aux repas**, faire gagner du temps, et offrir une source d’inspiration culinaire grâce à une communauté active.

---

## Fonctionnalités principales

### 🔍 Recommandation intelligente  
- Filtrage par origine culinaire  
- Système de tags et filtres avancés  
- Sélecteur d’unités  
- Suggestions basées sur les ingrédients disponibles  
- Reconnaissance d’aliments 

### 🧠 Réduction de la charge mentale  
- Idées de repas rapides selon le temps disponible  
- Historique et préférences utilisateur  
- Automatisation du « quoi cuisiner aujourd’hui ? »

### 🧑‍🤝‍🧑 Espace communautaire  
- Partage de recettes  
- Découverte de nouvelles saveurs  
- Inspiration collaborative

### 📶 Fonctionnement hors‑ligne  
- Cache intelligent via les hooks API  
- Gestion de la connectivité réseau

---

## Architecture du projet

Le projet est organisé pour être **modulaire, scalable et maintenable** :

```text
cookez-frontend/
│
├── assets/          # Images, icônes, ressources visuelles
├── components/      # Composants UI réutilisables
├── contexts/        # Gestion de l’état global (profil, préférences)
├── hooks/           # Logique réutilisable (API, cache, réseau)
├── modules/         # Filtres, bottom sheets, sélecteurs avancés
├── reducers/        # Gestion des tags, filtres, états complexes
├── screens/         # Écrans principaux de l’application
├── styles/          # Thèmes, design tokens, base visuelle
└── app/             # Routing Expo (file-based routing)
```

---

## Technologies utilisées

| Domaine   | Technologie                |
|----------|----------------------------|
| Frontend | Expo (React Native)        |
| Langage  | JavaScript                 |
| État     | Context API + Reducers     |
| Routing  | Expo Router                |
| Outils   | RNGH, DateTimePicker, etc. |

---

## Installation & lancement

### 1. Installer les dépendances

```bash
npm install
```

### 2. Lancer l’application

```bash
npx expo start
```

Vous pouvez ensuite ouvrir l’application via :  
- un **émulateur Android**,  
- un **simulateur iOS**,  
- **Expo Go**.



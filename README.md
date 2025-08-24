# 🥊 Super Smash Bros Like - Jeu de Plateforme

Un jeu de combat de plateforme inspiré de Super Smash Bros, développé en JavaScript avec Canvas HTML5.

## 🎮 Fonctionnalités

### ⚔️ Combat Avancé
- **4 types d'attaques** : Normal, Fort, Haut, Bas
- **Système de knockback** qui augmente avec les dégâts
- **Invulnérabilité** temporaire après avoir pris des dégâts
- **Pourcentage de dégâts** à la Super Smash Bros

### 🎯 Power-ups
- ⚡ **Vitesse** : Déplacement plus rapide
- 💪 **Force** : Attaques plus puissantes
- 🛡️ **Bouclier** : Réduit les dégâts reçus
- 🦘 **Super-saut** : Saut plus haut
- ❤️ **Soin** : Réduit les dégâts accumulés

### 🏗️ Environnement
- **6 plateformes** à différentes hauteurs
- **Physique réaliste** avec gravité, friction et momentum
- **Système de respawn** si on tombe de l'écran
- **Particules** et effets visuels

### 🎵 Effets Sonores
- Sons générés avec **Web Audio API**
- Effets pour les sauts, attaques, dégâts et power-ups
- Son de victoire

## 🎮 Contrôles

### Joueur 1 (Bleu)
- **Déplacement** : A (gauche) / D (droite)
- **Saut** : W
- **Attaques** :
  - Normal : S
  - Fort : Q
  - Haut : E
  - Bas : X

### Joueur 2 (Rouge)
- **Déplacement** : ← / →
- **Saut** : ↑
- **Attaques** :
  - Normal : ↓
  - Fort : 1 (pavé numérique)
  - Haut : 2 (pavé numérique)
  - Bas : 3 (pavé numérique)

### Contrôles Généraux
- **Pause** : Échap
- **Reset** : R

## 🚀 Comment Jouer

1. **Déplacez-vous** sur les plateformes
2. **Attaquez** votre adversaire pour augmenter ses dégâts
3. **Plus les dégâts sont élevés, plus le knockback est fort**
4. **Récupérez les power-ups** pour des avantages temporaires
5. **Évitez de tomber** de l'écran !
6. **Objectif** : Projeter l'adversaire hors de l'écran ou atteindre 300% de dégâts

## 🏆 Victoire

La partie se termine quand un joueur atteint **300% de dégâts**. Le vainqueur est annoncé avec un écran de victoire.

## 🛠️ Installation et Lancement

```bash
# Cloner le projet
git clone [votre-repo]

# Aller dans le dossier
cd learning-game

# Lancer un serveur local
python3 -m http.server 8080

# Ouvrir dans le navigateur
http://localhost:8080
```

## 🎨 Technologies Utilisées

- **HTML5 Canvas** pour le rendu graphique
- **JavaScript ES6+** pour la logique du jeu
- **Web Audio API** pour les effets sonores
- **CSS3** avec animations et gradients

## 📱 Compatibilité

Compatible avec tous les navigateurs modernes supportant :
- HTML5 Canvas
- Web Audio API
- ES6 JavaScript

---

**Amusez-vous bien ! 🎮**
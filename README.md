# Flag Jumper - 2D Platform Game

A fun 2D platformer game built with HTML5 Canvas and JavaScript featuring progressive difficulty, enemy combat, and retro sound effects.

## 🎮 Features

- **5 Progressive Levels** - Each level gets harder with more enemies and challenging layouts
- **Enemy Combat** - Jump on enemies to defeat them for points
- **Sound Effects** - Retro-style audio for jumps, kills, and flag collection
- **Power-ups** - Speed and jump boosts to help you navigate
- **Settings System** - Adjust difficulty, sound, and player color
- **Particle Effects** - Visual feedback for all actions

## 🎯 How to Play

1. **Objective**: Collect all 3 flags in each level to advance
2. **Movement**: Use arrow keys to move left/right
3. **Jump**: Press Space to jump
4. **Combat**: Jump on enemies to defeat them (+200 points)
5. **Avoid**: Don't touch enemies from the side or you'll lose a life

## 🎵 Controls

- `← →` Arrow Keys: Move left and right
- `Space`: Jump
- `P`: Pause game
- `ESC`: Return to menu
- `R`: Restart (when game over)
- `N`: Next level (when level complete)

## 🚀 Running the Game

1. Start a local HTTP server:
   ```bash
   python3 -m http.server 8000
   ```
2. Open your browser and go to `http://localhost:8000`
3. Enjoy the game!

## 🔧 Recent Fixes

- ✅ Fixed instructions menu functionality
- ✅ Fixed level 3 progression bug
- ✅ Added real sound effects using Web Audio API
- ✅ Enhanced progressive difficulty system
- ✅ Improved enemy combat mechanics

## 🎨 Game Elements

- **Player**: Customizable colored square character
- **Enemies**: Red patrolling and jumping enemies
- **Flags**: Yellow collectible objectives
- **Platforms**: Static and moving platforms
- **Power-ups**: Green speed and jump boosters

## 📁 Files

- `index.html` - Main game page
- `script.js` - Game logic and classes
- `style.css` - Game styling
- `README.md` - This file

Built with ❤️ using vanilla JavaScript and HTML5 Canvas.

# ⚔️ Heroes Guild Character Sheet

A modern, responsive digital character sheet designed specifically for the **Heroes Guild Westmarches** community at [westmarches.games](https://www.westmarches.games/communities/heroes-guild). Built with Vue.js 3 and optimized for both screen and print use.

![Character Sheet Preview](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=flat&logo=vue.js&logoColor=white)
![Build Status](https://img.shields.io/badge/Build-Passing-success)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🏰 Heroes Guild Westmarches

This character sheet is tailored for the Heroes Guild community, providing:

- **Westmarches-Optimized**: Character management perfect for episodic adventures
- **Community Features**: Designed for the Heroes Guild player experience
- **Session Ready**: Quick character access for drop-in gameplay

Visit the [Heroes Guild Westmarches](https://www.westmarches.games/communities/heroes-guild) to join our community!

## ✨ Features

### 📱 **Responsive Design**

- **Mobile-Optimized**: Touch-friendly interface with larger buttons and improved layouts
- **Desktop-Enhanced**: Clean, professional layout for larger screens
- **Print-Ready**: Optimized CSS for clean, professional printing

### ⚔️ **Complete Character Management**

- **Point Buy System**: Interactive ability score allocation with visual feedback
- **Background Integration**: Automatic skill proficiency assignment from available backgrounds
- **Class Features**: Support for character classes with spellcasting integration
- **Level Progression**: Automatic proficiency bonus and HP calculation

### 🎛️ **Advanced Features**

- **Drag-and-Drop Reordering**: Organize features, spells, and attacks by dragging
- **Auto-Save**: Character data persists locally in browser storage
- **Import/Export**: Share characters via JSON import/export
- **Real-time Calculations**: Automatic modifier and bonus calculations

### 🎯 **Interactive Elements**

- **Smart Point Buy**: Visual points remaining counter with animations
- **Mobile-Friendly Buttons**: Large, color-coded increase/decrease buttons
- **Spell Slot Management**: Automatic spell slot calculation by caster type
- **Death Save Tracking**: Quick checkbox interface for death saves

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/MelvinLoos/5e-character-sheet.git
cd 5e-character-sheet

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎮 Usage

### Creating a Character

1. **Edit Mode**: Click the edit button to modify character details
2. **Point Buy**: Allocate ability scores using the intuitive point buy system
3. **Background**: Select a background to automatically assign skill proficiencies
4. **Features**: Add class features, feats, and special abilities
5. **Spells**: Add spells with automatic spell slot calculation

### Managing Content

- **Drag to Reorder**: In edit mode, drag handles appear on features, spells, and attacks
- **Auto-Calculations**: Modifiers, proficiency bonuses, and spell save DCs update automatically
- **Print Layout**: Use your browser's print function for clean character sheets

### Data Management

- **Auto-Save**: Changes are automatically saved to browser storage
- **Export**: Download character as JSON file
- **Import**: Upload previously exported character files

### Heroes Guild Integration

- **Westmarches Ready**: Perfect for episodic adventure sessions
- **Community Optimized**: Designed for Heroes Guild gameplay style
- **Session Management**: Quick character access for drop-in games

## 🛠️ Technical Stack

- **Frontend**: Vue.js 3 with Composition API
- **State Management**: Pinia
- **Styling**: Tailwind CSS with custom D&D theming
- **Drag & Drop**: Vue.draggable.next
- **Icons**: Feather Icons
- **Build Tool**: Vite
- **Type Safety**: JavaScript with JSDoc

## 📋 Game System Integration

This character sheet implements common tabletop RPG mechanics including:

- Standard ability score systems
- Background-based skill assignments
- Class feature organization
- Spell slot management
- Proficiency bonus scaling

## 🎨 Customization

The character sheet uses CSS custom properties for theming:

```css
:root {
  --sheet-bg: #f4f0e6;
  --sheet-text: #3a2d21;
  --sheet-accent: #c9b7a2;
  --sheet-red: #8b4513;
}
```

## 📱 Mobile Features

- **Larger Touch Targets**: 40px minimum for comfortable mobile interaction
- **Responsive Layouts**: Stacked layouts on mobile, side-by-side on desktop
- **Stepper Controls**: Mobile-specific +/- buttons for level adjustment
- **Optimized Spacing**: Increased padding and margins for touch interfaces

## 🖨️ Print Optimization

- **Clean Layout**: Removes UI chrome and navigation for printing
- **Optimized Typography**: Print-friendly fonts and sizing
- **Page Breaks**: Intelligent page breaks between sections
- **Ink Efficient**: Optimized colors and backgrounds for printing

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

- Follow Vue.js 3 Composition API patterns
- Use Tailwind CSS for styling
- Ensure mobile responsiveness
- Test print layouts
- Maintain Heroes Guild compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Attribution

- **Icons**: <a href="https://www.flaticon.com/free-icons/rpg" title="rpg icons">RPG icons created by mj - Flaticon</a>
- **Fonts**: EB Garamond and Fell English fonts
- **Community**: Built for [Heroes Guild Westmarches](https://www.westmarches.games/communities/heroes-guild)

## 🐛 Known Issues

- Some browsers may require HTTPS for local storage persistence
- Print layouts optimized for standard letter-size paper
- Very long character names may wrap in mobile layouts

## 🔮 Roadmap

- [ ] PDF export functionality
- [ ] Multiple character management
- [ ] Heroes Guild campaign integration
- [ ] Custom background creation
- [ ] Community character sharing
- [ ] Session tracking features

---

**Built with ❤️ for the Heroes Guild Westmarches community**

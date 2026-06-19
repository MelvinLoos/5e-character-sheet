# ⚔️ Heroes Guild Character Sheet

A modern, responsive digital character sheet designed specifically for the **Heroes Guild Westmarches** community at [westmarches.games](https://www.westmarches.games/communities/heroes-guild). Built with Vue.js 3 and optimized for both screen and print use.

[![Vue.js](https://img.shields.io/badge/Vue.js-3.5.22-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Netlify Status](https://api.netlify.com/api/v1/badges/b8a04a80-1349-4a79-a3ce-c1d997e3bc9d/deploy-status)](https://app.netlify.com/projects/5e-character-sheet/deploys)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Heroes Guild](https://img.shields.io/badge/Heroes_Guild-Westmarches-8B4513?logo=castle&logoColor=white)](https://www.westmarches.games/communities/heroes-guild)

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

### 🤖 **AI-Powered Generation**

- **Prompt-to-Character**: Generate full character sheets from natural language descriptions using Google Gemini
- **Intelligent Creation**: Automatically selects appropriate class, race, background, and features
- **Rules Compliant**: Generates characters adhering to 5e rules (2024 handbook compatible)

### ☁️ **Online Sharing**

- **Shareable Links**: Generate unique URLs to share your characters with other players
- **Cloud Snapshots**: Character state is saved to Supabase for easy sharing via link

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

- Node.js `^20.19.0 || >=22.12.0` (see `engines` in `package.json`)
- npm (this repo uses `package-lock.json`; npm is the supported package manager)

### Installation

```bash
# Clone the repository
git clone https://github.com/MelvinLoos/5e-character-sheet.git
cd 5e-character-sheet

# Install dependencies
npm install

# Configure Environment Variables
# Copy the example file and fill in your own values, or configure them in Netlify.
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Copy `.env.example` to `.env` and provide values for the following variables. A `.env` file is git-ignored, so secrets are never committed.

| Variable                 | Scope             | Description                                                                                                       |
| ------------------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | Client (Vite)     | Supabase project URL used for online character sharing. Exposed to the browser via `import.meta.env`.             |
| `VITE_SUPABASE_ANON_KEY` | Client (Vite)     | Supabase anonymous (public) client key. Public, but kept in config rather than hard-coded.                        |
| `GEMINI_API_KEY`         | Server (Netlify)  | Google Gemini API key used by the Netlify serverless function for AI generation. A secret, never sent to the browser. |

> **Note:** When the Supabase variables are not set, the app still runs — online sharing is gracefully disabled and a warning is logged to the console.

## 🧪 Testing

```bash
# Run Unit Tests
npm run test:unit

# Run End-to-End Tests
npm run test:e2e
```

## 🎮 Usage

### Creating a Character

1. **AI Generation**: Use the "AI Generate" button to create a character from a description (e.g., "A sneaky goblin rogue who loves shiny things")
2. **Edit Mode**: Click the edit button to manually modify character details
3. **Point Buy**: Allocate ability scores using the intuitive point buy system
4. **Background**: Select a background to automatically assign skill proficiencies
5. **Features**: Add class features, feats, and special abilities
6. **Spells**: Add spells with automatic spell slot calculation

### Managing Content

- **Share Online**: Click "Share" to generate a unique URL for your character via Supabase
- **Drag to Reorder**: In edit mode, drag handles appear on features, spells, and attacks
- **Auto-Calculations**: Modifiers, proficiency bonuses, and spell save DCs update automatically
- **Print Layout**: Use your browser's print function for clean character sheets

### Data Management

- **Auto-Save**: Changes are automatically saved to browser storage
- **Cloud Save**: Characters shared online are preserved in the database
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
- **Backend & Auth**: Supabase
- **AI Integration**: Google Gemini via Netlify Functions
- **Drag & Drop**: Vue.draggable.next
- **Icons**: Feather Icons
- **Build Tool**: Vite
- **Testing**: Playwright (E2E), Vitest (Unit)
- **Type Safety**: TypeScript & JSDoc

## 📋 Game System Integration

This character sheet implements common tabletop RPG mechanics including:

- Standard ability score systems
- Background-based skill assignments
- Class feature organization
- Spell slot management
- Proficiency bonus scaling

## 🎨 Customization

The character sheet is themed through custom Tailwind CSS colors defined in `tailwind.config.js`:

```js
// tailwind.config.js
colors: {
  'sheet-bg': '#fdf6e3',
  'sheet-text': '#3a2d21',
  'sheet-red': '#8c1d1d',
  'sheet-red-dark': '#6a1616',
  'sheet-border': '#5c4d3d',
  'sheet-accent': '#c9b7a2',
  'sheet-input-bg': '#eaddc7',
}
```

These tokens are consumed via Tailwind utility classes (e.g. `bg-sheet-bg`, `text-sheet-red`) in the
component styles under `src/assets/main.css`. Adjust the values here to retheme the sheet.

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

- [x] AI Character Generation
- [x] Multiple character management
- [x] Community character sharing (Online via Supabase)
- [x] PDF export functionality
- [ ] Heroes Guild campaign integration
- [ ] Custom background creation
- [ ] Session tracking features

---

**Built with ❤️ for the Heroes Guild Westmarches community**

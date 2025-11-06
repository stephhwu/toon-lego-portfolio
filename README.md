# Spaceship Portfolio

A Vue.js portfolio showcasing LEGO spaceship builds from set 76832.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

This project is configured to automatically deploy to GitHub Pages when changes are pushed to the main branch.

### Manual Deployment

```bash
# Build and deploy to GitHub Pages
npm run deploy
```

## Project Structure

```
src/
├── components/
│   └── SpaceshipGrid.vue    # Main spaceship grid component
├── App.vue                  # Root Vue component
└── main.js                  # Vue application entry point

public/
└── images/                  # Spaceship images (1.png to 25.png)
```

## Technologies Used

- Vue.js 3 (Composition API)
- Vite (build tool)
- CSS Grid for responsive layout
- GitHub Pages for hosting
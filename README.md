# Connor & Kippy's Wedding Website 💍

A fun, playful wedding website built with TypeScript, Vite, and vanilla CSS.

## 🚀 Quick Start

### Development
```bash
npm run dev
```
Open http://localhost:5173 in your browser.

### Build for Production
```bash
npm run build
```
Output will be in the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

## 📁 Project Structure

```
wedding-site/
├── index.html          # Main HTML file
├── src/
│   ├── main.ts         # TypeScript entry point (countdown timer logic)
│   └── style.css       # All styles (fun & playful aesthetic)
├── public/
│   └── images/         # Place your photos here
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── AGENTS.md           # Project context for AI agents
└── README.md           # This file
```

## 🎨 Customization

### Update Wedding Details

1. **Date & Time**: Edit `WEDDING_DATE` in `src/main.ts` (line 6)
2. **Venue & Schedule**: Edit content in `index.html`
3. **Colors**: Modify CSS custom properties in `src/style.css` (lines 13-20)

### Add Photos

- Place images in `public/images/`
- Reference them in HTML as `/images/your-photo.jpg`

### Color Scheme

Current palette (fun & playful):
- Primary: `#ff6b9d` (pink)
- Secondary: `#c06c84` (mauve)
- Accent: `#f67280` (coral)
- Highlight: `#ffd93d` (yellow)

Change these in `:root` CSS variables to customize!

## 🛠 Tech Stack

- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast dev server and build tool
- **Vanilla CSS**: No framework, full control
- **GitHub Pages**: Deployment (coming soon)

## 📦 Deployment

Coming in Phase 3! Will deploy to GitHub Pages with custom domain support.

## 🎯 Feature Roadmap

- [x] Phase 1: MVP - Single page with countdown timer
- [ ] Phase 2: Photo gallery, multiple pages, enhanced animations
- [ ] Phase 3: RSVP system, guest uploads, custom domain, backend

## 💡 Learning Notes

This project is built to learn web development from scratch:
- TypeScript for type safety
- CSS Grid/Flexbox for layouts
- DOM manipulation
- Responsive design
- Build tooling with Vite

## 🐛 Troubleshooting

**Port already in use?**
```bash
npm run dev -- --port 3000
```

**Build fails?**
- Check TypeScript errors: `npx tsc --noEmit`
- Clear cache: `rm -rf node_modules dist && npm install`

---

Built with ❤️ by Connor (with help from Claude Code)

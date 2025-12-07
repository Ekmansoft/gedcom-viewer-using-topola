# Family Tree Viewer

A modern, interactive web application for visualizing family tree data from GEDCOM files or Geni.com, built with React, TypeScript, and the Topola library.

## Features

- 📁 **Multiple Data Sources** - GEDCOM files or Geni.com API connection
- 🌐 **Geni Integration** - Connect to your Geni.com account and visualize your online family tree
- 🔍 **Search & Filter** - Find profiles instantly with real-time search
- 🌳 **Multiple Chart Types** - Ancestor, descendant, hourglass, and relatives views
- 🎨 **Custom Renderers** - Extensible plugin system for custom visualizations
- ⚡ **High Performance** - Virtual scrolling for thousands of profiles
- 💾 **Local Storage** - Save your data in the browser with IndexedDB
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## Getting Started

### Prerequisites

- Node.js 20.19+ or 24+ (LTS recommended) and npm

### Installation

1. Navigate to the project directory:
```bash
cd gedcom-viewer
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Configure Geni API:
   - Copy `.env.example` to `.env.local`
   - Register an app at [Geni Developer Portal](https://www.geni.com/platform/developer)
   - Add your Client ID to `.env.local`:
     ```
     VITE_GENI_CLIENT_ID=your_client_id_here
     ```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser to `http://localhost:5173`

## Demo Files

The project includes several demo GEDCOM files for testing:

- **sample-family.ged** - Simple 3-generation family (8 individuals)
- **demo-family-3gen.ged** - More complex 3-generation tree (11 individuals) from John Sr Doe lineage
- **Queen.ged** - Extensive royal genealogy tracing European royalty back through ancient lineages

Load these files to explore different chart layouts and data structures.

## Usage

### Loading Data

**Option 1: GEDCOM File**
1. Click on the "GEDCOM File" tab
2. Drag and drop or click to browse for a .ged file
   - Demo files are included in the project root for testing

**Option 2: Geni.com** (requires configuration)
1. Click on the "Geni.com" tab
2. Click "Connect with Geni" to authenticate
3. Choose load options (ancestors, descendants, generations)
4. Click "Load Family Tree"

### Viewing Data

1. **Browse profiles** - Search and filter through the profile list
2. **Select a profile** - Click on any profile to view their family tree
3. **Choose chart type** - Switch between different visualization modes:
   - ⏳ Hourglass - Ancestors above, descendants below
   - ⬆️ Ancestors - Full ancestor tree
   - ⬇️ Descendants - All descendants
   - 👥 Relatives - Close family members
5. **Navigate the tree** - Click on any person in the chart to recenter on them
6. **Zoom controls** - Use the zoom buttons to adjust the view

## Project Structure

```
gedcom-viewer/
├── src/
│   ├── components/
│   │   ├── chart/          # Chart visualization components
│   │   ├── common/         # Reusable UI components
│   │   ├── layout/         # Layout components
│   │   ├── profiles/       # Profile list components
│   │   └── upload/         # File upload components
│   ├── services/           # Business logic & data processing
│   │   ├── gedcomParser.ts
│   │   └── relationshipGraphBuilder.ts
│   ├── store/              # Zustand state management
│   ├── types/              # TypeScript type definitions
│   └── App.tsx
├── docs/                   # Documentation
└── package.json
```

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite 7** - Build tool and dev server
- **Zustand** - State management
- **Topola 3.8** - Genealogy visualization library
- **D3.js** - Data visualization
- **Tailwind CSS** - Styling
- **@tanstack/react-virtual** - Virtual scrolling
- **Dexie.js** - IndexedDB wrapper

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests

### Adding Custom Renderers

See the [Plugin Development Guide](../GEDCOM_Plugin_Development_Guide.md) for detailed instructions on creating custom chart renderers and chart types.

## Documentation

- [Requirements](../GEDCOM_Frontend_Requirements.md)
- [API Specifications](../GEDCOM_API_Specifications.md)
- [Component Architecture](../GEDCOM_Component_Architecture.md)
- [Plugin Development Guide](../GEDCOM_Plugin_Development_Guide.md)

## Roadmap

- [x] Integrate Topola chart rendering
- [x] Add chart type selector (Hourglass, Ancestors, Descendants, Relatives)
- [x] Interactive navigation by clicking individuals in charts
- [x] Load new GEDCOM files without page reload
- [x] Upgraded to Vite 7 and latest dependencies
- [ ] Add custom renderer plugins
- [ ] Implement export to PNG/SVG/PDF
- [ ] Add photo support
- [ ] Implement family relationship calculator
- [ ] Add timeline view
- [ ] Support for GEDCOM 7.0 format
- [ ] Multi-language support

## Contributing

Contributions are welcome! Please read the documentation and submit pull requests.

## License

MIT License - See LICENSE file for details

## Acknowledgments

- [Topola](https://github.com/PeWu/topola) - Genealogy visualization library
- [gedcom](https://github.com/tmcw/gedcom) - GEDCOM parser library
- GEDCOM standard by FamilySearch

## Support

For issues and questions, please open an issue on GitHub.

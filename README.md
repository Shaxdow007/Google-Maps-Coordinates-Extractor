# Google Maps Coordinates Extractor

## Project Description
A web application that extracts latitude and longitude values from Google Maps URLs, place names, or place IDs. It is built with React, TypeScript, and Tailwind CSS and provides a simple interface to copy coordinates or view your recent searches.

## Features
- Parse coordinates directly from Google Maps URLs
- (Optional) Geocode place names and place IDs using the Google Maps API
- Copy latitude, longitude, or both to the clipboard
- Displays formatted coordinates and recent search history
- Example links for quick testing

## Installation
1. Install [Node.js](https://nodejs.org/) (version 18 or later recommended).
2. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```
5. Preview the production build locally:
   ```bash
   npm run preview
   ```

## Usage
After running `npm run dev`, open `http://localhost:5173` in your browser. Enter a Google Maps URL, place name, or place ID to extract coordinates. Example URLs provided in the app include:
- `https://www.google.com/maps/@40.7589,-73.9851,15z`
- `https://maps.google.com/maps?q=48.8584,2.2945`
- `https://www.google.com/maps/place/@51.5074,-0.1278,17z`

These correspond to the coordinates:
- **Lat:** 40.7589, **Lon:** -73.9851
- **Lat:** 48.8584, **Lon:** 2.2945
- **Lat:** 51.5074, **Lon:** -0.1278

## Configuration & Environment Variables
To enable place name and Place ID geocoding, supply a Google Maps API key via the environment variable `VITE_GOOGLE_MAPS_API_KEY` when running or building the app.

Example `.env` file:
```env
VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```
Without a key, only URL parsing is available.

## Dependencies
Main runtime dependencies:
- react
- react-dom
- lucide-react

Dev dependencies:
- @types/react
- @types/react-dom
- @vitejs/plugin-react
- eslint & related plugins
- tailwindcss
- typescript
- vite

See `package.json` for exact versions.

## Testing
No automated tests are included yet. Lint the project with:
```bash
npm run lint
```

## Contributing
1. Fork the repository and create a new branch for your changes.
2. Commit your work and open a pull request.
3. Describe your changes clearly so they can be reviewed.

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.

## Contact
Please open an issue on GitHub if you have questions or need support.
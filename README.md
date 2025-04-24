# Google News Search

<div align="center">

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?style=for-the-badge)](https://github.com/yourusername/google-news-search)
[![License](https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge)](LICENSE)
[![RapidAPI](https://img.shields.io/badge/powered%20by-RapidAPI-orange.svg?style=for-the-badge)](https://rapidapi.com/)

</div>

A modern, responsive Google News search application that allows users to search for news articles with advanced filtering options.



## Features

- **Search Capabilities**: Search for news articles with keywords, phrases, and boolean operators
- **Advanced Filtering**: Filter results by source domain and date range
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Fallback System**: Sample data displayed if API connection fails
- **Modern UI**: Clean interface with article cards and pagination
- **Secure Configuration**: API keys stored in a separate configuration file

## Setup

1. Clone the repository to your local machine or web server.
2. Edit the `config.js` file to add your own API keys:
   ```javascript
   const config = {
       apiKeys: [
           'your_api_key_here',       // Primary key
           'your_backup_api_key_here' // Backup key
       ],
       useAlternativeEndpoints: true,
       resultsPerPage: 9
   };
   ```
3. Open `index.html` in a web browser or set up a server to serve the files.

## File Structure

```
google-news-search/
├── app.js              # Main JavaScript file with app functionality
├── config.js           # Configuration file for API keys and settings
├── styles.css          # CSS styles for the application
├── index.html          # Main HTML file
├── package.json        # Node.js dependencies and project info (optional)
└── README.md           # Project documentation
```

## API Keys

The application uses RapidAPI's Google News and Real-Time News APIs. To use your own API keys:

1. Sign up for a free account at [RapidAPI](https://rapidapi.com/)
2. Subscribe to the [Google News API](https://rapidapi.com/newscatcher-api-newscatcher-api/api/google-news-api) and [Real-Time News API](https://rapidapi.com/newscatcher-api-newscatcher-api/api/real-time-news-data/)
3. Get your API key from RapidAPI dashboard
4. Add your API keys to the `config.js` file:

```javascript
const config = {
    apiKeys: [
        'your_api_key_here',       // Primary key
        'your_backup_api_key_here' // Backup key
    ],
    // other settings...
};
```

## Development

For local development:

1. Clone the repository
2. Edit config.js with your API keys
3. Open `index.html` in your browser or use a local server

## Customization

### Colors

You can customize the colors by modifying the CSS variables in the `styles.css` file:

```css
:root {
    --primary-color: #4a6cf7;
    --secondary-color: #6b7280;
    --background-color: #f9fafb;
    --card-background: #ffffff;
    --text-color: #1f2937;
    --border-color: #e5e7eb;
    --success-color: #10b981;
    --error-color: #ef4444;
}
```

### Layout

- Adjust the number of articles per page by modifying the `resultsPerPage` value in `config.js`
- Change the grid layout by modifying the media queries in the CSS file

## Browser Support

| Chrome | Firefox | Edge | Safari | Opera |
| :---: | :---: | :---: | :---: | :---: |
| ✅ | ✅ | ✅ | ✅ | ✅ |

## License

This project is released under the MIT License. Feel free to use, modify, and distribute it as needed.

## Credits

Built using:
- HTML, CSS, and JavaScript
- [RapidAPI](https://rapidapi.com/) for Google News API
- [Shields.io](https://shields.io/) for README badges

## Contact

Have questions or suggestions? Feel free to open an issue or contribute to the project!

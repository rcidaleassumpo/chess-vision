# Chess Vision

A React Native app that uses AI vision to analyze chess positions from photos and convert them to FEN notation.

## Features

- Take photos of chess boards using your device camera
- AI-powered chess position recognition using OpenAI GPT-4o Vision
- Get FEN notation for any chess position
- Open positions directly in Lichess for analysis

## Prerequisites

- Node.js (v18 or later)
- Expo CLI
- iOS Simulator / Android Emulator or physical device
- OpenAI API key

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/rcidaleassumpo/chess-vision.git
   cd chess-vision
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the project root:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Run the app**
   ```bash
   # Start the Expo dev server
   npm start

   # Run on iOS
   npm run ios

   # Run on Android
   npm run android
   ```

## Usage

1. Point your camera at a chess board
2. Tap the capture button to take a photo
3. Tap "Analyze" to process the position with AI
4. Copy the FEN notation or open in Lichess for analysis

## Tech Stack

- React Native with Expo
- react-native-vision-camera
- OpenAI GPT-4o Vision API

## License

MIT

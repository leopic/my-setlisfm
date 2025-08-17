# My Setlist.fm

A React Native/Expo app for tracking and managing your concert history using the Setlist.fm API.

## Setup

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
SETLISTFM_API_KEY=your_api_key_here
SETLISTFM_TEST_USERNAME=your_username_here
```

**⚠️ IMPORTANT:** Never commit your `.env` file to version control. It's already added to `.gitignore`.

### Getting an API Key

1. Visit [Setlist.fm](https://www.setlist.fm/)
2. Create an account or log in
3. Go to your profile settings
4. Generate an API key

## Development

```bash
# Install dependencies
yarn install

# Start the development server
yarn start

# Run on iOS simulator
yarn ios

# Run on Android emulator
yarn android
```

## Features

- View all your attended concerts
- Browse artists and venues
- See setlist details for each concert
- Sort and filter your concert data
- Track concert statistics and history

## Tech Stack

- React Native with Expo
- TypeScript
- SQLite for local data storage
- Setlist.fm REST API

# IDali

**IDali** is a mobile-based ID photo formatting, editing, and layout system built with **React Native and Expo**.

It helps users prepare ID photos in one application by allowing them to capture or upload a photo, edit it, choose an ID size and paper size, adjust the background, and automatically generate a printable layout.

## Features

* User Registration & Login
* Dashboard
* Profile
* Capture or Upload Photo
* Photo Editing
* Background Adjustment
* ID Photo Size Selection
* Paper Size Selection
* Automatic Layout Generation
* Layout Preview
* Save Layout
* Export / Download
* Layout History
* Offline Local Storage


## How It Works

1. **Login/Register** – User creates an account or logs in.
2. **Dashboard** – User accesses the main features.
3. **Capture/Upload** – User takes a photo or selects one from the device.
4. **Edit** – User prepares the photo using the available editing tools.
5. **ID Size** – User selects the required ID photo size.
6. **Background** – User adjusts or changes the photo background.
7. **Paper Size** – User selects the paper size for the layout.
8. **Generate** – IDali automatically arranges multiple copies of the photo.
9. **Preview** – User checks the generated layout.
10. **Save/Export** – User saves, exports, or downloads the final layout.
11. **History** – Previously created layouts can be accessed again.

## Technology Stack

* **React Native** – Mobile application
* **Expo** – Development framework
* **TypeScript** – Programming language
* **Expo Router** – Navigation
* **SQLite** – Local database and offline data
* **Firebase** – Authentication / cloud services
* **Git & GitHub** – Version control

## Project Goal

IDali aims to make ID photo preparation easier by combining:

**Capture → Edit → Format → Arrange → Preview → Save → Export**

into one simple mobile application.

## Status

 **Currently in development**

## Background-removal service

Background removal is handled by the backend in `server/`. remove.bg is tried first. If it is out of quota, rate-limited, temporarily unavailable, or otherwise fails, the backend tries Magic Hour. The app receives the processed PNG from whichever provider succeeds; it only receives a generic error when both providers fail.

Run the backend from the project root with:

```bash
npm run server
```

Before starting it, copy `server/.env.example` to `server/.env` and set `REMOVE_BG_API_KEY` and `MAGIC_HOUR_API_KEY` there, or provide those variables through the deployment platform's secret manager. The keys never belong in the Expo app.

For the mobile app, copy `.env.example` to `.env.local` and set `EXPO_PUBLIC_IDALI_API_URL` to the reachable backend URL. This is only the public server URL, not an API key. Restart Expo after changing it.

The current API keys were shared in chat, so rotate both provider keys before using this integration in production.

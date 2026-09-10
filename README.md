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

## App Flow

```text
Login / Register
       ↓
   Dashboard
       ↓
 Create ID Photo
       ↓
 Capture / Upload
       ↓
   Edit Photo
       ↓
 Select ID Size
       ↓
Adjust Background
       ↓
 Select Paper Size
       ↓
 Generate Layout
       ↓
    Preview
       ↓
 Save / Export / Download
       ↓
    History
```

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

## Architecture

```text
                IDali Mobile App
                       │
                       ▼
                React Native UI
                       │
                       ▼
                Application Logic
                       │
              ┌────────┴────────┐
              ▼                 ▼
          SQLite             Firebase
        Local Data       Authentication
        & History        Cloud Services
              │
              ▼
       Generated Layout
              │
              ▼
       Save / Export
```

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

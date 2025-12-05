# SumMed 💊

SumMed is a modern mobile application that scans medicine boxes to extract information, provides summarized leaflets, and tracks medication schedules.

## 📱 Features

### 🔍 Medicine Scanning & Recognition

- **Camera Scanning**: Automatically extract medicine information by pointing the camera at the medicine box
- **OCR Integration**: Extract medicine name and dosage information from images using Google Gemini API
- **Manual Entry**: You can also enter medicine information manually

### 📄 Summarized Leaflet

- Personalized medicine information and summarized leaflets
- Information about intended use, how to use, and side effects
- Customized recommendations based on user profile (age, height, weight)

### 📅 Medicine Tracking

- Add and track your medicines
- Customizable medicine schedules (daily, weekly)
- Multiple time slot support
- Push notifications for reminders

### 👤 User Profile

- Save your personal information (age, height, weight)
- Personalized medicine recommendations based on your profile information

### 🌍 Multi-language Support

- Turkish and English language support
- In-app language switching

## 🛠️ Technology Stack

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Data Storage**: AsyncStorage
- **Camera**: Expo Camera
- **Notifications**: Expo Notifications
- **OCR/API**: Google Gemini API
- **UI Libraries**:
  - @expo/vector-icons
  - React Native Reanimated
  - React Native Gesture Handler

## 📋 Requirements

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Android Emulator
- Google Gemini API key (for OCR)

## 🚀 Installation

1. **Clone the project**

   ```bash
   git clone <repository-url>
   cd summed
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the project root directory:

   ```
   API_KEY=your_gemini_api_key_here
   API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent
   ```

4. **Start the application**

   ```bash
   npm start
   ```

   Or platform-specific:

   ```bash
   npm run ios      # For iOS
   npm run android  # For Android
   npm run web      # For Web
   ```

## 📁 Project Structure

```
summed/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation pages
│   ├── add-medicine.tsx   # Add medicine screen
│   ├── edit-medicine.tsx  # Edit medicine screen
│   ├── scan-medicine.tsx  # Scan medicine screen
│   ├── medicine-tracker.tsx # Medicine tracker screen
│   ├── leaflet.tsx        # Leaflet display
│   ├── user-profile.tsx   # User profile
│   └── manual-medicine-entry.tsx # Manual medicine entry
├── components/            # Reusable components
├── models/               # TypeScript models
│   ├── medicine.ts       # Medicine model
│   └── integrations.ts  # API integration models
├── utils/                # Utility functions
│   ├── medicineStore.ts  # Medicine data management
│   ├── userProfileStore.ts # User profile management
│   ├── notificationManager.ts # Notification management
│   ├── languageStore.ts  # Language management
│   └── translations.ts   # Translation file
├── constants/            # Constants
├── hooks/               # Custom React hooks
└── assets/             # Images and fonts
```

## 🔧 Usage

### Medicine Scanning

1. Select "Scan your medicine box" from the home screen
2. Point the camera at the medicine box
3. The app will automatically extract medicine information
4. View summarized leaflet information

### Adding and Tracking Medicines

1. Go to the "Track your medicines" screen
2. Click the "+" button to add a new medicine
3. Enter medicine name, dosage, and schedule information
4. Enable notifications
5. Swipe medicines to delete or edit them

### User Profile

1. Go to the "Your Profile" screen
2. Enter your age, height, and weight information
3. This information is used for personalized medicine recommendations

## 🔐 API Integration

The application uses Google Gemini API for OCR operations. You need to define your API key in the `.env` file.

For detailed integration information, you can refer to the `README_PYTHON_INTEGRATION.md` file.

## 🌐 Language Support

The application supports the following languages:

- 🇹🇷 Turkish
- 🇬🇧 English

Language switching feature will be added soon.

## 📝 Development

### Resetting the Project

To start a fresh project:

```bash
npm run reset-project
```

This command backs up the current `app` directory as `app-example` and creates a new `app` directory.

### Linting

```bash
npm run lint
```

## 📄 License

This is a private project.

## 🤝 Contributing

Contributions are welcome! Before submitting a pull request, please:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Contact

For questions or suggestions, please contact us.

---

**Note**: This application is for general information purposes only. It does not replace medical advice, diagnosis, or treatment. Always consult a doctor.

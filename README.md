# Saarthak App

This project is an Expo React Native app.

## Run This App

### Prerequisites

- Node.js `22.13.0` or newer
- `npm`
- Android Studio with an Android emulator, or another Linux machine with KVM enabled

### Install

```bash
npm install
```

### Start Metro

```bash
npx expo start
```

### Run On An Android Emulator

1. Open Android Studio.
2. Open `Device Manager`.
3. Create or start an Android Virtual Device.
4. Prefer an `x86_64` image on a machine with hardware acceleration enabled.
5. In this project folder, run:

```bash
npx expo start
```

6. When Expo starts, press `a` in the terminal to open the app on the running Android emulator.

### Optional Script

You can also try:

```bash
npm run android
```

This uses Expo's Android run command.

## Important Note For This Host

This machine does not expose `/dev/kvm`, so Android emulators started here remain `offline` and do not finish booting.

That means:

- The app dependencies install correctly here.
- Metro starts correctly here.
- A usable Android simulator does not finish booting here.

To run the app without a physical phone, use one of these:

1. A Linux machine or VM with KVM enabled
2. Android Studio on another computer with emulator acceleration enabled
3. A cloud Android emulator service

## Recommended Working Flow

On a machine with a working emulator:

```bash
nvm use 22.13.0
npm install
npx expo start
```

Then:

1. Start the Android emulator
2. Press `a` in the Expo terminal

## Troubleshooting

### Node Version Problems

If Expo or React Native reports engine errors, switch to Node `22.13.0` or newer.

### Emulator Shows Offline

If `adb devices` shows the emulator as `offline`, the emulator host is usually missing hardware acceleration or the emulator is not booting correctly.

### Check Connected Devices

```bash
adb devices
```

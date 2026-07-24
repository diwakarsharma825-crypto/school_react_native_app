# 06 · Setup & Run

## Prerequisites (already verified on this machine)

| Tool | Version | Notes |
|------|---------|-------|
| Node | 21.7.3 | Works; Node 22 LTS recommended if Metro misbehaves (`nvm install 22`) |
| npm | 10.5 | Ships with Node |
| Java (JDK) | 17 (Zulu) | For Android builds |
| Android Studio SDK | installed | Emulator + `adb` |
| Xcode | installed | iOS Simulator (optional; Android is the target) |

### Shell PATH (important — was fixed during setup)

`~/.zshrc` must contain these on **separate lines**:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```
> A missing newline here (the `platform-tools` line glued to the next command) was why `adb`
> wasn't found the first time. After editing, run `source ~/.zshrc` or open a new terminal.
> Verify with `adb --version` → should print `1.0.41`.

## Install

```bash
cd "/Users/jatin/Desktop/React App/saarthak-app"
npm install
```

## Run on the Android emulator

```bash
# 1. boot the emulator (or launch it from Android Studio → Device Manager)
emulator -list-avds                       # e.g. Medium_Phone_API_36.1
emulator -avd Medium_Phone_API_36.1 &

# 2. start the app (installs Expo Go into the emulator on first run, then opens the app)
npx expo start --android
```
The app runs **inside Expo Go**. First launch downloads Expo Go once (~1–2 min); after that
it's instant.

## Run on a physical Android phone (no emulator)

1. Install **Expo Go** from the Play Store; put the phone on the same Wi-Fi as the Mac.
2. `npx expo start` → scan the QR code with Expo Go.

## Everyday dev loop

- Edit any file → **save** → app reloads in ~1s (Fast Refresh), state preserved.
- In the Metro terminal: `r` reload · `a` open Android · `m` dev menu · `Ctrl+C` quit.
- `console.log(...)` prints in the Metro terminal.

## Verify the project is healthy

```bash
npx tsc --noEmit        # type-check (should be clean)
npx expo-doctor         # dependency/config health
npx expo export --platform android --output-dir /tmp/x   # full bundle test
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `adb: command not found` | Fix `~/.zshrc` PATH (above), `source ~/.zshrc` |
| Pressing `a` does nothing / "no devices" | Emulator not booted, or Metro started before PATH fix — restart Metro in a fresh terminal |
| App stuck / white screen | `r` to reload, or `npx expo start -c` (clears Metro cache — fixes ~40% of ghosts) |
| "Unable to resolve module" | Wrong import path, or `npx expo start -c` |
| Weird native errors | `rm -rf node_modules && npm install` |
| Port 8081 busy | `lsof -ti:8081 \| xargs kill -9` then restart |

See the full onboarding reference in `../../expo-getting-started.md`.

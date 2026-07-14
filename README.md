# Simple H5Player Controller

A simple user script that gives you universal control over almost any HTML5 video player across the web.
It features global settings synchronization, frame-by-frame seeking, progress resuming, and performance-friendly state management.

## Features

* **Global Settings Sync:** Automatically remembers your preferred playback speed and volume, applying them to any video you open across different websites.
* **Resume Progress:** Remembers where you left off in a video and automatically jumps back to that timestamp on reload.
* **Frame-by-Frame Seeking:** Jump forward or backward frame-by-frame (customizable FPS).
* **Smart Hotkeys:** Granular control over speed, volume, and time without needing to click the player.

## Installation

1. Install a user script manager like [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/) for your browser.
2. Click or copy the script into your script manager.

## Keyboard Shortcuts

* **`C` / `X`**: Increase / Decrease playback speed by 0.1x (Max 16x, Min 0.1x).
* **`Z`**: Quick-toggle between normal speed (1.0x) and your last modified speed.
* **`1` to `6`**: Instantly switch playback speed to 1x, 2x, 3x, 4x, 5x, or 6x.
* **`D` / `F`**: Seek backward / forward by a single frame (based on your configured FPS).
* **`Arrow Left` / `Arrow Right`**: Seek backward / forward by 5 seconds.
* **`Shift + Arrow Left/Right`**: Seek backward / forward by 90 seconds.
* **`Arrow Up` / `Arrow Down`**: Increase / Decrease volume by 10%.

*(Note: Shortcuts are automatically disabled when you are typing in an input field, search bar, or text area to prevent accidental triggers.)*

## Configuration & Menu Options

* **Toggle Auto-Play:** Turn automatic video playback on or off.
* **Toggle Global Volume Sync:** Turn global volume memory on or off.
* **Toggle Global Speed Sync:** Turn global speed memory on or off.
* **Toggle Restore Progress:** Turn the video resume feature on or off.
* **Set Frame Rate (FPS):** Configure the FPS used for the `D` and `F` frame-seeking hotkeys (default is 30 FPS).

### Excluding Specific Websites
If you don't want the script to run on certain websites (like YouTube, which has its own robust hotkeys), you can add an `@exclude` rule to the metadata at the top of the script. Or add excluding rule with your script manager.

## License

This project is licensed under the MIT License.

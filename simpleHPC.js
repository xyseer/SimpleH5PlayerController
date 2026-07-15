// ==UserScript==
// @name         Simple H5Player Controller
// @namespace    https://github.com/xyseer
// @version      1.1
// @description  Control HTML5 video players: custom hotkeys, save progress, sync settings globally with smart speed memory.
// @author       xyseer
// @license      MIT
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURATION & SAVED DATA ---
    let enableResumeProgress = GM_getValue('ENABLE_RESUME_PROGRESS', true);
    let enableGlobalSpeed = GM_getValue('ENABLE_GLOBAL_SPEED', true);
    let enableGlobalVolume = GM_getValue('ENABLE_GLOBAL_VOLUME', true);
    let enableAutoPlay = GM_getValue('ENABLE_AUTOPLAY', true);

    let currentFPS = GM_getValue('H5PLAYER_FPS', 30);
    let globalPlaybackSpeed = GM_getValue('H5PLAYER_GLOBAL_SPEED', 1.0);
    let globalVolume = GM_getValue('H5PLAYER_GLOBAL_VOLUME', 1.0);

    // Persistent memory for the last custom speed used (defaults to 2.0 if never set)
    let lastModifiedSpeed = GM_getValue('H5PLAYER_LAST_MODIFIED_SPEED', 2.0);
    // ----------------------------------

    // --- EXTENSION MENU OPTIONS ---
    GM_registerMenuCommand(`Toggle Auto-Play (Currently: ${enableAutoPlay ? "ON" : "OFF"})`, () => {
        enableAutoPlay = !enableAutoPlay;
        GM_setValue('ENABLE_AUTOPLAY', enableAutoPlay);
        alert(`"Auto-Play" is now ${enableAutoPlay ? "ON" : "OFF"}.`);
    });

    GM_registerMenuCommand(`Toggle Global Volume Sync (Currently: ${enableGlobalVolume ? "ON" : "OFF"})`, () => {
        enableGlobalVolume = !enableGlobalVolume;
        GM_setValue('ENABLE_GLOBAL_VOLUME', enableGlobalVolume);
        alert(`"Global Volume Sync" is now ${enableGlobalVolume ? "ON" : "OFF"}.`);
    });

    GM_registerMenuCommand(`Toggle Global Speed Sync (Currently: ${enableGlobalSpeed ? "ON" : "OFF"})`, () => {
        enableGlobalSpeed = !enableGlobalSpeed;
        GM_setValue('ENABLE_GLOBAL_SPEED', enableGlobalSpeed);
        alert(`"Global Speed Sync" is now ${enableGlobalSpeed ? "ON" : "OFF"}.`);
    });

    GM_registerMenuCommand(`Toggle Restore Progress (Currently: ${enableResumeProgress ? "ON" : "OFF"})`, () => {
        enableResumeProgress = !enableResumeProgress;
        GM_setValue('ENABLE_RESUME_PROGRESS', enableResumeProgress);
        alert(`"Restore to last progress" is now ${enableResumeProgress ? "ON" : "OFF"}.`);
    });

    GM_registerMenuCommand(`Set Frame Rate for D/F Keys (Currently: ${currentFPS} FPS)`, () => {
        const userInput = prompt("Enter the FPS of the video for frame-seeking (e.g., 24, 30, 60):", currentFPS);
        const parsedFPS = parseInt(userInput, 10);

        if (!isNaN(parsedFPS) && parsedFPS > 0) {
            currentFPS = parsedFPS;
            GM_setValue('H5PLAYER_FPS', currentFPS);
            alert(`FPS set to ${currentFPS}.`);
        }
    });
    // -----------------------------

    // --- PERFORMANCE / MEMORY STATE ---
    let toastTimeout = null;
    let saveSpeedTimeout = null;
    let saveVolumeTimeout = null;
    let cachedVideo = null;

    function isTyping(e) {
        const target = e.target;
        return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
    }

    function getVideo() {
        if (cachedVideo && document.contains(cachedVideo)) {
            return cachedVideo;
        }

        const videos = document.querySelectorAll('video');
        let bestVideo = null;
        let maxArea = 0;
        videos.forEach(v => {
            const rect = v.getBoundingClientRect();
            const area = rect.width * rect.height;
            if (area > maxArea) {
                maxArea = area;
                bestVideo = v;
            }
        });

        cachedVideo = bestVideo;
        return bestVideo;
    }

    function showToast(video, message) {
        let toast = document.getElementById('h5player-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'h5player-toast';
            toast.style.cssText = `
                position: absolute;
                top: 10px;
                left: 10px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                font-family: sans-serif;
                font-size: 14px;
                z-index: 2147483647;
                pointer-events: none;
                transition: opacity 0.2s;
            `;
            document.body.appendChild(toast);
        }

        const rect = video.getBoundingClientRect();
        toast.style.top = `${rect.top + window.scrollY + 10}px`;
        toast.style.left = `${rect.left + window.scrollX + 10}px`;

        toast.textContent = message;
        toast.style.opacity = '1';

        if (toastTimeout) clearTimeout(toastTimeout);

        toastTimeout = setTimeout(() => {
            if (toast) toast.style.opacity = '0';
        }, 1500);
    }

    // Helper: Update global speed with Debounce & Persistent Memory
    function updateSpeed(video, newSpeed) {
        const formattedSpeed = parseFloat(newSpeed.toFixed(1));
        video.playbackRate = formattedSpeed;

        if (enableGlobalSpeed) {
            globalPlaybackSpeed = formattedSpeed;

            // If the user picked a speed other than 1.0, update our "last custom speed" memory
            if (formattedSpeed !== 1.0) {
                lastModifiedSpeed = formattedSpeed;
                GM_setValue('H5PLAYER_LAST_MODIFIED_SPEED', lastModifiedSpeed);
            }

            if (saveSpeedTimeout) clearTimeout(saveSpeedTimeout);
            saveSpeedTimeout = setTimeout(() => {
                GM_setValue('H5PLAYER_GLOBAL_SPEED', globalPlaybackSpeed);
            }, 500);
        }
        showToast(video, `Speed: ${formattedSpeed}x`);
    }

    // Helper: Update global volume with Debounce
    function updateVolume(video, newVolume) {
        video.volume = newVolume;
        if (enableGlobalVolume) {
            globalVolume = newVolume;

            if (saveVolumeTimeout) clearTimeout(saveVolumeTimeout);
            saveVolumeTimeout = setTimeout(() => {
                GM_setValue('H5PLAYER_GLOBAL_VOLUME', globalVolume);
            }, 500);
        }
        showToast(video, `Volume: ${Math.round(video.volume * 100)}%`);
    }

    // Handle Keyboard Shortcuts
    window.addEventListener('keydown', function(e) {
        if (isTyping(e)) return;

        const video = getVideo();
        if (!video) return;

        let handled = true;

        switch(e.key.toLowerCase()) {
            case 'c':
                updateSpeed(video, Math.min(16, video.playbackRate + 0.1));
                break;
            case 'x':
                updateSpeed(video, Math.max(0.1, video.playbackRate - 0.1));
                break;
            case 'z':
                if (parseFloat(video.playbackRate.toFixed(1)) !== 1.0) {
                    // Currently fast -> Reset to 1.0x normal speed
                    updateSpeed(video, 1.0);
                } else {
                    // Currently normal -> Apply the last modified speed
                    updateSpeed(video, lastModifiedSpeed);
                }
                break;

            case '1': case '2': case '3': case '4': case '5': case '6':
                updateSpeed(video, parseInt(e.key));
                break;

            case 'd':
                video.currentTime -= (1 / currentFPS);
                showToast(video, `Prev Frame (${currentFPS}fps)`);
                break;
            case 'f':
                video.currentTime += (1 / currentFPS);
                showToast(video, `Next Frame (${currentFPS}fps)`);
                break;

            case 'arrowright':
                video.currentTime += e.shiftKey ? 90 : 5;
                showToast(video, `Forward ${e.shiftKey ? 90 : 5}s`);
                break;
            case 'arrowleft':
                video.currentTime -= e.shiftKey ? 90 : 5;
                showToast(video, `Backward ${e.shiftKey ? 90 : 5}s`);
                break;
            case 'arrowup':
                updateVolume(video, Math.min(1, video.volume + 0.1));
                break;
            case 'arrowdown':
                updateVolume(video, Math.max(0, video.volume - 0.1));
                break;

            default:
                handled = false;
        }

        if (handled) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

    // Apply saved settings on video load
    window.addEventListener('loadedmetadata', function(e) {
        if (e.target.tagName === 'VIDEO') {
            const video = e.target;

            // 1. Apply Global Speed
            if (enableGlobalSpeed) {
                video.playbackRate = globalPlaybackSpeed;
            }

            // 2. Apply Global Volume
            if (enableGlobalVolume) {
                video.volume = globalVolume;
            }

            // 3. Apply Saved Progress
            if (enableResumeProgress) {
                const progressKey = `h5player_progress_${window.location.href.split('?')[0]}`;
                const savedTime = localStorage.getItem(progressKey);
                if (savedTime && parseFloat(savedTime) > 0) {
                    video.currentTime = parseFloat(savedTime);
                    showToast(video, `Restored to ${Math.floor(savedTime)}s`);
                }
            }

            // 4. Auto-Play
            if (enableAutoPlay) {
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {
                        // Suppress console spam; browser policies block autoplay often.
                    });
                }
            }
        }
    }, true);

    // Continuous progress saving - Throttled when page is hidden
    if (enableResumeProgress) {
        setInterval(() => {
            if (document.hidden) return;

            const video = getVideo();
            const progressKey = `h5player_progress_${window.location.href.split('?')[0]}`;
            if (video && !video.paused && video.currentTime > 5) {
                if (video.duration - video.currentTime > 5) {
                    localStorage.setItem(progressKey, video.currentTime);
                } else {
                    localStorage.removeItem(progressKey);
                }
            }
        }, 2000);
    }
})();

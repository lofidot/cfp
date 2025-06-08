// --- Supabase Setup ---
// Add this at the very top of main.js
const SUPABASE_URL = 'https://ojeyqqzpmhapnwwupely.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZXlxcXpwbWhhcG53d3VwZWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NDkwMDYsImV4cCI6MjA2MzEyNTAwNn0.8KrxB1P76kTtdaPxH8fINqCa6oB6xzA_BesvXpxsCF4';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Timer Sound Variables ---
let timerSoundToggle = null;
let timerSoundSelect = null;
let chimeAudio = null;

    // State
    const state = {
      currentSound: null,
      isPlaying: false,
      isMixMode: false,
      mixAudios: {},
      mixVolumes: {},
      hideUI: localStorage.getItem('hideUI') === 'true',
      useSoundBackground: true,
      customBackground: null,
      timer: {
        isRunning: false,
        isEditing: false,
        timerType: 'pomodoro',
        mode: 'focus',
        timeLeft: 25 * 60,
        totalTime: 25 * 60,
        elapsedTime: 0,
        currentCycle: 1,
        pomodoroCycles: parseInt(localStorage.getItem('pomodoroCycles'), 10) || 4,
        timer: null
      },
      sessionStartTime: null,
      sessionType: null,
    };

// --- User State ---
let user = null;
let userProfile = null;
let isPlusUser = false;

async function fetchUserProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  user = session?.user || null;
  if (user) {
    // Fetch profile from 'profiles' table (must have 'plus' boolean column)
    const { data, error } = await supabase
      .from('profiles')
      .select('plus')
      .eq('id', user.id)
      .single();
    if (!error && data) {
      userProfile = data;
      isPlusUser = !!data.plus;
    } else {
      isPlusUser = false;
    }
  } else {
    isPlusUser = false;
  }
}

console.log('main.js loaded');
// Simple Sound Player
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded fired.'); // Check if this logs
    const appElement = document.getElementById('app');
    console.log('App element found:', appElement);

    // Preload images
    function preloadImages() {
        const imagesToPreload = [
            "https://i.pinimg.com/originals/5f/a7/56/5fa756bd5a44204fc72891f265b4fd2b.gif",
            "https://i.pinimg.com/originals/e5/18/e8/e518e8a24b9c04a887bd4432289a5e88.gif",
            "https://i.pinimg.com/originals/c5/4e/8f/c54e8f5b82a0b0c6ff9d8ccb3f5d66fe.gif"
        ];

        imagesToPreload.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

    // Call preload function
    preloadImages();

    // State
    // const state = {
    //   currentSound: null,
    //   isPlaying: false,
    //   isMixMode: false,
    //   mixAudios: {},
    //   mixVolumes: {},
    //     hideUI: localStorage.getItem('hideUI') === 'true',
    //     useSoundBackground: true,
    //     customBackground: null,
    //     timer: {
    //       mode: 'focus',
    //       timerType: 'pomodoro', // pomodoro, simple, endless
    //       timeLeft: 25 * 60, // 25 minutes in seconds
    //       totalTime: 25 * 60,
    //       isRunning: false,
    //       isEditing: false,
    //       timer: null,
    //       elapsedTime: 0, // For endless timer
    //       pomodoroCycles: parseInt(localStorage.getItem('pomodoroCycles'), 10) || 4,
    //       currentCycle: parseInt(localStorage.getItem('pomodoroCurrentCycle'), 10) || 1,
    //       longBreakDuration: parseInt(localStorage.getItem('pomodoroLongBreakDuration'), 10) || 15 * 60
    //     }
    // };
    
    // Audio element
    const audio = new Audio();
    audio.loop = true;

    // Beep sound for timer end
    const timerBeep = new Audio('https://api.substack.com/feed/podcast/159247735/d47b8fa79d5b4c3e0171d2d1b0f50e48.mp3');
    timerBeep.volume = 1.0;

    // Fallback sounds (original sounds)
    const fallbackSounds = [
          {
            id: "heavy-rain",
            name: "Heavy Rain",
            url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/rain/heavy-rain.mp3",
            imageUrl: "https://i.pinimg.com/originals/5f/a7/56/5fa756bd5a44204fc72891f265b4fd2b.gif",
        thumbnailUrl: "https://i.pinimg.com/originals/5f/a7/56/5fa756bd5a44204fc72891f265b4fd2b.gif",
        category: "Nature",
        tags: ["featured"]
          },
          {
        id: "traffic",
        name: "Traffic",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/urban/traffic.mp3",
        imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=100&q=80",
        category: "Urban",
        tags: ["featured"]
      },
      {
        id: "road",
        name: "Road",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/urban/road.mp3",
        imageUrl: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=100&q=80",
        category: "Urban"
      },
      {
        id: "highway",
        name: "Highway",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/urban/highway.mp3",
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=100&q=80",
        category: "Urban"
      },
      {
        id: "fireworks",
        name: "Fireworks",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/urban/fireworks.mp3",
        imageUrl: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=100&q=80",
        category: "Urban",
        tags: ["featured"]
      },
      {
        id: "crowd",
        name: "Crowd",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/urban/crowd.mp3",
        imageUrl: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=100&q=80",
        category: "Urban"
      },
      {
        id: "street",
        name: "Street",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/urban/busy-street.mp3",
        imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=100&q=80",
        category: "Urban"
      },
      {
        id: "ambulance-siren",
        name: "Ambulance Siren",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/urban/ambulance-siren.mp3",
        imageUrl: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=100&q=80",
        category: "Urban"
      },
      {
        id: "train",
        name: "Train",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/transport/train.mp3",
        imageUrl: "https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=100&q=80",
        category: "Transport",
        tags: ["featured"]
      },
      {
        id: "submarine",
        name: "Submarine",
        url: "https://github.com/lofidot/moodist/blob/main/public/sounds/transport/submarine.mp3",
        imageUrl: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=100&q=80",
        category: "Transport"
      },
      {
        id: "sailboat",
        name: "Sailboat",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/transport/sailboat.mp3",
        imageUrl: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=100&q=80",
        category: "Transport"
      },
      {
        id: "rowing-boat",
        name: "Rowing Boat",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/transport/rowing-boat.mp3",
        imageUrl: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=100&q=80",
        category: "Transport"
      },
      {
        id: "inside-a-train",
        name: "Inside a train",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/transport/inside-a-train.mp3",
        imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=100&q=80",
        category: "Transport"
      },
      {
        id: "airplane",
        name: "Airplane",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/transport/airplane.mp3",
        imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=100&q=80",
        category: "Transport"
      },
      {
        id: "windshield-wipers",
        name: "Windshield Wipers",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/things/windshield-wipers.mp3",
        imageUrl: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=100&q=80",
        category: "Things"
      },
      {
        id: "wind-chimes",
        name: "Wind Chimes",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/things/wind-chimes.mp3",
        imageUrl: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=100&q=80",
        category: "Things"
      },
      {
        id: "washing-machine",
        name: "Washing Machine",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/things/washing-machine.mp3",
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=100&q=80",
        category: "Things"
      },
      {
        id: "vinyl-effect",
        name: "Vinyal Effect",
        url: "https://github.com/lofidot/moodist/blob/main/public/sounds/things/vinyl-effect.mp3",
        imageUrl: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=100&q=80",
        category: "Things"
      },
      {
        id: "tuning-radio",
        name: "Tuning Radio",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/things/tuning-radio.mp3",
        imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=100&q=80",
        category: "Things"
      },
      {
        id: "slide-projector",
        name: "Slide projectors",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/things/slide-projector.mp3",
        imageUrl: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=100&q=80",
        category: "Things"
      },
      {
        id: "singing-bowl",
        name: "Singing Bowl",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/things/singing-bowl.mp3",
        imageUrl: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=100&q=80",
        category: "Things"
      },
      {
        id: "paper",
        name: "Paper",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/things/paper.mp3",
        imageUrl: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=100&q=80",
        category: "Things"
      },
      {
        id: "keyboard",
        name: "Keyboard",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/things/keyboard.mp3",
        imageUrl: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=100&q=80",
        category: "Things"
      },
      {
        id: "rain-on-leaves",
        name: "Rain on leaves",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/rain/rain-on-leaves.mp3",
        imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=100&q=80",
        category: "Rain"
      },
      {
        id: "rain-on-tent",
        name: "Rain on tent",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/rain/rain-on-tent.mp3",
        imageUrl: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=100&q=80",
        category: "Rain"
      },
      {
        id: "rain-on-umbrella",
        name: "Rain on umbrella",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/rain/rain-on-umbrella.mp3",
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=100&q=80",
        category: "Rain"
      },
      {
        id: "rain-on-window",
        name: "Rain on window",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/rain/rain-on-window.mp3",
        imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=100&q=80",
        category: "Rain",
        tags: ["featured"]
      }
    ];

    // Fallback themes (original themes)
    const fallbackThemes = [
      {
        id: "rain",
        name: "Rain",
        imageUrl: "https://i.pinimg.com/originals/5f/a7/56/5fa756bd5a44204fc72891f265b4fd2b.gif",
        thumbnailUrl: "https://i.pinimg.com/originals/5f/a7/56/5fa756bd5a44204fc72891f265b4fd2b.gif"
      },
      {
        id: "forest",
        name: "Forest",
        imageUrl: "https://i.pinimg.com/originals/e5/18/e8/e518e8a24b9c04a887bd4432289a5e88.gif",
        thumbnailUrl: "https://i.pinimg.com/originals/e5/18/e8/e518e8a24b9c04a887bd4432289a5e88.gif"
      },
      {
        id: "sea",
        name: "Sea",
        imageUrl: "https://cdn.pixabay.com/video/2025/04/29/275633_large.mp4",
        thumbnailUrl: "https://cdn.jsdelivr.net/gh/lofidot/img@main/Sea%20Wave%20Beach%20Frame.png"
      },
      {
        id: "cropfield",
        name: "Cropfield",
        imageUrl: "https://cdn.jsdelivr.net/gh/lofidot/webflowwwwww@main/pexels-pixabay-158827.jpg",
        thumbnailUrl: "https://cdn.jsdelivr.net/gh/lofidot/webflowwwwww@main/pexels-pixabay-158827.jpg"
      },
      {
        id: "seathunder",
        name: "Seathunder",
        imageUrl: "https://cdn.jsdelivr.net/gh/lofidot/webflowwwwww@main/pexels-rpnickson-2775196.jpg",
        thumbnailUrl: "https://cdn.jsdelivr.net/gh/lofidot/webflowwwwww@main/pexels-rpnickson-2775196.jpg"
      },
      {
        id: "grassfield",
        name: "Grassfield",
        imageUrl: "https://cdn.jsdelivr.net/gh/lofidot/webflowwwwww@main/pexels-pixabay-259280.jpg",
        thumbnailUrl: "https://cdn.jsdelivr.net/gh/lofidot/webflowwwwww@main/pexels-pixabay-259280.jpg"
      }
    ];

    // --- Fetch Sounds from Supabase ---
    async function getSoundsFromSupabase() {
      const { data, error } = await supabase
        .from('sounds')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching sounds from Supabase:', error);
          return fallbackSounds;
        }
      // Optionally validate data here
      return data;
    }

    // --- Fetch Images (Themes) from Supabase ---
    async function getImagesFromSupabase() {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching images from Supabase:', error);
          return fallbackThemes;
        }
      // Optionally validate data here
      return data;
    }

    // Initialize sounds
    let sounds = [];

    // Load sounds from Supabase or use fallbacks
    async function loadSounds() {
      try {
        sounds = await getSoundsFromSupabase();
        renderSoundGrid();
        renderSoundLibrary();
      } catch (error) {
        console.error('Error initializing sounds:', error);
        sounds = fallbackSounds;
        renderSoundGrid();
        renderSoundLibrary();
      }
    }

    // Initialize themes
    let themes = [];

    // Load themes from Supabase or use fallbacks
    async function loadThemes() {
      try {
        themes = await getImagesFromSupabase();
        renderThemeGrid();
      } catch (error) {
        console.error('Error initializing themes:', error);
        themes = fallbackThemes;
        renderThemeGrid();
      }
    }

    // DOM Elements with error handling
    const getElement = (id) => {
        const element = document.getElementById(id);
        if (!element) {
            console.error(`Element with id '${id}' not found`);
            throw new Error(`Required element '${id}' is missing`);
        }
        return element;
    };

    const app = getElement('app');
    const backgroundOverlay = getElement('background-overlay');
    const soundGrid = getElement('sound-grid');
    const playButton = getElement('play-btn');
    const playIcon = getElement('play-icon');
    const pauseIcon = getElement('pause-icon');
    const hideUIButton = getElement('hide-ui-btn');
    const themeButton = getElement('theme-btn');
    const themeModal = getElement('theme-modal');
    const closeModalButton = getElement('close-modal');
    const customBgUrlInput = getElement('custom-bg-url');
    const applyBgButton = getElement('apply-bg-btn');
    const soundLibraryBtn = getElement('sound-library-btn');
    const soundLibrary = getElement('sound-library');
    const closeLibraryBtn = getElement('close-library');

    // Settings Modal elements
    const settingsModal = getElement('settings-modal');
    const closeSettingsModalBtn = getElement('close-settings-modal');

    // Timer Toggle Functionality
    const timerToggleBtn = document.getElementById('timer-toggle-btn');
    const timerContainer = document.querySelector('.timer-container');
    
    // Load saved timer visibility state
    const timerVisible = localStorage.getItem('timerVisible') === 'true';
    if (timerVisible) {
        timerContainer.classList.add('visible');
    }
    
    timerToggleBtn.addEventListener('click', () => {
        timerContainer.classList.toggle('visible');
    });

    // Store the original document title
    const originalTitle = document.title;

    // Functions
    function playSound() {
      try {
        const audio = new Audio();
        audio.src = sound.url;
        
        // Add error handling
        audio.onerror = (e) => {
          console.error('Error loading sound:', e);
          showToast('Failed to load sound. Using fallback.', 'error');
          useFallbackSound();
        };
        
        // Add loading state
        audio.onloadstart = () => {
          showToast('Loading sound...', 'info');
        };
        
        // Play with error handling
        audio.play().catch(e => {
          console.error('Playback error:', e);
          showToast('Playback failed. Using fallback.', 'error');
          useFallbackSound();
        });
      } catch (e) {
        console.error('Sound error:', e);
        showToast('Sound error. Using fallback.', 'error');
        useFallbackSound();
      }
    }

    function useFallbackSound() {
      // Use a default sound or silent fallback
      const fallbackUrl = 'path/to/fallback.mp3';
      const audio = new Audio(fallbackUrl);
      audio.play().catch(e => console.error('Fallback sound error:', e));
    }

    function showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      document.body.appendChild(toast);
      
      // Auto remove after 3 seconds
      setTimeout(() => {
        toast.remove();
      }, 3000);
    }
    
    function pauseSound() {
        audio.pause();
      state.isPlaying = false;
      updatePlayButton();
      updateSoundLibraryIcons();
      backgroundOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      renderSoundGrid();
    }
    
    function updatePlayButton() {
        if (state.isMixMode) {
            // In Mix Mode, show pause icon if any mix sound is playing
            const anyPlaying = Object.values(state.mixAudios).some(audio => audio && !audio.paused);
            playButton.classList.toggle('active', anyPlaying);
            playIcon.classList.toggle('hidden', anyPlaying);
            pauseIcon.classList.toggle('hidden', !anyPlaying);
        } else {
        playButton.classList.toggle('active', state.isPlaying);
        playIcon.classList.toggle('hidden', state.isPlaying);
        pauseIcon.classList.toggle('hidden', !state.isPlaying);
        }
    }

    function updateBackground() {
        // Helper: is video URL
        function isVideoUrl(url) {
            return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
        }

        let bgUrl = null;
        if (state.useSoundBackground && state.currentSound) {
            bgUrl = state.currentSound.image_url;
        } else if (state.customBackground) {
            bgUrl = state.customBackground;
        }

        // Get or create video background element
        let videoBg = document.getElementById('background-video');
        
        if (bgUrl && isVideoUrl(bgUrl)) {
            if (!videoBg) {
                // Create video element if it doesn't exist
                videoBg = document.createElement('video');
                videoBg.id = 'background-video';
                videoBg.autoplay = true;
                videoBg.loop = true;
                videoBg.muted = true;
                videoBg.playsInline = true;
                videoBg.style.position = 'absolute';
                videoBg.style.top = '0';
                videoBg.style.left = '0';
                videoBg.style.width = '100%';
                videoBg.style.height = '100%';
                videoBg.style.objectFit = 'cover';
                videoBg.style.zIndex = '0';
                videoBg.style.pointerEvents = 'none';
                videoBg.style.background = 'black';
                app.insertBefore(videoBg, backgroundOverlay);
            }
            
            // Only update source if it's different
            if (videoBg.src !== bgUrl) {
                videoBg.src = bgUrl;
            }
            
            app.style.backgroundImage = 'none';
            app.style.backgroundSize = ''; // Clear image background styles when using video
            app.style.backgroundPosition = '';
            app.style.backgroundRepeat = '';
        } else {
            // Remove video if it exists and we're not using a video
            if (videoBg) {
                videoBg.remove();
            }
            
            if (bgUrl) {
                app.style.backgroundImage = `url(${bgUrl})`;
                // Explicitly set background size/position for images
                app.style.backgroundSize = 'cover';
                app.style.backgroundPosition = 'center';
                app.style.backgroundRepeat = 'no-repeat';
            } else {
                app.style.backgroundImage = 'none';
                app.style.backgroundSize = '';
                app.style.backgroundPosition = '';
                app.style.backgroundRepeat = '';
            }
        }

        // Update overlay opacity
        if (state.hideUI) {
            backgroundOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
        } else {
            backgroundOverlay.style.backgroundColor = state.isPlaying ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.7)';
        }
    }

    function toggleUIVisibility() {
        state.hideUI = !state.hideUI;
        
        // Hide/show elements
        const controlsContainer = document.querySelector('.controls-container');
        const soundGrid = document.getElementById('sound-grid');
        const timerContainer = document.querySelector('.timer-container');
        const navigationSection = document.getElementById('navigation-section');
        const unhideButton = document.createElement('button');
        
        if (state.hideUI) {
            // Hide elements
            if (controlsContainer) controlsContainer.classList.add('hidden');
            if (soundGrid) soundGrid.classList.add('hidden');
            if (navigationSection) navigationSection.classList.add('hidden');
            
            // Create and show unhide button
            unhideButton.id = 'unhide-btn';
            unhideButton.className = 'unhide-button';
            unhideButton.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 2L22 22" stroke="currentColor" stroke-width="2"/>
                    <path d="M6.71277 6.7226C3.66479 8.79527 2 12 2 12C2 12 5.63636 19 12 19C14.0503 19 15.8174 18.2734 17.2711 17.2884L6.71277 6.7226Z" stroke="currentColor" stroke-width="2"/>
                    <path d="M14 14.2362C13.4692 14.7112 12.7684 15.0001 12 15.0001C10.3431 15.0001 9 13.657 9 12.0001C9 11.1764 9.33193 10.4303 9.86932 9.88818" stroke="currentColor" stroke-width="2"/>
                    <path d="M15.0005 12C15.0005 12 15.0005 12.0001 15.0005 12.0001M12.0005 9C12.0005 9 12.0005 9.00006 12.0005 9.00006" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 5C16.7915 5 20.0334 8.62459 21.4938 10.7509C22.0118 11.5037 22.0118 12.4963 21.4938 13.2491C21.1159 13.8163 20.5485 14.5695 19.8071 15.3454" stroke="currentColor" stroke-width="2"/>
                </svg>
            `;
            unhideButton.addEventListener('click', toggleUIVisibility);
            document.body.appendChild(unhideButton);
        } else {
            // Show elements
            if (controlsContainer) controlsContainer.classList.remove('hidden');
            if (soundGrid) soundGrid.classList.remove('hidden');
            if (navigationSection) navigationSection.classList.remove('hidden');
            
            // Remove unhide button
            const existingUnhideBtn = document.getElementById('unhide-btn');
            if (existingUnhideBtn) existingUnhideBtn.remove();
        }
        
        // Don't hide timer if it's visible
        if (timerContainer && timerContainer.classList.contains('visible')) {
            timerContainer.classList.remove('hidden');
        }
        
        localStorage.setItem('hideUI', state.hideUI);
        updateBackground();
    }
    
    function handlePlayPauseClick(event) {
        event.stopPropagation(); // Prevent event bubbling
        
        if (!state.currentSound) {
            showToast('Please select a sound first', 'info');
            return;
        }
        
        if (state.isPlaying) {
            pauseSound();
        } else {
            playSound();
        }
    }

    function selectSound(sound) {
        const wasPlaying = state.isPlaying && state.currentSound && state.currentSound.id === sound.id;
        state.currentSound = sound;
        
        if (wasPlaying) {
        pauseSound();
      } else {
        playSound();
        }
        
        updateBackground();
        renderSoundGrid();
        updateSoundLibraryIcons();
    }

    function handleImageLoad(img) {
        img.setAttribute('loaded', 'true');
        img.style.animation = 'none';
    }

    function renderSoundGrid() {
        if (state.isMixMode) {
            // Mix Mode: show only currently playing mix sounds, or nothing if none
            const playingMixSoundIds = Object.keys(state.mixAudios).filter(id => state.mixAudios[id] && !state.mixAudios[id].paused);
            const gridSounds = sounds.filter(sound => playingMixSoundIds.includes(sound.id));
            // --- Efficient update ---
            const existingCards = Array.from(soundGrid.querySelectorAll('.sound-card'));
            // Remove cards for sounds no longer playing
            existingCards.forEach(card => {
                if (!playingMixSoundIds.includes(card.dataset.soundId)) {
                    card.remove();
                }
            });
            // Add or update cards for currently playing sounds
            gridSounds.forEach(sound => {
                let soundCard = soundGrid.querySelector(`.sound-card[data-sound-id="${sound.id}"]`);
                const imageUrlToUse = sound.thumbnail_url || sound.image_url;
                if (!soundCard) {
                    soundCard = document.createElement('div');
                    soundCard.className = 'sound-card';
                    soundCard.dataset.soundId = sound.id;
                    soundCard.innerHTML = `
                        <button class="sound-button active playing" data-sound-id="${sound.id}">
                            <img loading="eager" decoding="async" src="${imageUrlToUse}" alt="${sound.name}" width="100" height="100" style="will-change: auto;">
                            <div class="sound-indicator"></div>
                        </button>
                        <span class="sound-name">${sound.name}</span>
                    `;
                    soundGrid.appendChild(soundCard);
                } else {
                    // Only update classes
                    const btn = soundCard.querySelector('.sound-button');
                    btn.classList.add('active', 'playing');
                }
            });
            // If no sounds, clear grid
            if (gridSounds.length === 0) {
                soundGrid.innerHTML = '';
            }
            return;
        }
        // Normal Mode: 4 featured sounds (2 left, 2 right), center is current sound if playing
        let featuredSounds = sounds.filter(sound => sound.category === 'Featured');
        let gridSounds = [];
        const maxGrid = 4;
        const currentSound = state.currentSound;
        if (currentSound && state.isPlaying) {
            // Center current sound, 2 featured left, 2 right
                let before = featuredSounds.slice(0, 2);
                let after = featuredSounds.slice(2, 4);
                gridSounds = [...before, currentSound, ...after];
        } else {
            // Just 4 featured sounds
            gridSounds = featuredSounds.slice(0, maxGrid);
        }
        // --- Efficient update ---
        const existingCards = Array.from(soundGrid.querySelectorAll('.sound-card'));
        // Remove cards for sounds no longer in grid
        existingCards.forEach(card => {
            if (!gridSounds.some(s => s.id === card.dataset.soundId)) {
                card.remove();
            }
        });
        // Add or update cards for grid sounds
            gridSounds.forEach(sound => {
            let soundCard = soundGrid.querySelector(`.sound-card[data-sound-id="${sound.id}"]`);
            const isActive = state.currentSound && state.currentSound.id === sound.id && state.isPlaying;
                const isCurrentlyPlaying = isActive && state.isPlaying;
            const imageUrlToUse = sound.thumbnail_url || sound.image_url;
            const isLocked = sound.plus_only && !isPlusUser;
            if (!soundCard) {
                soundCard = document.createElement('div');
                soundCard.className = 'sound-card';
                soundCard.dataset.soundId = sound.id;
                soundCard.innerHTML = `
                <button class="sound-button${isActive ? ' active' : ''}${isCurrentlyPlaying ? ' playing' : ''}" data-sound-id="${sound.id}" ${isLocked ? '' : ''}>
                    <img loading="eager" decoding="async" src="${imageUrlToUse}" alt="${sound.name}" width="100" height="100" style="will-change: auto;">
                        <div class="sound-indicator"></div>
                    ${isLocked ? '<div class="plus-badge plus-badge-bottom">Plus</div>' : ''}
                    </button>
                    <span class="sound-name">${sound.name}</span>
                `;
                const soundButton = soundCard.querySelector('.sound-button');
                const img = soundButton.querySelector('img');
                img.addEventListener('load', () => handleImageLoad(img));
            if (!isLocked) {
                soundButton.addEventListener('click', () => selectSound(sound));
            } else {
                soundButton.addEventListener('click', openPlusPopup);
            }
                soundGrid.appendChild(soundCard);
            } else {
                // Only update classes
                const btn = soundCard.querySelector('.sound-button');
                btn.classList.toggle('active', isActive);
                btn.classList.toggle('playing', isCurrentlyPlaying);
            }
            });
    }

    function closeAllBottomSheets() {
      document.querySelectorAll('.bottom-sheet').forEach(sheet => {
        sheet.classList.remove('active');
        sheet.classList.add('hidden');
      });
      document.querySelectorAll('.full-screen-modal').forEach(modal => {
        modal.classList.remove('active');
        modal.classList.add('hidden');
      });
    }

    function initializeThemeTabs() {
      const themeTabs = document.querySelectorAll('.theme-tab-btn');
      const tabPanes = document.querySelectorAll('.tab-pane');
      themeTabs.forEach(tab => {
        tab.onclick = null;
        tab.addEventListener('click', function() {
          themeTabs.forEach(t => t.classList.remove('active'));
          tabPanes.forEach(pane => pane.classList.remove('active'));
          tab.classList.add('active');
          const tabName = tab.getAttribute('data-tab');
          const pane = document.getElementById('tab-' + tabName);
          if (pane) pane.classList.add('active');
          if (tabName === 'default') {
            state.useSoundBackground = true;
            state.customBackground = null;
            updateBackground();
            localStorage.setItem('useSoundBackground', 'true');
            localStorage.removeItem('customBackground');
            showToast('Using sound backgrounds');
            closeThemeModal();
          }
        });
        tab.onkeydown = null;
        tab.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            tab.click();
          }
        });
      });
    }

    async function openThemeModal() {
      closeAllBottomSheets();
      themeModal.classList.remove('hidden');
      void themeModal.offsetWidth;
      themeModal.classList.add('active');
      initializeThemeTabs();
      // Always reload themes and grid when opening modal
      await loadThemes();
    }

    function toggleSoundLibrary() {
      if (soundLibrary.classList.contains('active')) {
        soundLibrary.classList.remove('active');
        soundLibrary.classList.add('hidden');
        if (soundLibraryBtn) soundLibraryBtn.classList.remove('active');
      } else {
        closeAllBottomSheets();
        soundLibrary.classList.remove('hidden');
        void soundLibrary.offsetWidth; // Force reflow for transition
        soundLibrary.classList.add('active');
        if (soundLibraryBtn) soundLibraryBtn.classList.add('active');
      }
    }

    function closeThemeModal() {
      themeModal.classList.remove('active');
            themeModal.classList.add('hidden');
    }

    function closeSoundLibrary() {
      soundLibrary.classList.remove('active');
      soundLibrary.classList.add('hidden');
      if (soundLibraryBtn) soundLibraryBtn.classList.remove('active');
    }

    // Functions to open and close settings modal
    function openSettingsModal() {
      closeAllBottomSheets(); // Close any other open sheets/modals
      settingsModal.classList.remove('hidden');
      void settingsModal.offsetWidth; // Trigger reflow
      settingsModal.classList.add('active');
    }

    function closeSettingsModal() {
      settingsModal.classList.remove('active');
      settingsModal.classList.add('hidden');
    }

    function setCustomBackground(url, isPreset = false) {
      // Show loading state
      const loader = document.createElement('div');
      loader.className = 'background-loader';
      loader.innerHTML = '<div class="spinner"></div>';
      document.body.appendChild(loader);
      
      const img = new Image();
      
      img.onload = () => {
        // Remove loader
        loader.remove();
        
        // Apply background
        if (isPreset) {
          backgroundOverlay.style.backgroundImage = `url(${url})`;
          backgroundOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          localStorage.setItem('customBackground', url);
          localStorage.setItem('isPresetBackground', 'true');
        } else {
          backgroundOverlay.style.backgroundImage = `url(${url})`;
          backgroundOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          localStorage.setItem('customBackground', url);
          localStorage.setItem('isPresetBackground', 'false');
        }
        
        showToast('Background updated successfully', 'success');
      };
      
      img.onerror = () => {
        // Remove loader
        loader.remove();
        
        // Show error
        showToast('Failed to load background image', 'error');
        
        // Reset to default
        backgroundOverlay.style.backgroundImage = '';
        backgroundOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        localStorage.removeItem('customBackground');
        localStorage.removeItem('isPresetBackground');
      };
      
      // Start loading
      img.src = url;
    }

    // Add CSS for loader
    const backgroundLoaderStyle = document.createElement('style');
    backgroundLoaderStyle.textContent = `
      .background-loader {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }
      
      .spinner {
        width: 50px;
        height: 50px;
        border: 5px solid #f3f3f3;
        border-top: 5px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(backgroundLoaderStyle);

    function renderSoundLibrary() {
      const sheetHeader = soundLibrary.querySelector('.sheet-header');
      const sheetContent = soundLibrary.querySelector('.sheet-content');
      // Remove any existing mix mode switch
      const oldSwitch = document.getElementById('mix-mode-switch');
      if (oldSwitch) oldSwitch.remove();
      // Create iOS-style switch container
      let switchContainer = document.getElementById('mix-mode-switch-container');
      if (!switchContainer) {
        switchContainer = document.createElement('div');
        switchContainer.id = 'mix-mode-switch-container';
        sheetHeader.insertBefore(switchContainer, sheetHeader.firstChild);
      }
      // Build iOS-style switch markup
      switchContainer.innerHTML = `
        <label class="mix-switch-label">
          <span style="margin-right:12px;font-weight:500;">Mix Mode</span>
          <input type="checkbox" id="mix-mode-switch" ${state.isMixMode ? 'checked' : ''}>
          <span class="mix-switch-slider"></span>
        </label>
      `;
      // Add event listener for the switch
      const mixSwitch = document.getElementById('mix-mode-switch');
      if (mixSwitch) {
        mixSwitch.onchange = function() {
          if (state.isMixMode) {
            // Switching to normal mode: pause and clear all mix audios
            Object.values(state.mixAudios).forEach(audio => { if (audio) { audio.pause(); audio.currentTime = 0; } });
            state.mixAudios = {};
            state.mixVolumes = {};
          } else {
            // Switching to Mix Mode: pause and clear normal mode sound
            if (audio) { audio.pause(); audio.currentTime = 0; }
            state.currentSound = null;
            state.isPlaying = false;
          }
          state.isMixMode = !state.isMixMode;
          renderSoundLibrary();
          renderSoundGrid();
          updatePlayButton();
        };
      }
      sheetContent.innerHTML = '';
        if (state.isMixMode) {
            // Mix Mode: show all sounds in a single list, no categories
            soundLibrary.classList.add('mix-mode'); // Add mix mode class
            soundLibrary.classList.remove('normal-mode-cards');
            const allSounds = sounds;
            let soundList = sheetContent.querySelector('.sound-library-list');
            if (!soundList) {
                soundList = document.createElement('div');
                soundList.className = 'sound-library-list';
                sheetContent.appendChild(soundList);
            }
            // Track which sound ids are present
            const presentIds = new Set();
            allSounds.forEach(sound => {
                const isActive = state.mixAudios[sound.id] && !state.mixAudios[sound.id].paused;
                const imageUrlToUse = sound.thumbnail_url || sound.image_url;
                const isLocked = sound.plus_only && !isPlusUser;
                let item = soundList.querySelector(`.library-sound-item[data-sound-id="${sound.id}"]`);
                if (!item) {
                    // Create new item
                    item = document.createElement('div');
                    item.className = `library-sound-item${isActive ? ' active' : ''}`;
                    item.dataset.soundId = sound.id;
                    item.innerHTML = `
                        <img src="${imageUrlToUse}" alt="${sound.name}" class="card-image">
                        <div class="card-overlay"></div>
                        ${sound.icon ? `<div class="mix-mode-icon"><img src="${sound.icon}" alt="${sound.name} icon"></div>` : ''}
                        <span class="library-sound-name">${sound.name}</span>
                        ${isLocked ? '<div class="plus-badge plus-badge-bottom">Plus</div>' : ''}
                    `;
                    soundList.appendChild(item);
                }
                // Update classes
                if (isActive) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
                // Slider: Add/Remove slider based on active state
                let slider = item.querySelector('.mix-volume-slider');
                if (!isLocked && isActive && !slider) {
                    slider = document.createElement('input');
                    slider.type = 'range';
                    slider.min = '0';
                    slider.max = '100';
                    slider.value = state.mixVolumes[sound.id] !== undefined ? state.mixVolumes[sound.id] : 50;
                    slider.className = 'mix-volume-slider';
                    slider.dataset.soundId = sound.id;
                    slider.addEventListener('click', e => e.stopPropagation());
                    slider.addEventListener('input', (e) => {
                      const volume = parseInt(e.target.value, 10);
                      state.mixVolumes[sound.id] = volume;
                      if (state.mixAudios[sound.id]) {
                        state.mixAudios[sound.id].volume = volume / 100;
                      }
                    });
                    // Append slider to the item
                    item.appendChild(slider);
                } else if ((!isActive || isLocked) && slider) {
                    slider.remove();
                }
                presentIds.add(sound.id);
            });
            // Remove items for sounds no longer present
            soundList.querySelectorAll('.library-sound-item').forEach(item => {
                if (!presentIds.has(item.dataset.soundId)) {
                    item.remove();
                }
            });
            // Add event listeners for all items (as before)
            const items = soundList.querySelectorAll('.library-sound-item');
            items.forEach(item => {
                const soundId = item.dataset.soundId;
                const sound = sounds.find(s => s.id === soundId);
                const isLocked = sound.plus_only && !isPlusUser;
                if (!isLocked) {
                    const slider = item.querySelector('.mix-volume-slider');
                    // Handler to toggle play/pause
                    const playPauseHandler = (e) => {
                      e.stopPropagation();
                      if (!state.mixAudios[soundId]) {
                        const initialVolume = state.mixVolumes[soundId] !== undefined ? state.mixVolumes[soundId] : 50;
                        const audio = new Audio(sound.url);
                        audio.loop = true;
                        audio.volume = initialVolume / 100;
                        state.mixVolumes[soundId] = initialVolume;
                        state.mixAudios[soundId] = audio;
                        audio.play();
                      } else {
                        const audio = state.mixAudios[soundId];
                        if (audio.paused) {
                          audio.play();
                        } else {
                          audio.pause();
                          // Remove from mix state when paused (deselected)
                          delete state.mixAudios[soundId];
                          delete state.mixVolumes[soundId];
                        }
                      }
                      renderSoundLibrary();
                      renderSoundGrid();
                      updatePlayButton();
                    };
                    item.onclick = null;
                    item.addEventListener('click', playPauseHandler);
                    if (slider) {
                      slider.addEventListener('click', e => e.stopPropagation());
                      slider.addEventListener('input', (e) => {
                        const volume = parseInt(e.target.value, 10);
                        state.mixVolumes[soundId] = volume;
                        if (state.mixAudios[soundId]) {
                          state.mixAudios[soundId].volume = volume / 100;
                        }
                      });
                    }
                } else {
                    item.onclick = null;
                    item.addEventListener('click', openPlusPopup);
                }
            });
        } else {
            // Normal mode code...
            soundLibrary.classList.remove('mix-mode');
            soundLibrary.classList.add('normal-mode-cards'); // Add class for card styles
            soundLibrary.classList.remove('mix-mode-list'); // Remove mix mode specific class if any
            const categories = [...new Set(sounds.map(sound => sound.category))];
      categories.forEach(category => {
        const categorySection = document.createElement('div');
        categorySection.className = 'sound-category';
        categorySection.innerHTML = `
          <h3>${category}</h3>
          <div class="sound-library-list">
            ${sounds
              .filter(sound => sound.category === category)
              .map(sound => {
                const isActive = state.currentSound && state.currentSound.id === sound.id && state.isPlaying;
                const imageUrlToUse = sound.thumbnail_url || sound.image_url;
                const isLocked = sound.plus_only && !isPlusUser;
                return `
                  <div class="library-sound-item ${isActive ? 'active' : ''}" data-sound-id="${sound.id}">
                                        <img src="${imageUrlToUse}" alt="${sound.name}" class="card-image">
                                        <div class="card-overlay"></div> <!-- Add overlay for gradient -->
                                        <span class="library-sound-name">${sound.name}</span>
                      ${isLocked ? '<div class="plus-badge plus-badge-bottom">Plus</div>' : ''}
                  </div>
                `;
              }).join('')}
          </div>
        `;
                sheetContent.appendChild(categorySection);
            });
            // Add click event listeners to sound items (fixed: no :contains())
            sheetContent.querySelectorAll('.sound-category').forEach(categorySection => {
                const header = categorySection.querySelector('h3');
                if (!header) return;
                // const category = header.textContent.trim(); // Not needed for event binding
        categorySection.querySelectorAll('.library-sound-item').forEach(item => {
            const soundId = item.dataset.soundId;
            const sound = sounds.find(s => s.id === soundId);
          const isLocked = sound.plus_only && !isPlusUser;
          if (!isLocked) {
            item.addEventListener('click', () => {
              selectSound(sound);
                            // Do NOT close the sound library automatically
                            // closeSoundLibrary();
            });
          } else {
            item.addEventListener('click', openPlusPopup);
            }
          });
      });
        }
    }

    function updateSoundLibraryIcons() {
      const soundItems = document.querySelectorAll('.library-sound-item');
      soundItems.forEach(item => {
        const soundId = item.dataset.soundId;
        const isActive = state.currentSound && state.currentSound.id === soundId && state.isPlaying;
        item.classList.toggle('active', isActive);
      });
    }

    function toggleSound(soundId) {
      const sound = sounds.find(s => s.id === soundId);
      if (!sound) return;
      const isActive = state.currentSound && state.currentSound.id === soundId && state.isPlaying;
      if (isActive) {
        pauseSound();
      } else {
        selectSound(sound);
        playSound();
      }
      updateSoundLibraryIcons();
    }

    function renderThemeGrid() {
      const presetGrid = document.querySelector('.preset-grid');
      if (!presetGrid) return;
      presetGrid.innerHTML = themes.map(theme => {
        const isActive = !state.useSoundBackground && state.customBackground === theme.url;
        const isLocked = theme.plus_only && !isPlusUser;
        return `
          <div class="preset-theme${isActive ? ' active' : ''}" data-theme="${theme.url}">
            <img src="${theme.thumbnail_url}" alt="${theme.name}" class="card-image"> <!-- Image covers card -->
            <div class="card-overlay"></div> <!-- Add overlay for gradient -->
            <span class="theme-name">${theme.name}</span> <!-- Name positioned at bottom -->
              ${isLocked ? '<div class="plus-badge plus-badge-top">Plus</div>' : ''}
        </div>
        `;
      }).join('');
      // Attach event listeners for preset themes after rendering
      document.querySelectorAll('.preset-theme').forEach(button => {
        const themeUrl = button.dataset.theme;
        const theme = themes.find(t => t.url === themeUrl);
        const isLocked = theme.plus_only && !isPlusUser;
        if (!isLocked) {
          button.addEventListener('click', () => {
            state.customBackground = themeUrl;
            state.useSoundBackground = false;
            renderThemeGrid();
            setCustomBackground(themeUrl, true);
          });
        } else {
          button.addEventListener('click', openPlusPopup);
        }
      });
    }

    // Event Listeners
    playButton.addEventListener('click', () => {
      if (state.isMixMode) {
        // Mix Mode: pause/resume all active mix sounds
        const anyPlaying = Object.values(state.mixAudios).some(audio => audio && !audio.paused);
        if (anyPlaying) {
          Object.values(state.mixAudios).forEach(audio => { if (audio && !audio.paused) audio.pause(); });
        } else {
          Object.values(state.mixAudios).forEach(audio => { if (audio && audio.paused) audio.play(); });
        }
        renderSoundGrid();
        renderSoundLibrary();
        updatePlayButton();
        return;
      }
      if (!state.currentSound) {
        // Select and play the first featured sound if none is selected
        const firstFeaturedSound = sounds.find(sound => Array.isArray(sound.tags) && sound.tags.includes('featured'));
        if (firstFeaturedSound) {
          selectSound(firstFeaturedSound);
          return;
        }
        // Fallback: select the first sound in the list
        if (sounds.length > 0) {
          selectSound(sounds[0]);
          return;
        }
        showToast('No sounds available to play', 'error');
        return;
      }
      state.isPlaying = !state.isPlaying;
      if (state.isPlaying) {
        playSound();
      } else {
        pauseSound();
      }
    });
    hideUIButton.addEventListener('click', toggleUIVisibility);
    themeButton.addEventListener('click', openThemeModal);
    closeModalButton.addEventListener('click', closeThemeModal);
    soundLibraryBtn.addEventListener('click', toggleSoundLibrary);
    closeLibraryBtn.addEventListener('click', closeSoundLibrary);

    // Settings modal event listeners
    if (closeSettingsModalBtn) closeSettingsModalBtn.addEventListener('click', closeSettingsModal);

    // Handle preset theme buttons
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !themeModal.classList.contains('hidden')) {
            closeThemeModal();
        }
        if (e.key === 'Escape' && !settingsModal.classList.contains('hidden')) {
            closeSettingsModal();
        }
    });

    // --- Timer State ---
    // Load custom durations from localStorage or use defaults
    let pomodoroFocusDuration = parseInt(localStorage.getItem('pomodoroFocusDuration'), 10) || 25 * 60;
    let pomodoroBreakDuration = parseInt(localStorage.getItem('pomodoroBreakDuration'), 10) || 5 * 60;
    // Set initial timeLeft/totalTime based on mode and timerType
    let timeLeft = state.timer.timerType === 'pomodoro'
      ? (state.timer.mode === 'focus' ? pomodoroFocusDuration : pomodoroBreakDuration)
      : 25 * 60;
    let totalTime = timeLeft;

    // --- DOM Elements ---
  const timerDisplay = document.getElementById('timerDisplay');
  const timeDisplay = document.getElementById('time');
  const progressBar = document.getElementById('progress');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const restartBtn = document.getElementById('restartBtn');
  const decreaseBtn = document.getElementById('decrease');
  const increaseBtn = document.getElementById('increase');
  const modeButtons = document.querySelectorAll('.mode-btn');
  const modeSwitcher = document.getElementById('modeSwitcher');
  const timerTypeDots = document.querySelectorAll('.timer-type-dot');
  
    // --- Format/Parse Time ---
  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }
  function parseTime(timeString) {
    const parts = timeString.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
      return parts[0] * 60;
    }
    return 0;
  }
  
    // --- Display Update ---
  function updateDisplay() {
      const t = state.timer;
      let timerLabel = '';
      if (t.timerType === 'pomodoro') {
        if (t.mode === 'focus') timerLabel = 'Focus Time';
        else if (t.mode === 'break') timerLabel = 'Short Break';
        else if (t.mode === 'longbreak') timerLabel = 'Long Break';
      } else if (t.timerType === 'simple') {
        timerLabel = 'Simple Timer';
      } else if (t.timerType === 'endless') {
        timerLabel = 'Endless Timer';
      } else if (t.timerType === 'sleep') {
        timerLabel = 'Sleep Timer';
      }
      timerLabelEl.textContent = timerLabel;
      if (t.timerType === 'endless') {
        timeDisplay.textContent = formatTime(t.elapsedTime);
      progressBar.style.width = '0%';
        } else {
        timeDisplay.textContent = formatTime(t.timeLeft);
        const progressPercent = ((t.totalTime - t.timeLeft) / t.totalTime) * 100;
      progressBar.style.width = `${progressPercent}%`;
        }
      if (t.isRunning) {
      startBtn.style.display = 'none';
      pauseBtn.classList.add('visible');
      restartBtn.classList.add('visible');
    } else {
      startBtn.style.display = 'flex';
      pauseBtn.classList.remove('visible');
      restartBtn.classList.remove('visible');
    }
    // Hide + and - buttons in endless timer
    if (t.timerType === 'endless') {
      decreaseBtn.style.display = 'none';
      increaseBtn.style.display = 'none';
    } else {
      decreaseBtn.style.display = '';
      increaseBtn.style.display = '';
    }
    // Update browser tab title with timer
    if (t.isRunning) {
      let timeString;
      if (t.timerType === 'endless') {
        timeString = formatTime(t.elapsedTime);
      } else {
        timeString = formatTime(t.timeLeft);
      }
      document.title = `${timeString} | ${originalTitle}`;
    } else {
      document.title = originalTitle;
    }
  }
  
    // --- Timer Logic ---
  function toggleTimer() {
    const t = state.timer;
    
    if (t.isRunning) {
        // Stop the timer
        clearInterval(t.interval);
        t.isRunning = false;
        t.interval = null;
        endSession(); // End the current session when stopping
        
        // Update UI
        const playPauseBtn = document.querySelector('.play-pause-btn');
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
        
        // Save current state
        localStorage.setItem('timerState', JSON.stringify({
            timeLeft: t.timeLeft,
            mode: t.mode,
            currentCycle: t.currentCycle,
            isRunning: false
        }));
    } else {
        // Start the timer
        startSession(t.mode); // Start a new session
        
        t.isRunning = true;
        t.interval = setInterval(() => {
            if (t.timeLeft > 0) {
                t.timeLeft--;
                updateDisplay();
                
                // Update progress bar
                const progress = (t.totalTime - t.timeLeft) / t.totalTime * 100;
                const progressBar = document.querySelector('.timer-progress');
                if (progressBar) {
                    progressBar.style.width = `${progress}%`;
                }
            } else {
                // Timer completed
                clearInterval(t.interval);
                t.isRunning = false;
                t.interval = null;
                
                // Play completion sound
                playTimerEndSound();
                
                if (t.timerType === 'pomodoro') {
                    if (t.mode === 'focus') {
                        if (t.currentCycle < t.pomodoroCycles) {
                            // Start short break
                            t.mode = 'break';
                            t.timeLeft = parseInt(localStorage.getItem('pomodoroBreakDuration'), 10) || 5 * 60;
                            t.totalTime = t.timeLeft;
                            t.currentCycle++;
                            saveCurrentCycle();
                            toggleTimer(); // Start the break timer
                        } else {
                            // Start long break
                            t.mode = 'longbreak';
                            t.timeLeft = parseInt(localStorage.getItem('pomodoroLongBreakDuration'), 10) || 15 * 60;
                            t.totalTime = t.timeLeft;
                            toggleTimer(); // Start the long break timer
                        }
                    } else if (t.mode === 'break' || t.mode === 'longbreak') {
                        // Return to focus mode
                        t.mode = 'focus';
                        t.timeLeft = parseInt(localStorage.getItem('pomodoroFocusDuration'), 10) || 25 * 60;
                        t.totalTime = t.timeLeft;
                        
                        if (t.mode === 'longbreak') {
                            // Reset cycles after long break
                            t.currentCycle = 1;
                            saveCurrentCycle();
                        }
                        
                        toggleTimer(); // Start the focus timer
                    }
                } else {
                    // For simple and sleep timers, just reset
                    resetTimer();
                }
                
                // Update UI
                const playPauseBtn = document.querySelector('.play-pause-btn');
                if (playPauseBtn) {
                    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                }
                
                // Update dots
                updatePomodoroDots();
            }
        }, 1000);
        
        // Update UI
        const playPauseBtn = document.querySelector('.play-pause-btn');
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
        
        // Save current state
        localStorage.setItem('timerState', JSON.stringify({
            timeLeft: t.timeLeft,
            mode: t.mode,
            currentCycle: t.currentCycle,
            isRunning: true
        }));
    }
}

  function resetTimer() {
      const t = state.timer;
      clearInterval(t.timer);
      t.isRunning = false;
      
      // End session when timer is reset
      if (stats.currentSessionStart) {
        const sessionDuration = Math.floor((new Date() - stats.currentSessionStart) / 1000 / 60);
        updateStats(sessionDuration, t.mode);
        stats.currentSessionStart = null;
        stats.currentSessionType = null;
        stats.totalSessions++;
      }
      
      // Reset only the current session, not the entire sequence
      if (t.timerType === 'pomodoro') {
        if (t.mode === 'focus') {
          t.timeLeft = parseInt(localStorage.getItem('pomodoroFocusDuration'), 10) || 25 * 60;
        } else if (t.mode === 'break') {
          t.timeLeft = parseInt(localStorage.getItem('pomodoroBreakDuration'), 10) || 5 * 60;
        } else if (t.mode === 'longbreak') {
          t.timeLeft = parseInt(localStorage.getItem('pomodoroLongBreakDuration'), 10) || 15 * 60;
        }
        t.totalTime = t.timeLeft;
      } else if (t.timerType === 'endless') {
        t.elapsedTime = 0;
      } else if (t.timerType === 'simple') {
        t.timeLeft = parseInt(localStorage.getItem('simpleTimerDuration'), 10) || 25 * 60;
        t.totalTime = t.timeLeft;
      } else if (t.timerType === 'sleep') {
        t.timeLeft = parseInt(localStorage.getItem('sleepTimerDuration'), 10) || 30 * 60;
        t.totalTime = t.timeLeft;
      }
      
      updateDisplay();
      enableControls();
  }

  function toggleMode(newMode) {
      const t = state.timer;
      if (newMode === t.mode || t.timerType !== 'pomodoro') return;
      
      // End session when mode changes
      if (stats.currentSessionStart) {
        const sessionDuration = Math.floor((new Date() - stats.currentSessionStart) / 1000 / 60);
        updateStats(sessionDuration, t.mode);
        stats.currentSessionStart = null;
        stats.currentSessionType = null;
        stats.totalSessions++;
      }
      
      t.mode = newMode;
      clearInterval(t.timer);
      t.isRunning = false;
      
      // Sync with settings
      syncTimerToSettings();
      
      // Update UI
      updateDisplay();
      updatePlayButton();
      enableControls();
      
      // Update mode buttons
      modeButtons.forEach(btn => {
        if (btn.dataset.mode === t.mode) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      
      // Start the timer automatically after a short delay
      setTimeout(() => {
        if (!t.isRunning) {
          toggleTimer();
        }
      }, 1000);
  }

  function changeTimerType(newType) {
    const t = state.timer;
    if (newType === t.timerType) return;
    
    // End session when timer type changes
    if (stats.currentSessionStart) {
      const sessionDuration = Math.floor((new Date() - stats.currentSessionStart) / 1000 / 60);
      updateStats(sessionDuration, t.mode);
      stats.currentSessionStart = null;
      stats.currentSessionType = null;
      stats.totalSessions++;
    }
    
    t.timerType = newType;
    
    // Reset timer state
    clearInterval(t.timer);
    t.isRunning = false;
    t.isEditing = false;
    t.elapsedTime = 0;
    
    // Set default times based on type
    if (newType === 'pomodoro') {
      modeSwitcher.classList.remove('hidden');
      t.mode = 'focus';
      t.currentCycle = 1;
      
      // Initialize Pomodoro dots
      const dotsContainer = document.querySelector('.pomodoro-dots');
      if (dotsContainer) {
        dotsContainer.remove();
      }
      const newDotsContainer = createPomodoroDots();
      if (timerDisplay && timerDisplay.parentElement) {
        timerDisplay.parentElement.appendChild(newDotsContainer);
      }
      
      // Sync with settings
      syncTimerToSettings();
      updatePomodoroDots();
    } else {
      modeSwitcher.classList.add('hidden');
      if (newType === 'simple') {
        const simpleDuration = parseInt(localStorage.getItem('simpleTimerDuration'), 10) || 25;
        t.timeLeft = simpleDuration * 60;
        t.totalTime = t.timeLeft;
      } else if (newType === 'endless') {
        t.timeLeft = 0;
        t.totalTime = 0;
      } else if (newType === 'sleep') {
        const sleepDuration = parseInt(localStorage.getItem('sleepTimerDuration'), 10) || 30;
        t.timeLeft = sleepDuration * 60;
        t.totalTime = t.timeLeft;
      }
      
      // Remove Pomodoro dots if they exist
      const dotsContainer = document.querySelector('.pomodoro-dots');
      if (dotsContainer) {
        dotsContainer.remove();
      }
    }
    
    // Update UI elements
    timerTypeDots.forEach(dot => {
      if (dot.dataset.timerType === t.timerType) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
    
    modeButtons.forEach(btn => {
      if (btn.dataset.mode === 'focus') {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    updateDisplay();
    updatePlayButton();
    enableControls();
  }

  function adjustTime(amount) {
      const t = state.timer;
      if (t.isRunning || t.timerType === 'endless') return;
      t.timeLeft = Math.max(0, t.timeLeft + amount);
      t.totalTime = t.timeLeft;
    updateDisplay();
  }

  function handleTimeClick() {
      const t = state.timer;
      if (t.isRunning || t.isEditing || t.timerType === 'endless') return;
      t.isEditing = true;
    const currentTimeText = timeDisplay.textContent;
    timeDisplay.innerHTML = `<input type="text" class="time-input" value="${currentTimeText}" maxlength="8">`;
    const timeInput = document.querySelector('.time-input');
    timeInput.focus();
    timeInput.select();
    timeInput.addEventListener('blur', finishEditing);
    timeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') finishEditing();
    });
    timeInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9:]/g, '');
    });
  }

  function finishEditing() {
      const t = state.timer;
    const timeInput = document.querySelector('.time-input');
    if (!timeInput) return;
    
    let timeValue = timeInput.value.trim();
    let totalSeconds = 0;
    
    // Handle different time input formats
    if (timeValue.includes(':')) {
        const parts = timeValue.split(':');
        if (parts.length === 2) {
            // MM:SS format
            const minutes = parseInt(parts[0], 10) || 0;
            const seconds = parseInt(parts[1], 10) || 0;
            totalSeconds = (minutes * 60) + seconds;
        } else if (parts.length === 3) {
            // HH:MM:SS format
            const hours = parseInt(parts[0], 10) || 0;
            const minutes = parseInt(parts[1], 10) || 0;
            const seconds = parseInt(parts[2], 10) || 0;
            totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
        }
    } else {
        // Simple number input (treated as minutes)
        const minutes = parseInt(timeValue, 10) || 0;
        totalSeconds = minutes * 60; // Convert minutes to seconds
    }
    
    t.timeLeft = totalSeconds;
    t.totalTime = totalSeconds;
    
    // Save custom durations for different timer types
    if (t.timerType === 'pomodoro') {
        const minutes = Math.floor(totalSeconds / 60);
        if (t.mode === 'focus') {
            localStorage.setItem('pomodoroFocusDuration', totalSeconds);
        } else if (t.mode === 'break') {
            localStorage.setItem('pomodoroBreakDuration', totalSeconds);
        } else if (t.mode === 'longbreak') {
            localStorage.setItem('pomodoroLongBreakDuration', totalSeconds);
        }
    } else if (t.timerType === 'simple') {
        localStorage.setItem('simpleTimerDuration', totalSeconds);
    } else if (t.timerType === 'sleep') {
        localStorage.setItem('sleepTimerDuration', totalSeconds);
    }
    
    timeDisplay.innerHTML = '';
    timeDisplay.textContent = formatTime(t.timeLeft);
    t.isEditing = false;
    syncTimerToSettings();
  }

  function disableControls() {
    decreaseBtn.classList.add('disabled');
    increaseBtn.classList.add('disabled');
    modeButtons.forEach(btn => btn.classList.add('disabled'));
    timerDisplay.classList.add('disabled');
    timerTypeDots.forEach(dot => dot.parentElement.classList.add('disabled'));
  }

  function enableControls() {
    decreaseBtn.classList.remove('disabled');
    increaseBtn.classList.remove('disabled');
    modeButtons.forEach(btn => btn.classList.remove('disabled'));
    timerDisplay.classList.remove('disabled');
    timerTypeDots.forEach(dot => dot.parentElement.classList.remove('disabled'));
  }
  
    // --- Event Listeners ---
  startBtn.addEventListener('click', toggleTimer);
  pauseBtn.addEventListener('click', toggleTimer);
    restartBtn.addEventListener('click', resetTimer);
    decreaseBtn.addEventListener('click', () => adjustTime(-60));
    increaseBtn.addEventListener('click', () => adjustTime(60));
  timeDisplay.addEventListener('click', handleTimeClick);
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        if (!state.timer.isRunning && state.timer.timerType === 'pomodoro') {
        toggleMode(btn.dataset.mode);
      }
    });
  });
  timerTypeDots.forEach(dot => {
    dot.addEventListener('click', () => {
        if (!state.timer.isRunning && dot.dataset.timerType !== state.timer.timerType) {
        changeTimerType(dot.dataset.timerType);
      }
    });
  });
  
    // --- Initialize ---
    // On load, set timer to correct custom value for pomodoro mode, simple timer, and sleep timer
    if (state.timer.timerType === 'pomodoro') {
      if (state.timer.mode === 'focus') {
        state.timer.timeLeft = parseInt(localStorage.getItem('pomodoroFocusDuration'), 10) || 25 * 60;
        state.timer.totalTime = state.timer.timeLeft;
      } else if (state.timer.mode === 'break') {
        state.timer.timeLeft = parseInt(localStorage.getItem('pomodoroBreakDuration'), 10) || 5 * 60;
        state.timer.totalTime = state.timer.timeLeft;
      } else if (state.timer.mode === 'longbreak') {
        state.timer.timeLeft = parseInt(localStorage.getItem('pomodoroLongBreakDuration'), 10) || 15 * 60;
        state.timer.totalTime = state.timer.timeLeft;
      }
    } else if (state.timer.timerType === 'simple') {
      state.timer.timeLeft = parseInt(localStorage.getItem('simpleTimerDuration'), 10) || 25 * 60;
      state.timer.totalTime = state.timer.timeLeft;
    } else if (state.timer.timerType === 'sleep') {
      state.timer.timeLeft = parseInt(localStorage.getItem('sleepTimerDuration'), 10) || 30 * 60;
      state.timer.totalTime = state.timer.timeLeft;
    }
    updateDisplay();

    // Theme Modal Tab System
    const themeTabs = document.querySelectorAll('.theme-tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    themeTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remove active from all tabs and panes
        themeTabs.forEach(t => t.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        // Add active to clicked tab and corresponding pane
        tab.classList.add('active');
        const tabName = tab.getAttribute('data-tab');
        const pane = document.getElementById('tab-' + tabName);
        if (pane) pane.classList.add('active');
        // If Default tab, apply sound background immediately and close modal
        if (tabName === 'default') {
          state.useSoundBackground = true;
          state.customBackground = null;
          updateBackground();
          localStorage.setItem('useSoundBackground', 'true');
          localStorage.removeItem('customBackground');
          showToast('Using sound backgrounds');
            closeThemeModal();
        }
  });
      // Keyboard accessibility
      tab.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          tab.click();
        }
      });
    });

    // Attach event listeners for preset themes (once, after DOMContentLoaded or after renderThemeGrid)
    function attachPresetThemeListeners() {
      document.querySelectorAll('.preset-theme').forEach(button => {
        button.replaceWith(button.cloneNode(true)); // Remove all listeners
      });
      document.querySelectorAll('.preset-theme').forEach(button => {
        button.addEventListener('click', () => {
          const themeUrl = button.dataset.theme;
          state.customBackground = themeUrl;
          state.useSoundBackground = false;
          renderThemeGrid(); // Re-render to update active state immediately
          setCustomBackground(themeUrl, true); // true = isPreset
        });
      });
    }
    attachPresetThemeListeners();

    // Attach event listener for custom background apply button (once)
    if (applyBgButton && customBgUrlInput) {
      applyBgButton.onclick = null;
      applyBgButton.addEventListener('click', () => {
        setCustomBackground(customBgUrlInput.value.trim());
      });
    }

    // Ensure the sound grid is rendered
    loadSounds();

    // On page load, restore cached theme if present
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) {
        state.customBackground = savedTheme;
        state.useSoundBackground = false;
        updateBackground();
    }

    // --- Goal Placeholder Logic ---
    const goalDiv = document.getElementById('current-goal');
    const placeholder = 'Goal for This Session?';

    if (goalDiv) {
      goalDiv.addEventListener('focus', function() {
        if (goalDiv.textContent.trim() === placeholder) {
          goalDiv.textContent = '';
          goalDiv.style.color = '#fff'; // Normal text color (white)
        }
      });

      goalDiv.addEventListener('blur', function() {
        if (goalDiv.textContent.trim() === '') {
          goalDiv.textContent = placeholder;
          goalDiv.style.color = '#bdbdbd'; // Placeholder color
        }
      });

      // Handle Enter key to set goal instead of new line
      goalDiv.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          goalDiv.blur(); // Triggers blur event to "set" the goal
        }
      });

      // On page load, set color based on content
      if (goalDiv.textContent.trim() === placeholder) {
        goalDiv.style.color = '#bdbdbd';
      } else {
        goalDiv.style.color = '#fff';
      }
    }

    // On page load, fetch user profile and then load sounds/themes
    (async function initApp() {
      await fetchUserProfile();
      await loadSounds();
      await loadThemes();
    })();

    // Add minimal CSS for Plus badge (rectangle at bottom center)
    const style = document.createElement('style');
    style.innerHTML = `
    .plus-badge {
      position: absolute;
      right: -16px;
      transform: translateX(-50%);
      background: #fffffff0;
      color: #00000070;
      border-radius: 6px;
      padding: 2px 10px;
      font-size: 0.85em;
      font-weight: 700;
      z-index: 2; top: 8px;
      pointer-events: none;
    }
    .plus-badge-bottom {
      top: 8px;
    }
    .sound-button, .library-sound-thumbnail, .preset-preview {
      position: relative;
    }
    .plus-badge-top {
      top: 8px;
      bottom: auto;
    }
    `;
    document.head.appendChild(style);

    // Add link to account page in settings modal
    const settingsModalContent = document.querySelector('#settings-modal .modal-content');
    if (settingsModalContent) {
      const accountLink = document.createElement('a');
      accountLink.href = 'account.html';
      accountLink.className = 'primary-btn';
      accountLink.style.marginTop = '24px';
      accountLink.style.display = 'inline-block';
      accountLink.textContent = 'Manage Account';
      settingsModalContent.appendChild(accountLink);
    }

    // --- Plus Popup Functions for Webflow ---
    function openPlusPopup() {
      // You can use this to show your Webflow popup
      const popup = document.querySelector('.plus-popup');
      if (popup) popup.classList.add('plus-popup-open');
    }
    function closePlusPopup() {
      const popup = document.querySelector('.plus-popup');
      if (popup) popup.classList.remove('plus-popup-open');
    }
    // You can use <button id="close-plus-popup"> in your Webflow popup to call closePlusPopup()

    // Mix Mode Toggle Handler
    const mixModeToggle = document.getElementById('mix-mode-toggle');
    const mixModeLabel = document.getElementById('mix-mode-label');
    if (mixModeToggle) {
      mixModeToggle.addEventListener('click', () => {
        if (!state.isMixMode) {
          // Switching to Mix Mode: pause and clear normal mode sound
          if (audio) { audio.pause(); audio.currentTime = 0; }
          state.currentSound = null;
          state.isPlaying = false;
        } else {
          // Switching to normal mode: pause and clear all mix audios
          Object.values(state.mixAudios).forEach(audio => { if (audio) { audio.pause(); audio.currentTime = 0; } });
          state.mixAudios = {};
          state.mixVolumes = {};
        }
        state.isMixMode = !state.isMixMode;

        // If switching TO Mix Mode, open the sound library
        if (state.isMixMode) {
          toggleSoundLibrary();
        }

        mixModeLabel.textContent = state.isMixMode ? 'Mix Mode: On' : 'Mix Mode: Off';
        renderSoundLibrary();
        renderSoundGrid();
        updatePlayButton();
      });
    }

    // Initialize statistics functionality
    function initStats() {
        const statsBtn = document.getElementById('stats-btn');
        const statsModal = document.getElementById('stats-modal');
        const closeStats = document.getElementById('close-stats');

        if (statsBtn && statsModal && closeStats) {
            statsBtn.addEventListener('click', () => {
                closeAllBottomSheets();
                statsModal.classList.remove('hidden');
                statsModal.classList.add('active');
            });

            closeStats.addEventListener('click', () => {
                statsModal.classList.remove('active');
                statsModal.classList.add('hidden');
            });
        }
    }

    // Add to your existing DOMContentLoaded event listener
    document.addEventListener('DOMContentLoaded', () => {
        // ... existing initialization code ...
        
        // Initialize statistics
        initStats();
        loadStats();
        
        // Update stats when timer completes
        const originalStartTimer = startTimer;
        startTimer = function() {
            originalStartTimer.apply(this, arguments);
            startSession(state.currentMode === 'break' ? 'break' : 'focus');
        };
        
        const originalStopTimer = stopTimer;
        stopTimer = function() {
            originalStopTimer.apply(this, arguments);
            endSession();
        };
    });

    // Statistics tracking
    let stats = {
        totalFocusTime: 0,
        totalBreakTime: 0,
        totalSessions: 0,
        currentSessionStart: null,
        currentSessionType: null
    };

    // Add version constant
    const STATS_VERSION = 1;

    function updateStats(minutes, type) {
      console.log('Updating stats:', { minutes, type, timerType: state.timer.timerType });
      
      // Only count focus time for simple timer, pomodoro focus, and endless timer
      if (type === 'focus' && 
          (state.timer.timerType === 'simple' || 
           state.timer.timerType === 'pomodoro' || 
           state.timer.timerType === 'endless')) {
        stats.totalFocusTime += minutes;
      }
      
      // Only count break time for pomodoro breaks
      if (type === 'break' && state.timer.timerType === 'pomodoro') {
        stats.totalBreakTime += minutes;
      }
      
      // Update display
      const focusTimeElement = document.getElementById('total-focus-time');
      const breakTimeElement = document.getElementById('total-break-time');
      const sessionsElement = document.getElementById('total-sessions');
      
      if (focusTimeElement) focusTimeElement.textContent = stats.totalFocusTime;
      if (breakTimeElement) breakTimeElement.textContent = stats.totalBreakTime;
      if (sessionsElement) sessionsElement.textContent = stats.totalSessions;
      
      // Save to localStorage with version
      localStorage.setItem('focusStats', JSON.stringify({
        version: STATS_VERSION,
        data: stats
      }));
    }

    function loadStats() {
      try {
        const savedStats = localStorage.getItem('focusStats');
        if (savedStats) {
          const parsed = JSON.parse(savedStats);
          
          // Check version and migrate if needed
          if (parsed.version !== STATS_VERSION) {
            console.log('Migrating stats from version', parsed.version, 'to', STATS_VERSION);
            // Add migration logic here if needed
          }
          
          stats = parsed.data;
          
          // Update UI
          const focusTimeElement = document.getElementById('total-focus-time');
          const breakTimeElement = document.getElementById('total-break-time');
          const sessionsElement = document.getElementById('total-sessions');
          
          if (focusTimeElement) focusTimeElement.textContent = stats.totalFocusTime;
          if (breakTimeElement) breakTimeElement.textContent = stats.totalBreakTime;
          if (sessionsElement) sessionsElement.textContent = stats.totalSessions;
        }
      } catch (e) {
        console.error('Error loading stats:', e);
        // Reset stats on error
        stats = {
          totalFocusTime: 0,
          totalBreakTime: 0,
          totalSessions: 0,
          currentSessionStart: null,
          currentSessionType: null
        };
      }
    }

    // Start tracking a new session
    function startSession(type) {
        if (!state.sessionStartTime) {
            state.sessionStartTime = Date.now();
            state.sessionType = type;
            console.log('Starting session:', { type, timerType: state.timer.timerType });
        }
    }

    // End current session
    function endSession() {
        if (state.sessionStartTime) {
            const duration = Math.floor((Date.now() - state.sessionStartTime) / 1000 / 60);
            if (duration > 0) {
              updateStats(duration, state.sessionType);
            }
            state.sessionStartTime = null;
            state.sessionType = null;
            stats.totalSessions++;
        }
    }

    // Add direct event listener for stats button
    document.getElementById('stats-btn')?.addEventListener('click', function() {
        console.log('Stats button clicked');
        const statsModal = document.getElementById('stats-modal');
        if (statsModal) {
            closeAllBottomSheets();
            statsModal.classList.remove('hidden');
            requestAnimationFrame(() => {
                statsModal.classList.add('active');
            });
        } else {
            console.error('Stats modal not found');
        }
    });

    // Add direct event listener for close button
    document.getElementById('close-stats')?.addEventListener('click', function() {
        console.log('Close button clicked');
        const statsModal = document.getElementById('stats-modal');
        if (statsModal) {
            statsModal.classList.remove('active');
            setTimeout(() => {
                statsModal.classList.add('hidden');
            }, 300);
        }
    });

    // Update the toggleTimer function to track sessions
    const originalToggleTimer = toggleTimer;
    toggleTimer = function() {
        const wasRunning = state.timer.isRunning;
        originalToggleTimer.apply(this, arguments);
        if (!wasRunning && state.timer.isRunning) {
            // Timer started
            startSession(state.timer.mode);
        } else if (wasRunning && !state.timer.isRunning) {
            // Timer stopped
            endSession();
            // Play chime if enabled and timer ended (not just paused)
            if (timerSoundToggle && timerSoundToggle.checked) {
                if (timerSoundSelect && timerSoundSelect.value === 'chime') {
                    chimeAudio.currentTime = 0;
                    chimeAudio.play();
                }
            }
        }
    };

    // Update the resetTimer function to track sessions
    const originalResetTimer = resetTimer;
    resetTimer = function() {
        if (state.timer.isRunning) {
            endSession();
        }
        originalResetTimer.apply(this, arguments);
    };

    // Update the changeTimerType function
    const originalChangeTimerType = changeTimerType;
    changeTimerType = function(newType) {
        if (state.timer.isRunning) {
            endSession();
        }
        originalChangeTimerType.apply(this, arguments);
    };

    // Update the toggleMode function
    const originalToggleMode = toggleMode;
    toggleMode = function(newMode) {
        if (state.timer.isRunning) {
            endSession();
        }
        originalToggleMode.apply(this, arguments);
    };

    // Initialize statistics when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize statistics
        initStats();
        loadStats();
        
        // Add event listeners for timer controls
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const restartBtn = document.getElementById('restartBtn');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (!state.timer.isRunning) {
                    startSession(state.timer.mode);
                }
            });
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                if (state.timer.isRunning) {
                    endSession();
                }
            });
        }
        
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                if (state.timer.isRunning) {
                    endSession();
                }
            });
        }
    });

    // Statistics Modal
    const statsModal = document.getElementById('stats-modal');
    if (statsModal) {
        statsModal.innerHTML = `
            <div class="sheet-header">
                <h3>Focus Statistics</h3>
                <button id="close-stats" class="close-btn" aria-label="Close">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
            <div class="sheet-content">
                <div class="stats-container">
                    <div class="stat-item">
                        <div class="stat-value" id="total-focus-time">0</div>
                        <div class="stat-label">Focus Time</div>
                        <div class="stat-unit">minutes</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="total-break-time">0</div>
                        <div class="stat-label">Break Time</div>
                        <div class="stat-unit">minutes</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="total-sessions">0</div>
                        <div class="stat-label">Total Sessions</div>
                        <div class="stat-unit">sessions</div>
                    </div>
                </div>

                <!-- Graph Section -->
                <div class="stats-graph-section">
                     <div class="graph-header">
                        <h4>Focus Time Trends</h4>
                        <div class="time-range-selector">
                            <button class="time-range-btn active" data-range="24h">24h</button>
                            <button class="time-range-btn" data-range="7d">7d</button>
                            <button class="time-range-btn" data-range="30d">30d</button>
                        </div>
                     </div>
                    <div class="graph-container" id="stats-graph">
                         <p class="empty-graph-message">No data available yet. Start a timer to see your trends!</p>
                    </div>
                </div>

            </div>
        `;

        // Add styles for the stats modal
        const statsModalStyle = document.createElement('style');
        statsModalStyle.textContent = `
            #stats-modal {
                position: fixed;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 100%;
                max-width: 500px;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                border-radius: 20px 20px 0 0;
                padding: 20px;
                z-index: 1000;
                transition: transform 0.3s ease-out;
                box-sizing: border-box; /* Include padding in width */
            }

            #stats-modal.hidden {
                transform: translate(-50%, 100%);
            }

            #stats-modal.active {
                transform: translate(-50%, 0);
            }

            .stats-container {
                display: flex;
                justify-content: space-around;
                align-items: center;
                padding: 20px 0;
            }

            .stat-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                padding: 15px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                min-width: 100px; /* Adjusted min-width */
                 flex: 1; /* Allow items to grow */
                 margin: 0 5px; /* Add horizontal margin */
            }

             .stat-item:first-child { margin-left: 0; }
             .stat-item:last-child { margin-right: 0; }

            .stat-value {
                font-size: 2em; /* Adjusted font size */
                font-weight: bold;
                color: #fff;
                margin-bottom: 5px;
            }

            .stat-label {
                font-size: 0.9em; /* Adjusted font size */
                color: #bdbdbd;
                margin-bottom: 3px;
            }

            .stat-unit {
                font-size: 0.7em; /* Adjusted font size */
                color: #666;
            }

            .sheet-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .sheet-header h3 {
                margin: 0;
                color: #fff;
            }

            .close-btn {
                background: none;
                border: none;
                color: #fff;
                cursor: pointer;
                padding: 5px;
                 display: flex; /* Center icon */
                 align-items: center;
                 justify-content: center;
            }

            .close-btn:hover {
                opacity: 0.8;
            }

            /* Graph Section Styles */
            .stats-graph-section {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .graph-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .graph-header h4 {
                margin: 0;
                color: #fff;
                font-size: 1.2em;
            }

            .time-range-selector {
                display: flex;
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                overflow: hidden;
            }

            .time-range-btn {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                padding: 8px 12px;
                cursor: pointer;
                font-size: 0.9em;
                transition: background 0.3s ease, color 0.3s ease;
            }

            .time-range-btn.active {
                background: rgba(255, 255, 255, 0.2);
                color: #fff;
                font-weight: bold;
            }

            .time-range-btn:hover:not(.active) {
                 background: rgba(255, 255, 255, 0.1);
            }

            .graph-container {
                width: 100%;
                height: 200px; /* Adjust height as needed */
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                /* Updated styles for empty state message */
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                color: rgba(255, 255, 255, 0.6);
                font-size: 1em;
                padding: 20px;
                box-sizing: border-box; /* Include padding in width */
                 overflow: hidden; /* Hide potential overflow */
            }

            .empty-graph-message {
                 margin: 0; /* Remove default paragraph margin */
            }

            /* Placeholder for graph bars (will be dynamic) */
            .graph-container .bar {
                 /* Keep bar styles for when data is present */
                 width: 10px; /* Example width */
                 background-color: #ffd700; /* Example color */
                 margin: 0 2px; /* Space between bars */
                 /* Bars should override flex centering when added */
            }

            @media (max-width: 480px) {
                #stats-modal {
                    padding: 15px;
                }

                .stats-container {
                    flex-direction: column; /* Stack items on small screens */
                    gap: 10px;
                }

                .stat-item {
                     width: 100%; /* Full width on small screens */
                     margin: 0;
                }

                 .stat-item:first-child { margin-top: 0; }
                 .stat-item:last-child { margin-bottom: 0; }

                .stat-value {
                    font-size: 1.8em;
                }

                .stat-label {
                    font-size: 0.8em;
                }

                .stat-unit {
                    font-size: 0.6em;
                }

                .graph-header {
                    flex-direction: column; /* Stack header elements */
                    align-items: flex-start;
                }

                .time-range-selector {
                    margin-top: 10px; /* Space between title and selector */
                     width: 100%;
                }

                 .time-range-btn {
                     flex: 1; /* Distribute width equally */
                     text-align: center;
                 }

                 .graph-container {
                     height: 150px; /* Smaller graph on mobile */
                 }
            }
        `;
        document.head.appendChild(statsModalStyle);
    }

    // Add direct event listener for close button
    document.getElementById('close-stats')?.removeEventListener('click', handleCloseStatsClick);
    document.getElementById('close-stats')?.addEventListener('click', handleCloseStatsClick);

    // --- To-Do List Open/Close Logic ---
    const openTodoBtn = document.getElementById('open-todo-btn');
    const todoSheet = document.getElementById('todo-sheet');
    const closeTodoBtn = document.getElementById('close-todo');

    if (openTodoBtn && todoSheet) {
      openTodoBtn.addEventListener('click', function() {
        if (typeof closeAllBottomSheets === 'function') closeAllBottomSheets();
        todoSheet.classList.remove('hidden');
        requestAnimationFrame(() => {
          todoSheet.classList.add('active');
        });
      });
    }
    if (closeTodoBtn && todoSheet) {
      closeTodoBtn.addEventListener('click', function() {
        todoSheet.classList.remove('active');
        setTimeout(() => {
          todoSheet.classList.add('hidden');
        }, 300);
      });
    }

    // Copy functionality for todo list
    const copyBtn = document.querySelector('.copy-btn');
    if (copyBtn) copyBtn.addEventListener('click', function() {
        const taskList = document.getElementById('task-list');
        if (!taskList) return;
        const tasks = Array.from(taskList.querySelectorAll('.task-item'));
        const lines = tasks.map(item => {
            const text = item.querySelector('.task-text').textContent.trim();
            if (!text) return null;
            const circle = item.querySelector('.task-circle');
            if (circle.classList.contains('completed')) {
                return `✔ ${text}`;
            } else {
                return `☐ ${text}`;
            }
        }).filter(Boolean);
        const todoText = lines.join('\n');
        if (todoText) {
            navigator.clipboard.writeText(todoText).then(() => {
                showToast('Todo list copied to clipboard!', 'success');
            }, () => {
                showToast('Failed to copy todo list.', 'error');
            });
        } else {
            showToast('No todo items to copy.', 'info');
        }
    });

    // Dropdown menu logic for settings-btn
    // (Removed from here; will be moved to main DOMContentLoaded handler)

    // Timer Settings Menu logic
    const settingsDot = document.getElementById('settings-dot');
    const timerSettingsMenu = document.getElementById('timer-settings-menu');
    const timerSettingsForm = document.getElementById('timer-settings-form');
    const closeTimerSettingsBtn = document.getElementById('close-timer-settings');
    if (settingsDot && timerSettingsMenu && timerSettingsForm && closeTimerSettingsBtn) {
        // Toggle menu
        settingsDot.addEventListener('click', function(e) {
            e.stopPropagation();
            timerSettingsMenu.classList.add('active');
            syncTimerToSettings();
            const firstInput = timerSettingsMenu.querySelector('input');
            if (firstInput) firstInput.focus();
        });
        // Hide on outside click
        document.addEventListener('click', function(e) {
            if (timerSettingsMenu.classList.contains('active') && !timerSettingsMenu.contains(e.target) && e.target !== settingsDot) {
                timerSettingsMenu.classList.remove('active');
            }
        });
        // Close button
        closeTimerSettingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            timerSettingsMenu.classList.remove('active');
        });
        // Form submit logic
        timerSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get values
            const focusTime = parseInt(document.getElementById('focus-time-input').value, 10);
            const breakTime = parseInt(document.getElementById('break-time-input').value, 10);
            const longBreakTime = parseInt(document.getElementById('long-break-time-input').value, 10);
            const cycles = parseInt(document.getElementById('cycles-input').value, 10);
            const sleepTime = parseInt(document.getElementById('sleep-time-input').value, 10);
            
            // Save to localStorage
            localStorage.setItem('pomodoroFocusDuration', focusTime * 60);
            localStorage.setItem('pomodoroBreakDuration', breakTime * 60);
            localStorage.setItem('pomodoroLongBreakDuration', longBreakTime * 60);
            localStorage.setItem('pomodoroCycles', cycles);
            localStorage.setItem('sleepTimerDuration', sleepTime * 60);
            
            // Update state
            state.timer.pomodoroCycles = cycles;
            
            // Update current timer if needed
            if (state.timer.timerType === 'pomodoro') {
              if (state.timer.mode === 'focus') {
                state.timer.timeLeft = focusTime * 60;
              } else if (state.timer.mode === 'break') {
                state.timer.timeLeft = breakTime * 60;
              } else if (state.timer.mode === 'longbreak') {
                state.timer.timeLeft = longBreakTime * 60;
              }
              state.timer.totalTime = state.timer.timeLeft;
            }
            
            updateDisplay();
            updatePomodoroDots();
            timerSettingsMenu.classList.remove('active');
        });
    }

    // Hide Current Goal toggle logic
    const hideGoalToggle = document.getElementById('hide-goal-toggle');
    const currentGoalContainer = document.querySelector('.current-goal-container');
    if (hideGoalToggle && currentGoalContainer) {
        // Set initial state from localStorage
        const hideGoal = localStorage.getItem('hideCurrentGoal') === 'true';
        hideGoalToggle.checked = hideGoal;
        currentGoalContainer.style.display = hideGoal ? 'none' : '';
        // Toggle handler
        hideGoalToggle.addEventListener('change', function() {
            if (hideGoalToggle.checked) {
                currentGoalContainer.style.display = 'none';
                localStorage.setItem('hideCurrentGoal', 'true');
            } else {
                currentGoalContainer.style.display = '';
                localStorage.setItem('hideCurrentGoal', 'false');
            }
        });
    }

    // Timer Sound Effect toggle logic
    timerSoundToggle = document.getElementById('timer-sound-toggle');
    const timerSoundSelectCell = document.getElementById('timer-sound-select-cell');
    timerSoundSelect = document.getElementById('timer-sound-select');
    chimeAudio = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae5b2.mp3'); // Example chime
    if (timerSoundToggle && timerSoundSelectCell && timerSoundSelect) {
        // Set initial state from localStorage
        const timerSoundOn = localStorage.getItem('timerSoundOn') === 'true';
        timerSoundToggle.checked = timerSoundOn;
        timerSoundSelectCell.style.display = timerSoundOn ? 'flex' : 'none';
        const savedType = localStorage.getItem('timerSoundType') || 'chime';
        timerSoundSelect.value = savedType;
        // Toggle handler
        timerSoundToggle.addEventListener('change', function() {
            if (timerSoundToggle.checked) {
                timerSoundSelectCell.style.display = 'flex';
                localStorage.setItem('timerSoundOn', 'true');
            } else {
                timerSoundSelectCell.style.display = 'none';
                localStorage.setItem('timerSoundOn', 'false');
            }
        });
        timerSoundSelect.addEventListener('change', function() {
            localStorage.setItem('timerSoundType', timerSoundSelect.value);
        });
    }

    // Render Timer Sounds (Tones) in the sound library modal
    function renderTimerSoundsLibrary() {
      const timerSoundLibraryList = document.getElementById('timer-sound-library-list');
      if (!timerSoundLibraryList) return;
      timerSoundLibraryList.innerHTML = '';
      if (!tones || tones.length === 0) {
        timerSoundLibraryList.innerHTML = '<div style="color:#aaa;padding:8px;">No timer sounds available.</div>';
        return;
      }
      tones.forEach(tone => {
        const item = document.createElement('div');
        item.className = 'library-sound-item';
        item.dataset.soundId = tone.id;
        item.innerHTML = `
          <div class="library-sound-thumbnail">
            <img src="${tone.image_url || 'https://i.pinimg.com/originals/5f/a7/56/5fa756bd5a44204fc72891f265b4fd2b.gif'}" alt="${tone.name}">
          </div>
          <span class="library-sound-name">${tone.name}</span>
          <div class="library-sound-status">
            <svg class="play-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5.14v14.72a.5.5 0 00.76.43l11.52-7.36a.5.5 0 000-.86L8.76 4.71a.5.5 0 00-.76.43z" fill="currentColor"/></svg>
            <svg class="pause-icon hidden" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5h2v14H8V5zm6 0h2v14h-2V5z" fill="currentColor"/></svg>
          </div>
        `;
        // Play/pause logic
        let audio = null;
        let isPlaying = false;
        item.addEventListener('click', () => {
          if (!audio) {
            audio = new Audio(tone.url);
            audio.addEventListener('ended', () => {
              isPlaying = false;
              item.classList.remove('active');
            });
          }
          if (isPlaying) {
            audio.pause();
            audio.currentTime = 0;
            isPlaying = false;
            item.classList.remove('active');
          } else {
            audio.play();
            isPlaying = true;
            item.classList.add('active');
          }
        });
        timerSoundLibraryList.appendChild(item);
      });
    }

    // Call this after tones are loaded
    async function loadTonesAndPopulateDropdownAndLibrary() {
      await loadTonesAndPopulateDropdown();
      renderTimerSoundsLibrary();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadTonesAndPopulateDropdownAndLibrary);
    } else {
      loadTonesAndPopulateDropdownAndLibrary();
    }
});

// Define the handler function separately
function handleCloseStatsClick() {
    console.log('Close button clicked');
    const statsModal = document.getElementById('stats-modal');
    if (statsModal) {
        statsModal.classList.remove('active');
        setTimeout(() => {
            statsModal.classList.add('hidden');
        }, 300);
    }
}

// Add the full-featured todo list JS code after DOMContentLoaded

document.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    // Get day number
    const dayNumber = today.getDate();
    // Get abbreviated month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthAbbr = months[today.getMonth()];
    // Get abbreviated day of week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayAbbr = days[today.getDay()];
    // Create the date elements
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
      dateEl.innerHTML = '';
      const dayNumberEl = document.createElement('div');
      dayNumberEl.className = 'day-number';
      dayNumberEl.textContent = dayNumber;
      const monthDayEl = document.createElement('div');
      monthDayEl.className = 'month-day';
      const monthEl = document.createElement('div');
      monthEl.textContent = monthAbbr;
      const dayEl = document.createElement('div');
      dayEl.textContent = dayAbbr;
      monthDayEl.appendChild(monthEl);
      monthDayEl.appendChild(dayEl);
      dateEl.appendChild(dayNumberEl);
      dateEl.appendChild(monthDayEl);
    }
    const taskList = document.getElementById('task-list');
    const helpBtn = document.querySelector('.help-btn');
    const clearBtn = document.querySelector('.clear-btn');
    const downloadBtn = document.querySelector('.download-btn');
    const hideBtn = document.querySelector('.hide-btn');
    const showListBtn = document.getElementById('show-list-btn');
    const todoContainer = document.getElementById('todo-container');
    // Initialize Feather icons
    if (window.feather) feather.replace();
    // Demo data
    const demoData = [
        { text: "Click to add your todo.", status: "" },
        { text: "Click on circle to change progress.", status: "" },
        { text: "Single click will make task in progress.", status: "in-progress" },
        { text: "Double click will make it complete.", status: "completed" },
        { text: "Click on download and download it.", status: "" },
        { text: "Click on the dustbin to clear this list.", status: "" }
    ];
    // Check local storage for existing tasks
    const storedTasks = localStorage.getItem('analogTasks');
    // Always load demo data on first visit
    if (!storedTasks) {
        loadDemoData();
        updateGoalFromTodo();
    } else {
        // Load saved tasks
        const tasks = JSON.parse(storedTasks);
        if (tasks.length > 0) {
            tasks.forEach(task => {
                addTask(task.text, task.status);
            });
            sortTasks();
            updateGoalFromTodo();
        } else {
            // Add empty cells if no saved tasks
            for (let i = 0; i < 10; i++) {
                addEmptyTask();
            }
            updateGoalFromTodo();
        }
    }
    // Add new task
    function addTask(text, status = "") {
        const li = document.createElement('li');
        li.className = 'task-item';
        const circle = document.createElement('div');
        circle.className = 'task-circle';
        if (status === "in-progress") {
            circle.classList.add('in-progress');
        } else if (status === "completed") {
            circle.classList.add('completed');
        }
        const taskText = document.createElement('div');
        taskText.className = 'task-text';
        taskText.setAttribute('contenteditable', 'true');
        taskText.textContent = text;
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        const dragDots = document.createElement('div');
        dragDots.className = 'drag-dots';
        // Create 6 dots
        for (let i = 0; i < 6; i++) {
            const dot = document.createElement('div');
            dot.className = 'drag-dot';
            dragDots.appendChild(dot);
        }
        dragHandle.appendChild(dragDots);
        li.appendChild(circle);
        li.appendChild(taskText);
        li.appendChild(dragHandle);
        setupTaskEvents(li, circle, taskText, dragHandle);
        taskList.appendChild(li);
        return li;
    }
    // Add empty task
    function addEmptyTask() {
        addTask('');
    }
    // Setup events for task item
    function setupTaskEvents(li, circle, taskText, dragHandle) {
        // Update drag handle visibility based on task status
        function updateDragHandle() {
            const isCompleted = circle.classList.contains('completed');
            const isInProgress = circle.classList.contains('in-progress');
            const hasText = taskText.textContent.trim() !== '';
            if (isCompleted || isInProgress || !hasText) {
                dragHandle.classList.add('hidden');
                li.draggable = false;
            } else {
                dragHandle.classList.remove('hidden');
                li.draggable = true;
            }
        }
        // Initial update
        updateDragHandle();
        // Drag and drop functionality
        li.addEventListener('dragstart', function(e) {
            if (!li.draggable) return;
            li.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', li.outerHTML);
            // Create a custom drag image that stays within bounds
            const dragImage = li.cloneNode(true);
            dragImage.style.position = 'absolute';
            dragImage.style.top = '-1000px';
            dragImage.style.left = '0px';
            dragImage.style.width = li.offsetWidth + 'px';
            dragImage.style.opacity = '0.8';
            dragImage.style.backgroundColor = 'white';
            dragImage.style.border = '1px solid #e0e0e0';
            dragImage.style.borderRadius = '4px';
            dragImage.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            dragImage.style.padding = '10px';
            dragImage.style.zIndex = '1000';
            document.body.appendChild(dragImage);
            // Calculate offset so cursor appears over the drag handle
            const dragHandleRect = dragHandle.getBoundingClientRect();
            const liRect = li.getBoundingClientRect();
            const offsetX = dragHandleRect.left - liRect.left + (dragHandleRect.width / 2);
            const offsetY = dragHandleRect.top - liRect.top + (dragHandleRect.height / 2);
            e.dataTransfer.setDragImage(dragImage, offsetX, offsetY);
            // Clean up the drag image after a short delay
            setTimeout(() => {
                if (document.body.contains(dragImage)) {
                    document.body.removeChild(dragImage);
                }
            }, 0);
        });
        li.addEventListener('dragend', function(e) {
            li.classList.remove('dragging');
            // Remove drag-over class from all items
            const allItems = taskList.querySelectorAll('.task-item');
            allItems.forEach(item => item.classList.remove('drag-over'));
        });
        li.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const dragging = taskList.querySelector('.dragging');
            if (dragging && dragging !== li) {
                li.classList.add('drag-over');
            }
        });
        li.addEventListener('dragleave', function(e) {
            if (!li.contains(e.relatedTarget)) {
                li.classList.remove('drag-over');
            }
        });
        li.addEventListener('drop', function(e) {
            e.preventDefault();
            li.classList.remove('drag-over');
            const dragging = taskList.querySelector('.dragging');
            if (dragging && dragging !== li) {
                // Get the bounding rect to determine drop position
                const rect = li.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                if (e.clientY < midpoint) {
                    // Insert before
                    taskList.insertBefore(dragging, li);
                } else {
                    // Insert after
                    taskList.insertBefore(dragging, li.nextSibling);
                }
                saveTasksToLocalStorage();
                updateGoalFromTodo();
            }
        });
        // Add task circle click handlers for status changes
        circle.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event from bubbling to modal overlay
            if (circle.classList.contains('completed')) {
                // If completed, reset to not started
                circle.classList.remove('completed');
                circle.classList.remove('in-progress');
            } else if (circle.classList.contains('in-progress')) {
                // If in progress, mark as completed
                circle.classList.remove('in-progress');
                circle.classList.add('completed');
            } else {
                // If not started, make it in progress
                circle.classList.add('in-progress');
            }
            // Update drag handle visibility
            updateDragHandle();
            // Sort tasks and save
            sortTasks();
            saveTasksToLocalStorage();
            updateGoalFromTodo();
        });
        // Double click to complete directly
        circle.addEventListener('dblclick', function(e) {
            e.stopPropagation(); // Prevent event from bubbling to modal overlay
            circle.classList.remove('in-progress');
            circle.classList.add('completed');
            // Update drag handle visibility
            updateDragHandle();
            // Sort tasks and save
            sortTasks();
            saveTasksToLocalStorage();
            updateGoalFromTodo();
        });
        // Text click - make editable
        taskText.addEventListener('focus', function() {
            this.classList.add('editing');
        });
        // Text blur - finish editing
        taskText.addEventListener('blur', function() {
            this.classList.remove('editing');
            // Update drag handle visibility
            updateDragHandle();
            // Check if we need more empty cells
            checkAndAddEmptyCell();
            // Sort tasks and save
            sortTasks();
            saveTasksToLocalStorage();
            updateGoalFromTodo();
        });
        // Task text key events
        taskText.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.blur();
            }
        });
        // Text input event to update drag handle
        taskText.addEventListener('input', function() {
            updateDragHandle();
        });
    }
    // Sort tasks: in-progress at top, then not started & empty, then completed
    function sortTasks() {
        const tasks = Array.from(taskList.querySelectorAll('.task-item'));
        // Remove all tasks from DOM
        tasks.forEach(task => task.remove());
        // Sort tasks by status
        const inProgressTasks = tasks.filter(task => 
            task.querySelector('.task-circle').classList.contains('in-progress') && 
            task.querySelector('.task-text').textContent.trim() !== '');
        const emptyTasks = tasks.filter(task => 
            task.querySelector('.task-text').textContent.trim() === '');
        const notStartedTasks = tasks.filter(task => 
            !task.querySelector('.task-circle').classList.contains('in-progress') && 
            !task.querySelector('.task-circle').classList.contains('completed') && 
            task.querySelector('.task-text').textContent.trim() !== '');
        const completedTasks = tasks.filter(task => 
            task.querySelector('.task-circle').classList.contains('completed') && 
            task.querySelector('.task-text').textContent.trim() !== '');
        // Add back in proper order: in-progress, not started, empty, completed
        const sortedTasks = [...inProgressTasks, ...notStartedTasks, ...emptyTasks, ...completedTasks];
        sortedTasks.forEach(task => taskList.appendChild(task));
        updateGoalFromTodo();
    }
    // Check if we need to add more empty cells
    function checkAndAddEmptyCell() {
        const tasks = Array.from(taskList.querySelectorAll('.task-item'));
        const emptyCells = tasks.filter(task => 
            task.querySelector('.task-text').textContent.trim() === '');
        if (emptyCells.length === 0) {
            addEmptyTask();
        }
        updateGoalFromTodo();
    }
    // Load demo data function
    function loadDemoData() {
        // Clear existing tasks
        taskList.innerHTML = '';
        // Add demo tasks
        demoData.forEach(task => {
            addTask(task.text, task.status);
        });
        // Save to local storage - no need to sort since demo data is ordered correctly
        saveTasksToLocalStorage();
        updateGoalFromTodo();
    }
    // Help button now loads demo data directly without confirmation
    if (helpBtn) helpBtn.addEventListener('click', function() { loadDemoData(); updateGoalFromTodo(); });
    // Clear all tasks directly without confirmation
    if (clearBtn) clearBtn.addEventListener('click', function() {
        taskList.innerHTML = '';
        // Add back 10 empty cells
        for (let i = 0; i < 10; i++) {
            addEmptyTask();
        }
        saveTasksToLocalStorage();
        updateGoalFromTodo();
    });
    // Hide and show list
    if (hideBtn) hideBtn.addEventListener('click', function() {
        if (todoContainer) todoContainer.classList.add('hidden');
        if (showListBtn) showListBtn.classList.add('visible');
        localStorage.setItem('todoHidden', 'true');
    });
    if (showListBtn) showListBtn.addEventListener('click', function() {
        if (todoContainer) todoContainer.classList.remove('hidden');
        if (showListBtn) showListBtn.classList.remove('visible');
        localStorage.setItem('todoHidden', 'false');
    });
    // Check if todo list was hidden
    if (localStorage.getItem('todoHidden') === 'true') {
        if (todoContainer) todoContainer.classList.add('hidden');
        if (showListBtn) showListBtn.classList.add('visible');
    }
    // Save tasks to local storage
    function saveTasksToLocalStorage() {
        const tasks = Array.from(taskList.querySelectorAll('.task-item')).map(item => {
            const text = item.querySelector('.task-text').textContent;
            let status = "";
            const circle = item.querySelector('.task-circle');
            if (circle.classList.contains('in-progress')) {
                status = "in-progress";
            } else if (circle.classList.contains('completed')) {
                status = "completed";
            }
            return { text, status };
        });
        localStorage.setItem('analogTasks', JSON.stringify(tasks));
        updateGoalFromTodo();
    }
    // Download functionality
    if (downloadBtn) downloadBtn.addEventListener('click', function() {
        // Clone the container to avoid modifying the original
        const container = document.querySelector('.todo-container');
        const containerClone = container ? container.cloneNode(true) : null;
        if (!containerClone) return;
        // Hide buttons in the clone
        const actionButtons = containerClone.querySelector('#action-buttons');
        if (actionButtons) actionButtons.style.display = 'none';
        // Remove empty items in the clone
        const emptyItems = Array.from(containerClone.querySelectorAll('.task-item')).filter(item => 
            item.querySelector('.task-text').textContent.trim() === '');
        emptyItems.forEach(item => item.remove());
        // Create a new div with just the required content
        const downloadDiv = document.createElement('div');
        downloadDiv.style.backgroundColor = 'white';
        downloadDiv.style.padding = '20px';
        downloadDiv.style.borderRadius = '8px';
        downloadDiv.style.position = 'fixed';
        downloadDiv.style.left = '-9999px';
        downloadDiv.style.top = '-9999px';
        // Set fixed width for consistent image size
        containerClone.style.width = '500px';
        containerClone.style.minHeight = '300px';
        // Apply invert filter to the clone
        containerClone.style.filter = 'invert(1) hue-rotate(180deg)';
        downloadDiv.appendChild(containerClone);
        // Add to body temporarily
        document.body.appendChild(downloadDiv);
        // Handle the in-progress circles properly for the download
        const inProgressCircles = downloadDiv.querySelectorAll('.task-circle.in-progress');
        inProgressCircles.forEach(circle => {
            circle.classList.remove('in-progress');
            const halfFill = document.createElement('div');
            halfFill.style.position = 'absolute';
            halfFill.style.width = '50%';
            halfFill.style.height = '100%';
            halfFill.style.backgroundColor = '#333';
            halfFill.style.right = '0';
            halfFill.style.top = '0';
            circle.appendChild(halfFill);
        });
        // Use html2canvas with proper options
        if (window.html2canvas) {
          html2canvas(containerClone, {
              backgroundColor: 'white',
              scale: 2, // Higher quality
              logging: false,
              useCORS: true,
              removeContainer: true,
              width: 500, // Fixed width
              height: null, // Auto height based on content
              onclone: (clonedDoc) => {
                  const clonedButtons = clonedDoc.querySelector('#action-buttons');
                  if (clonedButtons) clonedButtons.remove();
                  // Also apply the filter to the cloned element in the DOM used by html2canvas
                  const clonedTodo = clonedDoc.querySelector('.todo-container');
                  if (clonedTodo) clonedTodo.style.filter = 'invert(1) hue-rotate(180deg)';
              }
          }).then(canvas => {
              const link = document.createElement('a');
              const today = new Date();
              const dayNumber = today.getDate();
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const monthAbbr = months[today.getMonth()];
              const year = today.getFullYear();
              link.download = `todo-${dayNumber}-${monthAbbr}-${year}.png`;
              link.href = canvas.toDataURL("image/png");
              link.click();
              // Clean up
              document.body.removeChild(downloadDiv);
          });
        }
    });
});
  
// Helper: Update timer goal from top in-progress todo
function updateGoalFromTodo() {
  const taskList = document.getElementById('task-list');
  const goalDiv = document.getElementById('current-goal');
  if (!taskList || !goalDiv) return;
  const inProgress = Array.from(taskList.querySelectorAll('.task-item')).find(
    li => li.querySelector('.task-circle').classList.contains('in-progress') &&
          li.querySelector('.task-text').textContent.trim() !== ''
  );
  if (inProgress) {
    const text = inProgress.querySelector('.task-text').textContent.trim();
    goalDiv.textContent = text;
    goalDiv.style.color = '#fff';
    goalDiv.setAttribute('data-auto', 'true');
  } else if (goalDiv.getAttribute('data-auto') === 'true') {
    // If previously auto-set, reset to placeholder
    goalDiv.textContent = 'Goal for This Session?';
    goalDiv.style.color = '#bdbdbd';
    goalDiv.removeAttribute('data-auto');
  }
}
  
// 1. Add a timer label element above the timer display (if not present, create it dynamically):
let timerLabelEl = document.getElementById('timer-label');
if (!timerLabelEl) {
  timerLabelEl = document.createElement('div');
  timerLabelEl.id = 'timer-label';
  timerLabelEl.className = 'timer-label';
  timerDisplay.insertBefore(timerLabelEl, timerDisplay.firstChild);
}

// 3. Sync timer to settings form when timer changes (after finishEditing):
function syncTimerToSettings() {
    const t = state.timer;
    
    // Update timer settings form inputs
    const focusInput = document.getElementById('focus-time-input');
    const breakInput = document.getElementById('break-time-input');
    const longBreakInput = document.getElementById('long-break-time-input');
    const cyclesInput = document.getElementById('cycles-input');
    const sleepInput = document.getElementById('sleep-time-input');
    
    if (focusInput) focusInput.value = Math.floor((parseInt(localStorage.getItem('pomodoroFocusDuration'), 10) || 25 * 60) / 60);
    if (breakInput) breakInput.value = Math.floor((parseInt(localStorage.getItem('pomodoroBreakDuration'), 10) || 5 * 60) / 60);
    if (longBreakInput) longBreakInput.value = Math.floor((parseInt(localStorage.getItem('pomodoroLongBreakDuration'), 10) || 15 * 60) / 60);
    if (cyclesInput) cyclesInput.value = parseInt(localStorage.getItem('pomodoroCycles'), 10) || 4;
    if (sleepInput) sleepInput.value = Math.floor((parseInt(localStorage.getItem('sleepTimerDuration'), 10) || 30 * 60) / 60);
    
    // Update timer state based on current type and mode
    if (t.timerType === 'pomodoro') {
        const focusDuration = parseInt(localStorage.getItem('pomodoroFocusDuration'), 10) || 25 * 60;
        const breakDuration = parseInt(localStorage.getItem('pomodoroBreakDuration'), 10) || 5 * 60;
        const longBreakDuration = parseInt(localStorage.getItem('pomodoroLongBreakDuration'), 10) || 15 * 60;
        const cycles = parseInt(localStorage.getItem('pomodoroCycles'), 10) || 4;
        
        t.pomodoroCycles = cycles;
        
        if (t.mode === 'focus') {
            t.timeLeft = focusDuration;
            t.totalTime = focusDuration;
        } else if (t.mode === 'break') {
            t.timeLeft = breakDuration;
            t.totalTime = breakDuration;
        } else if (t.mode === 'longbreak') {
            t.timeLeft = longBreakDuration;
            t.totalTime = longBreakDuration;
        }
    } else if (t.timerType === 'simple') {
        const simpleDuration = parseInt(localStorage.getItem('simpleTimerDuration'), 10) || 25 * 60;
        t.timeLeft = simpleDuration;
        t.totalTime = simpleDuration;
    } else if (t.timerType === 'sleep') {
        const sleepDuration = parseInt(localStorage.getItem('sleepTimerDuration'), 10) || 30 * 60;
        t.timeLeft = sleepDuration;
        t.totalTime = sleepDuration;
    }
    
    updateDisplay();
    updatePomodoroDots();
}
  
// --- Fetch Tones from Supabase ---
async function getTonesFromSupabase() {
  const { data, error } = await supabase
    .from('tone')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching tones from Supabase:', error);
    return [];
  }
  return data;
}

// Initialize tones
let tones = [];

// Load tones and populate timer sound dropdown
async function loadTonesAndPopulateDropdown() {
    try {
        tones = await getTonesFromSupabase(); // assign to global
        if (tones && tones.length > 0) {
            timerSoundSelect = document.getElementById('timer-sound-select');
            if (timerSoundSelect) {
                timerSoundSelect.innerHTML = '';
                const defaultOption = document.createElement('option');
                defaultOption.value = 'chime';
                defaultOption.textContent = 'Chime';
                timerSoundSelect.appendChild(defaultOption);
                tones.forEach(tone => {
                    const option = document.createElement('option');
                    option.value = tone.id;
                    option.textContent = tone.name;
                    timerSoundSelect.appendChild(option);
                });
                const savedType = localStorage.getItem('timerSoundType') || 'chime';
                timerSoundSelect.value = savedType;
            }
            // Add preview buttons for each timer mode
            const previewContainerId = 'timer-sound-preview-container';
            let previewContainer = document.getElementById(previewContainerId);
            if (!previewContainer) {
                previewContainer = document.createElement('div');
                previewContainer.id = previewContainerId;
                previewContainer.style.display = 'flex';
                previewContainer.style.gap = '8px';
                previewContainer.style.marginTop = '8px';
                const selectCell = document.getElementById('timer-sound-select-cell');
                if (selectCell) selectCell.appendChild(previewContainer);
            } else {
                previewContainer.innerHTML = '';
            }
            const modes = [
                { key: 'focus', label: 'Focus' },
                { key: 'short_break', label: 'Short Break' },
                { key: 'long_break', label: 'Long Break' },
                { key: 'sleep', label: 'Sleep' },
                { key: 'countdown', label: 'Countdown' },
            ];
            modes.forEach(mode => {
                const btn = document.createElement('button');
                btn.textContent = `Preview ${mode.label}`;
                btn.className = 'preview-btn';
                btn.style.fontSize = '13px';
                btn.style.padding = '4px 10px';
                btn.addEventListener('click', () => {
                    let selectedTone = null;
                    if (timerSoundSelect.value === 'chime') {
                        chimeAudio.currentTime = 0;
                        chimeAudio.play();
                        return;
                    } else {
                        selectedTone = tones.find(t => t.id === timerSoundSelect.value);
                    }
                    if (!selectedTone) {
                        showToast('No preset selected.', 'error');
                        return;
                    }
                    let url = null;
                    if (mode.key === 'focus') url = selectedTone.focus_timer_url;
                    else if (mode.key === 'short_break') url = selectedTone.short_break_url;
                    else if (mode.key === 'long_break') url = selectedTone.long_break_url;
                    else if (mode.key === 'sleep') url = selectedTone.sleep_timer_url;
                    else if (mode.key === 'countdown') url = selectedTone.countdown_timer_url;
                    if (url) {
                        const audio = new Audio(url);
                        audio.play();
                    } else {
                        showToast(`No sound set for ${mode.label} in this preset.`, 'info');
                    }
                });
                previewContainer.appendChild(btn);
            });
        }
    } catch (error) {
        console.error('Error loading tones:', error);
    }
}

// Call this after DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadTonesAndPopulateDropdown);
} else {
  loadTonesAndPopulateDropdown();
}

// Update timer end logic to play selected tone
// Find the timer end logic and update:
// ... existing code ...
// In toggleTimer override, replace chimeAudio logic:
// ... existing code ...
function playTimerEndSound() {
  if (timerSoundToggle && timerSoundToggle.checked) {
    if (timerSoundSelect) {
      if (timerSoundSelect.value === 'chime') {
        chimeAudio.currentTime = 0;
        chimeAudio.play();
      } else {
        const selectedTone = tones.find(t => t.id === timerSoundSelect.value);
        const t = state.timer;
        // Debug logs
        console.log('tones:', tones);
        console.log('Selected value:', timerSoundSelect.value);
        console.log('Selected tone:', selectedTone);
        console.log('Timer type:', t.timerType, 'Mode:', t.mode);
        let url = null;
        if (selectedTone) {
          if (t.timerType === 'pomodoro') {
            if (t.mode === 'focus') url = selectedTone.focus_timer_url;
            else if (t.mode === 'break') {
              if (t.currentCycle === t.pomodoroCycles) {
                url = selectedTone.cycle_complete_url;
              } else {
                url = selectedTone.short_break_url;
              }
            } else if (t.mode === 'longbreak') url = selectedTone.long_break_url;
          } else if (t.timerType === 'sleep') {
            url = selectedTone.sleep_timer_url;
          } else if (t.timerType === 'countdown' || t.timerType === 'simple') {
            url = selectedTone.countdown_timer_url;
          }
        }
        console.log('URL to play:', url);
        if (url) {
          const toneAudio = new Audio(url);
          toneAudio.play();
        } else {
          chimeAudio.currentTime = 0;
          chimeAudio.play();
          showToast('No sound set for this timer mode. Using default chime.', 'info');
        }
      }
    }
  }
}
// ... existing code ...

function createPomodoroDots() {
    const dotsContainer = document.querySelector('.pomodoro-dots');
    if (!dotsContainer) return;
    
    // Clear existing dots
    dotsContainer.innerHTML = '';
    
    const t = state.timer;
    const totalCycles = t.pomodoroCycles || 4;
    
    // Create dots
    for (let i = 0; i < totalCycles; i++) {
        const dot = document.createElement('div');
        dot.className = 'pomodoro-dot';
        
        // Set dot state based on current cycle
        if (i < t.currentCycle - 1) {
            dot.classList.add('completed');
        } else if (i === t.currentCycle - 1 && t.mode === 'focus') {
            dot.classList.add('active');
        }
        
        dotsContainer.appendChild(dot);
    }
    
    // Update container width based on number of dots
    const dotWidth = 8; // Width of each dot in pixels
    const dotMargin = 4; // Margin between dots in pixels
    const totalWidth = (dotWidth + dotMargin) * totalCycles - dotMargin;
    dotsContainer.style.width = `${totalWidth}px`;
    
    // Center the dots container
    dotsContainer.style.margin = '0 auto';
}

function updatePomodoroDots() {
  const dotsContainer = document.querySelector('.pomodoro-dots');
  if (!dotsContainer) return;

  const dots = dotsContainer.querySelectorAll('.pomodoro-dot');
  const currentCycle = state.timer.currentCycle;
  const isFocusComplete = state.timer.mode === 'break' || state.timer.mode === 'longbreak';
  
  console.log('Updating dots:', {
    currentCycle,
    totalCycles: state.timer.pomodoroCycles,
    isFocusComplete,
    mode: state.timer.mode
  });

  dots.forEach((dot, index) => {
    if (index < currentCycle - 1) {
      // Completed cycles
      dot.style.background = 'rgba(255, 255, 255, 0.8)';
      dot.style.border = '2px solid rgba(255, 255, 255, 0.3)';
    } else if (index === currentCycle - 1) {
      // Current cycle
      if (isFocusComplete) {
        dot.style.background = 'rgba(255, 255, 255, 0.8)';
        dot.style.border = '2px solid rgba(255, 255, 255, 0.3)';
      } else {
        dot.style.background = 'rgba(255, 255, 255, 0.5)';
        dot.style.border = '2px solid rgba(255, 255, 255, 0.2)';
      }
    } else {
      // Future cycles
      dot.style.background = 'rgba(255, 255, 255, 0.2)';
      dot.style.border = '2px solid rgba(255, 255, 255, 0.1)';
    }
  });
}

// Update the toggleTimer function to properly handle cycle transitions
function toggleTimer() {
  const t = state.timer;
  if (t.isRunning) {
    clearInterval(t.timer);
    t.timer = null; // Clear reference
    t.isRunning = false;
    endSession(); // End session when timer is stopped
    updatePlayButton();
  } else {
    if (t.timer) {
      clearInterval(t.timer); // Safety check
      t.timer = null;
    }
    if (t.isEditing) {
      finishEditing();
    }
    t.isRunning = true;
    startSession(t.mode); // Start session when timer is started
    updatePlayButton();
    const startTime = Date.now();
    t.timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      if (t.timerType === 'endless') {
        t.elapsedTime += 1;
        updateDisplay();
      } else {
        t.timeLeft = Math.max(0, t.totalTime - elapsed);
        updateDisplay();
        if (t.timeLeft <= 0) {
          clearInterval(t.timer);
          t.timer = null;
          t.isRunning = false;
          playTimerEndSound();
          
          if (t.timerType === 'pomodoro') {
            console.log('Timer ended:', {
              mode: t.mode,
              currentCycle: t.currentCycle,
              totalCycles: t.pomodoroCycles
            });
            
            if (t.mode === 'focus') {
              // Completed a focus session
              if (t.currentCycle < t.pomodoroCycles) {
                // More cycles remain - start short break
                console.log('Moving to short break');
                toggleMode('break');
              } else {
                // All cycles complete - start long break and reset
                console.log('Moving to long break');
                t.currentCycle = 1; // Reset for next round
                saveCurrentCycle();
                toggleMode('longbreak');
              }
            } else if (t.mode === 'break') {
              // Completed a short break
              if (t.currentCycle < t.pomodoroCycles) {
                // Move to next focus session
                console.log('Incrementing cycle and moving to focus');
                t.currentCycle++;
                saveCurrentCycle();
                toggleMode('focus');
              } else {
                // This shouldn't happen with correct logic
                console.log('All cycles complete, moving to long break');
                toggleMode('longbreak');
              }
            } else if (t.mode === 'longbreak') {
              // Completed long break - start new round
              console.log('Starting new round');
              t.currentCycle = 1;
              saveCurrentCycle();
              toggleMode('focus');
            }
          }
          updatePlayButton();
        }
      }
    }, 1000);
  }
}

// Update the changeTimerType function to properly initialize Pomodoro mode
function changeTimerType(newType) {
  const t = state.timer;
  if (newType === t.timerType) return;
  
  // End session when timer type changes
  if (stats.currentSessionStart) {
    const sessionDuration = Math.floor((new Date() - stats.currentSessionStart) / 1000 / 60);
    updateStats(sessionDuration, t.mode);
    stats.currentSessionStart = null;
    stats.currentSessionType = null;
    stats.totalSessions++;
  }
  
  t.timerType = newType;
  
  // Reset timer state
  clearInterval(t.timer);
  t.isRunning = false;
  t.isEditing = false;
  t.elapsedTime = 0;
  
  // Set default times based on type
  if (newType === 'pomodoro') {
    modeSwitcher.classList.remove('hidden');
    t.mode = 'focus';
    t.currentCycle = 1;
    
    // Initialize Pomodoro dots
    const dotsContainer = document.querySelector('.pomodoro-dots');
    if (dotsContainer) {
      dotsContainer.remove();
    }
    const newDotsContainer = createPomodoroDots();
    if (timerDisplay && timerDisplay.parentElement) {
      timerDisplay.parentElement.appendChild(newDotsContainer);
    }
    
    // Sync with settings
    syncTimerToSettings();
    updatePomodoroDots();
  } else {
    modeSwitcher.classList.add('hidden');
    if (newType === 'simple') {
      const simpleDuration = parseInt(localStorage.getItem('simpleTimerDuration'), 10) || 25;
      t.timeLeft = simpleDuration * 60;
      t.totalTime = t.timeLeft;
    } else if (newType === 'endless') {
      t.timeLeft = 0;
      t.totalTime = 0;
    } else if (newType === 'sleep') {
      const sleepDuration = parseInt(localStorage.getItem('sleepTimerDuration'), 10) || 30;
      t.timeLeft = sleepDuration * 60;
      t.totalTime = t.timeLeft;
    }
    
    // Remove Pomodoro dots if they exist
    const dotsContainer = document.querySelector('.pomodoro-dots');
    if (dotsContainer) {
      dotsContainer.remove();
    }
  }
  
  // ... rest of the function remains the same ...
}
// ... existing code ...
  
// Helper function to save current cycle state
function saveCurrentCycle() {
  localStorage.setItem('pomodoroCurrentCycle', state.timer.currentCycle);
}
  
function stopMixSound(soundId) {
  if (state.mixAudios[soundId]) {
    state.mixAudios[soundId].pause();
    state.mixAudios[soundId] = null;
    delete state.mixAudios[soundId];
  }
}

function playMixSound(sound) {
  // Stop any existing instance of this sound
  stopMixSound(sound.id);
  
  // Create new audio instance
  const audio = new Audio(sound.url);
  state.mixAudios[sound.id] = audio;
  
  // Add cleanup on end
  audio.onended = () => {
    stopMixSound(sound.id);
  };
  
  // Play with error handling
  audio.play().catch(e => {
    console.error('Mix sound error:', e);
    stopMixSound(sound.id);
  });
}

// Add cleanup on page unload
window.addEventListener('beforeunload', () => {
  // Stop all active audio
  Object.keys(state.mixAudios).forEach(soundId => {
    stopMixSound(soundId);
  });
  if (state.sessionStartTime) {
    endSession(); // Save any incomplete session
  }
});
  
function switchTimerType(type) {
    const t = state.timer;
    const oldType = t.timerType;
    
    // Stop current timer if running
    if (t.isRunning) {
        toggleTimer();
    }
    
    // Reset timer state
    t.timerType = type;
    t.mode = 'focus';
    t.currentCycle = 1;
    
    // Load appropriate duration based on timer type
    if (type === 'pomodoro') {
        const focusDuration = parseInt(localStorage.getItem('pomodoroFocusDuration'), 10) || 25 * 60;
        t.timeLeft = focusDuration;
        t.totalTime = focusDuration;
        t.pomodoroCycles = parseInt(localStorage.getItem('pomodoroCycles'), 10) || 4;
    } else if (type === 'simple') {
        const simpleDuration = parseInt(localStorage.getItem('simpleTimerDuration'), 10) || 25 * 60;
        t.timeLeft = simpleDuration;
        t.totalTime = simpleDuration;
    } else if (type === 'sleep') {
        const sleepDuration = parseInt(localStorage.getItem('sleepTimerDuration'), 10) || 30 * 60;
        t.timeLeft = sleepDuration;
        t.totalTime = sleepDuration;
    }
    
    // Update UI
    document.querySelectorAll('.timer-type-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === type) {
            btn.classList.add('active');
        }
    });
    
    // Show/hide appropriate UI elements
    const pomodoroDots = document.querySelector('.pomodoro-dots');
    if (pomodoroDots) {
        pomodoroDots.style.display = type === 'pomodoro' ? 'flex' : 'none';
    }
    
    // Update display and dots
    updateDisplay();
    updatePomodoroDots();
    
    // Save current timer type
    localStorage.setItem('currentTimerType', type);
    
    console.log(`Switched timer type from ${oldType} to ${type}`);
}
  
// Add CSS for Pomodoro dots
const style = document.createElement('style');
style.textContent = `
.pomodoro-dots {
    display: flex;
    justify-content: center;
    gap: 4px;
    margin: 10px auto;
}

.pomodoro-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    border: 2px solid rgba(255, 255, 255, 0.1);
}

.pomodoro-dot.completed {
    background: rgba(255, 255, 255, 0.8);
    border-color: rgba(255, 255, 255, 0.9);
}

.pomodoro-dot.active {
    background: rgba(255, 255, 255, 1);
    border-color: rgba(255, 255, 255, 1);
    transform: scale(1.2);
}
`;
document.head.appendChild(style);
  
document.getElementById('videoForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const videoUrl = document.getElementById('videoUrl').value;
    const views = parseInt(document.getElementById('views').value) || 1;
    const videoId = extractVideoId(videoUrl);
    const videoGrid = document.getElementById('videoGrid');
    
    if (!videoId) {
        alert('Invalid YouTube URL. Please enter a valid YouTube video URL.');
        return;
    }
    
    if (views < 1 || views > 100) {
        alert('Please enter a number of views between 1 and 100.');
        return;
    }

    videoGrid.innerHTML = '';
    const batchSize = 50;
    const totalBatches = Math.ceil(views / batchSize);
    
    function renderBatch(batchIndex) {
        if (batchIndex >= totalBatches) return;
        
        const start = batchIndex * batchSize;
        const end = Math.min(start + batchSize, views);
        
        for (let i = start; i < end; i++) {
            const box = document.createElement('div');
            box.className = 'video-box';
            box.innerHTML = `
                <iframe 
                    src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&enablejsapi=1&controls=1&rel=0&loop=1&playlist=${videoId}&playsinline=1&disablekb=1&modestbranding=1&origin=${window.location.origin}" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; background-play" 
                    allowfullscreen 
                    frameborder="0"
                    loading="lazy"
                    id="youtube-player-${i}"
                ></iframe>
            `;
            videoGrid.appendChild(box);
        }
        

        if (batchIndex < totalBatches - 1) {
            setTimeout(() => renderBatch(batchIndex + 1), 50);
        } else {

            setTimeout(checkVideoPlayback, 500);
        }
    }
    

    renderBatch(0);
});

function extractVideoId(url) {
    if (!url) return null;
    let videoId = null;
    const regexWatch = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\/?]+)/;
    const matchWatch = url.match(regexWatch);
    
    if (matchWatch) {
        videoId = matchWatch[1];
    } else {
        const regexShort = /youtu\.be\/([^&\/?]+)/;
        const matchShort = url.match(regexShort);
        
        if (matchShort) {
            videoId = matchShort[1];
        } else {
            const regexEmbed = /youtube\.com\/embed\/([^&\/?]+)/;
            const matchEmbed = url.match(regexEmbed);
            
            if (matchEmbed) {
                videoId = matchEmbed[1];
            }
        }
    }
    
    return videoId;
}

function loadYoutubeAPI() {
    if (window.YT) return; 
    
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

window.onYouTubeIframeAPIReady = function() {
    console.log("YouTube API Ready");
    ensureVideosArePlaying();
};

loadYoutubeAPI();

function checkVideoPlayback() {
    ensureVideosArePlaying();
}

let players = [];

function ensureVideosArePlaying() {
    const iframes = document.querySelectorAll('iframe');
    
    iframes.forEach((iframe, index) => {
        try {
            if (!players[index] && iframe.contentWindow) {
                players[index] = {
                    iframe: iframe,
                    contentWindow: iframe.contentWindow
                };
            }
            
            if (players[index] && players[index].contentWindow) {
                players[index].contentWindow.postMessage(JSON.stringify({
                    event: 'command',
                    func: 'playVideo',
                    args: []
                }), '*');
            }
        } catch (e) {
            console.log('Error controlling video:', e);
        }
    });
}

function forceVideoPlayback() {
    ensureVideosArePlaying();
    
    const currentTime = Date.now();
    if (!window.lastFullRefresh || currentTime - window.lastFullRefresh > 30000) {
        const iframes = document.querySelectorAll('iframe');
        
        iframes.forEach(iframe => {
            try {
                let src = iframe.src;
                if (src.includes('&_t=')) {
                    if (!src.includes('autoplay=1')) {
                        src = src.replace(/autoplay=0/g, 'autoplay=1');
                        iframe.src = src;
                    }
                } else {
                    src += '&autoplay=1';
                    iframe.src = src;
                }
            } catch (e) {
                console.log('Unable to update video:', e);
            }
        });
        
        window.lastFullRefresh = currentTime;
    }
}

let isPageHidden = false;
let playbackInterval;

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        isPageHidden = true;
        startBackgroundPlaybackMonitor();
    } else {
        isPageHidden = false;
        checkVideoPlayback();
        if (playbackInterval) {
            clearInterval(playbackInterval);
            playbackInterval = null;
        }
    }
});

function startBackgroundPlaybackMonitor() {
    if (playbackInterval) {
        clearInterval(playbackInterval);
    }
    
    playbackInterval = setInterval(() => {
        if (isPageHidden) {
            forceVideoPlayback();
        } else {
            clearInterval(playbackInterval);
            playbackInterval = null;
        }
    }, 30000); 
}

function keepAlive() {
    let counter = 0;
    setInterval(() => {
        counter++;
        if (counter % 30 === 0 && isPageHidden) {
            ensureVideosArePlaying(); 
        }
    }, 1000);
}

keepAlive();

const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
            setTimeout(checkVideoPlayback, 500);
        }
    });
});

observer.observe(document.getElementById('videoGrid'), { 
    childList: true,
    subtree: true 
});

window.addEventListener('beforeunload', function(e) {
    if (document.querySelectorAll('iframe').length > 0) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
});
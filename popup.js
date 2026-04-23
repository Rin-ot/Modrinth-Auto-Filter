const CACHE_KEY = 'modrinth_versions_cache_v2';
const CACHE_TIME = 24 * 60 * 60 * 1000;

async function fetchVersions() {
    return new Promise((resolve) => {
        chrome.storage.local.get([CACHE_KEY], async (res) => {
            const cache = res[CACHE_KEY];
            const now = Date.now();
            if (cache && cache.timestamp && (now - cache.timestamp < CACHE_TIME)) {
                resolve(cache.data);
                return;
            }
            try {
                const response = await fetch('https://api.modrinth.com/v2/tag/game_version');
                const data = await response.json();
                const versionsData = data.map(v => ({
                    version: v.version,
                    type: v.version_type
                }));
                chrome.storage.local.set({
                    [CACHE_KEY]: {
                        timestamp: now,
                        data: versionsData
                    }
                });
                resolve(versionsData);
            } catch (error) {
                console.error('Failed to fetch versions:', error);
                resolve(cache ? cache.data : []);
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const versionSelect = document.getElementById('version');
    const platformSelect = document.getElementById('platform');
    const channelSelect = document.getElementById('channel');
    const isEnabledCheck = document.getElementById('isEnabled');
    const saveBtn = document.getElementById('saveBtn');
    const statusDiv = document.getElementById('status');
    const allVersions = await fetchVersions();
    const renderVersions = (channel) => {
        versionSelect.innerHTML = '<option value="">(指定なし)</option>';
        const filtered = allVersions.filter(v => v.type === channel);
        filtered.forEach(v => {
            const option = document.createElement('option');
            option.value = v.version;
            option.textContent = v.version;
            versionSelect.appendChild(option);
        });
    };

    chrome.storage.sync.get({
        mcVersion: '',
        mcPlatform: '',
        mcChannel: 'release',
        isEnabled: true
    }, (items) => {
        platformSelect.value = items.mcPlatform;
        channelSelect.value = items.mcChannel;
        isEnabledCheck.checked = items.isEnabled;
        renderVersions(items.mcChannel);
        versionSelect.value = items.mcVersion;
    });

    channelSelect.addEventListener('change', (e) => {
        renderVersions(e.target.value);
        versionSelect.value = '';
    });

    saveBtn.addEventListener('click', () => {
        const mcVersion = versionSelect.value;
        const mcPlatform = platformSelect.value;
        const mcChannel = channelSelect.value;
        const isEnabled = isEnabledCheck.checked;

        chrome.storage.sync.set({
            mcVersion,
            mcPlatform,
            mcChannel,
            isEnabled
        }, () => {
            statusDiv.textContent = '保存しました';
            setTimeout(() => {
                statusDiv.textContent = '';
            }, 2000);
        });
    });
});
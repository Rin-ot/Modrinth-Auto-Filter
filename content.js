let lastUrl = location.href;

const applyFilters = () => {
    const url = new URL(location.href);
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 3 && pathParts[pathParts.length - 1] === 'versions') {
        if (!url.searchParams.has('g') && !url.searchParams.has('l')) {
            chrome.storage.sync.get({
                mcVersion: '',
                mcPlatform: '',
                isEnabled: true
            }, (settings) => {
                if (!settings.isEnabled) return;
                if (!settings.mcVersion && !settings.mcPlatform) return;
                let needsRedirect = false;
                if (settings.mcVersion) {
                    url.searchParams.set('g', settings.mcVersion);
                    needsRedirect = true;
                }
                if (settings.mcPlatform) {
                    url.searchParams.set('l', settings.mcPlatform);
                    needsRedirect = true;
                }
                if (needsRedirect) {
                    window.location.replace(url.toString());
                }
            });
        }
    }
};

const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        applyFilters();
    }
});

observer.observe(document.body, { childList: true, subtree: true });
applyFilters();
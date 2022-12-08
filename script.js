document.getElementById("watch-history-file").addEventListener("change", (event) => {
    var file = event.target.files[0];
    generateReport(file);
});

function generateReport(file) {
    loadFile(file);
}

function loadFile(file) {
    var reader = new FileReader();

    reader.onload = function () {
        console.log("File loaded successfully. Size: " + reader.result.length / 1024.0 + " KB");
        getVideoList(reader.result)
    };

    reader.onerror = function () {
        console.log("Some error occured while loading file.");
    }

    reader.readAsText(file);
}

function getVideoList(fileValue) {
    console.log("Parsing file contents. Size: " + fileValue.length / 1024.0 + " KB");

    var parser = new DOMParser();
    var parsedValue = parser.parseFromString(fileValue, 'text/html');

    var body = parsedValue.getElementsByTagName("body");

    var rootDiv = getDivNode(body[0].childNodes).childNodes
    var videoList = Array.from(rootDiv).filter(node => node.nodeName == "DIV");
    console.log("Total videos: " + videoList.length);

    processList(videoList);
}

function getDivNode(childNodes) {
    for (var node of childNodes) {
        if (node.tagName == 'DIV')
            return node;
    }
    return null;
}

function printProgress(total, current) {
    var progress = document.getElementById("status-msg");
    progress.innerHTML = "Processing " + current + "/" + total + " records..."

    if (total == current) {
        progress.innerHTML = "";
    }
}

function processList(videoList) {
    var videoViewsMap = new Map();
    var videoNameMap = new Map();

    var channelViewsMap = new Map();
    var channelNameMap = new Map();

    var ads = 0;

    for (var i = 0; i < videoList.length; ++i) {
        printProgress(videoList.length, i + 1);

        if (videoList[i].innerText.indexOf("From Google Ads") != -1) {
            ++ads;
            continue;
        }

        var video = getVideo(videoList[i].getElementsByTagName("a"));

        if (video != null) {
            var videoUrl = video.href;
            var videoTitle = video.innerText;

            videoNameMap.set(videoUrl, videoTitle);
            videoViewsMap.set(videoUrl, videoViewsMap.get(videoUrl) + 1 || 1);
        }

        var channel = getChannel(videoList[i].getElementsByTagName("a"));

        if (channel != null) {
            var channelUrl = channel.href;
            var channelTitle = channel.innerText;

            channelNameMap.set(channelUrl, channelTitle);
            channelViewsMap.set(channelUrl, channelViewsMap.get(channelUrl) + 1 || 1);
        }
    }

    console.log("Total ads: " + ads);

    if (videoViewsMap.size == 0) {
        var progress = document.getElementById("status-msg");
        progress.innerHTML = "Watch history is empty :("
        return;
    }

    renderSummary(channelNameMap.size, videoNameMap.size, ads);

    var sortedVideoViewsMap = new Map([...videoViewsMap.entries()].sort((a, b) => b[1] - a[1]));
    renderTopVideos(videoNameMap, sortedVideoViewsMap);

    var sortedChannelViewsMap = new Map([...channelViewsMap.entries()].sort((a, b) => b[1] - a[1]));
    renderTopChannels(channelNameMap, sortedChannelViewsMap);
}

function getVideo(links) {
    for (var link of links) {
        if (link.pathname == "/watch")
            return link;
    }
    return null;
}

function getChannel(links) {
    for (var link of links) {
        if (link.pathname.startsWith("/channel/"))
            return link;
    }
    return null;
}

function renderSummary(channels, videos, ads) {
    summary = document.getElementsByClassName("channel-summary")[0];
    summary.innerHTML = "<h4>Explored " + channels + " channels</h4>";

    summary = document.getElementsByClassName("video-summary")[0];
    summary.innerHTML = "<h4>Watched " + videos + " videos</h4>";

    summary = document.getElementsByClassName("ad-summary")[0];
    summary.innerHTML = "<h4>Skipped " + ads + " ads</h4>";
}

function renderTableRow(table, column1, column2, isHeading) {
    newRow = document.createElement("tr");

    newCell = document.createElement(isHeading ? "th" : "td");
    newCell.textContent = column1
    newRow.appendChild(newCell);

    newCell = document.createElement(isHeading ? "th" : "td");
    newCell.textContent = column2
    newRow.appendChild(newCell);

    table.appendChild(newRow);
}

function renderTopVideos(nameMap, sortedViewsMap) {
    var tableBody = document.getElementById("top-videos");

    var sortedViewsArray = Array.from(sortedViewsMap, ([url, views]) => ({ url, views }));

    renderTableRow(tableBody, "Video", "Views", true)

    for (var i = 0; i < sortedViewsArray.length && i < 25; ++i) {
        renderTableRow(tableBody, nameMap.get(sortedViewsArray[i].url), sortedViewsArray[i].views, false)
    }
}

function renderTopChannels(nameMap, sortedViewsMap) {
    var tableBody = document.getElementById("top-channels");

    var sortedViewsArray = Array.from(sortedViewsMap, ([url, views]) => ({ url, views }));

    renderTableRow(tableBody, "Channel", "Views", true)

    for (var i = 0; i < sortedViewsArray.length && i < 25; ++i) {
        renderTableRow(tableBody, nameMap.get(sortedViewsArray[i].url), sortedViewsArray[i].views, false)
    }
}
/* =====================================================
   COSMIC TRACE — LIVE NASA DATA
   APOD + Near-Earth Objects + NASA Image Library
===================================================== */

(() => {
    "use strict";

    const NASA = {
        apod: "https://science.nasa.gov/wp-json/wp/v2/apod-basic/",
        neo: "https://api.nasa.gov/neo/rest/v1/feed",
        images: "https://images-api.nasa.gov/search",
        apiKey: "mCnMWHfWGzpfwz6dbh9KKBLhmjcjKN8NJBLMkHCK",
        donki: "https://ccmc.gsfc.nasa.gov/DONKI-API/get",
    };

    // Create the NASA Explorer interface.
    const panel = document.createElement("section");
    panel.id = "cosmic-nasa-panel";

    const style = document.createElement("style");
    style.textContent = `
        #cosmic-nasa-panel {
            position: fixed;
            z-index: 30;
            left: 20px;
            bottom: 20px;
            width: min(390px, calc(100vw - 40px));
            max-height: 75vh;
            overflow-y: auto;
            padding: 18px;
            color: #eaf1ff;
            background: rgba(5, 10, 25, .94);
            border: 1px solid rgba(100, 160, 255, .35);
            border-radius: 16px;
            box-shadow: 0 12px 45px rgba(0,0,0,.4);
            backdrop-filter: blur(16px);
            font-family: Arial, sans-serif;
        }

        #cosmic-nasa-panel h2 {
            margin: 0 0 5px;
            font-size: 17px;
            letter-spacing: 2px;
        }

        #cosmic-nasa-panel .nasa-subtitle {
            color: #8fa9d4;
            font-size: 11px;
            margin-bottom: 14px;
        }

        #cosmic-nasa-panel .nasa-tabs {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 14px;
        }

        #cosmic-nasa-panel button {
            cursor: pointer;
            color: #eaf1ff;
            background: #152544;
            border: 1px solid #34527e;
            border-radius: 7px;
            padding: 8px 10px;
        }

        #cosmic-nasa-panel button:hover {
            background: #254575;
        }

        #cosmic-nasa-panel input {
            width: 100%;
            padding: 10px;
            color: white;
            background: #101b32;
            border: 1px solid #34527e;
            border-radius: 7px;
            margin: 8px 0;
        }

        #cosmic-nasa-panel img {
            display: block;
            width: 100%;
            max-height: 190px;
            object-fit: cover;
            border-radius: 9px;
            margin: 10px 0;
        }

        #cosmic-nasa-panel p {
            color: #b8c7e2;
            font-size: 12px;
            line-height: 1.6;
        }

        #cosmic-nasa-panel .nasa-result {
            padding: 10px 0;
            border-top: 1px solid rgba(140,170,220,.2);
        }

        #cosmic-nasa-panel .nasa-status {
            color: #91b8ff;
            font-size: 12px;
        }

        #cosmic-nasa-panel a {
            color: #91bdff;
        }

        #cosmic-nasa-panel .nasa-close {
            float: right;
            padding: 5px 9px;
        }

        @media (max-width: 600px) {
            #cosmic-nasa-panel {
                left: 10px;
                bottom: 10px;
                width: calc(100vw - 20px);
                max-height: 55vh;
            }
        }
    `;

    document.head.appendChild(style);

    const heading = document.createElement("h2");
    heading.textContent = "NASA EXPLORER";

    const subtitle = document.createElement("div");
    subtitle.className = "nasa-subtitle";
    subtitle.textContent = "LIVE DATA FROM NASA SERVICES";

    const closeButton = document.createElement("button");
    closeButton.className = "nasa-close";
    closeButton.textContent = "Hide";
    closeButton.addEventListener("click", () => {
        panel.hidden = true;
        launcher.hidden = false;
    });

    const tabs = document.createElement("div");
    tabs.className = "nasa-tabs";

    const content = document.createElement("div");

    const status = document.createElement("div");
    status.className = "nasa-status";
    status.textContent = "Connecting to NASA services...";

    const launcher = document.createElement("button");
    launcher.textContent = "NASA Explorer";
    launcher.style.cssText =
        "position:fixed;z-index:31;left:20px;bottom:20px;";
    launcher.hidden = true;
    launcher.addEventListener("click", () => {
        panel.hidden = false;
        launcher.hidden = true;
    });

    panel.append(closeButton, heading, subtitle, tabs, status, content);
    document.body.append(panel, launcher);

    // Small helper to create safe text elements.
    function addText(parent, tag, value) {
        const element = document.createElement(tag);
        element.textContent = value || "";
        parent.appendChild(element);
        return element;
    }

    async function getJSON(url) {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("NASA service returned HTTP " + response.status);
        }

        return response.json();
    }

    function setStatus(message) {
        status.textContent = message;
    }

    function clearContent() {
        content.replaceChildren();
    }

    function makeTab(label, action) {
        const button = document.createElement("button");
        button.textContent = label;
        button.addEventListener("click", action);
        tabs.appendChild(button);
    }

    // 1. NASA Astronomy Picture of the Day.
    async function showAPOD() {
        clearContent();
        setStatus("Loading NASA Astronomy Picture of the Day...");

        try {
            const data = await getJSON(NASA.apod);
            const item = Array.isArray(data) ? data[0] : data;

            if (!item) {
                throw new Error("No APOD entry was returned.");
            }

            addText(content, "h3", item.title);
            addText(content, "p", "Date: " + (item.date || "Not provided"));

            if (item.media_type === "image" && item.hdurl) {
                const image = document.createElement("img");
                image.src = item.hdurl;
                image.alt = item.alt || item.title || "NASA astronomy image";
                image.loading = "lazy";
                content.appendChild(image);
            } else if (item.media_type === "image" && item.url) {
                const image = document.createElement("img");
                image.src = item.url;
                image.alt = item.alt || item.title || "NASA astronomy image";
                image.loading = "lazy";
                content.appendChild(image);
            }

            addText(content, "p", item.explanation);

            if (item.credit || item.copyright) {
                addText(content, "p", "Image credit: " +
                    (item.credit || item.copyright));
            }

            if (item.permalink) {
                const link = document.createElement("a");
                link.href = item.permalink;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = "View on NASA";
                content.appendChild(link);
            }

            setStatus("APOD data received from NASA.");
        } catch (error) {
            setStatus("Could not load APOD: " + error.message);
        }
    }

    // 2. NASA Near-Earth Objects.
    async function showAsteroids() {
    clearContent();
    setStatus("Connecting to NASA NeoWs...");

    try {
        const date = new Date().toISOString().slice(0, 10);

        const url = new URL(NASA.neo);
        url.searchParams.set("startDate", startDate);
        url.searchParams.set("endDate", endDate);
        

        const data = await getJSON(url.toString());

        const objects = data.near_earth_objects?.[date] || [];

        // Make NASA records available to other project modules.
        window.COSMIC_NEO_DATA = objects;

        addText(content, "h3", "NASA Near-Earth Asteroids");
        addText(content, "p", "Observation feed date: " + date);
        addText(content, "p", "NASA records returned: " + objects.length);

        const explanation = addText(
            content,
            "p",
            "These are actual NASA NeoWs records. Their positions are not represented by the illustrative 3D asteroid belt."
        );

        explanation.style.color = "#91b8ff";

        if (!objects.length) {
            addText(content, "p", "No objects were returned for this date.");
            setStatus("NASA returned no asteroid records for today.");
            return;
        }

        objects.forEach((object, index) => {
            const card = document.createElement("div");
            card.className = "nasa-result";

            addText(card, "strong", object.name || "Unnamed asteroid");

            addText(
                card,
                "p",
                "NASA record ID: " + object.id
            );

            const diameter = object.estimated_diameter?.meters;

            if (diameter) {
                addText(
                    card,
                    "p",
                    "Estimated diameter: " +
                    diameter.estimated_diameter_min.toFixed(2) +
                    "–" +
                    diameter.estimated_diameter_max.toFixed(2) +
                    " metres"
                );
            }

            const approach = object.close_approach_data?.[0];

            if (approach) {
                addText(
                    card,
                    "p",
                    "Close approach: " +
                    approach.close_approach_date
                );

                addText(
                    card,
                    "p",
                    "Distance: " +
                    Number(approach.miss_distance.kilometers)
                        .toLocaleString() +
                    " km"
                );

                addText(
                    card,
                    "p",
                    "Relative velocity: " +
                    Number(approach.relative_velocity.kilometers_per_hour)
                        .toLocaleString() +
                    " km/h"
                );
            }

            const hazardous = object.is_potentially_hazardous_asteroid;

            addText(
                card,
                "p",
                hazardous
                    ? "NASA classification: Potentially hazardous"
                    : "NASA classification: Not classified as potentially hazardous"
            );

            const detailsButton = document.createElement("button");
            detailsButton.textContent = "View asteroid details";

            detailsButton.addEventListener("click", async() => {
                const details = document.createElement("div");

                addText(
                    details,
                    "h3",
                    object.name || "Asteroid details"
                );

                addText(details, "p", "NASA ID: " + object.id);

                addText(
                    details,
                    "p",
                    "Absolute magnitude: " + object.absolute_magnitude_h
                );

                addText(
                    details,
                    "p",
                    "Potentially hazardous: " +
                    (hazardous ? "Yes" : "No")
                );

                if (approach) {
                    addText(
                        details,
                        "p",
                        "Approach date: " + approach.close_approach_date_full
                    );

                    addText(
                        details,
                        "p",
                        "Orbiting body: " + approach.orbiting_body
                    );
                }

                if (object.nasa_jpl_url) {
                    const link = document.createElement("a");
                    link.href = object.nasa_jpl_url;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    link.textContent = "Open NASA/JPL asteroid record";
                    details.appendChild(link);
                }
                // Search NASA's image archive for this asteroid.
                const gallery = document.createElement("div");
                gallery.style.cssText =
                    "margin-top:15px;padding-top:12px;border-top:1px solid #34527e;";

                addText(gallery, "h4", "NASA IMAGE ARCHIVE");

                const loading = addText(
                    gallery,
                    "p",
                    "Searching NASA's image collection..."
                );

                details.appendChild(gallery);

                try {
                    const imageURL = new URL(NASA.images);

                    imageURL.searchParams.set(
                        "q",
                        object.name
                    );

                    imageURL.searchParams.set(
                        "media_type",
                        "image"
                    );

                    imageURL.searchParams.set(
                        "page_size",
                        "5"
                    );

                    const imageData = await getJSON(
                        imageURL.toString()
                    );

                    const imageItems =
                        imageData.collection?.items || [];

                    gallery.replaceChildren();

                    addText(gallery, "h4", "NASA IMAGE ARCHIVE");

                    if (imageItems.length === 0) {
                        addText(
                            gallery,
                            "p",
                            "No matching NASA archive images were found."
                        );
                    }

                    imageItems.slice(0, 5).forEach(item => {
                        const metadata = item.data?.[0] || {};

                        const preview = item.links?.find(
                            link => link.rel === "preview"
                        );

                        const imageCard =
                            document.createElement("div");

                        imageCard.style.cssText =
                            "margin:12px 0;padding:10px;background:#101b32;border-radius:9px;";

                        addText(
                            imageCard,
                            "strong",
                            metadata.title || "NASA archive image"
                        );

                        if (preview?.href) {
                            const image =
                                document.createElement("img");

                            image.src = preview.href;
                            image.alt =
                                metadata.title || "NASA archive image";

                            image.loading = "lazy";

                            image.style.cssText =
                                "width:100%;max-height:190px;object-fit:contain;border-radius:8px;margin-top:8px;";

                            imageCard.appendChild(image);
                        }

                        addText(
                            imageCard,
                            "p",
                            "Archive date: " +
                            (metadata.date_created || "Not provided")
                        );

                        addText(
                            imageCard,
                            "p",
                            "Search result from NASA's image archive. " +
                            "The image is not necessarily a photograph of this exact asteroid."
                        );

                        if (metadata.nasa_id) {
                            const archiveLink =
                                document.createElement("a");

                            archiveLink.href =
                                "https://images.nasa.gov/details/" +
                                encodeURIComponent(metadata.nasa_id);

                            archiveLink.target = "_blank";
                            archiveLink.rel = "noopener noreferrer";
                            archiveLink.textContent =
                                "View NASA archive record";

                            imageCard.appendChild(archiveLink);
                        }

                        gallery.appendChild(imageCard);
                    });

                } catch (imageError) {
                    gallery.replaceChildren();

                    addText(
                        gallery,
                        "p",
                        "NASA image search is temporarily unavailable."
                    );

                    console.error(
                        "NASA asteroid image search:",
                        imageError
                    );
                }
                const oldDetails = content.querySelector(
                    ".selected-asteroid-details"
                );

                if (oldDetails) oldDetails.remove();

                details.className = "selected-asteroid-details";
                details.style.cssText =
                    "padding:12px;margin-top:12px;background:#142442;border-radius:9px;";

                content.appendChild(details);

                details.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest"
                });
            });

            card.appendChild(detailsButton);
            content.appendChild(card);
        });

        setStatus(
            "Successfully loaded " +
            objects.length +
            " NASA asteroid records."
        );

    } catch (error) {
        setStatus("NASA asteroid request failed: " + error.message);
        console.error("COSMIC TRACE NeoWs error:", error);
    }
}

    // 3. NASA Image and Video Library.
    async function showImageSearch() {
        clearContent();
        setStatus("Search NASA's image archive.");

        const input = document.createElement("input");
        input.placeholder = "Search: Jupiter, Saturn, galaxies...";
        input.value = "Jupiter";

        const searchButton = document.createElement("button");
        searchButton.textContent = "Search NASA";

        content.append(input, searchButton);

        const results = document.createElement("div");
        content.appendChild(results);

        async function search() {
            results.replaceChildren();
            setStatus("Searching NASA's image archive...");

            const query = input.value.trim();

            if (!query) {
                setStatus("Enter a search term.");
                return;
            }

            try {
                const url = new URL(NASA.images);
                url.searchParams.set("q", query);
                url.searchParams.set("media_type", "image");
                url.searchParams.set("page_size", "8");

                const data = await getJSON(url.toString());
                const items = data.collection?.items || [];

                if (!items.length) {
                    addText(results, "p", "No images found.");
                }

                items.slice(0, 8).forEach(item => {
                    const metadata = item.data?.[0] || {};
                    const preview = item.links?.find(
                        link => link.rel === "preview"
                    );

                    const card = document.createElement("div");
                    card.className = "nasa-result";

                    addText(card, "strong", metadata.title || "NASA image");

                    if (preview?.href) {
                        const image = document.createElement("img");
                        image.src = preview.href;
                        image.alt = metadata.title || "NASA archive image";
                        image.loading = "lazy";
                        card.appendChild(image);
                    }

                    addText(card, "p",
                        metadata.date_created
                            ? "Date: " + metadata.date_created.slice(0, 10)
                            : ""
                    );

                    addText(card, "p",
                        metadata.description
                            ? metadata.description.slice(0, 250)
                            : "No description available."
                    );

                    results.appendChild(card);
                });

                setStatus("NASA image search completed.");
            } catch (error) {
                setStatus("Image search failed: " + error.message);
            }
        }

        searchButton.addEventListener("click", search);

        input.addEventListener("keydown", event => {
            if (event.key === "Enter") search();
        });

        search();
    }
    // ================================================
// 4. NASA SPACE MISSION EXPLORER
// ================================================

async function showMissions() {
    clearContent();

    setStatus("Loading NASA mission explorer...");

    addText(content, "h3", "NASA SPACE MISSIONS");

    addText(
        content,
        "p",
        "Explore spacecraft missions investigating asteroids and the Solar System."
    );

    const missions = [
        {
            name: "OSIRIS-REx",
            target: "Asteroid Bennu",
            query: "OSIRIS-REx Bennu",
            description:
                "NASA's sample-return mission to asteroid Bennu. The spacecraft delivered its collected sample to Earth in September 2023.",
            objective:
                "Asteroid exploration and sample return."
        },
        {
            name: "DART",
            target: "Dimorphos",
            query: "NASA DART spacecraft Dimorphos",
            description:
                "NASA's Double Asteroid Redirection Test demonstrated asteroid deflection by impacting Dimorphos in 2022.",
            objective:
                "Testing asteroid deflection technology."
        },
        {
            name: "Lucy",
            target: "Jupiter Trojan asteroids",
            query: "NASA Lucy spacecraft Trojan asteroids",
            description:
                "A NASA mission designed to investigate Jupiter's Trojan asteroids and study the early history of the Solar System.",
            objective:
                "Understanding the origins of the Solar System."
        },
        {
            name: "Psyche",
            target: "Asteroid Psyche",
            query: "NASA Psyche spacecraft asteroid",
            description:
                "A mission investigating the metal-rich asteroid Psyche to learn more about planetary formation and the interiors of rocky worlds.",
            objective:
                "Studying a metal-rich asteroid."
        }
    ];

    const missionContainer = document.createElement("div");
    content.appendChild(missionContainer);

    for (const mission of missions) {
        const card = document.createElement("div");
        card.className = "nasa-result";

        addText(card, "h3", mission.name);
        addText(card, "p", "Target: " + mission.target);
        addText(card, "p", mission.description);

        addText(
            card,
            "p",
            "Scientific objective: " + mission.objective
        );

        const imageArea = document.createElement("div");

        addText(
            imageArea,
            "p",
            "Searching NASA mission archive..."
        );

        card.appendChild(imageArea);
        missionContainer.appendChild(card);

        try {
            const url = new URL(NASA.images);

            url.searchParams.set("q", mission.query);
            url.searchParams.set("media_type", "image");
            url.searchParams.set("page_size", "3");

            const result = await getJSON(url.toString());

            const items = result.collection?.items || [];

            imageArea.replaceChildren();

            if (items.length === 0) {
                addText(
                    imageArea,
                    "p",
                    "No mission images currently available."
                );
                continue;
            }

            items.slice(0, 2).forEach(item => {
                const metadata = item.data?.[0] || {};

                const preview = item.links?.find(
                    link => link.rel === "preview"
                );

                const imageCard = document.createElement("div");

                if (preview?.href) {
                    const img = document.createElement("img");

                    img.src = preview.href;
                    img.alt = metadata.title || mission.name;
                    img.loading = "lazy";

                    imageCard.appendChild(img);
                }

                addText(
                    imageCard,
                    "p",
                    metadata.title || "NASA mission image"
                );

                if (metadata.nasa_id) {
                    const link = document.createElement("a");

                    link.href =
                        "https://images.nasa.gov/details/" +
                        encodeURIComponent(metadata.nasa_id);

                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    link.textContent = "View original NASA image";

                    imageCard.appendChild(link);
                }

                imageArea.appendChild(imageCard);
            });

        } catch (error) {
            imageArea.replaceChildren();

            addText(
                imageArea,
                "p",
                "Mission image search temporarily unavailable."
            );

            console.error(
                "NASA mission image error:",
                mission.name,
                error
            );
        }
    }

    setStatus("NASA Mission Explorer loaded.");
}
// ================================================
// 5. NASA SPACE WEATHER — DONKI
// ================================================

async function showSpaceWeather() {
    clearContent();
    setStatus("Loading NASA space weather data...");

    addText(content, "h3", "SPACE WEATHER MONITOR");
    addText(
        content,
        "p",
        "Recent solar flares, coronal mass ejections and geomagnetic storms."
    );

    const end = new Date();
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - 7);

    const formatDate = date =>
        date.toISOString().slice(0, 10);

    const startDate = formatDate(start);
    const endDate = formatDate(end);

    const eventTypes = [
        { name: "SOLAR FLARES", endpoint: "FLR" },
        { name: "CORONAL MASS EJECTIONS", endpoint: "CME" },
        { name: "GEOMAGNETIC STORMS", endpoint: "GST" }
    ];

    for (const type of eventTypes) {
        const section = document.createElement("section");
        section.className = "nasa-result";
        content.appendChild(section);

        addText(section, "h3", type.name);

        try {
            const url = new URL(
                NASA.donki + "mCnMWHfWGzpfwz6dbh9KKBLhmjcjKN8NJBLMkHCK" + type.endpoint
            );

            url.searchParams.set("startDate", startDate);
            url.searchParams.set("endDate", endDate);

            const events = await getJSON(url.toString());

            if (!Array.isArray(events) || events.length === 0) {
                addText(section, "p", "No events reported in this period.");
                continue;
            }

            events.slice(0, 8).forEach(event => {
                const card = document.createElement("div");

                const title =
                    event.classType ||
                    event.note ||
                    event.activityID ||
                    event.gstID ||
                    event.flrID ||
                    "Space weather event";

                const date =
                    event.beginTime ||
                    event.startTime ||
                    "Date unavailable";

                addText(card, "h4", title);
                addText(card, "p", "Date: " + date);

                if (event.peakTime) {
                    addText(card, "p", "Peak: " + event.peakTime);
                }

                if (event.sourceLocation) {
                    addText(
                        card,
                        "p",
                        "Source location: " + event.sourceLocation
                    );
                }

                if (event.cmeAnalyses?.length) {
                    const analysis = event.cmeAnalyses.find(
                        item => item.isMostAccurate
                    ) || event.cmeAnalyses[0];

                    if (analysis?.speed != null) {
                        addText(
                            card,
                            "p",
                            "Estimated speed: " + analysis.speed + " km/s"
                        );
                    }
                }

                const link = event.link;

                if (link) {
                    const anchor = document.createElement("a");
                    anchor.href = link;
                    anchor.target = "_blank";
                    anchor.rel = "noopener noreferrer";
                    anchor.textContent = "View event record";
                    card.appendChild(anchor);
                }

                section.appendChild(card);
            });

        } catch (error) {
            console.error("DONKI error:", type.endpoint, error);

            addText(
                section,
                "p",
                "Could not load this event category. Check the connection or API availability."
            );
        }
    }

    setStatus("Space weather data request completed.");
}
   
    makeTab("Picture of the Day", showAPOD);
    makeTab("Asteroids", showAsteroids);
    makeTab("NASA Images", showImageSearch);
    makeTab("NASA Missions", showMissions);
    makeTab("Space Weather", showSpaceWeather);

    showAPOD();

})();
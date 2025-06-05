import React, { useEffect, useState } from "react";

/**
 * LyricLounge Main Container (refactored for multiple artists)
 * Features:
 *  - Selectable grid/list of artists (hardcoded)
 *  - On artist select, fetch & display info/image/music videos for chosen artist
 *  - Music video list and "lyrics" placeholder area
 *  - Modern, music-themed layout, color theme: primary #f0adea, secondary #fbf9f9, accent #100e0e
 */

// PUBLIC_INTERFACE
function LyricLoungeContainer() {
  // TheAudioDB API key
  const THEAUDIODB_APIKEY = "2";

  // Demo/hardcoded artists (ID, name, imageURL)
  // IDs from TheAudioDB documentation/examples
  const ARTISTS = [
    {
      id: "111239", // Coldplay
      name: "Coldplay",
      img: "https://www.theaudiodb.com/images/media/artist/thumb/xxtwus1340291734.jpg"
    },
    {
      id: "112024", // Daft Punk
      name: "Daft Punk",
      img: "https://www.theaudiodb.com/images/media/artist/thumb/wvxxsq1420551799.jpg"
    },
    {
      id: "135088", // Adele
      name: "Adele",
      img: "https://www.theaudiodb.com/images/media/artist/thumb/vwxyyu1419359185.jpg"
    },
    {
      id: "112419", // Imagine Dragons
      name: "Imagine Dragons",
      img: "https://www.theaudiodb.com/images/media/artist/thumb/uytsvw1421930182.jpg"
    }
  ];

  // State
  const [selectedArtistId, setSelectedArtistId] = useState(ARTISTS[0].id);
  const [artist, setArtist] = useState(null);
  const [musicVideos, setMusicVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trackDetails, setTrackDetails] = useState(null); // for enriched track info

  // Image error state for the artist selection grid
  const [artistGridImgError, setArtistGridImgError] = useState({});

  // Fetch artist info and music videos when artist changes
  useEffect(() => {
    // PUBLIC_INTERFACE
    async function fetchData() {
      setLoading(true);
      setError("");
      let artistData = null;
      let musicVideosData = null;
      let loadError = "";

      const artistDetailsApi = `https://www.theaudiodb.com/api/v1/json/${THEAUDIODB_APIKEY}/artist.php?i=${selectedArtistId}`;
      const musicVideosApi = `https://www.theaudiodb.com/api/v1/json/${THEAUDIODB_APIKEY}/mvid.php?i=${selectedArtistId}`;

      // Fetch artist info
      try {
        const artistResp = await fetch(artistDetailsApi);
        if (!artistResp.ok) {
          throw new Error(`Artist info fetch failed: HTTP ${artistResp.status}`);
        }
        const artistJson = await artistResp.json();
        artistData = artistJson?.artists?.[0] || null;
      } catch (err) {
        loadError = "Sorry, failed to load artist information.";
      }

      // Fetch music videos
      try {
        const mvResp = await fetch(musicVideosApi);
        if (!mvResp.ok) {
          throw new Error(`Music video fetch failed: HTTP ${mvResp.status}`);
        }
        const mvJson = await mvResp.json();

        // Defensive: API sometimes returns "mvids" or "mvid"
        let vidsKey = "mvids";
        let arrayVal = mvJson?.[vidsKey];
        if (!arrayVal && "mvid" in mvJson) {
          vidsKey = "mvid";
          arrayVal = mvJson.mvid;
        }

        let rawMvs = Array.isArray(arrayVal) ? arrayVal : [];

        // Error/debug reporting
        if (
          !arrayVal &&
          (!mvJson || typeof mvJson !== "object" || Object.keys(mvJson).length === 0)
        ) {
          loadError +=
            (loadError ? " " : "") +
            "No music video data found for this artist (empty API response).";
          // eslint-disable-next-line no-console
          console.error("LyricLounge DEBUG: Music video API returned empty or invalid response:", mvJson);
        } else if (!rawMvs.length) {
          // Array is empty
          if (Object.keys(mvJson || {}).length > 0) {
            loadError +=
              (loadError ? " " : "") +
              "No music videos found in the database for this artist.";
            // eslint-disable-next-line no-console
            console.error(
              "LyricLounge DEBUG: No music videos array found for key",
              vidsKey,
              "Full music video API response:",
              mvJson
            );
          }
        } else if (arrayVal && !Array.isArray(arrayVal)) {
          loadError += (loadError ? " " : "") + "Unexpected music video API response structure.";
          // eslint-disable-next-line no-console
          console.error("LyricLounge DEBUG: Music video data is present but not an array. Raw response:", mvJson);
        }
        musicVideosData = rawMvs;
      } catch (err) {
        loadError +=
          (loadError ? " " : "") +
          "Sorry, failed to load music videos. [Network/API error]";
        // eslint-disable-next-line no-console
        console.error("Music video fetch error", err);
      }

      setArtist(artistData);
      setMusicVideos(musicVideosData || []);
      // Select the first available music video, or clear if none.
      if (musicVideosData && musicVideosData.length > 0) {
        setSelectedVideo(musicVideosData[0]);
      } else {
        setSelectedVideo(null);
      }
      setTrackDetails(null); // clear last track enrichment on artist change
      setError(loadError);
      setLoading(false);
    }

    fetchData();
    // eslint-disable-next-line
  }, [selectedArtistId]);

  // Fetch full track details whenever the selected video/track changes
  useEffect(() => {
    // Only fetch if a track is selected
    async function fetchTrackDetails() {
      if (!selectedVideo || !selectedVideo.idTrack) {
        setTrackDetails(null);
        return;
      }
      // PUBLIC_INTERFACE: Fetches detailed track info (including lyrics)
      setTrackDetails(null); // show loading state if needed
      try {
        const resp = await fetch(`https://www.theaudiodb.com/api/v1/json/2/track.php?m=${selectedVideo.idTrack}`);
        if (!resp.ok) {
          throw new Error("Track details fetch failed");
        }
        const data = await resp.json();
        if (data && data.track && data.track.length) {
          setTrackDetails(data.track[0]);
        } else {
          setTrackDetails(null);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch track details", e);
        setTrackDetails(null);
      }
    }
    fetchTrackDetails();
  }, [selectedVideo]);

  // Filter music videos by search term
  const filteredVideos = musicVideos.filter((vid) => {
    const t = searchTerm.toLowerCase();
    return (
      vid.strTrack?.toLowerCase().includes(t) ||
      vid.strAlbum?.toLowerCase().includes(t) ||
      vid.strDescriptionEN?.toLowerCase().includes(t)
    );
  });

  const handleVideoSelect = (video) => setSelectedVideo(video);

  // Minimal music-themed SVG icon
  const MusicIcon = () => (
    <svg
      width="28"
      height="28"
      fill="none"
      viewBox="0 0 24 24"
      style={{ marginRight: 6, verticalAlign: "middle" }}
    >
      <circle cx="12" cy="12" r="11" fill="#f0adea" stroke="#100e0e" strokeWidth="2" />
      <path
        d="M16.5 6v8.5a2.5 2.5 0 11-1-2V8.25l-6 1.333V15.5a2.5 2.5 0 11-1-2V8l8-2v2z"
        fill="#100e0e"
      />
    </svg>
  );

  // Get artist thumb image based on current selection (API image sometimes missing/corrupt)
  // Updated strategy:
  // 1. Use the API image (artist?.strArtistThumb) if it's available and not empty
  // 2. Otherwise, use the fallback from the ARTISTS array for initial load/hardcoded fallback
  // 3. Fallback to AudioDB default
  const getValidArtistImage = () => {
    // Prefer live API data if available and valid
    if (artist?.strArtistThumb && artist.strArtistThumb.trim() !== "") {
      return artist.strArtistThumb;
    }
    // Fallback: use the static array (may be stale if list grows)
    const arObj = ARTISTS.find((ar) => ar.id === selectedArtistId);
    if (arObj && arObj.img && arObj.img.trim() !== "") {
      return arObj.img;
    }
    // Last resort: AudioDB generic
    return "https://www.theaudiodb.com/images/media/artist/thumb/default.png";
  };
  const currentArtistPic = getValidArtistImage();

  return (
    <div
      className="ll-main"
      style={{
        fontFamily: "'Inter','Roboto','Helvetica',sans-serif",
        minHeight: "100vh",
        background: "#fbf9f9",
        color: "#100e0e",
        paddingBottom: 32,
        boxSizing: "border-box"
      }}
    >
      {/* Header/Nav */}
      <nav
        style={{
          padding: "24px 0 8px 0",
          background: "#f0adea",
          borderBottom: "2.5px solid #100e0e19",
          position: "sticky",
          top: 0,
          zIndex: 10
        }}
      >
        <div
          className="ll-container"
          style={{
            maxWidth: 990,
            margin: "0 auto",
            padding: "0 20px",
            display: "flex",
            alignItems: "center"
          }}
        >
          <div
            className="ll-logo"
            style={{
              display: "flex",
              alignItems: "center",
              fontWeight: 700,
              fontSize: "1.4rem",
              color: "#100e0e",
              letterSpacing: "-1px"
            }}
          >
            <MusicIcon />
            LyricLounge
          </div>
        </div>
      </nav>

      <main>
        {/* Artist Selection Grid */}
        <section
          style={{
            margin: "0 auto",
            maxWidth: 900,
            padding: "30px 20px 20px 20px",
            marginTop: 22
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: "1.16rem",
              color: "#f0adea",
              marginBottom: 13,
              letterSpacing: 0,
              textTransform: "uppercase"
            }}
          >
            Choose an Artist
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 18,
              marginBottom: 5
            }}
          >
            {ARTISTS.map((ar) => {
              // Determine which image to show for each artist "card" in the grid.
              // Use live API thumb for the currently selected artist if it is available
              // Otherwise use the static image, or fallback to generic
              const baseFallback = "https://www.theaudiodb.com/images/media/artist/thumb/default.png";
              let thumb;
              if (
                artist &&
                ar.id === selectedArtistId &&
                artist.strArtistThumb &&
                artist.strArtistThumb.trim().length > 0
              ) {
                thumb = artist.strArtistThumb.trim();
              } else if (ar.img && ar.img.trim().length > 0) {
                thumb = ar.img.trim();
              } else {
                thumb = baseFallback;
              }

              // Use error override if state for this artist is set
              const errorKey = ar.id;
              const finalThumb = artistGridImgError[errorKey] ? baseFallback : thumb;
              // Handler to set fallback image (avoiding infinite loop)
              const handleImgError = (e) => {
                if (
                  e.target &&
                  e.target.src !== baseFallback &&
                  !artistGridImgError[errorKey] // avoid set loop
                ) {
                  // eslint-disable-next-line no-console
                  console.warn(
                    `Artist grid image failed to load for '${ar.name}': `,
                    e.target.src
                  );
                  setArtistGridImgError((prev) => ({
                    ...prev,
                    [errorKey]: true
                  }));
                  // fallback immediately for user
                  e.target.src = baseFallback;
                }
              };

              return (
                <button
                  key={ar.id}
                  onClick={() => setSelectedArtistId(ar.id)}
                  style={{
                    background:
                      selectedArtistId === ar.id
                        ? "linear-gradient(110deg,#fff7fa,#ffc3ee 95%)"
                        : "#fff",
                    border:
                      selectedArtistId === ar.id
                        ? "2.6px solid #f0adea"
                        : "2px solid #ded3d6",
                    borderRadius: 16,
                    padding: 0,
                    cursor: "pointer",
                    outline: "none",
                    boxShadow:
                      selectedArtistId === ar.id
                        ? "0 4px 18px 0 #f0adea14"
                        : "0 2px 10px #100e0e06",
                    overflow: "hidden",
                    minWidth: 140,
                    maxWidth: 175,
                    width: 155,
                    marginBottom: 0,
                    transition:
                      "border 0.15s, box-shadow 0.18s, background 0.15s"
                  }}
                  aria-label={`Select artist ${ar.name}`}
                >
                  <img
                    src={finalThumb}
                    alt={ar.name}
                    style={{
                      width: "100%",
                      height: 62,
                      objectFit: "cover",
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                      background: "#f0adea13"
                    }}
                    onError={handleImgError}
                  />
                  <div
                    style={{
                      padding: "9px 14px 12px 13px",
                      textAlign: "center"
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color:
                          selectedArtistId === ar.id
                            ? "#e86ac8"
                            : "#100e0e",
                        fontSize: "1.04em"
                      }}
                    >
                      {ar.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Artist Info */}
        <section
          style={{
            margin: "0 auto",
            maxWidth: 900,
            padding: "32px 20px 14px 20px",
            display: "flex",
            gap: 32,
            flexWrap: "wrap",
            borderRadius: "20px",
            background: "#f0adea05",
            alignItems: "flex-start"
          }}
        >
          {loading ? (
            <div
              style={{
                color: "#f0adea",
                fontSize: "1.2rem",
                width: "100%",
                textAlign: "center"
              }}
            >
              Loading artist information...
            </div>
          ) : !artist ? (
            <div style={{ color: "#fa3a62", width: "100%", fontWeight: 500 }}>
              {error || "Artist information not available at this time."}
            </div>
          ) : (
            <>
              <img
                src={currentArtistPic}
                alt={artist?.strArtist || "Artist"}
                style={{
                  borderRadius: 20,
                  width: 128,
                  height: 128,
                  objectFit: "cover",
                  boxShadow: "0 2px 20px 0 #f0adea33"
                }}
                onError={e => {
                  // Fallback to generic only if not already at default; prevents infinite loop
                  if (
                    e.target &&
                    e.target.src !== "https://www.theaudiodb.com/images/media/artist/thumb/default.png"
                  ) {
                    // Log a warning for developers in console
                    // eslint-disable-next-line no-console
                    console.warn(
                      `Artist image failed to load for '${artist?.strArtist || selectedArtistId}': `,
                      e.target.src
                    );
                    e.target.src = "https://www.theaudiodb.com/images/media/artist/thumb/default.png";
                  }
                }}
              />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div
                  style={{
                    fontWeight: 600,
                    color: "#f0adea",
                    marginBottom: 2,
                    letterSpacing: "0.2px",
                    fontSize: "1rem"
                  }}
                >
                  {artist.strGenre || "Genre Unk."}
                  {" • "}
                  {artist.intFormedYear || "--"}
                  {" • "}
                  {artist.strCountry || ""}
                </div>
                <h1
                  style={{
                    fontSize: "2.2rem",
                    margin: "4px 0",
                    color: "#100e0e",
                    fontWeight: 700,
                    letterSpacing: "-1px"
                  }}
                >
                  {artist.strArtist || "Unknown Artist"}
                </h1>
                <div
                  style={{
                    fontSize: "1rem",
                    margin: "8px 0",
                    color: "#3f2044",
                    lineHeight: 1.45
                  }}
                >
                  {artist?.strBiographyEN
                    ? artist.strBiographyEN.substring(0, 240) +
                      (artist.strBiographyEN.length > 240 ? "…" : "")
                    : ""}
                </div>
                {artist?.strWebsite && (
                  <a
                    href={
                      artist.strWebsite.match(/^https?:\/\//)
                        ? artist.strWebsite
                        : "https://" + artist.strWebsite
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#fff",
                      background: "#100e0e",
                      border: "none",
                      padding: "7px 19px",
                      borderRadius: "7px",
                      fontWeight: 600,
                      fontSize: "0.97rem",
                      textDecoration: "none",
                      transition: "background 0.18s",
                      marginTop: 6,
                      display: "inline-block"
                    }}
                  >
                    Official Website
                  </a>
                )}
              </div>
            </>
          )}
        </section>

        {/* Search Bar & Song List */}
        <section style={{ margin: "34px auto 0 auto", maxWidth: 900, padding: "0 20px" }}>
          {/* Search bar */}
          <form
            onSubmit={e => e.preventDefault()}
            style={{ marginBottom: 20, width: "100%" }}
            autoComplete="off"
            role="search"
          >
            <input
              type="search"
              name="search"
              aria-label="Filter videos"
              placeholder="Search songs, albums, or keywords…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 18px",
                border: "2px solid #f0adea",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: 500,
                outline: "none",
                background: "#fbf9f9",
                color: "#100e0e"
              }}
            />
          </form>

          {/* Song (Music Video) Selection List */}
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "1.2rem",
                color: "#f0adea",
                marginBottom: 13,
                letterSpacing: 0,
                textTransform: "uppercase"
              }}
            >
              Select a Song / Music Video
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: 22,
                minHeight: 42
              }}
            >
              {loading ? (
                <div style={{ color: "#100e0e9a", gridColumn: "1/-1" }}>
                  Loading songs…
                </div>
              ) : error && musicVideos.length === 0 ? (
                <div style={{ color: "#fa3a62", gridColumn: "1/-1" }}>
                  {error.includes("music videos") ? (
                    <>
                      Sorry, failed to load music videos. Try reloading the page.<br />
                      <span
                        style={{
                          fontSize: "0.95em",
                          color: "#bb2144",
                          fontWeight: 400
                        }}
                      >
                        (See browser console for technical error details.)
                      </span>
                    </>
                  ) : (
                    error
                  )}
                </div>
              ) : filteredVideos.length === 0 ? (
                <div style={{ color: "#100e0e99", gridColumn: "1/-1" }}>
                  No results found.
                </div>
              ) : (
                filteredVideos.map((video) => (
                  <button
                    key={video.idTrack}
                    onClick={() => handleVideoSelect(video)}
                    style={{
                      background:
                        selectedVideo?.idTrack === video.idTrack
                          ? "linear-gradient(100deg,#f0adea33,#f0adea88 90%)"
                          : "#fff",
                      border:
                        selectedVideo?.idTrack === video.idTrack
                          ? "2.6px solid #f0adea"
                          : "2px solid #ded3d6",
                      borderRadius: 13,
                      padding: 0,
                      cursor: "pointer",
                      outline: "none",
                      boxShadow:
                        selectedVideo?.idTrack === video.idTrack
                          ? "0 4px 18px 0 #f0adea28"
                          : "0 2px 10px #100e0e06",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      transition:
                        "border 0.15s, box-shadow 0.18s, background 0.15s",
                      marginBottom: 2
                    }}
                    aria-label={`Select ${video.strTrack}`}
                  >
                    <img
                      src={
                        video.strTrackThumb ||
                        video.strTrack3dCase ||
                        currentArtistPic
                      }
                      alt={video.strTrack}
                      style={{
                        width: "100%",
                        height: 110,
                        objectFit: "cover",
                        borderTopLeftRadius: 13,
                        borderTopRightRadius: 13,
                        background: "#f0adea13"
                      }}
                    />
                    <div
                      style={{
                        padding: "12px 13px 13px 13px",
                        textAlign: "left",
                        width: "100%"
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "1.08em",
                          color: "#100e0e"
                        }}
                      >
                        {video.strTrack}
                      </div>
                      {video.intYearReleased && (
                        <div
                          style={{
                            color: "#f0adea",
                            fontSize: "0.98em",
                            fontWeight: 500,
                            marginBottom: 2
                          }}
                        >
                          {video.intYearReleased}
                        </div>
                      )}
                      {video.strAlbum && (
                        <div
                          style={{
                            color: "#6a447a",
                            fontSize: "0.97em"
                          }}
                        >
                          {video.strAlbum}
                        </div>
                      )}
                      {video.strDescriptionEN && (
                        <div
                          style={{
                            fontSize: "0.89em",
                            color: "#100e0e99",
                            marginTop: 6
                          }}
                        >
                          {video.strDescriptionEN.substring(0, 68)}
                          {video.strDescriptionEN.length > 68 ? "…" : ""}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Lyrics/Track Details Area */}
        <section
          style={{
            margin: "34px auto 0 auto",
            maxWidth: 900,
            padding: "18px 22px",
            background: "#f0adea11",
            borderRadius: 18,
            minHeight: 154
          }}
        >
          <div
            style={{
              marginBottom: 16,
              fontWeight: 700,
              fontSize: "1.13rem",
              color: "#f0adea",
              display: "flex",
              alignItems: "center"
            }}
          >
            <span
              role="img"
              aria-label="Lyrics"
              style={{ fontSize: 21, marginRight: 9 }}
            >
              📝
            </span>
            Lyrics & Track Details
          </div>
          {/* [Start] Track details logic */}
          <div
            style={{
              fontFamily: "monospace, 'Menlo', 'Courier New', monospace",
              fontSize: "1.12rem",
              background: "#fff",
              color: "#100e0e",
              minHeight: 80,
              borderRadius: 9,
              padding: "20px 20px 19px 20px",
              boxShadow: "0 1.5px 10px 0 #f0adea12",
              letterSpacing: "0.02em",
              wordBreak: "break-word"
            }}
          >
            {!selectedVideo ? (
              "Please select a song to view its lyrics and details."
            ) : trackDetails === null ? (
              <span style={{ color: "#c26293" }}>
                { /* If no details or details loading, provide fallback/loader */ }
                Loading lyrics and details...
              </span>
            ) : trackDetails ? (
              <div>
                {/* Show Title and basic info */}
                <div style={{
                  color: "#ea41c3",
                  fontWeight: 700,
                  fontSize: "1.22em",
                  marginBottom: 6,
                  fontFamily: "inherit"
                }}>{trackDetails.strTrack || selectedVideo.strTrack}</div>
                
                <div style={{
                  fontSize: "1em", marginBottom: 10, color: "#6f2361", fontWeight: 500
                }}>
                  {trackDetails.strAlbum ? (
                    <>
                      <span style={{
                        padding: "2.5px 7px", background: "#f0adea33",
                        borderRadius: 5, color: "#902e77", marginRight: 11
                      }}>
                        Album: <b>{trackDetails.strAlbum}</b>
                      </span>
                    </>
                  ) : null}
                  {trackDetails.intYearReleased && (
                    <span style={{ marginLeft: 5 }}>
                      Year: {trackDetails.intYearReleased}
                    </span>
                  )}
                </div>
                {/* [Optional] Genre, Duration, etc */}
                <div style={{marginBottom:7, fontSize: ".96em", color: "#a9577c"}}>
                  {trackDetails.strGenre && <span>Genre: {trackDetails.strGenre}</span>}
                  {trackDetails.intDuration && (
                    <span style={{marginLeft:9}}>
                      {Math.round(Number(trackDetails.intDuration||0) / 1000)}s
                    </span>
                  )}
                </div>
                {/* Lyrics */}
                <div style={{
                  color: "#100e0e", fontWeight: 500, fontSize: "1.13em", margin: "10px 0 0 0", whiteSpace: "pre-line"
                }}>
                  {trackDetails.strLyrics ?
                    trackDetails.strLyrics :
                    <span style={{ color: "#ce7ea8" }}>
                      Lyrics not found for this track.
                    </span>
                  }
                </div>
              </div>
            ) : (
              <span style={{ color: "#ce7ea8" }}>
                No track details available.
              </span>
            )}
          </div>
          {/* [End] Track details logic */}
          {/* Bonus: Link to the music video */}
          {selectedVideo && (
            <div style={{ marginTop: 13 }}>
              <a
                href={
                  selectedVideo.strMusicVid ||
                  selectedVideo.strYoutube
                }
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "#100e0e",
                  color: "#fff",
                  padding: "9px 16px",
                  borderRadius: 7,
                  fontWeight: 600,
                  textDecoration: "none",
                  fontSize: "1rem",
                  display: "inline-block",
                  marginRight: 10
                }}
              >
                ▶ Watch Video
              </a>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default LyricLoungeContainer;


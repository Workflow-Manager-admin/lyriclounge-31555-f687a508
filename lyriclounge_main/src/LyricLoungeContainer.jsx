import React, { useEffect, useState } from "react";

/**
 * LyricLounge Main Container (refactored for multiple artists)
 * Features:
 *  - Selectable grid/list of artists (hardcoded)
 *  - On artist select, fetch & display info/image/music videos for chosen artist
 *  - Music video list and "lyrics" placeholder area
 *  - Modern, music-themed layout, color theme: primary #f0adea, secondary #fbf9f9, accent #100e0e
 */

/**
 * LyricLounge Main Container (refactored for multiple artists and robust album info filtering)
 * Features:
 *  - Selectable grid/list of artists (hardcoded)
 *  - On artist select, fetch & display info/image/music videos for chosen artist
 *  - Music video list and "lyrics" placeholder area
 *  - Modern, music-themed layout, color theme: primary #f0adea, secondary #fbf9f9, accent #100e0e
 *  - Enhanced: When Daft Punk is selected and 'Homework' album is searched, fetch album robustly by artist+album
 */

 // PUBLIC_INTERFACE
function LyricLoungeContainer() {
  // TheAudioDB API key
  const THEAUDIODB_APIKEY = "2";

  // The new specified fallback for all artist images (grid/profile)
  const FALLBACK_ARTIST_IMG = "https://www.theaudiodb.com/images/media/artist/thumb/xxtwus1340291734.jpg/small";
  // Retain the placeholder for tracks and others (but artists will always fallback to above)
  const PLACEHOLDER_IMG = "https://www.theaudiodb.com/images/media/artist/thumb/default.png";
  const ARTIST_STATIC_FALLBACKS = {
    "135088": "https://upload.wikimedia.org/wikipedia/commons/5/5c/Adele_2016.jpg", // Adele
    "112419": "https://upload.wikimedia.org/wikipedia/commons/f/fb/Imagine_Dragons_Lollapalooza_2014_%28cropped%29.jpg", // Imagine Dragons
    // Daft Punk fallback (if needed in future): original not listed but kept here for consistency
    "112024": "https://www.theaudiodb.com/images/media/artist/thumb/uxwuqw1486114912.jpg"
  };

  // Demo/hardcoded artists (ID, name, imageURL)
  // Daft Punk: 112024, name, and thumbnail from TheAudioDB
  const ARTISTS = [
    {
      id: "111239", // Coldplay
      name: "Coldplay",
      img: "https://www.theaudiodb.com/images/media/artist/thumb/xxtwus1340291734.jpg"
    },
    {
      id: "121335", // The Weeknd (force correct ID and remove any potential whitespace or casing issues)
      name: "The Weeknd",
      img: "https://www.theaudiodb.com/images/media/artist/thumb/uxxyuv1429914500.jpg"
    },
    {
      id: "135088", // Adele
      name: "Adele",
      img: ARTIST_STATIC_FALLBACKS["135088"]
    },
    {
      id: "112419", // Imagine Dragons
      name: "Imagine Dragons",
      img: ARTIST_STATIC_FALLBACKS["112419"]
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

  // Album state (for Daft Punk 'Homework')
  const [album, setAlbum] = useState(null);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [albumError, setAlbumError] = useState("");

  // --- Track Search State ---
  const [trackSearchArtist, setTrackSearchArtist] = useState("");
  const [trackSearchTitle, setTrackSearchTitle] = useState("");
  const [trackSearchLoading, setTrackSearchLoading] = useState(false);
  const [trackSearchError, setTrackSearchError] = useState("");
  const [trackSearchResult, setTrackSearchResult] = useState(null);

  // Image error state for the artist selection grid
  const [artistGridImgError, setArtistGridImgError] = useState({});

  // Fetch album info for Daft Punk's "Homework" when that artist is selected.
  useEffect(() => {
    // Only fire for Daft Punk and when selecting a new artist.
    async function fetchAlbum() {
      setAlbum(null);
      setAlbumError("");
      setAlbumLoading(false);
      if (selectedArtistId !== "112024") {
        return; // Not Daft Punk, do not fetch.
      }
      setAlbumLoading(true);
      try {
        // Robustly fetch by artist and album (case-insensitive match both)
        const url = `https://www.theaudiodb.com/api/v1/json/2/searchalbum.php?s=daft_punk&a=Homework`;
        const resp = await fetch(url);
        if (!resp.ok) {
          throw new Error(`Album info fetch failed: HTTP ${resp.status}`);
        }
        const data = await resp.json();
        let foundAlbum = null;
        if (Array.isArray(data.album)) {
          foundAlbum = data.album
            .find(
              (a) =>
                (a?.strAlbum?.trim().toLowerCase() === "homework") &&
                (
                  (a?.idArtist && String(a.idArtist) === "112024") ||
                  (a?.strArtist?.trim().toLowerCase() === "daft punk")
                )
            );
        }
        if (foundAlbum) {
          setAlbum(foundAlbum);
        } else {
          setAlbum(null);
          setAlbumError("Could not find Daft Punk's Homework album.");
        }
      } catch (err) {
        setAlbum(null);
        setAlbumError("Failed to load album info.");
        // eslint-disable-next-line no-console
        console.error("[LyricLounge] Album fetch exception:", err);
      } finally {
        setAlbumLoading(false);
      }
    }
    fetchAlbum();
    // eslint-disable-next-line
  }, [selectedArtistId]);

  // Fetch artist info and music videos when artist changes
  useEffect(() => {
    // PUBLIC_INTERFACE
    let isCurrent = true; // local flag that will be unique per effect run
    const fetchId = Symbol('artistFetch');

    // Store a persistent ref for any new fetch, invalidating previous ones
    // by scoping with closure and checking at set state time
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

        // Strictly filter for artist by idArtist – never allow fallback or wrong artist
        artistData = null;
        if (Array.isArray(artistJson?.artists) && artistJson.artists.length > 0) {
          const strictArtist = artistJson.artists.find(
            (a) => String(a.idArtist) === String(selectedArtistId)
          );
          if (strictArtist) {
            artistData = strictArtist;
          } else {
            // Null out artist if no ID match, never fallback to a different one (e.g. Richard Goode)
            artistData = null;
            // eslint-disable-next-line no-console
            console.warn(
              `[LyricLounge] No artist found with idArtist === '${selectedArtistId}' in TheAudioDB API response, artists array:`,
              artistJson.artists
            );
          }
        } else {
          artistData = null;
          // eslint-disable-next-line no-console
          console.warn(
            `[LyricLounge] Artist API response did not contain a valid 'artists' array (API issue or bad ID?):`,
            artistJson
          );
        }
        // Only exact match for The Weeknd will succeed. No details for other artists if not found!
      } catch (err) {
        loadError = "Sorry, failed to load artist information.";
        // eslint-disable-next-line no-console
        console.error("[LyricLounge] Exception during fetch of artist info:", err);
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

      // Guard: only set state if effect instance is still current
      if (!isCurrent) return;
      setArtist(artistData);
      setMusicVideos(musicVideosData || []);
      if (musicVideosData && musicVideosData.length > 0) {
        setSelectedVideo(musicVideosData[0]);
      } else {
        setSelectedVideo(null);
      }
      setTrackDetails(null);
      setError(loadError);
      setLoading(false);
    }

    fetchData();
    // On effect cleanup, invalidate previous fetch runs
    return () => { isCurrent = false; };
    // eslint-disable-next-line
  }, [selectedArtistId]);

  // Fetch track details when the selected video/track changes
  useEffect(() => {
    async function fetchTrackDetails() {
      if (!selectedVideo || !selectedVideo.idTrack) {
        setTrackDetails(null);
        return;
      }
      // PUBLIC_INTERFACE: Fetches detailed track info (including lyrics)
      setTrackDetails(null);
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

  // Robust fallback for artist image (profile area)
  const getValidArtistImage = () => {
    // 1. Use API img if present, not empty, and matches selected artist
    if (
      artist &&
      artist?.idArtist &&
      String(artist.idArtist) === String(selectedArtistId) &&
      artist?.strArtistThumb &&
      artist.strArtistThumb.trim() !== ""
    ) {
      return artist.strArtistThumb;
    }
    // 2. Hard fallback for these three key artists
    if (ARTIST_STATIC_FALLBACKS[selectedArtistId]) {
      return ARTIST_STATIC_FALLBACKS[selectedArtistId];
    }
    // 3. ARTISTS array
    const arObj = ARTISTS.find((ar) => ar.id === selectedArtistId);
    if (arObj && arObj.img && arObj.img.trim() !== "") {
      return arObj.img;
    }
    // 4. Always use the new specified fallback
    return FALLBACK_ARTIST_IMG;
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
              // The dedicated fallback for ALL grid images.
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
                thumb = FALLBACK_ARTIST_IMG;
              }
              const errorKey = ar.id;
              const finalThumb = artistGridImgError[errorKey] ? FALLBACK_ARTIST_IMG : thumb;
              // Universal handler: any error, set to dedicated fallback (one retry only)
              const handleImgError = (e) => {
                if (e.target && !artistGridImgError[errorKey]) {
                  // eslint-disable-next-line no-console
                  console.warn(
                    `Artist grid image failed to load for '${ar.name}': `,
                    e.target.src
                  );
                  setArtistGridImgError((prev) => ({
                    ...prev,
                    [errorKey]: true
                  }));
                  // Set fallback; if for some reason it's not fallback img, force set
                  e.target.src = FALLBACK_ARTIST_IMG;
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
                  // Set directly to robust global fallback on error, always. Only retry this once.
                  if (e.target.src !== FALLBACK_ARTIST_IMG) {
                    e.target.src = FALLBACK_ARTIST_IMG;
                    // eslint-disable-next-line no-console
                    console.warn(
                      `Artist profile image failed to load for '${artist?.strArtist || selectedArtistId}'; falling back to hard fallback image: `,
                      FALLBACK_ARTIST_IMG
                    );
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

        {/* Daft Punk 'Homework' album section */}
        {selectedArtistId === "112024" && (
          <section
            style={{
              margin: "28px auto 0 auto",
              maxWidth: 900,
              padding: "24px 20px",
              background: "#f0adea06",
              borderRadius: "16px",
              minHeight: 86,
              border: album ? "2px solid #f0adea22" : "none"
            }}
          >
            <div style={{ color: "#ea41c3", fontWeight: 700, fontSize: "1.15rem", marginBottom: 9, letterSpacing: 1 }}>
              Album: <span style={{ color: "#100e0e" }}>Homework</span>
            </div>
            {albumLoading ? (
              <div style={{ color: "#e86ac8" }}>Loading album info…</div>
            ) : albumError ? (
              <div style={{ color: "#bb2144" }}>{albumError}</div>
            ) : album ? (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 22, flexWrap: "wrap" }}>
                {album.strAlbumThumb && (
                  <img
                    src={album.strAlbumThumb}
                    alt="Homework Album"
                    style={{
                      width: 106,
                      height: 106,
                      objectFit: "cover",
                      borderRadius: 13,
                      background: "#eee",
                      boxShadow: "0 2px 12px 0 #ea41c322"
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 200, marginTop: 2 }}>
                  <div style={{ fontWeight: 700, fontSize: "1.06em", color: "#902e77" }}>
                    {album.strArtist} – <b>{album.strAlbum}</b>
                    {album.intYearReleased ? (
                      <span style={{ fontWeight: 500, color: "#e86ac8", marginLeft: 7 }}>
                        ({album.intYearReleased})
                      </span>
                    ) : null}
                  </div>
                  <div style={{ color: "#654491", fontSize: ".98em", margin: "7px 0 6px 0" }}>
                    {album.strGenre && <span>{album.strGenre}</span>}
                    {album.strStyle && (
                      <span style={{ marginLeft: 13 }}>Style: {album.strStyle}</span>
                    )}
                  </div>
                  {album.strDescriptionEN && (
                    <div
                      style={{
                        color: "#20202a",
                        fontSize: ".97em",
                        fontWeight: 400,
                        marginTop: 3,
                        maxWidth: 500
                      }}
                    >
                      {album.strDescriptionEN.length > 250
                        ? album.strDescriptionEN.slice(0, 250) + "…"
                        : album.strDescriptionEN}
                    </div>
                  )}
                  {/* If album external links available */}
                  <div style={{ marginTop: 9 }}>
                    {album.strAlbumSTRMIX && (
                      <a
                        href={album.strAlbumSTRMIX}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#fff",
                          background: "#902e77",
                          borderRadius: 6,
                          fontWeight: 600,
                          fontSize: ".98rem",
                          padding: "3px 11px",
                          textDecoration: "none",
                          marginRight: 14
                        }}
                      >
                        Listen on Stream Mix
                      </a>
                    )}
                    {album.strMusicVid && (
                      <a
                        href={album.strMusicVid}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#fff",
                          background: "#ea41c3",
                          borderRadius: 6,
                          fontWeight: 600,
                          fontSize: ".98rem",
                          padding: "3px 11px",
                          textDecoration: "none"
                        }}
                      >
                        Music Video
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        )}

        {/* ---- Track Search Section ---- */}
        <section
          style={{
            margin: "38px auto 0 auto",
            maxWidth: 900,
            padding: "24px 20px",
            background: "#fff7fa",
            borderRadius: "18px",
            border: "2px solid #f0adea14",
            marginTop: 34
          }}
        >
          <form
            onSubmit={async e => {
              e.preventDefault();
              if (
                !trackSearchArtist.trim() ||
                !trackSearchTitle.trim()
              ) {
                setTrackSearchError("Please enter both artist and song title.");
                setTrackSearchResult(null);
                return;
              }
              setTrackSearchError("");
              setTrackSearchLoading(true);
              setTrackSearchResult(null);
              try {
                const queryArtist = encodeURIComponent(trackSearchArtist.trim());
                const queryTitle = encodeURIComponent(trackSearchTitle.trim());
                const apiUrl = `https://www.theaudiodb.com/api/v1/json/2/searchtrack.php?s=${queryArtist}&t=${queryTitle}`;
                const resp = await fetch(apiUrl);
                if (!resp.ok) {
                  throw new Error("Network/API error during track lookup.");
                }
                const data = await resp.json();
                if (data && Array.isArray(data.track) && data.track.length > 0) {
                  setTrackSearchResult(data.track[0]);
                  setTrackSearchError("");
                } else {
                  setTrackSearchResult(null);
                  setTrackSearchError("No matching track was found.");
                }
              } catch (err) {
                setTrackSearchResult(null);
                setTrackSearchError("Failed to fetch track info.");
                // eslint-disable-next-line no-console
                console.error("[Track Search] exception:", err);
              } finally {
                setTrackSearchLoading(false);
              }
            }}
            style={{
              marginBottom: 22,
              width: "100%",
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center"
            }}
            role="search"
            autoComplete="off"
          >
            <input
              type="text"
              placeholder="Artist (e.g. Coldplay)"
              value={trackSearchArtist}
              onChange={e => setTrackSearchArtist(e.target.value)}
              style={{
                flex: "1 1 190px",
                minWidth: 120,
                padding: "11px 14px",
                border: "2px solid #f0adea",
                borderRadius: 7,
                fontSize: "1rem",
                fontWeight: 500,
                outline: "none",
                background: "#fbf9f9",
                color: "#100e0e",
                marginBottom: 6
              }}
              aria-label="Search by artist"
              required
            />
            <input
              type="text"
              placeholder="Song Title (e.g. Yellow)"
              value={trackSearchTitle}
              onChange={e => setTrackSearchTitle(e.target.value)}
              style={{
                flex: "1 1 190px",
                minWidth: 120,
                padding: "11px 14px",
                border: "2px solid #f0adea",
                borderRadius: 7,
                fontSize: "1rem",
                fontWeight: 500,
                outline: "none",
                background: "#fbf9f9",
                color: "#100e0e",
                marginBottom: 6
              }}
              aria-label="Search by track title"
              required
            />
            <button
              type="submit"
              style={{
                padding: "11px 26px",
                minWidth: 100,
                fontSize: "1.03em",
                fontWeight: 700,
                border: "none",
                background: "#f0adea",
                color: "#fff",
                borderRadius: 7,
                cursor: "pointer"
              }}
              disabled={trackSearchLoading}
            >
              {trackSearchLoading ? "Searching…" : "Search"}
            </button>
          </form>
          <div>
            {/* Status or Error UI */}
            {trackSearchLoading && (
              <div style={{
                color: "#ea41c3",
                fontWeight: 600,
                marginBottom: 7
              }}>
                Searching for track…
              </div>
            )}
            {trackSearchError && (
              <div style={{
                color: "#bb2144",
                fontWeight: 600,
                marginBottom: 7
              }}>
                {trackSearchError}
              </div>
            )}
            {/* Track Search Results */}
            {trackSearchResult && (
              <div
                style={{
                  display: "flex",
                  gap: 23,
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  marginTop: 4,
                  background: "#f0adea11",
                  borderRadius: 12,
                  padding: "14px 14px 14px 0"
                }}
              >
                <div>
                  <img
                    src={
                      trackSearchResult.strTrackThumb ||
                      trackSearchResult.strTrack3dCase ||
                      trackSearchResult.strAlbumThumb ||
                      trackSearchResult.strArtistThumb ||
                      PLACEHOLDER_IMG
                    }
                    alt={`${trackSearchResult.strTrack} cover`}
                    style={{
                      width: 110,
                      height: 110,
                      objectFit: "cover",
                      borderRadius: 10,
                      marginRight: 12,
                      background: "#f0adea33"
                    }}
                    onError={e => { if (e.target.src !== PLACEHOLDER_IMG) e.target.src = PLACEHOLDER_IMG; }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{
                    color: "#ea41c3",
                    fontWeight: 700,
                    fontSize: "1.19em",
                    marginBottom: 4
                  }}>
                    {trackSearchResult.strTrack || "Untitled Track"}
                  </div>
                  <div style={{ color: "#100e0e", fontWeight: 600, fontSize: ".98em" }}>
                    {trackSearchResult.strArtist}
                  </div>
                  <div style={{ fontSize: ".98em", color: "#902e77" }}>
                    {trackSearchResult.strAlbum && (
                      <span>
                        Album: <b>{trackSearchResult.strAlbum}</b>
                        {trackSearchResult.intYearReleased && (
                          <span style={{ color: "#e86ac8", marginLeft: 9 }}>
                            ({trackSearchResult.intYearReleased})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: ".96em",
                    color: "#a9577c",
                    margin: "7px 0"
                  }}>
                    {trackSearchResult.strGenre && <span>Genre: {trackSearchResult.strGenre}</span>}
                  </div>
                  <div style={{
                    fontFamily: "monospace, 'Menlo', 'Courier New', monospace",
                    fontSize: "1.02em",
                    marginTop: 9,
                    whiteSpace: "pre-line",
                    color: "#100e0e"
                  }}>
                    {trackSearchResult.strLyrics
                      ? (trackSearchResult.strLyrics.length > 560
                        ? trackSearchResult.strLyrics.slice(0, 560) + "…"
                        : trackSearchResult.strLyrics)
                      : (
                        <span style={{ color: "#ce7ea8", fontWeight: 500 }}>
                          Lyrics not found for this track.
                        </span>
                      )
                    }
                  </div>
                  {/* Bonus: external links */}
                  <div style={{ marginTop: 8 }}>
                    {trackSearchResult.strMusicVid && (
                      <a
                        href={trackSearchResult.strMusicVid}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: "#100e0e",
                          color: "#fff",
                          padding: "7px 13px",
                          borderRadius: 6,
                          fontWeight: 600,
                          textDecoration: "none",
                          fontSize: "0.98rem",
                          marginRight: 10
                        }}
                      >
                        ▶ Watch Music Video
                      </a>
                    )}
                    {trackSearchResult.strYoutube && (
                      <a
                        href={trackSearchResult.strYoutube}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: "#ea41c3",
                          color: "#fff",
                          padding: "7px 13px",
                          borderRadius: 6,
                          fontWeight: 600,
                          textDecoration: "none",
                          fontSize: "0.98rem",
                          marginRight: 10
                        }}
                      >
                        ▶ YouTube
                      </a>
                    )}
                    {trackSearchResult.strTrack || trackSearchResult.strArtist ? (
                      <a
                        href={`https://theaudiodb.com/track/${trackSearchResult.idTrack}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: "#f0adea",
                          color: "#fff",
                          padding: "6px 11px",
                          borderRadius: 6,
                          fontWeight: 600,
                          textDecoration: "none",
                          fontSize: "0.93rem"
                        }}
                      >
                        More Info
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>
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
                {"Loading lyrics and details..."}
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

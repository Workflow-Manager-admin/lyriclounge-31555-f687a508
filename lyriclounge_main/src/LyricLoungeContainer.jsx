import React, { useEffect, useState } from "react";

/**
 * LyricLounge Main Container
 * Features:
 *  - Search bar (filter music videos as proxy for songs)
 *  - Fetch & display artist info and image (TheAudioDB)
 *  - List and select music videos
 *  - Show lyrics display area (placeholder)
 *  - Modern, music-themed layout, color theme: primary #f0adea, secondary #fbf9f9, accent #100e0e
 */

// PUBLIC_INTERFACE
function LyricLoungeContainer() {
  // Constants for APIs and styling
  const THEAUDIODB_APIKEY = "2";
  const ARTIST_ID = "112024"; // Coldplay as sample artist
  const ARTIST_DETAILS_API = `https://www.theaudiodb.com/api/v1/json/${THEAUDIODB_APIKEY}/artist.php?i=${ARTIST_ID}`;
  const ARTIST_IMAGE_URL =
    "https://www.theaudiodb.com/images/media/artist/thumb/xxtwus1340291734.jpg";
  const MUSIC_VIDEOS_API = `https://theaudiodb.com/api/v1/json/2/mvid.php?i=${ARTIST_ID}`;

  // State
  const [artist, setArtist] = useState(null);
  const [musicVideos, setMusicVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch artist info and music video list
  useEffect(() => {
    // PUBLIC_INTERFACE
    async function fetchData() {
      setLoading(true);
      setError("");
      let artistData = null;
      let musicVideosData = null;
      let loadError = "";

      // Fetch artist info
      try {
        const artistResp = await fetch(ARTIST_DETAILS_API);
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
        const mvResp = await fetch(MUSIC_VIDEOS_API);
        if (!mvResp.ok) {
          throw new Error(`Music video fetch failed: HTTP ${mvResp.status}`);
        }
        const mvJson = await mvResp.json();
        musicVideosData = mvJson?.mvids || [];
      } catch (err) {
        loadError += (loadError ? " " : "") + "Sorry, failed to load music videos.";
      }

      setArtist(artistData);
      setMusicVideos(musicVideosData || []);
      // Select the first available music video, or clear if none.
      if (musicVideosData && musicVideosData.length > 0) {
        setSelectedVideo(musicVideosData[0]);
      } else {
        setSelectedVideo(null);
      }

      setError(loadError);
      setLoading(false);
    }

    fetchData();
    // eslint-disable-next-line
  }, []);

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

  return (
    <div className="ll-main"
      style={{
        fontFamily: "'Inter','Roboto','Helvetica',sans-serif",
        minHeight: "100vh",
        background: "#fbf9f9",
        color: "#100e0e",
        paddingBottom: 32,
        boxSizing: "border-box"
      }}>
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
        <div className="ll-container" style={{
          maxWidth: 990,
          margin: "0 auto",
          padding: "0 20px",
          display: "flex",
          alignItems: "center"
        }}>
          <div className="ll-logo" style={{
            display: "flex",
            alignItems: "center",
            fontWeight: 700,
            fontSize: "1.4rem",
            color: "#100e0e",
            letterSpacing: "-1px"
          }}>
            <MusicIcon />
            LyricLounge
          </div>
        </div>
      </nav>

      <main>
        {/* Artist Info */}
        <section
          style={{
            margin: "0 auto",
            maxWidth: 900,
            padding: "36px 20px 16px 20px",
            display: "flex",
            gap: 32,
            flexWrap: "wrap",
            borderRadius: "20px",
            background: "#f0adea05",
            alignItems: "flex-start",
            marginTop: 22
          }}>
          {loading ? (
            <div style={{
              color: "#f0adea",
              fontSize: "1.2rem",
              width: "100%",
              textAlign: "center"
            }}>
              Loading artist information...
            </div>
          ) : !artist ? (
            <div style={{ color: "#fa3a62", width: "100%", fontWeight: 500 }}>
              {error || "Artist information not available at this time."}
            </div>
          ) : (
            <>
              <img
                src={ARTIST_IMAGE_URL}
                alt={artist?.strArtist || "Artist"}
                style={{
                  borderRadius: 20,
                  width: 128,
                  height: 128,
                  objectFit: "cover",
                  boxShadow: "0 2px 20px 0 #f0adea33"
                }}
              />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{
                  fontWeight: 600,
                  color: "#f0adea",
                  marginBottom: 2,
                  letterSpacing: "0.2px",
                  fontSize: "1rem"
                }}>
                  {artist.strGenre || "Genre Unk."}
                  {" • "}
                  {artist.intFormedYear || "--"}
                  {" • "}
                  {artist.strCountry || ""}
                </div>
                <h1 style={{
                  fontSize: "2.2rem",
                  margin: "4px 0",
                  color: "#100e0e",
                  fontWeight: 700,
                  letterSpacing: "-1px"
                }}>
                  {artist.strArtist || "Unknown Artist"}
                </h1>
                <div style={{
                  fontSize: "1rem",
                  margin: "8px 0",
                  color: "#3f2044",
                  lineHeight: 1.45
                }}>
                  {artist?.strBiographyEN
                    ? artist.strBiographyEN.substring(0, 240) + (artist.strBiographyEN.length > 240 ? "…" : "")
                    : ""}
                </div>
                {artist?.strWebsite && (
                  <a
                    href={artist.strWebsite.match(/^https?:\/\//)
                      ? artist.strWebsite
                      : "https://" + artist.strWebsite}
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
                    }}>
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
            <div style={{
              fontWeight: 700,
              fontSize: "1.2rem",
              color: "#f0adea",
              marginBottom: 13,
              letterSpacing: 0,
              textTransform: "uppercase"
            }}>
              Select a Song / Music Video
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 22,
              minHeight: 42
            }}>
              {loading ? (
                <div style={{ color: "#100e0e9a", gridColumn: "1/-1" }}>Loading songs…</div>
              ) : error && musicVideos.length === 0 ? (
                <div style={{ color: "#fa3a62", gridColumn: "1/-1" }}>
                  {error.includes("music videos")
                    ? "Sorry, failed to load music videos. Try reloading the page."
                    : error}
                </div>
              ) : filteredVideos.length === 0 ? (
                <div style={{ color: "#100e0e99", gridColumn: "1/-1" }}>No results found.</div>
              ) : (
                filteredVideos.map((video) => (
                  <button
                    key={video.idTrack}
                    onClick={() => handleVideoSelect(video)}
                    style={{
                      background: selectedVideo?.idTrack === video.idTrack
                        ? "linear-gradient(100deg,#f0adea33,#f0adea88 90%)"
                        : "#fff",
                      border: selectedVideo?.idTrack === video.idTrack
                        ? "2.6px solid #f0adea"
                        : "2px solid #ded3d6",
                      borderRadius: 13,
                      padding: 0,
                      cursor: "pointer",
                      outline: "none",
                      boxShadow: selectedVideo?.idTrack === video.idTrack
                        ? "0 4px 18px 0 #f0adea28"
                        : "0 2px 10px #100e0e06",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      transition: "border 0.15s, box-shadow 0.18s, background 0.15s",
                      marginBottom: 2,
                    }}
                    aria-label={`Select ${video.strTrack}`}
                  >
                    <img
                      src={video.strTrackThumb || video.strTrack3dCase || ARTIST_IMAGE_URL}
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
                    <div style={{ padding: "12px 13px 13px 13px", textAlign: "left", width: "100%" }}>
                      <div style={{
                        fontWeight: 600,
                        fontSize: "1.08em",
                        color: "#100e0e"
                      }}>{video.strTrack}</div>
                      {video.intYearReleased && (
                        <div style={{
                          color: "#f0adea",
                          fontSize: "0.98em",
                          fontWeight: 500,
                          marginBottom: 2
                        }}>
                          {video.intYearReleased}
                        </div>
                      )}
                      {video.strAlbum && (
                        <div style={{
                          color: "#6a447a",
                          fontSize: "0.97em",
                        }}>
                          {video.strAlbum}
                        </div>
                      )}
                      {video.strDescriptionEN && (
                        <div style={{
                          fontSize: "0.89em",
                          color: "#100e0e99",
                          marginTop: 6
                        }}>
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

        {/* Lyrics Display Area */}
        <section style={{
          margin: "34px auto 0 auto",
          maxWidth: 900,
          padding: "18px 22px",
          background: "#f0adea11",
          borderRadius: 18,
          minHeight: 154
        }}>
          <div style={{
            marginBottom: 16,
            fontWeight: 700,
            fontSize: "1.13rem",
            color: "#f0adea",
            display: "flex",
            alignItems: "center",
          }}>
            <span role="img" aria-label="Lyrics" style={{ fontSize: 21, marginRight: 9 }}>📝</span>
            Lyrics
          </div>
          <div style={{
            fontFamily: "monospace, 'Menlo', 'Courier New', monospace",
            fontSize: "1.15rem",
            background: "#fff",
            color: "#100e0e",
            minHeight: 80,
            borderRadius: 9,
            padding: "20px 20px 19px 20px",
            boxShadow: "0 1.5px 10px 0 #f0adea12",
            letterSpacing: "0.03em",
            wordBreak: "break-word"
          }}>
            {
              !selectedVideo
                ? "Please select a song to view its lyrics."
                : <span style={{ color: "#c26293" }}>[Lyrics Placeholder]</span>
            }
            {/* You can integrate lyrics-fetching API here in the future. */}
          </div>
          {/* Bonus: Link to the music video */}
          {selectedVideo && (
            <div style={{ marginTop: 13 }}>
              <a
                href={selectedVideo.strMusicVid || selectedVideo.strYoutube}
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

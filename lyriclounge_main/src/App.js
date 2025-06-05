import React, { useEffect, useState } from 'react';
import './App.css';

// PUBLIC_INTERFACE
function App() {
  // State hooks for artist details and music videos
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [musicVideos, setMusicVideos] = useState([]);
  const [error, setError] = useState(null);

  // Configure TheAudioDB APIKEY for artist details endpoint
  const THEAUDIODB_APIKEY = '2'; // Default public API key, can be changed for a private one if needed
  const ARTIST_ID = '112024';    // 112024 = Coldplay

  // API Endpoints
  const ARTIST_DETAILS_API = `https://www.theaudiodb.com/api/v1/json/${THEAUDIODB_APIKEY}/artist.php?i=${ARTIST_ID}`;
  const ARTIST_IMAGE_URL = 'https://www.theaudiodb.com/images/media/artist/thumb/xxtwus1340291734.jpg';
  const MUSIC_VIDEOS_API = `https://theaudiodb.com/api/v1/json/2/mvid.php?i=${ARTIST_ID}`; // APIKEY=2 is public read key.

  // Fetch artist info & music videos on mount
  useEffect(() => {
    async function fetchResources() {
      try {
        setLoading(true);
        // Fetch artist details
        const [artistRes, mvRes] = await Promise.all([
          fetch(ARTIST_DETAILS_API),
          fetch(MUSIC_VIDEOS_API)
        ]);
        const artistJson = await artistRes.json();
        const mvJson = await mvRes.json();

        setArtist(artistJson?.artists?.[0] || null);
        setMusicVideos(mvJson?.mvids || []);
      } catch (err) {
        setError('Failed to load artist data or music videos.');
      } finally {
        setLoading(false);
      }
    }
    fetchResources();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="app">
      <nav className="navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo">
              <span className="logo-symbol">🎵</span> LyricLounge
            </div>
            <button className="btn">Log In</button>
          </div>
        </div>
      </nav>

      <main>
        <div className="container">
          <div className="hero" style={{ minHeight: '180px', alignItems: 'flex-start', marginTop: '24px' }}>
            {loading && (<div className="subtitle" style={{ textAlign: 'center', width: '100%' }}>Loading artist info...</div>)}
            {error && (<div style={{ color: '#E87A41', width: '100%' }}>{error}</div>)}

            {!loading && artist && (
              <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', width: '100%', flexWrap: 'wrap' }}>
                <div>
                  <img
                    src={ARTIST_IMAGE_URL}
                    alt={artist.strArtist}
                    style={{
                      borderRadius: '16px',
                      objectFit: 'cover',
                      width: '170px',
                      boxShadow: '0 3px 16px 0 #0004'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="subtitle">{artist.strGenre} - {artist.intFormedYear} - {artist.strCountry}</div>
                  <h1 className="title" style={{ fontSize: '2.25rem', margin: 0 }}>{artist.strArtist}</h1>
                  <div className="description" style={{ marginBottom: 8 }}>{artist.strBiographyEN?.substring(0, 400)}{artist.strBiographyEN?.length > 400 ? '…' : ''}</div>
                  {artist.strWebsite &&
                    <a
                      href={'https://' + artist.strWebsite.replace(/^https?:\/\//, '')}
                      className="btn"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ marginTop: 8 }}
                    >
                      Official Website
                    </a>}
                </div>
              </div>
            )}
          </div>

          <section style={{ marginTop: 32 }}>
            <h2 style={{ color: 'var(--base-light)', fontSize: '2rem' }}>
              Music Videos
            </h2>
            {loading ? (
              <div style={{ margin: '36px 0' }}>Loading videos…</div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
                gap: '32px',
                marginTop: '24px'
              }}>
                {musicVideos.length === 0 && !loading && (
                  <div>No music videos found for this artist.</div>
                )}
                {musicVideos.map(video => (
                  <div key={video.idTrack} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '12px',
                  }}>
                    <a
                      href={video.strMusicVid || video.strYoutube}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={video.strTrackThumb || video.strTrack3dCase || ARTIST_IMAGE_URL}
                        alt={video.strTrack}
                        style={{
                          width: '100%',
                          minWidth: '120px',
                          maxWidth: '220px',
                          borderRadius: '8px',
                          marginBottom: '8px',
                          objectFit: 'cover'
                        }}
                      />
                    </a>
                    <span style={{ fontWeight: 600, fontSize: '1.1em', color: 'var(--text-color)' }}>{video.strTrack}</span>
                    {video.intYearReleased && (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.95em', marginBottom: 2 }}>
                        {video.intYearReleased}
                      </span>
                    )}
                    {video.strDescriptionEN && (
                      <span style={{
                        fontSize: '0.92em',
                        color: 'var(--text-secondary)',
                        marginTop: 6
                      }}>
                        {video.strDescriptionEN.substring(0, 90)}{video.strDescriptionEN.length > 90 ? "…" : ""}
                      </span>
                    )}
                    <a
                      href={video.strMusicVid || video.strYoutube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                      style={{ marginTop: 10, fontSize: '0.97em' }}
                      aria-label={`Watch ${video.strTrack} video`}
                    >
                      Watch Video
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;

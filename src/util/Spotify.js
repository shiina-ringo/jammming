let accessToken = '';
const clientID = '4e3184b97e664111b6afe7649f560c4b';
const redirectURI = 'https://shiina-ringo.surge.sh/';

const Spotify = {
  getAccessToken() {
    if (accessToken) {
      return accessToken;
    }

    let href = window.location.href;
    let accessTokenMatch = href.match('access_token=([^&]*)');
    let expirationTimeMatch = href.match('expires_in=([^&]*)');
    if (accessTokenMatch && expirationTimeMatch) {
      accessToken = accessTokenMatch[1];
      window.setTimeout(() => accessToken = '', expirationTimeMatch[1] * 1000);
      window.history.pushState('Access Token', null, '/');
      return accessToken;
    }
    
    window.location = 'https://accounts.spotify.com/authorize?client_id=' + clientID +
      '&response_type=token&scope=playlist-modify-public&redirect_uri=' + redirectURI;
  },

  search(searchTerm) {
    let token = this.getAccessToken();

    return fetch('https://api.spotify.com/v1/search?type=track&q=' + searchTerm, {
      headers: {'Authorization': 'Bearer ' + token}
    }).then(response => {
      return response.json();
    }).then(jsonResponse => {
      if (jsonResponse.tracks) {
	return jsonResponse.tracks.items.map(track => {
	  return {
	    id: track.id,
	    name: track.name,
	    artist: track.artists[0].name,
	    album: track.album.name,
	    uri: track.uri
	  };
	});
      } else {
	return [];
      }
    })
  },

  async savePlaylist(playlistName, trackURIs) {
    if (!playlistName || !trackURIs) return;

    let token = this.getAccessToken();

    let response = await fetch('https://api.spotify.com/v1/me', {
      headers: {'Authorization': 'Bearer ' + token}
    });
    let jsonResponse = await response.json();
    let userID = jsonResponse.id;

    response = await fetch('https://api.spotify.com/v1/users/' + userID + '/playlists', {
      headers: {
	'Authorization': 'Bearer ' + token,
	'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({name: playlistName})
    });
    jsonResponse = await response.json();
    let playlistID = jsonResponse.id;

    response = await fetch('https://api.spotify.com/v1/users/' + userID + '/playlists/' + playlistID + '/tracks', {
      headers: {
	'Authorization': 'Bearer ' + token,
	'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({uris: trackURIs})
    });
    jsonResponse = await response.json();
  }
};

export default Spotify;

/**
 * itunes.js Node API (v2.1.0)
 *
 * Copyright (c) 2019 Logan Savage.
 * Licensed Under the MIT License.
 *
 * To run, this file requires:
 * The `./applescript` folder, along with its contained scripts
 * The `macos-version` module from npm
 */

const OSA = require('node-osascript')
const itom = require('macos-version').is('>=10.15') ? 'Music' : 'iTunes'

module.exports = {
  /** Plays if the player is paused, or pauses if the player is playing */
  playPause: async() => new Promise(resolve => {
    OSA.execute(`tell application "${itom}" to playpause`, () => resolve())
  }),

  /** Goes to the previous song */
  gotoPrevious: async() => new Promise(resolve => {
    OSA.execute(`tell application "${itom}" to previous track`, () => resolve())
  }),

  /** Skips the current song, goes to the next song */
  gotoNext: async() => new Promise(resolve => {
    OSA.execute(`tell application "${itom}" to next track`, () => resolve())
  }),

  /**
   * Gets a specific piece of metadata on the song currently playing
   * @param {string} name The name of the parameter wanted. Options include: 'name', 'artist', and 'album'.
   * @param {boolean} isVerbose Whether to print debug output or not.
   */
  get: async(name, isVerbose) => new Promise((resolve, reject) => {
    let isValidKey = name === 'name' || name === 'artist' || name === 'album'

    if (typeof isVerbose === 'boolean' && isVerbose && isValidKey) {
      console.log(`Valid string recieved: ${name}`)
    }
    else if (typeof isVerbose === 'boolean' && isVerbose) {
      console.log(`Invalid string recieved: ${name}`)
    }
    if (typeof name === 'string' && isValidKey) {
      OSA.execute(
        `tell application "${itom}" to get the ${name} of the current track`,
        (error, output) => resolve(output, error)
      )
    }
    else reject(`[${itom}] [Error] Invalid input.`)
  }),

  /**
   * Gets all the metadata for the specific song
   */
  getMetadata: async() => new Promise((resolve, reject) => {
    let filename = `${__dirname}/applescript/metadata.${ itom === 'Music'
      ? 'music.'
      : ''
    }applescript`
    OSA.executeFile(filename, (err, meta) => {
      if (err) reject(err)
      try {
        if (typeof meta !== 'undefined' && typeof meta !== 'null') {
          let response = {
            name: meta[0],
            artist: meta[1],
            album: meta[2],
            year: meta[3],
            albumArtist: meta[4],
            bpm: meta[5],
            composer: meta[6],
            genre: meta[7],
            length: meta[8],
            progress: meta[9],
            trackNumber: meta[10]
          }
          resolve(response)
        }
      }
      catch(err) {
        reject('No song is currently playing')
      }
    })
  }),

  /**
   * Gets the metadata of every song in the specified playlist.
   * @param {string} name The name of the playlist.
   */
  getPlaylistMetadata: async(name) => new Promise((resolve, reject) => {
    let filename = `${__dirname}/applescript/metadata.playlist.${ itom === 'Music'
    ? 'music.'
    : ''
  }applescript`
    OSA.executeFile(filename, { playlistName: name }, (error, meta) => {
      if (error) reject(error)
      resolve(meta)
    })
  }),

  /**
   * Gets the playpause state of the player
   */
  getPlayerState: async() => new Promise((resolve, reject) => {
    OSA.execute(`tell application "${itom}" to get player state as text`, (error, output) => {
      if (error) reject(error)
      resolve(output === 'playing')
    })
  }),

  /**
   * Activates the player
   */
  activate: async() => new Promise((resolve, reject) => {
    OSA.execute(
      `tell application "${itom}" to activate`,
      error => error ? reject(error.message) : resolve()
    )
  }),

  /**
   * Plays the song specified
   * @param {SongObject} options The metadata of the song to be played.
   */
  playSong: async(options) => new Promise((resolve, reject) => {
    let isNotNullName   = typeof options.name   !== 'undefined'
    let isNotNullArtist = typeof options.artist !== 'undefined'
    let isNotNullAlbum  = typeof options.album  !== 'undefined'

    // Add the song name tag if it isn't null
    let responseName = isNotNullName
      ? `name is "${options.name}"`
      : ''

    // Add the artist tag if it isn't null
    let responseArtist = isNotNullArtist
      ? `${isNotNullName
            ? ' and '
            : ' '
        }artist is "${options.artist}"`
      : ''

    // Add the album tag if it isn't null
    let responseAlbum = isNotNullAlbum
      ? `${(isNotNullName || isNotNullArtist)
            ? ' and '
            : ' '
        }album is "${options.album}"`
      : ''

    if (isNotNullName || isNotNullArtist || isNotNullAlbum) {
      try {
        // Concatenate all of the non-null tags generated above to create an AppleScript
        //   command to be executed on the target
        OSA.execute(
          `tell application "${itom}" to play (first track whose ${responseName} ${responseArtist} ${responseAlbum})`,
          error => error ? reject(error.message) : resolve()
        )
      }
      catch(e) { reject(e) }
    }
    else {
      // Throw an error if no information is given
      reject(`[${itom}] [Error] Not enough info in options, requires "name", "artist", or "album".`)
    }
  }),

  /**
   * Plays the playlist specified.
   * @param {String} name The name of the playlist to play
   */
  playPlaylist: async(name) => new Promise((resolve, reject) => {
    OSA.execute(
      `tell application "${itom}" to play playlist "${name}"`,
      error => error ? reject(error.message) : resolve()
    )
  }),

  /**
   * Adds the specified song to the end of the specified playlist.
   * @param {Object} songObject The metadata object (from .getMetadata()) of the song to add
   * @param {String} playlist The name of the playlist to add the song to
   */
  addToPlaylist: async(songObject, playlist) => new Promise((resolve, reject) => {
    OSA.execute(
      `tell application "${itom}" to add (get the location of the first track whose name is "${songObject.name}" and artist is "${songObject.artist}" and album is "${songObject.album}") to playlist "${playlist}"`,
      error => error ? reject(error.message) : resolve()
    )
  })
}

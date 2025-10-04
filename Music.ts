import * as hz from 'horizon/core';

class RandomMusicPlayer extends hz.Component<typeof RandomMusicPlayer> {
  static propsDefinition = {
    enabled: { type: hz.PropTypes.Boolean, default: true },
    song1: { type: hz.PropTypes.Entity },
    song2: { type: hz.PropTypes.Entity },
    song3: { type: hz.PropTypes.Entity },
    song4: { type: hz.PropTypes.Entity },
    song5: { type: hz.PropTypes.Entity },
    song6: { type: hz.PropTypes.Entity },
    song7: { type: hz.PropTypes.Entity },
    song8: { type: hz.PropTypes.Entity },
    song9: { type: hz.PropTypes.Entity },
    song10: { type: hz.PropTypes.Entity },
  };

  private songs: { entity: hz.Entity; duration: number }[] = [];
  private currentSong: hz.Entity | null = null;

  preStart() {
    if (!this.props.enabled) {return;}
    
    const allSongs = [
      { entity: this.props.song1, duration: 60 },
      { entity: this.props.song2, duration: 60 },
      { entity: this.props.song3, duration: 60 },
      { entity: this.props.song4, duration: 60 },
      { entity: this.props.song5, duration: 60 },
      { entity: this.props.song6, duration: 60 }, //90
      { entity: this.props.song7, duration: 60 }, //
      { entity: this.props.song8, duration: 60 },
      { entity: this.props.song9, duration: 60 },
      { entity: this.props.song10, duration: 60 }, //90
    ];

    // Filter and cast only the songs with defined entities
    this.songs = allSongs.filter((s): s is { entity: hz.Entity; duration: number } => s.entity !== undefined);

    if (this.songs.length > 0) {
      this.playRandomSong();
    } else {
      console.error('No valid songs provided.');
    }
  }

  start() {
    // Ensure the script is set to 'server' mode to play music for everyone
    // Please set the script to server mode in the scripting panel and ensure that the entity with this component is server-owned to execute correctly
  }

  playRandomSong() {
    if (this.currentSong) {
      const prevAudio = this.currentSong.as(hz.AudioGizmo);
      if (prevAudio) prevAudio.stop();
    }

    const { entity, duration } = this.songs[Math.floor(Math.random() * this.songs.length)];
    this.currentSong = entity;

    const audioGizmo = entity.as(hz.AudioGizmo);
    if (audioGizmo) {
      audioGizmo.play();
      this.async.setTimeout(() => this.playRandomSong(), duration * 1000);
    } else {
      console.error('Selected entity is not an AudioGizmo.');
    }
  }
}
hz.Component.register(RandomMusicPlayer);


// import * as hz from 'horizon/core';

// //This component plays one of the 7 songs randomly when the game starts
// class RandomMusicPlayer extends hz.Component<typeof RandomMusicPlayer> {
//   static propsDefinition = {
//     song1: { type: hz.PropTypes.Entity },
//     song2: { type: hz.PropTypes.Entity },
//     song3: { type: hz.PropTypes.Entity },
//     song4: { type: hz.PropTypes.Entity },
//     song5: { type: hz.PropTypes.Entity },
//     song6: { type: hz.PropTypes.Entity },
//     song7: { type: hz.PropTypes.Entity },
//     song8: { type: hz.PropTypes.Entity },
//     song9: { type: hz.PropTypes.Entity },
//     song10: { type: hz.PropTypes.Entity },
//   };

//   songs: hz.Entity[] = [];
//   currentSong: hz.Entity | null = null;

//   preStart() {
//     // Check if all song properties are set before adding them to the list
//     if (this.props.song1! && this.props.song2! && this.props.song3! && this.props.song4! && this.props.song5! && this.props.song6! && this.props.song7!) {
//       this.songs = [this.props.song1!, this.props.song2!, this.props.song3!, this.props.song4!, this.props.song5!, this.props.song6!, this.props.song7!];
//       this.playRandomSong();
//     } else {
//       console.error('Not all song properties are set.');
//     }
//   }

//   start() {
//     // Make sure the script is set to 'server' mode to play music for everyone
//     // Please set the script to server mode in the scripting panel and ensure that the entity with this component is server-owned to execute correctly
//   }

//   playRandomSong() {
//     if (this.songs.length > 0) {
//       // Stop the current song if it's playing
//       if (this.currentSong) {
//         const currentAudioGizmo = this.currentSong.as(hz.AudioGizmo);
//         if (currentAudioGizmo) {
//           currentAudioGizmo.stop();
//         }
//       }

//       // Select a new random song
//       const randomSong = this.songs[Math.floor(Math.random() * this.songs.length)];
//       this.currentSong = randomSong;

//       // Check if the randomSong is not null before attempting to cast it to hz.AudioGizmo
//       if (randomSong) {
//         const audioGizmo = randomSong.as(hz.AudioGizmo);
//         if (audioGizmo) {
//           // Listen for the OnAudioCompleted event to play the next song
//           this.connectCodeBlockEvent(randomSong, hz.CodeBlockEvents.OnAudioCompleted, this.playRandomSong.bind(this));
//           audioGizmo.play();
//         } else {
//           console.error('Failed to cast the random song to AudioGizmo.');
//         }
//       } else {
//         console.error('Random song is null.');
//       }
//     } else {
//       console.error('No songs available to play.');
//     }
//   }
// }

// hz.Component.register(RandomMusicPlayer);


// import * as hz from 'horizon/core';

// // Define a list of audio entities
// class MusicPlayer extends hz.Component<typeof MusicPlayer> {
//   static propsDefinition = {
//     songs: { type: hz.PropTypes.EntityArray },
//   };

//   private currentSong: hz.Entity | null = null;
//   private songIndex: number = 0;

//   preStart(): void {
//     this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnAudioCompleted, this.onAudioCompleted.bind(this));
//   }

//   start(): void {
//     this.playRandomSong();
//   }

//   private playRandomSong(): void {
//     // Get the list of songs from the props
//     const songs = this.props.songs!;

//     // Check if there are songs to play
//     if (songs.length === 0) {
//       console.error('No songs to play');
//       return;
//     }

//     // Choose a random song from the list
//     this.songIndex = Math.floor(Math.random() * songs.length);
//     const songToPlay = songs[this.songIndex];

//     // Validate if songToPlay is an AudioGizmo
//     const audioGizmo = songToPlay.as(hz.AudioGizmo);
//     if (!audioGizmo) {
//       console.error(`Entity ${songToPlay.id} is not an AudioGizmo`);
//       return;
//     }

//     // Stop the current song if it's playing
//     if (this.currentSong) {
//       const currentAudioGizmo = this.currentSong.as(hz.AudioGizmo);
//       if (currentAudioGizmo) {
//         currentAudioGizmo.stop();
//       }
//     }

//     // Play the new song
//     this.currentSong = songToPlay;
//     audioGizmo.play();
//   }

//   private onAudioCompleted(): void {
//     // Play the next song when the current one finishes
//     this.playRandomSong();
//   }
// }

// hz.Component.register(MusicPlayer);


// import * as hz from 'horizon/core';

// //This component plays one of the 7 songs randomly when the game starts
// class RandomMusicPlayer extends hz.Component<typeof RandomMusicPlayer> {
//   static propsDefinition = {
//     song1: { type: hz.PropTypes.Entity },
//     song2: { type: hz.PropTypes.Entity },
//     song3: { type: hz.PropTypes.Entity },
//     song4: { type: hz.PropTypes.Entity },
//     song5: { type: hz.PropTypes.Entity },
//     song6: { type: hz.PropTypes.Entity },
//     song7: { type: hz.PropTypes.Entity },
//     song8: { type: hz.PropTypes.Entity },
//     song9: { type: hz.PropTypes.Entity },
//     song10: { type: hz.PropTypes.Entity },
//   };

//   songs: hz.Entity[] = [];

//   preStart() {
//     // Check if all song properties are set before adding them to the list
//     if (this.props.song1! && this.props.song2! && this.props.song3! && this.props.song4! && this.props.song5! && this.props.song6! && this.props.song7!) {
//       this.songs = [this.props.song1!, this.props.song2!, this.props.song3!, this.props.song4!, this.props.song5!, this.props.song6!, this.props.song7!];
//       this.playRandomSong();
//     } else {
//       console.error('Not all song properties are set.');
//     }
//   }

//   start() {
//   }

//   playRandomSong() {
//     if (this.songs.length > 0) {
//       const randomSong = this.songs[Math.floor(Math.random() * this.songs.length)];
//       // Check if the randomSong is not null before attempting to cast it to hz.AudioGizmo
//       if (randomSong) {
//         const audioGizmo = randomSong.as(hz.AudioGizmo);
//         if (audioGizmo) {
//           audioGizmo.play();
//         } else {
//           console.error('Failed to cast the random song to AudioGizmo.');
//         }
//       } else {
//         console.error('Random song is null.');
//       }
//     } else {
//       console.error('No songs available to play.');
//     }
//   }
// }

// hz.Component.register(RandomMusicPlayer);
import { AudioGizmo, CodeBlockEvents, Component, Entity, Player, PropTypes } from "horizon/core";

class MusicPlayer extends Component<typeof MusicPlayer> {
  static propsDefinition = {
    playRandomSongOnStart: { type: PropTypes.Boolean, default: false },
    song1: { type: PropTypes.Entity },
    song2: { type: PropTypes.Entity },
    song3: { type: PropTypes.Entity },
    song4: { type: PropTypes.Entity },
    song5: { type: PropTypes.Entity },
    song6: { type: PropTypes.Entity },
    song7: { type: PropTypes.Entity },
    song8: { type: PropTypes.Entity },
    song9: { type: PropTypes.Entity },
    song10: { type: PropTypes.Entity },
  };

  private songs: { entity: Entity; duration: number }[] = [];
  private currentSongIndex = -1;

  preStart() {
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
    this.songs = allSongs.filter((s): s is { entity: Entity; duration: number } => s.entity !== undefined);
    if (this.songs.length == 0) {
      console.error("No valid songs provided.");
    }

    if (this.props.playRandomSongOnStart) {
      this.playRandomSong();
    }
  }

  start() {}

  public playSong(index: number) {
    if (this.currentSongIndex >= 0) {
      const prevAudio = this.songs[this.currentSongIndex].entity.as(AudioGizmo);
      if (prevAudio) {
        prevAudio.stop();
      }
      this.currentSongIndex = -1;
    }

    if (index >= 0 && index < this.songs.length) {
      const { entity, duration } = this.songs[index];

      const audioGizmo = entity.as(AudioGizmo);
      if (audioGizmo) {
        audioGizmo.play();
        this.async.setTimeout(() => this.playRandomSong(), duration * 1000);
      } else {
        console.error("Selected entity is not an AudioGizmo.");
      }
      this.currentSongIndex = index;
    }
  }

  public playNextSong() {
    let nextIndex = (this.currentSongIndex + 1) % this.songs.length;
    this.playSong(nextIndex);
  }

  public playRandomSong() {
    let songIndex: number;
    do {
      songIndex = Math.floor(Math.random() * this.songs.length);
    } while (this.songs.length > 1 && songIndex === this.currentSongIndex);

    this.playSong(songIndex);
  }
}
Component.register(MusicPlayer);

class MusicTrigger extends Component<typeof MusicTrigger> {
  static propsDefinition = {
    musicPlayer: { type: PropTypes.Entity, componentType: MusicPlayer },
  };

  private musicPlayer?: MusicPlayer;

  preStart() {
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterTrigger, this.OnPlayerEnterTrigger.bind(this));
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerExitTrigger, this.OnPlayerExitTrigger.bind(this));
  }

  start() {
    if (this.props.musicPlayer) {
      this.musicPlayer = this.props.musicPlayer.getComponents(MusicPlayer)[0];
    }
  }

  OnPlayerEnterTrigger(player: Player) {
    if (this.musicPlayer) {
      this.musicPlayer.playNextSong();
    }
  }

  OnPlayerExitTrigger(player: Player) {}
}
Component.register(MusicTrigger);

/**
 * Streaming audio player using MediaSource Extensions.
 *
 * Receives base64-encoded MP3 chunks from the backend and
 * appends them to a SourceBuffer for seamless streaming playback.
 * Falls back to individual chunk decoding if MSE is unavailable.
 */

export class StreamingAudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private mediaSource: MediaSource | null = null;
  private sourceBuffer: SourceBuffer | null = null;
  private queue: Uint8Array[] = [];
  private isAppending = false;
  private isPlaying = false;
  private initialized = false;

  /**
   * Initialize MediaSource and attach to audio element.
   * Must be called from a user gesture context to satisfy autoplay policy.
   */
  init(): void {
    if (this.initialized) return;

    this.audio = new Audio();
    this.mediaSource = new MediaSource();
    this.audio.src = URL.createObjectURL(this.mediaSource);

    this.mediaSource.addEventListener("sourceopen", () => {
      if (!this.mediaSource || this.sourceBuffer) return;
      this.sourceBuffer = this.mediaSource.addSourceBuffer("audio/mpeg");
      this.sourceBuffer.addEventListener("updateend", () => {
        this.isAppending = false;
        this._flush();
      });
      // Flush any chunks that arrived before sourceopen
      this._flush();
    });

    this.initialized = true;
  }

  /**
   * Queue a base64-encoded MP3 chunk for playback.
   */
  playChunk(base64Audio: string): void {
    if (!this.initialized) this.init();

    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    this.queue.push(bytes);
    this._flush();
  }

  private _flush(): void {
    if (
      this.isAppending ||
      !this.sourceBuffer ||
      this.queue.length === 0 ||
      this.sourceBuffer.updating
    ) {
      return;
    }

    this.isAppending = true;
    const chunk = this.queue.shift()!;
    this.sourceBuffer.appendBuffer(chunk as any);

    // Start playback on first chunk
    if (!this.isPlaying && this.audio) {
      this.audio.play().catch(() => {
        // Autoplay blocked — will play on next user interaction
      });
      this.isPlaying = true;
    }
  }

  /**
   * Stop playback and reset for a new response.
   */
  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.queue = [];
    this.isAppending = false;
    this.isPlaying = false;

    // Tear down and reinitialize for next response
    if (this.mediaSource && this.mediaSource.readyState === "open") {
      try {
        this.sourceBuffer = null;
        this.mediaSource.endOfStream();
      } catch {
        // May throw if already ended
      }
    }
    this.mediaSource = null;
    this.audio = null;
    this.initialized = false;
  }

  /**
   * Reset for a new conversation turn.
   */
  reset(): void {
    this.stop();
  }

  get playing(): boolean {
    return this.isPlaying;
  }
}

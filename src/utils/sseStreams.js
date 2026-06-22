/**
 * Thin wrapper around an Express `res` for Server-Sent Events.
 * Keeps the controller free of raw `res.write` JSON.stringify boilerplate
 * and guarantees every event has a consistent shape.
 */
export class SSEStream {
  constructor(res) {
    this.res = res;
    this._closed = false;
  }

  init() {
    this.res.setHeader("Content-Type", "text/event-stream");
    this.res.setHeader("Cache-Control", "no-cache");
    this.res.setHeader("Connection", "keep-alive");
    this.res.setHeader("X-Accel-Buffering", "no");
    if (this.res.flushHeaders) this.res.flushHeaders();
    return this;
  }

  /**
   * @param {string} type - event type, e.g. "token", "done", "error"
   * @param {object} payload - merged into the event object alongside `type`
   */
  send(type, payload = {}) {
    if (this._closed) return;
    this.res.write(`data:${JSON.stringify({ type, ...payload })}\n\n`);
  }

  end() {
    if (this._closed) return;
    this._closed = true;
    this.res.end();
  }

  get closed() {
    return this._closed;
  }
}

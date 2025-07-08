// Mock for Next.js server components that don't work in Jest environment

class MockNextRequest {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.headers = new Map(Object.entries(options.headers || {}));
    this._body = options.body;
  }

  async json() {
    if (this._body) {
      return JSON.parse(this._body);
    }
    return {};
  }

  async text() {
    return this._body || '';
  }
}

class MockNextResponse {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.headers = new Map(Object.entries(options.headers || {}));
  }

  static json(data, options = {}) {
    const response = new MockNextResponse(JSON.stringify(data), options);
    response.headers.set('content-type', 'application/json');
    return response;
  }

  async json() {
    return JSON.parse(this.body);
  }

  async text() {
    return this.body;
  }
}

module.exports = {
  NextRequest: MockNextRequest,
  NextResponse: MockNextResponse
};
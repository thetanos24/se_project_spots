export default class Api {
  constructor({ baseUrl, headers }) {
    this._baseUrl = baseUrl;
    this._headers = headers;
  }

  // Private method to check response status and parse JSON
  _checkResponse(res) {
    if (res.ok) {
      return res.json();
    }
    // Throw an Error object for proper rejection handling
    return res.text().then((text) => {
      throw new Error(`Error ${res.status}: ${text}`);
    });
  }

  // Private helper for standardizing fetch calls
  _fetch(path, options = {}) {
    const url = `${this._baseUrl}${path}`;
    const fetchOptions = {
      ...options,
      headers: this._headers,
    };

    if (options.body && typeof options.body !== "string") {
      fetchOptions.body = JSON.stringify(options.body);
    }

    return fetch(url, fetchOptions)
      .then(this._checkResponse)
      .catch((err) => {
        console.error(
          `API Request Failed: ${options.method || "GET"} ${path}`,
          err
        );
        throw err;
      });
  }

  // Private helper to get a single card
  _getCard(cardId) {
    return this._fetch(`/cards/${cardId}`);
  }

  // --- API METHODS ---

  getAppInfo() {
    return Promise.all([this._fetch("/users/me"), this._fetch("/cards")]);
  }

  changeLikeStatus(cardId, like) {
    const method = like ? "PUT" : "DELETE";

    // 1. Perform the like/unlike action
    return (
      this._fetch(`/cards/${cardId}/likes`, {
        method: method,
      })
        // 2. FIXED: Cleanly chain the .then() to the fetch call
        .then(() => {
          // Fetch the full, updated card after the action succeeds.
          return this._getCard(cardId);
        })
        .catch((err) => {
          console.error(
            `Failed to change like status for card ${cardId}:`,
            err
          );
          throw err;
        })
    );
  }

  addCard(data) {
    return this._fetch("/cards", {
      method: "POST",
      body: data,
    });
  }

  removeCard(cardId) {
    return this._fetch(`/cards/${cardId}`, {
      method: "DELETE",
    });
  }

  editUserInfo(data) {
    return this._fetch("/users/me", {
      method: "PATCH",
      body: data,
    });
  }

  editAvatar(url) {
    return this._fetch("/users/me/avatar", {
      method: "PATCH",
      body: { avatar: url },
    });
  }
}

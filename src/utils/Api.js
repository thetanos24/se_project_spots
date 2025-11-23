export default class Api {
  constructor({ baseUrl, headers }) {
    this._baseUrl = baseUrl;
    this._headers = headers;
  }

  _checkResponse(res) {
    if (res.ok) {
      return res.json().then((data) => {
        console.log("Parsed API Data:", data);
        return data;
      });
    }
    return res.text().then((text) => {
      console.error("Server Error:", text);
      throw new Error(`Error ${res.status}: ${text}`);
    });
  }

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
        console.error(`API Error at ${path}:`, err);
        throw err;
      });
  }

  getAppInfo() {
    return Promise.all([this._fetch("/users/me"), this._fetch("/cards")]);
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

  changeLikeStatus(cardId, like) {
    const method = like ? "PUT" : "DELETE";
    return this._fetch(`/cards/${cardId}/likes`, {
      method: method,
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

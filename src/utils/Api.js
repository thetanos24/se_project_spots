export default class Api {
  constructor({ baseUrl, headers }) {
    this._baseUrl = baseUrl;
    this._headers = headers;
  }

  _checkResponse(res) {
    if (!res.ok) {
      return res.text().then((text) => {
        throw new Error(`Error ${res.status}: ${text}`);
      });
    }
    return res.json();
  }

  changeLikeStatus(cardId, like) {
    console.log(`Changing like status for card ${cardId}, like: ${like}`);
    return fetch(`${this._baseUrl}/cards/${cardId}/likes`, {
      method: like ? "PUT" : "DELETE",
      headers: this._headers,
    })
      .then(this._checkResponse)
      .catch((err) => {
        console.error("Error with like status change:", err);
        throw err;
      });
  }

  getAppInfo() {
    return Promise.all([
      fetch(`${this._baseUrl}/users/me`, { headers: this._headers }).then(
        this._checkResponse
      ),
      fetch(`${this._baseUrl}/cards`, { headers: this._headers }).then(
        this._checkResponse
      ),
    ]);
  }

  addCard(data) {
    return fetch(`${this._baseUrl}/cards`, {
      method: "POST",
      headers: this._headers,
      body: JSON.stringify(data),
    }).then(this._checkResponse);
  }

  removeCard(cardId) {
    return fetch(`${this._baseUrl}/cards/${cardId}`, {
      method: "DELETE",
      headers: this._headers,
    }).then(this._checkResponse);
  }

  editUserInfo(data) {
    return fetch(`${this._baseUrl}/users/me`, {
      method: "PATCH",
      headers: this._headers,
      body: JSON.stringify(data),
    }).then(this._checkResponse);
  }

  editAvatar(url) {
    return fetch(`${this._baseUrl}/users/me/avatar`, {
      method: "PATCH",
      headers: this._headers,
      body: JSON.stringify({ avatar: url }),
    }).then(this._checkResponse);
  }
}

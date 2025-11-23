import "./index.css";
import Api from "../utils/Api.js";
import { setButtonText } from "../utils/helpers.js";
import {
  enableValidation,
  settings,
  resetValidation,
  disableButton,
} from "../scripts/validation.js";

const api = new Api({
  baseUrl: "https://around-api.en.tripleten-services.com/v1",
  headers: {
    authorization: "4dfaab43-99e9-4353-9f81-55b2f4334e00",
    "Content-Type": "application/json",
  },
});

let currentUserId;
let selectedCard;
let selectedCardId;

const profileNameEl = document.querySelector(".profile__name");
const profileDescriptionEl = document.querySelector(".profile__description");
const profileAvatarEl = document.querySelector(".profile__avatar");
const editProfileBtn = document.querySelector(".profile__edit-btn");
const addNewPostBtn = document.querySelector(".profile__add-btn");
const avatarEditBtn = document.querySelector(".profile__avatar-btn");
const cardList = document.querySelector(".cards__list");

const previewModal = document.querySelector("#preview-modal");
const previewImageEl = previewModal.querySelector(".modal__image");
const previewCaptionEl = previewModal.querySelector(".modal__caption");

const deleteModal = document.querySelector("#delete-modal");
const deleteForm = deleteModal.querySelector(".modal__form");
const deleteCancelBtn = deleteModal.querySelector(".modal__cancel-btn");

const editProfileModal = document.querySelector("#edit-profile-modal");
const editProfileForm = editProfileModal.querySelector(".modal__form");
const editProfileNameInput = editProfileModal.querySelector(
  "#profile-name-input"
);
const editProfileDescriptionInput = editProfileModal.querySelector(
  "#profile-description-input"
);

const newPostModal = document.querySelector("#new-post-modal");
const newPostForm = newPostModal.querySelector(".modal__form");
const newPostCaptionInput = newPostModal.querySelector("#card-caption-input");
const newPostImageInput = newPostModal.querySelector("#card-image-input");

const avatarModal = document.querySelector("#avatar-modal");
const avatarInput = document.querySelector("#profile-avatar-input");
const avatarForm = avatarModal?.querySelector(".modal__form") ?? null;

function closeModal(modal) {
  modal.classList.remove("modal_is-opened");
  document.removeEventListener("keydown", closeModalOnEsc);
}

function openModal(modal) {
  modal.classList.add("modal_is-opened");
  document.addEventListener("keydown", closeModalOnEsc);
}

function closeModalOnEsc(evt) {
  if (evt.key === "Escape") {
    const openedModal = document.querySelector(".modal_is-opened");
    if (openedModal) closeModal(openedModal);
  }
}

function getCardElement(cardData) {
  const template = document.querySelector("#card-template").content;
  const cardEl = template.querySelector(".card").cloneNode(true);

  const cardImage = cardEl.querySelector(".card__image");
  const cardTitle = cardEl.querySelector(".card__title");
  const likeBtn = cardEl.querySelector(".card__like-btn");
  const deleteBtn = cardEl.querySelector(".card__delete-btn");

  cardImage.src = cardData.link;
  cardImage.alt = cardData.name;
  cardTitle.textContent = cardData.name;

  cardImage.addEventListener("click", () => {
    previewImageEl.src = cardData.link;
    previewImageEl.alt = cardData.name;
    previewCaptionEl.textContent = cardData.name;
    openModal(previewModal);
  });

  deleteBtn.classList.remove("card__delete-btn_hidden");

  deleteBtn.addEventListener("click", () => {
    selectedCard = cardEl;
    selectedCardId = cardData._id;
    openModal(deleteModal);
  });

  const likesArray = cardData.likes || [];

  if (likesArray.some((user) => user._id === currentUserId)) {
    likeBtn.classList.add("card__like-btn_active");
  }

  likeBtn.addEventListener("click", () => {
    const isCurrentlyLiked = likeBtn.classList.contains(
      "card__like-btn_active"
    );
    const cardId = cardData._id;
    api
      .changeLikeStatus(cardId, !isCurrentlyLiked)
      .then((data) => {
        if (isCurrentlyLiked) {
          likeBtn.classList.remove("card__like-btn_active");
        } else {
          likeBtn.classList.add("card__like-btn_active");
        }
      })
      .catch((err) => {
        console.error("Like Action Failed:", err);
      });
  });

  return cardEl;
}

function handleEditProfileSubmit(evt) {
  evt.preventDefault();
  const submitButton = evt.submitter;
  setButtonText(submitButton, true, "Save", "Saving...");

  api
    .editUserInfo({
      name: editProfileNameInput.value,
      about: editProfileDescriptionInput.value,
    })
    .then((data) => {
      profileNameEl.textContent = data.name;
      profileDescriptionEl.textContent = data.about;
      closeModal(editProfileModal);
    })
    .catch((err) => console.error("Error editing profile:", err))
    .finally(() => setButtonText(submitButton, false, "Save", "Saving..."));
}

function handleAvatarSubmit(evt) {
  evt.preventDefault();
  const submitButton = evt.submitter;
  setButtonText(submitButton, true, "Save", "Saving...");

  api
    .editAvatar(avatarInput.value)
    .then((data) => {
      profileAvatarEl.src = data.avatar;
      avatarForm.reset();
      disableButton(submitButton, settings);
      closeModal(avatarModal);
    })
    .catch((err) => console.error("Error updating avatar:", err))
    .finally(() => setButtonText(submitButton, false, "Save", "Saving..."));
}

function handleAddCardSubmit(evt) {
  evt.preventDefault();
  const submitButton = evt.submitter;
  setButtonText(submitButton, true, "Save", "Saving...");

  const cardData = {
    name: newPostCaptionInput.value,
    link: newPostImageInput.value,
  };

  api
    .addCard(cardData)
    .then((newCard) => {
      const cardElement = getCardElement(newCard);
      cardList.prepend(cardElement);
      closeModal(newPostModal);
      evt.target.reset();
      disableButton(submitButton, settings);
    })
    .catch((err) => console.error("Error adding card:", err))
    .finally(() => setButtonText(submitButton, false, "Save", "Saving..."));
}

function handleDeleteSubmit(evt) {
  evt.preventDefault();
  const submitButton = evt.submitter;
  setButtonText(submitButton, true, "Yes", "Deleting...");

  api
    .removeCard(selectedCardId)
    .then(() => {
      if (selectedCard) {
        selectedCard.remove();
        selectedCard = null;
      }
      closeModal(deleteModal);
    })
    .catch((err) => console.error("Error deleting card:", err))
    .finally(() => setButtonText(submitButton, false, "Yes", "Deleting..."));
}

api
  .getAppInfo()
  .then(([user, cards]) => {
    currentUserId = user._id;
    console.log("Current User ID:", currentUserId);

    profileAvatarEl.src = user.avatar;
    profileNameEl.textContent = user.name;
    profileDescriptionEl.textContent = user.about;

    cards.forEach((item) => {
      const cardElement = getCardElement(item);
      cardList.append(cardElement);
    });
  })
  .catch((err) => console.error("Error fetching initial data:", err));

const modals = document.querySelectorAll(".modal");
modals.forEach((modal) => {
  modal.addEventListener("mousedown", (evt) => {
    if (
      evt.target.classList.contains("modal_is-opened") ||
      evt.target.classList.contains("modal__close-btn")
    ) {
      closeModal(modal);
    }
  });
});

editProfileBtn.addEventListener("click", () => {
  editProfileNameInput.value = profileNameEl.textContent;
  editProfileDescriptionInput.value = profileDescriptionEl.textContent;
  resetValidation(editProfileForm, settings);
  openModal(editProfileModal);
});

addNewPostBtn.addEventListener("click", () => {
  resetValidation(newPostForm, settings);
  openModal(newPostModal);
});

if (avatarEditBtn && avatarForm) {
  avatarEditBtn.addEventListener("click", () => {
    resetValidation(avatarForm, settings);
    openModal(avatarModal);
  });
}

if (deleteCancelBtn) {
  deleteCancelBtn.addEventListener("click", () => {
    closeModal(deleteModal);
  });
}

editProfileForm.addEventListener("submit", handleEditProfileSubmit);
newPostForm.addEventListener("submit", handleAddCardSubmit);
deleteForm.addEventListener("submit", handleDeleteSubmit);

if (avatarForm) {
  avatarForm.addEventListener("submit", handleAvatarSubmit);
}

enableValidation(settings);

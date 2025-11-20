import "./index.css";
import { setButtonText } from "../utils/helpers.js";
import {
  enableValidation,
  settings,
  resetValidation,
  disableButton,
} from "../scripts/validation.js";
import Api from "../utils/Api.js";

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

const editProfileModal = document.querySelector("#edit-profile-modal");
const editProfileForm = document.forms["edit-profile-form"];
const editProfileNameInput = editProfileModal.querySelector(
  "#profile-name-input"
);
const editProfileDescriptionInput = editProfileModal.querySelector(
  "#profile-description-input"
);
const editProfileBtn = document.querySelector(".profile__edit-btn");
const editProfileCloseBtn = editProfileModal.querySelector(".modal__close-btn");

const avatarModal = document.querySelector("#avatar-modal");
const avatarForm = document.forms["edit-avatar-form"];
const avatarInput = avatarModal.querySelector("#profile-avatar-input");
const avatarModalBtn = document.querySelector(".profile__avatar-btn");
const avatarSubmitBtn = avatarModal.querySelector(".modal__submit-btn");
const avatarModalCloseBtn = avatarModal.querySelector(".modal__close-btn");

const newPostModal = document.querySelector("#new-post-modal");
const newPostForm = document.forms["card-form"];
const newPostBtn = document.querySelector(".profile__add-btn");
const cardSubmitBtn = newPostModal.querySelector(".modal__submit-btn");
const newPostCloseBtn = newPostModal.querySelector(".modal__close-btn");
const newPostImageInput = newPostModal.querySelector("#card-image-input");
const newPostCaptionInput = newPostModal.querySelector("#card-caption-input");

const deleteModal = document.querySelector("#delete-modal");
const deleteForm = document.forms["delete-form"];
const deleteModalCloseBtn = deleteModal.querySelector(".modal__close-btn");
const deleteModalCancelBtn = deleteModal.querySelector(".modal__cancel-btn");

const previewModal = document.querySelector("#preview-modal");
const previewModalCloseBtn = previewModal.querySelector(".modal__close-btn");
const previewImageEl = previewModal.querySelector(".modal__image");
const previewCaptionEl = previewModal.querySelector(".modal__caption");

const cardTemplate = document
  .querySelector("#card-template")
  .content.querySelector(".card");
const cardList = document.querySelector(".cards__list");

function closeModal(modal) {
  modal.classList.remove("modal_is-opened");
  document.removeEventListener("keydown", closeModalOnEsc);
  modal.removeEventListener("click", closeModalOnOverlayClick);
}

function openModal(modal) {
  modal.classList.add("modal_is-opened");
  document.addEventListener("keydown", closeModalOnEsc);
  modal.addEventListener("click", closeModalOnOverlayClick);
}

function closeModalOnEsc(evt) {
  if (evt.key === "Escape") {
    const openedModal = document.querySelector(".modal_is-opened");
    if (openedModal) closeModal(openedModal);
  }
}

function closeModalOnOverlayClick(evt) {
  if (evt.target === evt.currentTarget) closeModal(evt.currentTarget);
}

function handleDeleteCard(cardElement, cardId) {
  selectedCard = cardElement;
  selectedCardId = cardId;
  openModal(deleteModal);
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

  console.log("Card ID:", cardData._id);
  console.log("Card Owner ID:", cardData.owner ? cardData.owner._id : "N/A");
  console.log("Current User ID:", currentUserId);

  const isOwner = cardData.owner && cardData.owner._id === currentUserId;

  deleteBtn.addEventListener("click", () => {
    handleDeleteCard(cardEl, cardData._id);
  });

  const likesArray = Array.isArray(cardData.likes) ? cardData.likes : [];
  if (likesArray.some((user) => user._id === currentUserId)) {
    likeBtn.classList.add("card__like-btn_active");
  } else {
    likeBtn.classList.remove("card__like-btn_active");
  }

  likeBtn.addEventListener("click", () => {
    const isLiked = likeBtn.classList.contains("card__like-btn_active");
    console.log(`Is liked before click: ${isLiked}`);

    api
      .changeLikeStatus(cardData._id, !isLiked)
      .then((updatedCard) => {
        console.log("Updated card:", updatedCard);

        const updatedLikes = updatedCard.likes || [];
        console.log("Likes Array:", updatedLikes);

        const isNowLiked = updatedLikes.includes(currentUserId);
        console.log(`Is liked after update: ${isNowLiked}`);

        if (isNowLiked) {
          likeBtn.classList.add("card__like-btn_active");
          console.log("Added active class");
        } else {
          likeBtn.classList.remove("card__like-btn_active");
          console.log("Removed active class");
        }
      })
      .catch((err) => {
        console.error("Error updating like status", err);
      });
  });

  return cardEl;
}

api
  .getAppInfo()
  .then(([user, cards]) => {
    currentUserId = user._id;
    console.log("Current user ID:", currentUserId);

    profileAvatarEl.src = user.avatar;
    profileNameEl.textContent = user.name;
    profileDescriptionEl.textContent = user.about;

    cards.forEach((item) => {
      const cardElement = getCardElement(item);
      cardList.append(cardElement);
    });
  })
  .catch(console.error);

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
    .catch(console.error)
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
    .catch(console.error)
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
  setButtonText(submitButton, true, "Delete", "Deleting...");

  api
    .removeCard(selectedCardId)
    .then(() => {
      selectedCard.remove();
      closeModal(deleteModal);
    })
    .catch(console.error)
    .finally(() => setButtonText(submitButton, false, "Delete", "Deleting..."));
}

editProfileBtn.addEventListener("click", () => {
  editProfileNameInput.value = profileNameEl.textContent;
  editProfileDescriptionInput.value = profileDescriptionEl.textContent;
  resetValidation(editProfileForm, settings);
  openModal(editProfileModal);
});
editProfileCloseBtn.addEventListener("click", () =>
  closeModal(editProfileModal)
);
editProfileForm.addEventListener("submit", handleEditProfileSubmit);

avatarModalBtn.addEventListener("click", () => {
  resetValidation(avatarForm, settings);
  disableButton(avatarSubmitBtn, settings);
  openModal(avatarModal);
});
avatarModalCloseBtn.addEventListener("click", () => closeModal(avatarModal));
avatarForm.addEventListener("submit", handleAvatarSubmit);

newPostBtn.addEventListener("click", () => openModal(newPostModal));
newPostCloseBtn.addEventListener("click", () => closeModal(newPostModal));
newPostForm.addEventListener("submit", handleAddCardSubmit);

deleteModalCloseBtn.addEventListener("click", () => closeModal(deleteModal));
deleteModalCancelBtn.addEventListener("click", () => closeModal(deleteModal));
deleteForm.addEventListener("submit", handleDeleteSubmit);

previewModalCloseBtn.addEventListener("click", () => closeModal(previewModal));

enableValidation(settings);

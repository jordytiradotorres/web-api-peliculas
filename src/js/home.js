// api para las peliculas
(async function load() {
  async function getData(url) {
    const response = await fetch(url);
    const data = await response.json();
    if (data.data.movie_count > 0) {
      return data;
    }
    throw new Error("No se encontro ningun resultado");
  }

  const form = document.getElementById("form");
  const home = document.getElementById("home");
  const featuringContainer = document.getElementById("featuring");

  function setAttributes(element, attributes) {
    for (let attribute in attributes) {
      element.setAttribute(attribute, attributes[attribute]);
    }
  }

  const BASE_API = "https://yts.lt/api/v2/";

  function featuringTemplate(peli) {
    return `
      <div class="featuring">
        <div class="featuring-image">
          <img src="${peli.medium_cover_image}" width="70" height="100" alt="${peli.title}">
        </div>
        <div class="featuring-content">
          <p class="featuring-title">Pelicula encontrada</p>
          <p class="featuring-album">${peli.title}</p>
        </div>
      </div>
    `;
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    home.classList.add("search-active");

    const loader = document.createElement("img");
    setAttributes(loader, {
      src: "./src/images/loader.gif",
      width: "50px",
      height: "50px"
    });
    featuringContainer.append(loader);

    /*Los objetos FormData le permiten compilar un conjunto de pares clave/valor para enviar mediante XMLHttpRequest. Están destinados principalmente para el envío de los datos del formulario, pero se pueden utilizar de forma independiente con el fin de transmitir los datos tecleados. Los datos transmitidos estarán en el mismo formato que usa el método submit() del formulario para enviar los datos si el tipo de codificación del formulario se establece en "multipart/form-data".*/
    const data = new FormData(form);
    // data.get('name') es del name del input del formulario

    try {
      const {
        data: { movies: pelis }
      } = await getData(
        `${BASE_API}list_movies.json?limit=1&query_term=${data.get("name")}`
      );
      const HTMLString = featuringTemplate(pelis[0]);
      featuringContainer.innerHTML = HTMLString;
    } catch (error) {
      alert(error.message);
      loader.remove();
      home.classList.remove("search-active");
    }
  });

  function videoItemTemplate(movie, category) {
    return `<div class="primaryPlaylistItem" data-id="${movie.id}" data-category="${category}">
      <div class="primaryPlaylistItem-image">
        <img src="${movie.medium_cover_image}" alt="${movie.title}">
      </div>
      <h4 class="primaryPlaylistItem-title">${movie.title}</h4>
    </div>`;
  }

  function createTemplate(HTMLString) {
    const html = document.implementation.createHTMLDocument();
    html.body.innerHTML = HTMLString;
    return html.body.children[0];
  }

  function addEventClick(element) {
    element.addEventListener("click", () => {
      showModal(element);
    });
  }

  function renderMovieList(list, container, category) {
    container.children[0].remove(); // elimina el gif de carga antes de mostrar los datos
    list.forEach(movie => {
      const HTMLString = videoItemTemplate(movie, category);
      const movieElement = createTemplate(HTMLString);
      container.append(movieElement);
      const image = movieElement.querySelector("img");
      image.addEventListener("load", e => {
        e.target.classList.add("fadeIn");
      });
      addEventClick(movieElement);
    });
  }

  // elementos DOM
  const actionContainer = document.getElementById("action");
  const dramaContainer = document.getElementById("drama");
  const animationContainer = document.getElementById("animation");

  // favorites pelis
  const {
    data: { movies: favoritesPelis }
  } = await getData(`${BASE_API}list_movies.json?limit=10`);
  console.log(favoritesPelis);

  function favoritesPelisTemplate(movie) {
    return `<li class="myPlaylist-item">
              <a href="#">
                <span>
                  ${movie.title}
                </span>
              </a>
            </li>`;
  }

  function renderFavoritesPelis(list, container) {
    list.forEach(movie => {
      const HTMLString = favoritesPelisTemplate(movie);
      const movieElement = createTemplate(HTMLString);
      container.append(movieElement);
    });
  }

  const myPlaylist = document.getElementById("myPlaylist");
  renderFavoritesPelis(favoritesPelis, myPlaylist);

  //---------------------------------------------------------

  // usuarios random
  // random de usuarios
  const { results: usersList } = await getUsers(
    "https://randomuser.me/api/?results=10"
  );
  console.log(usersList);

  async function getUsers(url) {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  }

  function playlistFriendsItemTemplate({
    picture: { thumbnail },
    name: { first, last }
  }) {
    return `<li class="playlistFriends-item">
        <a href="#">
          <img src="${thumbnail}" alt="${first}" />
          <span>
            ${first} ${last}
          </span>
        </a>
      </li>`;
  }

  function renderFriends(list, container) {
    list.forEach(movie => {
      const HTMLString = playlistFriendsItemTemplate(movie);
      const movieElement = createTemplate(HTMLString);
      container.append(movieElement);
    });
  }

  const playlistFriends = document.querySelector(".playlistFriends");
  renderFriends(usersList, playlistFriends);

  //------------------------------------------------------------

  async function cacheExist(category) {
    const listName = `${category}List`;
    const cacheList = localStorage.getItem(listName);

    if (cacheList) {
      return JSON.parse(cacheList);
    }

    const {
      data: { movies: data }
    } = await getData(`${BASE_API}list_movies.json?genre=${category}`);
    localStorage.setItem(listName, JSON.stringify(data));
    return data;
  }
  /*  const {
    data: { movies: actionList }
  } = await getData(`${BASE_API}list_movies.json?genre=action`); */
  const actionList = await cacheExist("action");
  renderMovieList(actionList, actionContainer, "action");

  const dramaList = await cacheExist("drama");
  renderMovieList(dramaList, dramaContainer, "drama");

  const animationList = await cacheExist("animation");
  renderMovieList(animationList, animationContainer, "animation");

  const modal = document.getElementById("modal");
  const modalTitle = modal.querySelector("h1");
  const modalImage = modal.querySelector("img");
  const modalDescription = modal.querySelector("p");

  const overlay = document.getElementById("overlay");
  const hideModal = document.getElementById("hide-modal");

  function findId(list, id) {
    return list.find(movie => movie.id === parseInt(id, 10));
  }

  function findMovie(id, category) {
    switch (category) {
      case "action":
        return findId(actionList, id);
      case "drama":
        return findId(dramaList, id);
      default:
        return findId(animationList, id);
    }
  }

  function showModal(element) {
    overlay.classList.add("active");
    modal.style.animation = "modalIn .8s forwards";
    // const id = element.dataset.id;
    // const category = element.dataset.category;
    const { id, category } = element.dataset;

    const data = findMovie(id, category);
    console.log(data);
    modalTitle.textContent = data.title;
    modalDescription.textContent = data.description_full;
    modalImage.src = data.medium_cover_image;
  }

  hideModal.addEventListener("click", functionHideModal);

  function functionHideModal() {
    overlay.classList.remove("active");
    modal.style.animation = "modalOut .8s forwards";
  }
})();

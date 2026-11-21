const API_URL =
  'https://free-games-notifier-api.martinponce.com.ar/api/games/current';

const languageToggle = document.getElementById('language-toggle');
const gamesGrid = document.getElementById('games-grid');
const gamesStatus = document.getElementById('games-status');

let currentLanguage = 'en';
let currentGames = [];

function setLanguage(language) {
  currentLanguage = language;

  document.documentElement.lang = language;

  document.querySelectorAll('[data-en][data-es]').forEach((element) => {
    element.textContent = element.dataset[language];
  });

  languageToggle.textContent = language === 'en' ? 'ES' : 'EN';

  languageToggle.setAttribute(
    'aria-label',
    language === 'en'
      ? 'Cambiar idioma a español'
      : 'Switch language to English',
  );

  document.title =
    language === 'en'
      ? 'Free Games Notifier | Never miss a free game'
      : 'Free Games Notifier | No te pierdas ningún juego gratis';

  renderGames();
}

languageToggle.addEventListener('click', () => {
  setLanguage(currentLanguage === 'en' ? 'es' : 'en');
});

document.getElementById('current-year').textContent = new Date().getFullYear();

function setGamesStatus(message, isError = false, showRetry = false) {
  gamesStatus.replaceChildren();
  gamesStatus.classList.toggle('error', isError);

  const text = document.createElement('p');
  text.textContent = message;
  gamesStatus.appendChild(text);

  if (showRetry) {
    const button = document.createElement('button');

    button.type = 'button';
    button.textContent = currentLanguage === 'en' ? 'Try again' : 'Reintentar';
    button.addEventListener('click', loadGames);

    gamesStatus.appendChild(button);
  }
}

function getGameImageUrl(game) {
  if (!game.imageUrl) {
    return null;
  }

  try {
    const imageUrl = new URL(game.imageUrl);

    if (imageUrl.protocol !== 'https:') {
      return null;
    }

    // Epic images use the Vercel image proxy.
    if (game.source === 'epic') {
      return `/api/image?url=${encodeURIComponent(imageUrl.href)}`;
    }

    // Steam images are loaded directly.
    return imageUrl.href;
  } catch {
    return null;
  }
}

function getGameDate(date) {
  if (!date) {
    return currentLanguage === 'en'
      ? 'End date unavailable'
      : 'Fecha de finalización no disponible';
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return currentLanguage === 'en'
      ? 'End date unavailable'
      : 'Fecha de finalización no disponible';
  }

  const locale = currentLanguage === 'en' ? 'en-US' : 'es-AR';

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate);
}

function createGameCard(game) {
  const card = document.createElement('article');
  card.className = 'game-card';
  card.dataset.gameId = game.id;

  const imageContainer = document.createElement('div');
  imageContainer.className = 'game-image-container';

  const imageUrl = getGameImageUrl(game);

  if (imageUrl) {
    const image = document.createElement('img');

    image.className = 'game-image';
    image.src = imageUrl;
    image.alt = game.title;
    image.loading = 'lazy';
    image.decoding = 'async';

    image.addEventListener('error', () => {
      image.remove();
    });

    imageContainer.appendChild(image);
  }

  const platform = document.createElement('span');
  platform.className = 'game-platform';
  platform.textContent = game.source;

  imageContainer.appendChild(platform);

  const content = document.createElement('div');
  content.className = 'game-content';

  const title = document.createElement('h3');
  title.textContent = game.title;

  const expiration = document.createElement('p');
  expiration.className = 'game-expiration';

  expiration.textContent =
    `${currentLanguage === 'en' ? 'Available until' : 'Disponible hasta'}: ` +
    getGameDate(game.endDate);

  content.append(title, expiration);

  let gameUrl;

  try {
    gameUrl = new URL(game.url);

    if (gameUrl.protocol !== 'https:') {
      gameUrl = null;
    }
  } catch {
    gameUrl = null;
  }

  if (gameUrl) {
    const link = document.createElement('a');

    link.className = 'game-button';
    link.href = gameUrl.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    const linkText = document.createElement('span');
    linkText.textContent =
      currentLanguage === 'en' ? 'Get game' : 'Obtener juego';

    const icon = document.createElement('i');
    icon.className = 'fa-solid fa-arrow-up-right-from-square';
    icon.setAttribute('aria-hidden', 'true');

    link.append(linkText, icon);
    content.appendChild(link);
  }

  card.append(imageContainer, content);

  return card;
}

function renderGames() {
  gamesGrid.replaceChildren();

  if (currentGames.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'games-empty';

    const icon = document.createElement('i');
    icon.className = 'fa-solid fa-gift';

    const title = document.createElement('h3');
    title.textContent =
      currentLanguage === 'en'
        ? 'No free games available right now'
        : 'No hay juegos gratis disponibles en este momento';

    const description = document.createElement('p');
    description.textContent =
      currentLanguage === 'en'
        ? 'Check back later for new offers.'
        : 'Volvé más tarde para descubrir nuevas promociones.';

    empty.append(icon, title, description);
    gamesGrid.appendChild(empty);

    return;
  }

  const fragment = document.createDocumentFragment();

  currentGames.forEach((game) => {
    fragment.appendChild(createGameCard(game));
  });

  gamesGrid.appendChild(fragment);
}

async function loadGames() {
  setGamesStatus(
    currentLanguage === 'en'
      ? 'Loading free games...'
      : 'Cargando juegos gratis...',
  );

  gamesGrid.replaceChildren();

  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const games = await response.json();

    if (!Array.isArray(games)) {
      throw new Error('Invalid API response');
    }

    currentGames = games.filter(
      (game) =>
        game &&
        typeof game.id === 'string' &&
        typeof game.title === 'string' &&
        typeof game.url === 'string' &&
        typeof game.source === 'string',
    );

    gamesStatus.replaceChildren();
    gamesStatus.classList.remove('error');

    renderGames();
  } catch (error) {
    console.error('Unable to load free games:', error);

    currentGames = [];
    gamesGrid.replaceChildren();

    setGamesStatus(
      currentLanguage === 'en'
        ? 'Unable to load free games. Please try again later.'
        : 'No pudimos cargar los juegos gratis. Intentá nuevamente más tarde.',
      true,
      true,
    );
  }
}

document.getElementById('current-year').textContent = new Date().getFullYear();
loadGames();
setLanguage('en');

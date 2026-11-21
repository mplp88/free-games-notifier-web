const languageToggle = document.getElementById('language-toggle');

let currentLanguage = 'en';

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
}

languageToggle.addEventListener('click', () => {
  setLanguage(currentLanguage === 'en' ? 'es' : 'en');
});

document.getElementById('current-year').textContent = new Date().getFullYear();

setLanguage('en');

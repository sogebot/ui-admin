// https://stackoverflow.com/a/54101500

['keyup', 'keydown'].forEach((event) => {
  window.addEventListener(event, (e) => {
    document.onselectstart = function () {
      return !(e.key === 'Shift' && e.shiftKey);
    };
  });
});

/* deskshelf 详情页：缩略图切换大图、收藏按钮状态。 */
(function () {
  'use strict';

  var main = document.getElementById('main-shot');
  var mainLabel = document.getElementById('main-shot-label');
  var thumbs = Array.prototype.slice.call(document.querySelectorAll('.thumb'));

  thumbs.forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      thumbs.forEach(function (t) {
        t.setAttribute('aria-pressed', String(t === thumb));
      });
      main.style.background = thumb.dataset.bg;
      mainLabel.textContent = '占位图 · ' + thumb.dataset.label;
    });
  });

  var save = document.getElementById('save');
  var saveLabel = document.getElementById('save-label');

  save.addEventListener('click', function () {
    var saved = save.getAttribute('aria-pressed') !== 'true';
    save.setAttribute('aria-pressed', String(saved));
    saveLabel.textContent = saved ? '已收藏' : '收藏';
  });
})();

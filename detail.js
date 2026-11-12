/* deskshelf 详情页：按地址里的 ?slug= 渲染对应桌搭，
   处理图集切换和收藏（收藏存在浏览器 localStorage 里）。 */
(function () {
  'use strict';

  var D = window.Deskshelf;
  var Sketch = window.DeskSketch;
  var SAVED_KEY = 'deskshelf:saved';

  function $(id) {
    return document.getElementById(id);
  }

  var slug = new URLSearchParams(window.location.search).get('slug');
  // 不带 slug 时显示第一张，导航里的「3D 摆一摆」就是这样进来的
  var setup = slug == null ? D.SETUPS[0] : D.find(slug);

  if (!setup) {
    $('crumb-slug').textContent = slug;
    $('content').hidden = true;
    $('missing').hidden = false;
    $('missing-path').textContent = '/setups/' + slug + ' · 404';
    document.title = '没有找到这张桌搭 · deskshelf';
    return;
  }

  document.title = setup.title + ' · deskshelf';
  $('crumb-slug').textContent = setup.slug;
  $('setup-path').textContent = '/setups/' + setup.slug;
  $('setup-title').textContent = setup.title;
  $('setup-desc').textContent = setup.desc;
  $('creator-avatar').textContent = setup.by.charAt(0);
  $('creator-name').textContent = setup.by;

  // ---------- 图集 ----------
  // 真实照片到位之前，三张图是同一张桌子的三种线稿：正视、俯视、局部放大
  var VIEWS = [
    { label: '全景', art: Sketch.front(setup) },
    { label: '桌面俯拍', art: Sketch.top(setup) },
    { label: '细节', art: Sketch.front(setup, true) }
  ];

  var main = $('main-shot');
  var mainArt = $('main-art');
  var mainLabel = $('main-shot-label');
  var current = -1;

  D.paintShot(main, setup, null);
  // 和首页那张卡片同名，两页之间切换时浏览器会把卡片放大成这张大图
  main.style.viewTransitionName = 'shot-' + setup.slug;
  $('main-3d').hidden = !setup.d3;

  var thumbs = VIEWS.map(function (view, i) {
    var thumb = D.el('button', 'thumb shot');
    thumb.type = 'button';
    thumb.setAttribute('aria-label', '查看图片：' + view.label);
    D.paintShot(thumb, setup, view.art);
    delete thumb.dataset.shot; // 缩略图不参与页面转场
    thumb.appendChild(D.el('span', 'shot__label', view.label));
    thumb.addEventListener('click', function () {
      show(i, true);
    });
    $('thumbs').appendChild(thumb);
    return thumb;
  });

  function show(index, animate) {
    if (index === current) return;
    current = index;
    thumbs.forEach(function (thumb, i) {
      thumb.setAttribute('aria-pressed', String(i === index));
    });
    mainArt.innerHTML = VIEWS[index].art;
    mainLabel.textContent = '占位图 · ' + VIEWS[index].label;
    if (animate && mainArt.animate) {
      // 轻微的模糊把前后两张线稿接成一次变化，而不是两张图硬切
      mainArt.animate(
        D.motionOK()
          ? [{ opacity: 0, filter: 'blur(4px)', transform: 'scale(0.985)' }, { opacity: 1, filter: 'blur(0)', transform: 'scale(1)' }]
          : [{ opacity: 0 }, { opacity: 1 }],
        { duration: 240, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
      );
    }
  }

  // 焦点在缩略图上时，左右方向键换图。键盘操作不加动画
  $('thumbs').addEventListener('keydown', function (event) {
    var step = event.key === 'ArrowRight' ? 1 : (event.key === 'ArrowLeft' ? -1 : 0);
    if (!step) return;
    event.preventDefault();
    var next = (current + step + thumbs.length) % thumbs.length;
    show(next, false);
    thumbs[next].focus();
  });

  show(0, false);

  setup.tags.forEach(function (tag) {
    var chip = D.el('a', 'chip', tag);
    chip.href = D.tagUrl(tag);
    $('setup-tags').appendChild(chip);
  });

  // ---------- 同款清单 ----------
  $('items-count').textContent = '/items · ' + setup.items.length + ' 件';
  setup.items.forEach(function (item, i) {
    var li = D.el('li', 'item');
    var thumb = D.el('span', 'item__thumb');
    thumb.style.background = D.LIGHT[(setup.idx + i) % D.LIGHT.length];
    thumb.setAttribute('aria-hidden', 'true');
    thumb.innerHTML = Sketch.icon(item.kind);
    var text = D.el('div', 'item__text');
    text.appendChild(D.el('p', 'item__name', item.name));
    text.appendChild(D.el('p', 'item__meta', item.kind + ' · [价格]'));
    var link = D.el('a', 'btn', '去看看');
    link.insertAdjacentHTML('beforeend', D.ARROW_ICON);
    link.href = '#';
    link.setAttribute('aria-label', '去看看：' + item.name);
    li.appendChild(thumb);
    li.appendChild(text);
    li.appendChild(link);
    $('items').appendChild(li);
  });

  // ---------- 3D 复刻：没有复刻的桌搭不显示这一块和对应入口 ----------
  var replica = $('replica');
  replica.hidden = !setup.d3;
  $('to-replica').hidden = !setup.d3;
  if (setup.d3) {
    $('replica-desc').textContent =
      '这套桌搭的布局已经复刻好：' + setup.width + ' × ' + setup.depth + ' cm 桌面，' +
      setup.items.length + ' 件物品各就各位。拖一拖、换一换、量一量，看看放到你家合不合适。';
    $('replica-w').textContent = setup.width + ' cm';
    $('replica-d').textContent = setup.depth + ' cm';
    $('replica-svg').setAttribute(
      'aria-label',
      '等距视角的桌面线稿示意：桌上有显示器、键盘、鼠标、桌垫、台灯和杯子，标注 ' +
        setup.width + ' cm 宽、' + setup.depth + ' cm 深'
    );

    // 滚到这里时把线稿一笔一笔画出来，只画一次
    if (D.motionOK() && 'IntersectionObserver' in window) {
      Array.prototype.forEach.call(replica.querySelectorAll('svg path, svg ellipse'), function (stroke, i) {
        stroke.setAttribute('pathLength', '1');
        // 两个值分别对应描边和填充：先描完线，再把面填上
        stroke.style.transitionDelay = (i * 55) + 'ms, ' + (i * 55 + 600) + 'ms';
      });
      replica.classList.add('will-draw');
      new IntersectionObserver(function (entries, observer) {
        if (!entries[0].isIntersecting) return;
        replica.classList.add('is-drawn');
        observer.disconnect();
      }, { threshold: 0.35 }).observe($('replica-svg'));
    }
  }

  // ---------- 相似桌搭：同分类优先，其次看共同标签，最后按收录顺序补齐 ----------
  function score(other) {
    var shared = other.tags.filter(function (tag) {
      return setup.tags.indexOf(tag) >= 0;
    }).length;
    return (other.cat === setup.cat ? 10 : 0) + shared;
  }

  D.SETUPS.filter(function (other) {
    return other !== setup;
  }).sort(function (a, b) {
    return (score(b) - score(a)) || (a.idx - b.idx);
  }).slice(0, 4).forEach(function (other) {
    $('similar').appendChild(D.card(other, false));
  });

  var similarLink = $('similar-link');
  similarLink.href = D.tagUrl(setup.cat);
  similarLink.textContent = '/setups?cat=' + setup.cat;
  similarLink.insertAdjacentHTML('beforeend', D.ARROW_ICON);

  // ---------- 收藏：存 slug 列表；浏览器禁用存储时退回到只在当前页面有效 ----------
  function readSaved() {
    try {
      var list = JSON.parse(window.localStorage.getItem(SAVED_KEY));
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return [];
    }
  }

  function writeSaved(list) {
    try {
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(list));
      return true;
    } catch (err) {
      return false;
    }
  }

  var save = $('save');
  var saveLabel = $('save-label');

  function paintSave(saved) {
    save.setAttribute('aria-pressed', String(saved));
    saveLabel.textContent = saved ? '已收藏' : '收藏';
  }

  paintSave(readSaved().indexOf(setup.slug) >= 0);

  save.addEventListener('click', function () {
    var saved = save.getAttribute('aria-pressed') !== 'true';
    var list = readSaved().filter(function (s) {
      return s !== setup.slug;
    });
    if (saved) list.push(setup.slug);
    var kept = writeSaved(list);
    paintSave(saved);

    var icon = save.querySelector('svg');
    if (saved && icon.animate && D.motionOK()) {
      icon.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }],
        { duration: 280, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
      );
    }
    if (!saved) D.toast('已取消收藏');
    else D.toast(kept ? '已收藏，保存在这台设备的浏览器里' : '已收藏，但这个浏览器存不下来，关掉页面就没了');
  });

  // 内容是脚本填进去的，带 #replica 进来时浏览器的锚点定位可能偏早，这里再对齐一次
  if (window.location.hash) {
    var target = document.getElementById(window.location.hash.slice(1));
    if (target && !target.hidden) target.scrollIntoView({ behavior: 'instant' });
  }
})();

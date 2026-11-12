/* deskshelf 详情页：按地址里的 ?slug= 渲染对应桌搭，
   处理缩略图切换和收藏（收藏存在浏览器 localStorage 里）。 */
(function () {
  'use strict';

  var D = window.Deskshelf;
  var SAVED_KEY = 'deskshelf:saved';
  var SHOTS = ['全景', '桌面俯拍', '细节'];

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

  // 图集：占位色块，从这张桌搭的底色开始轮一圈
  var main = $('main-shot');
  var mainLabel = $('main-shot-label');
  var palette = setup.dark ? D.DARK : D.LIGHT;
  var start = palette.indexOf(setup.bg);
  if (setup.dark) main.classList.add('shot--dark');
  $('main-3d').hidden = !setup.d3;

  var thumbs = SHOTS.map(function (label, i) {
    var thumb = D.el('button', 'thumb' + (setup.dark ? ' thumb--dark' : ''));
    thumb.type = 'button';
    thumb.style.background = palette[(start + i) % palette.length];
    thumb.setAttribute('aria-label', '查看图片：' + label);
    thumb.appendChild(D.el('span', '', label));
    thumb.addEventListener('click', function () {
      show(i);
    });
    $('thumbs').appendChild(thumb);
    return thumb;
  });

  function show(index) {
    thumbs.forEach(function (thumb, i) {
      thumb.setAttribute('aria-pressed', String(i === index));
    });
    main.style.background = thumbs[index].style.background;
    mainLabel.textContent = '占位图 · ' + SHOTS[index];
  }

  show(0);

  setup.tags.forEach(function (tag) {
    var chip = D.el('a', 'chip', tag);
    chip.href = D.tagUrl(tag);
    $('setup-tags').appendChild(chip);
  });

  // 同款清单
  $('items-count').textContent = '/items · ' + setup.items.length + ' 件';
  setup.items.forEach(function (item, i) {
    var li = D.el('li', 'item');
    var thumb = D.el('span', 'item__thumb');
    thumb.style.background = D.LIGHT[(setup.idx + i) % D.LIGHT.length];
    thumb.setAttribute('aria-hidden', 'true');
    var text = D.el('div', 'item__text');
    text.appendChild(D.el('p', 'item__name', item.name));
    text.appendChild(D.el('p', 'item__meta', item.kind + ' · [价格]'));
    var link = D.el('a', 'btn', '去看看 →');
    link.href = '#';
    link.setAttribute('aria-label', '去看看：' + item.name);
    li.appendChild(thumb);
    li.appendChild(text);
    li.appendChild(link);
    $('items').appendChild(li);
  });

  // 3D 复刻：没有复刻的桌搭不显示这一块和对应入口
  $('replica').hidden = !setup.d3;
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
  }

  // 相似桌搭：同分类优先，其次看共同标签，最后按收录顺序补齐
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
  similarLink.textContent = '/setups?cat=' + setup.cat + ' →';

  // 收藏：存 slug 列表；浏览器禁用存储时退回到只在当前页面有效
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
    } catch (err) {
      // 存不了就算了，按钮状态仍然会更新
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
    writeSaved(list);
    paintSave(saved);
  });

  // 内容是脚本填进去的，带 #replica 进来时浏览器的锚点定位可能偏早，这里再对齐一次
  if (window.location.hash) {
    var target = document.getElementById(window.location.hash.slice(1));
    if (target && !target.hidden) target.scrollIntoView();
  }
})();

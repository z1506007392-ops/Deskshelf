/* deskshelf 首页：分类筛选、搜索、排序、加载更多。
   数据目前是写死的示例，接后端时把 SETUPS 换成接口返回即可。 */
(function () {
  'use strict';

  var PAGE_SIZE = 12;
  var PAGE_STEP = 8;
  var CATS = ['全部', '极简', '电竞', '编程', '设计师', '小户型', '理线', '复古'];
  var LIGHT = ['#EFEAE2', '#E6ECE8', '#E9E6F0', '#F1E7E1', '#E3EAF1', '#EDEDEB', '#F2EEDC'];
  var DARK = ['#17181C', '#1E1B26', '#101418'];

  // slug, 分类, 占位比例, 可 3D 复刻, 博主（示例昵称）, 收藏数权重
  var SETUPS = [
    ['white-oak-minimal', '极简', '4 / 5', 1, '阿木', 18],
    ['rgb-battlestation', '电竞', '4 / 3', 1, '夜航', 20],
    ['dual-monitor-dev', '编程', '3 / 4', 0, 'Kiko', 12],
    ['studio-display-designer', '设计师', '1 / 1', 1, '拾屿', 17],
    ['tiny-room-80cm', '小户型', '2 / 3', 0, '小满', 9],
    ['clean-cable-underdesk', '理线', '5 / 4', 1, '灰尘', 19],
    ['walnut-retro-radio', '复古', '4 / 5', 0, '旧时光', 7],
    ['all-white-compact', '极简', '4 / 3', 0, 'Mono柚', 14],
    ['ultrawide-sim-racing', '电竞', '3 / 4', 0, '北纬三十', 11],
    ['vertical-monitor-vim', '编程', '1 / 1', 1, 'Lin', 16],
    ['ipad-sketch-corner', '设计师', '2 / 3', 0, '周末工坊', 6],
    ['bay-window-desk', '小户型', '4 / 5', 1, '南枝', 15],
    ['pegboard-zero-wires', '理线', '3 / 4', 0, '阿木', 13],
    ['crt-typewriter-nook', '复古', '1 / 1', 0, '旧时光', 5],
    ['birch-ladder-shelf', '极简', '3 / 4', 0, '拾屿', 10],
    ['dark-oled-triple', '电竞', '4 / 5', 0, '夜航', 8],
    ['standing-desk-terminal', '编程', '4 / 5', 1, 'Kiko', 4],
    ['color-proof-lightbox', '设计师', '4 / 3', 0, 'Mono柚', 3],
    ['dorm-loft-setup', '小户型', '1 / 1', 0, '小满', 2],
    ['magnetic-cable-rail', '理线', '4 / 5', 1, '灰尘', 1]
  ].map(function (r, i) {
    var dark = r[1] === '电竞';
    return {
      slug: r[0],
      cat: r[1],
      ratio: r[2],
      d3: !!r[3],
      by: r[4],
      saved: r[5],
      idx: i,
      dark: dark,
      bg: dark ? DARK[i % DARK.length] : LIGHT[i % LIGHT.length]
    };
  });

  var CUBE_ICON =
    '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true"><path d="M6 1l4.5 2.5v5L6 11 1.5 8.5v-5z"></path><path d="M1.5 3.5L6 6l4.5-2.5M6 6v5"></path></svg>';

  var params = new URLSearchParams(window.location.search);
  var state = {
    cat: CATS.indexOf(params.get('cat')) >= 0 ? params.get('cat') : '全部',
    q: params.get('q') || '',
    sort: 'new',
    shown: PAGE_SIZE
  };

  var $chips = document.getElementById('chips');
  var $grid = document.getElementById('grid');
  var $empty = document.getElementById('empty');
  var $more = document.getElementById('more');
  var $end = document.getElementById('end');
  var $search = document.getElementById('search');
  var $sort = document.getElementById('sort');

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function matches() {
    var q = state.q.trim().toLowerCase();
    var list = SETUPS.filter(function (it) {
      var inCat = state.cat === '全部' || it.cat === state.cat;
      var inQ = !q || (it.slug + ' ' + it.cat + ' ' + it.by).toLowerCase().indexOf(q) >= 0;
      return inCat && inQ;
    });
    if (state.sort === 'saved') {
      list.sort(function (a, b) { return b.saved - a.saved; });
    } else if (state.sort === 'd3') {
      list.sort(function (a, b) { return (b.d3 - a.d3) || (a.idx - b.idx); });
    }
    return list;
  }

  function card(it) {
    var article = el('article', 'card');

    var shot = el('a', 'shot' + (it.dark ? ' shot--dark' : ''));
    shot.href = 'detail.html';
    shot.setAttribute('aria-label', '查看桌搭 ' + it.slug);
    shot.style.aspectRatio = it.ratio;
    shot.style.background = it.bg;
    if (it.d3) {
      var tag = el('span', 'tag-3d');
      tag.innerHTML = CUBE_ICON;
      tag.appendChild(document.createTextNode('可 3D 复刻'));
      shot.appendChild(tag);
    }
    shot.appendChild(el('span', 'shot__label', '占位图 · ' + it.cat));

    var meta = el('div', 'card__meta');
    var path = el('a', 'card__path', '/setups/' + it.slug);
    path.href = 'detail.html';
    var by = el('span', 'card__by');
    var avatar = el('span', 'avatar', it.by.charAt(0));
    avatar.setAttribute('aria-hidden', 'true');
    by.appendChild(avatar);
    by.appendChild(document.createTextNode(it.by));
    meta.appendChild(path);
    meta.appendChild(by);

    article.appendChild(shot);
    article.appendChild(meta);
    return article;
  }

  function render() {
    var list = matches();

    Array.prototype.forEach.call($chips.children, function (chip) {
      chip.setAttribute('aria-pressed', String(chip.dataset.cat === state.cat));
    });

    $grid.textContent = '';
    list.slice(0, state.shown).forEach(function (it) {
      $grid.appendChild(card(it));
    });

    $empty.hidden = list.length > 0;
    $more.hidden = list.length <= state.shown;
    $end.hidden = !(list.length > 0 && list.length <= state.shown);
  }

  CATS.forEach(function (label) {
    var chip = el('button', 'chip', label);
    chip.type = 'button';
    chip.dataset.cat = label;
    chip.addEventListener('click', function () {
      state.cat = label;
      state.shown = PAGE_SIZE;
      render();
    });
    $chips.appendChild(chip);
  });

  $search.value = state.q;
  $search.addEventListener('input', function () {
    state.q = $search.value;
    state.shown = PAGE_SIZE;
    render();
  });

  $sort.addEventListener('change', function () {
    state.sort = $sort.value;
    render();
  });

  $more.addEventListener('click', function () {
    state.shown += PAGE_STEP;
    render();
  });

  render();
})();

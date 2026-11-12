/* deskshelf 首页：分类筛选、搜索、排序、加载更多。
   数据和卡片在 shared.js 里。筛选状态会同步到地址栏，刷新或分享链接都能还原。 */
(function () {
  'use strict';

  var D = window.Deskshelf;
  var PAGE_SIZE = 12;
  var PAGE_STEP = 8;
  var SORTS = ['new', 'saved', 'd3'];

  var params = new URLSearchParams(window.location.search);
  var state = {
    cat: D.CATS.indexOf(params.get('cat')) >= 0 ? params.get('cat') : '全部',
    q: params.get('q') || '',
    sort: SORTS.indexOf(params.get('sort')) >= 0 ? params.get('sort') : 'new',
    shown: PAGE_SIZE
  };

  var $count = document.getElementById('count');
  var $chips = document.getElementById('chips');
  var $grid = document.getElementById('grid');
  var $empty = document.getElementById('empty');
  var $more = document.getElementById('more');
  var $end = document.getElementById('end');
  var $search = document.getElementById('search');
  var $sort = document.getElementById('sort');

  function matches() {
    var q = state.q.trim().toLowerCase();
    var list = D.SETUPS.filter(function (it) {
      var inCat = state.cat === '全部' || it.cat === state.cat;
      var text = [it.slug, it.title, it.by].concat(it.tags).join(' ').toLowerCase();
      return inCat && (!q || text.indexOf(q) >= 0);
    });
    if (state.sort === 'saved') {
      list.sort(function (a, b) { return b.saved - a.saved; });
    } else if (state.sort === 'd3') {
      list.sort(function (a, b) { return (b.d3 - a.d3) || (a.idx - b.idx); });
    }
    return list;
  }

  function syncUrl() {
    var next = new URLSearchParams();
    if (state.cat !== '全部') next.set('cat', state.cat);
    if (state.q.trim()) next.set('q', state.q.trim());
    if (state.sort !== 'new') next.set('sort', state.sort);
    var query = next.toString();
    try {
      window.history.replaceState(null, '', window.location.pathname + (query ? '?' + query : ''));
    } catch (err) {
      // 个别环境（如沙盒 iframe）不允许改地址栏，筛选本身不受影响
    }
  }

  function render() {
    var list = matches();

    Array.prototype.forEach.call($chips.children, function (chip) {
      chip.setAttribute('aria-pressed', String(chip.dataset.cat === state.cat));
    });

    $grid.textContent = '';
    list.slice(0, state.shown).forEach(function (it) {
      $grid.appendChild(D.card(it));
    });

    $empty.hidden = list.length > 0;
    $more.hidden = list.length <= state.shown;
    $end.hidden = !(list.length > 0 && list.length <= state.shown);
  }

  function update() {
    syncUrl();
    render();
  }

  $count.textContent = '/setups · ' + D.SETUPS.length.toLocaleString('en-US') + ' 张真实桌搭';

  D.CATS.forEach(function (label) {
    var chip = D.el('button', 'chip', label);
    chip.type = 'button';
    chip.dataset.cat = label;
    chip.addEventListener('click', function () {
      state.cat = label;
      state.shown = PAGE_SIZE;
      update();
    });
    $chips.appendChild(chip);
  });

  $search.value = state.q;
  $search.addEventListener('input', function () {
    state.q = $search.value;
    state.shown = PAGE_SIZE;
    update();
  });

  $sort.value = state.sort;
  $sort.addEventListener('change', function () {
    state.sort = $sort.value;
    update();
  });

  $more.addEventListener('click', function () {
    state.shown += PAGE_STEP;
    render();
  });

  render();
})();

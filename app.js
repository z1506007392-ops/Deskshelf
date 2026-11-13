/* deskshelf 首页：分类筛选、搜索、排序、瀑布流、加载更多。
   数据和卡片在 shared.js 里。筛选状态会同步到地址栏，刷新或分享链接都能还原。 */
(function () {
  'use strict';

  var D = window.Deskshelf;
  var PAGE_SIZE = 12;
  var PAGE_STEP = 8;
  var SORTS = ['new', 'saved', 'd3'];
  var COL_GAP = 20;
  var ROW_GAP = 28;
  var EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

  var params = new URLSearchParams(window.location.search);
  var state = {
    cat: D.CATS.indexOf(params.get('cat')) >= 0 ? params.get('cat') : '全部',
    q: params.get('q') || '',
    sort: SORTS.indexOf(params.get('sort')) >= 0 ? params.get('sort') : 'new',
    shown: PAGE_SIZE
  };

  function $(id) {
    return document.getElementById(id);
  }

  var $count = $('count');
  var $filters = $('filters');
  var $sentinel = $('filters-sentinel');
  var $chips = $('chips');
  var $grid = $('grid');
  var $results = $('results');
  var $reset = $('reset');
  var $empty = $('empty');
  var $more = $('more');
  var $end = $('end');
  var $search = $('search');
  var $searchKbd = $('search-kbd');
  var $searchClear = $('search-clear');
  var $sort = $('sort');

  // ---------- 数据 ----------

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

  function filtered() {
    return state.cat !== '全部' || state.q.trim() !== '';
  }

  // 当前筛选，按原样写（不转义），地址栏和列表上方那行字都用它
  function queryPairs() {
    var pairs = [];
    if (state.cat !== '全部') pairs.push(['cat', state.cat]);
    if (state.q.trim()) pairs.push(['q', state.q.trim()]);
    if (state.sort !== 'new') pairs.push(['sort', state.sort]);
    return pairs;
  }

  function syncUrl() {
    var next = new URLSearchParams();
    queryPairs().forEach(function (pair) {
      next.set(pair[0], pair[1]);
    });
    var query = next.toString();
    try {
      window.history.replaceState(null, '', window.location.pathname + (query ? '?' + query : ''));
    } catch (err) {
      // 个别环境（如沙盒 iframe）不允许改地址栏，筛选本身不受影响
    }
  }

  // ---------- 瀑布流 ----------
  // 卡片按数据顺序留在 DOM 里，位置由这里算：每张放进当前最矮的一列。
  // 这样阅读顺序是从左到右，「加载更多」也只往下接，已有的卡片不会挪位置。

  var cards = {};

  function getCard(it) {
    if (!cards[it.slug]) cards[it.slug] = D.card(it);
    return cards[it.slug];
  }

  function columnCount(width) {
    if (width < 520) return 2;
    if (width < 900) return 3;
    return 4;
  }

  var laidWidth = -1;

  function layout() {
    var width = $grid.clientWidth;
    laidWidth = width;
    var kids = Array.prototype.slice.call($grid.children);
    if (!width || !kids.length) {
      $grid.style.height = '0px';
      return;
    }
    var cols = columnCount(width);
    var colWidth = (width - COL_GAP * (cols - 1)) / cols;
    $grid.style.setProperty('--col-w', colWidth + 'px');

    // 先统一读高度，再统一写位置，避免读写交替
    var heights = kids.map(function (kid) {
      return kid.offsetHeight;
    });
    var tops = [];
    for (var c = 0; c < cols; c++) tops.push(0);
    kids.forEach(function (kid, i) {
      var col = 0;
      for (var k = 1; k < cols; k++) {
        if (tops[k] < tops[col] - 0.5) col = k;
      }
      kid.style.transform = 'translate(' + (col * (colWidth + COL_GAP)) + 'px,' + tops[col] + 'px)';
      tops[col] += heights[i] + ROW_GAP;
    });
    $grid.style.height = (Math.max.apply(null, tops) - ROW_GAP) + 'px';
  }

  // 同一页里筛选、排序时，每张卡片有自己的名字，浏览器才能把它从旧位置移到新位置
  function nameCards() {
    Array.prototype.forEach.call($grid.children, function (kid) {
      var slug = kid.dataset.slug;
      kid.querySelector('.shot').style.viewTransitionName = 'shot-' + slug;
      kid.querySelector('.card__meta').style.viewTransitionName = 'meta-' + slug;
      kid.querySelector('.card__save').style.viewTransitionName = 'save-' + slug;
    });
  }

  // 新出现的卡片依次浮上来。只在首屏和「加载更多」时用，筛选时不用
  function appear(nodes) {
    if (!nodes.length || !nodes[0].animate) return;
    var gentle = !D.motionOK();
    nodes.forEach(function (node, i) {
      node.animate(
        gentle
          ? [{ opacity: 0 }, { opacity: 1 }]
          : [{ opacity: 0, translate: '0 18px' }, { opacity: 1, translate: '0 0' }],
        { duration: gentle ? 200 : 520, delay: gentle ? 0 : Math.min(i, 11) * 45, easing: EASE_OUT, fill: 'backwards' }
      );
    });
  }

  // ---------- 分类胶囊 ----------

  // 选中态是盖在分类上面的一层深色副本，这里只移动它的裁剪框（样式里有说明）
  var $active = D.el('div', 'chips__active');
  $active.setAttribute('aria-hidden', 'true');

  function moveActive(animate) {
    var chip = $chips.querySelector('button.chip[aria-pressed="true"]');
    if (!chip) return;
    var left = chip.offsetLeft;
    var right = $active.offsetWidth - left - chip.offsetWidth;
    $active.style.transitionDuration = animate && D.motionOK() ? '' : '0s';
    $active.style.clipPath = 'inset(0 ' + right + 'px 0 ' + left + 'px round 999px)';
    // 横向滚动的那一排里，选中的要露出来
    if (left - 16 < $chips.scrollLeft) $chips.scrollLeft = left - 16;
    else if (left + chip.offsetWidth + 16 > $chips.scrollLeft + $chips.clientWidth) {
      $chips.scrollLeft = left + chip.offsetWidth + 16 - $chips.clientWidth;
    }
  }

  // ---------- 渲染 ----------

  function render(append) {
    var list = matches();
    var visible = list.slice(0, state.shown);
    var nodes = visible.map(getCard);
    var before = append ? $grid.children.length : 0;

    if (append) {
      nodes.slice(before).forEach(function (node) {
        $grid.appendChild(node);
      });
    } else {
      $grid.replaceChildren.apply($grid, nodes);
    }
    nameCards();
    layout();

    Array.prototype.forEach.call($chips.querySelectorAll('button.chip'), function (chip) {
      chip.setAttribute('aria-pressed', String(chip.dataset.cat === state.cat));
    });

    var query = queryPairs().map(function (pair) {
      return pair[0] + '=' + pair[1];
    }).join('&');
    var amount = visible.length < list.length ? visible.length + ' / ' + list.length : String(list.length);
    $results.textContent = '/setups' + (query ? '?' + query : '') + ' · ' + amount + ' 张';

    $reset.hidden = !filtered() || list.length === 0;
    $empty.hidden = list.length > 0;
    $more.hidden = list.length <= state.shown;
    $end.hidden = !(list.length > PAGE_SIZE && list.length <= state.shown);
    $searchClear.hidden = state.q === '';
    $searchKbd.hidden = state.q !== '';

    return nodes.slice(before);
  }

  // ---------- 吸顶的筛选栏 ----------

  function stickyTop() {
    return parseFloat(window.getComputedStyle($filters).top) || 0;
  }

  function checkStuck() {
    $filters.classList.toggle('is-stuck', $sentinel.getBoundingClientRect().top < stickyTop() - 0.5);
  }

  // 列表变短以后，如果筛选栏正吸在顶上，就把列表开头对回到它下面
  function keepInView() {
    if (!$filters.classList.contains('is-stuck')) return;
    var top = window.scrollY + $sentinel.getBoundingClientRect().top - stickyTop() + 1;
    window.scrollTo({ top: top, behavior: 'instant' });
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      checkStuck();
    });
  }, { passive: true });

  // ---------- 状态变化 ----------

  // animated：点分类、换排序、清除筛选时把前后两帧接起来；打字搜索太频繁，直接换
  function update(animated) {
    syncUrl();
    var run = function () {
      render(false);
      moveActive(animated);
      keepInView();
    };
    if (animated) D.transition(run);
    else run();
  }

  function reset() {
    state.cat = '全部';
    state.q = '';
    state.shown = PAGE_SIZE;
    $search.value = '';
    update(true);
  }

  $count.textContent = '/setups · ' + D.SETUPS.length.toLocaleString('en-US') + ' 张真实桌搭';

  D.CATS.forEach(function (label) {
    var chip = D.el('button', 'chip', label);
    chip.type = 'button';
    chip.dataset.cat = label;
    chip.addEventListener('click', function () {
      if (state.cat === label) return;
      state.cat = label;
      state.shown = PAGE_SIZE;
      update(true);
    });
    $chips.appendChild(chip);
    $active.appendChild(D.el('span', 'chip', label));
  });
  $chips.appendChild($active);

  $search.value = state.q;
  $search.addEventListener('input', function () {
    state.q = $search.value;
    state.shown = PAGE_SIZE;
    update(false);
  });
  $search.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if ($search.value) {
      event.preventDefault();
      $search.value = '';
      state.q = '';
      state.shown = PAGE_SIZE;
      update(false);
    } else {
      $search.blur();
    }
  });
  $searchClear.addEventListener('click', function () {
    $search.value = '';
    state.q = '';
    state.shown = PAGE_SIZE;
    update(false);
    $search.focus();
  });

  // 按 / 直接跳到搜索框
  document.addEventListener('keydown', function (event) {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
    var target = event.target;
    if (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    if (document.querySelector('dialog[open]')) return;
    event.preventDefault();
    $search.focus();
    $search.select();
  });

  $sort.value = state.sort;
  $sort.addEventListener('change', function () {
    state.sort = $sort.value;
    update(true);
  });

  $reset.addEventListener('click', reset);
  $('empty-reset').addEventListener('click', function () {
    reset();
    $search.focus();
  });

  $more.addEventListener('click', function () {
    state.shown += PAGE_STEP;
    appear(render(true));
  });

  // ---------- 首次渲染 ----------

  var first = render(false);
  moveActive(false);
  checkStuck();

  // 进场只做一次：标题两行依次出现，卡片跟着浮上来。
  // 如果是带着转场从详情页回来的，就不再叠一层进场动画。
  var introDone = false;

  function intro() {
    if (introDone) return;
    introDone = true;
    if (D.motionOK()) document.documentElement.classList.add('intro');
    appear(first);
  }

  if ('onpagereveal' in window) {
    window.addEventListener('pagereveal', function (event) {
      // 离开页面时名字被清过（见 shared.js），从缓存里回来要补上
      $filters.style.viewTransitionName = '';
      nameCards();
      if (!event.viewTransition) {
        intro();
        return;
      }
      introDone = true;
      // 从详情页回来：那张卡片不在屏幕里的话就不做变形，免得大图飞出画面
      var from = window.navigation && window.navigation.activation && window.navigation.activation.from;
      var card = from && cards[D.slugOf(from.url)];
      if (!card || !card.isConnected) return;
      var box = card.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) {
        card.querySelector('.shot').style.viewTransitionName = 'none';
        event.viewTransition.finished.then(nameCards, nameCards);
      }
    });
  } else {
    intro();
  }

  // 列宽变了、字体换好了，都要重新排一次
  function relayout() {
    layout();
    moveActive(false);
    checkStuck();
  }

  if (window.ResizeObserver) {
    new ResizeObserver(function () {
      if ($grid.clientWidth !== laidWidth) relayout();
    }).observe($grid);
  } else {
    window.addEventListener('resize', relayout);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
})();

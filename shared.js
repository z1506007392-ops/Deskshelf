/* deskshelf 两个页面共用：示例数据、卡片、提示条、登录占位弹层、页面转场。
   数据目前是写死的示例，接后端时把 SETUPS 换成接口返回即可。 */
(function () {
  'use strict';

  var CATS = ['全部', '极简', '电竞', '编程', '设计师', '小户型', '理线', '复古'];
  var LIGHT = ['#EFEAE2', '#E6ECE8', '#E9E6F0', '#F1E7E1', '#E3EAF1', '#EDEDEB', '#F2EEDC'];
  var DARK = ['#17181C', '#1E1B26', '#101418'];

  // 每个分类一份示例简介和同款清单：[物品名, 品类]
  var CAT_SAMPLE = {
    '极简': {
      desc: '桌面上只留每天都用的东西，线全部走桌下，颜色控制在两三种以内。',
      items: [['原木色桌面', '桌子'], ['27 英寸显示器', '显示器'], ['矮轴无线键盘', '键盘'], ['毛毡桌垫', '桌垫'], ['屏幕挂灯', '灯具'], ['桌下理线槽', '理线']]
    },
    '电竞': {
      desc: '暗色环境加灯带，主屏高刷，耳机和手柄都有固定的位置。',
      items: [['电竞桌', '桌子'], ['高刷电竞显示器', '显示器'], ['磁轴键盘', '键盘'], ['轻量化鼠标', '鼠标'], ['大号鼠标垫', '桌垫'], ['屏幕背光灯带', '灯具']]
    },
    '编程': {
      desc: '屏幕面积优先，键盘手感其次，坐一整天也不累。',
      items: [['升降桌', '桌子'], ['4K 显示器', '显示器'], ['显示器支架', '支架'], ['分体式机械键盘', '键盘'], ['轨迹球', '鼠标'], ['人体工学椅', '椅子']]
    },
    '设计师': {
      desc: '屏幕颜色要准，手边要有画板和样张的位置，光线尽量均匀。',
      items: [['大桌面工作台', '桌子'], ['广色域显示器', '显示器'], ['数位板', '绘图'], ['校色仪', '校色'], ['高显色台灯', '灯具'], ['样张收纳架', '收纳']]
    },
    '小户型': {
      desc: '桌面不大，所以每件东西要么能挂起来，要么能收进去。',
      items: [['窄款书桌', '桌子'], ['便携显示器', '显示器'], ['笔记本支架', '支架'], ['折叠键盘', '键盘'], ['夹式台灯', '灯具'], ['墙面置物板', '收纳']]
    },
    '理线': {
      desc: '看得见的线一根不留：电源走桌下，数据线走线槽，充电线用磁吸收住。',
      items: [['升降桌', '桌子'], ['桌下理线槽', '理线'], ['插座收纳盒', '理线'], ['魔术贴扎带', '理线'], ['磁吸线夹', '理线'], ['桌面扩展坞', '配件']]
    },
    '复古': {
      desc: '木头、暖光和几件旧物，新设备尽量藏在后面。',
      items: [['胡桃木书桌', '桌子'], ['木质显示器增高架', '支架'], ['复古键帽机械键盘', '键盘'], ['黄铜台灯', '灯具'], ['桌面收音机', '摆件'], ['皮质桌垫', '桌垫']]
    }
  };

  // 单独写了简介和清单的桌搭
  var OVERRIDES = {
    'white-oak-minimal': {
      desc: '160 cm 的白橡木桌面配一块 27 寸屏，线全部走桌下，桌面上只留键盘、桌垫和一盏挂灯。适合想把工作区收干净、又不想显得冷清的人。',
      items: [['白橡木升降桌 160 × 70', '桌子'], ['27 英寸 4K 显示器', '显示器'], ['75% 铝壳机械键盘', '键盘'], ['羊毛毡桌垫 90 × 40', '桌垫'], ['屏幕挂灯', '灯具'], ['桌下理线槽', '理线']]
    }
  };

  // slug, 标题, 分类, 占位比例, 可 3D 复刻, 博主（示例昵称）, 收藏数权重, 桌面宽 cm, 桌面深 cm, 其他标签
  var SETUPS = [
    ['white-oak-minimal', '白橡木极简桌面', '极简', '4 / 5', 1, '阿木', 18, 160, 70, ['白橡木', '单屏', '理线']],
    ['rgb-battlestation', 'RGB 电竞战斗位', '电竞', '4 / 3', 1, '夜航', 20, 180, 80, ['RGB', '双屏']],
    ['dual-monitor-dev', '双屏开发工位', '编程', '3 / 4', 0, 'Kiko', 12, 160, 80, ['双屏', '机械键盘']],
    ['studio-display-designer', '设计师的单屏工作台', '设计师', '1 / 1', 1, '拾屿', 17, 180, 80, ['单屏', '校色']],
    ['tiny-room-80cm', '80 cm 小桌面', '小户型', '2 / 3', 0, '小满', 9, 80, 50, ['单屏', '收纳']],
    ['clean-cable-underdesk', '桌下理线示范', '理线', '5 / 4', 1, '灰尘', 19, 140, 70, ['升降桌', '收纳']],
    ['walnut-retro-radio', '胡桃木与老收音机', '复古', '4 / 5', 0, '旧时光', 7, 120, 60, ['胡桃木', '收音机']],
    ['all-white-compact', '全白紧凑桌面', '极简', '4 / 3', 0, 'Mono柚', 14, 120, 60, ['全白', '单屏']],
    ['ultrawide-sim-racing', '带鱼屏模拟赛车位', '电竞', '3 / 4', 0, '北纬三十', 11, 160, 80, ['带鱼屏', '模拟赛车']],
    ['vertical-monitor-vim', '竖屏 Vim 工位', '编程', '1 / 1', 1, 'Lin', 16, 140, 70, ['竖屏', '双屏']],
    ['ipad-sketch-corner', '平板手绘角落', '设计师', '2 / 3', 0, '周末工坊', 6, 100, 60, ['平板', '手绘']],
    ['bay-window-desk', '飘窗改书桌', '小户型', '4 / 5', 1, '南枝', 15, 120, 55, ['飘窗', '单屏']],
    ['pegboard-zero-wires', '洞洞板无线桌面', '理线', '3 / 4', 0, '阿木', 13, 140, 60, ['洞洞板', '收纳']],
    ['crt-typewriter-nook', 'CRT 与打字机角落', '复古', '1 / 1', 0, '旧时光', 5, 110, 60, ['CRT', '打字机']],
    ['birch-ladder-shelf', '桦木梯形架桌面', '极简', '3 / 4', 0, '拾屿', 10, 120, 60, ['桦木', '收纳']],
    ['dark-oled-triple', '暗色 OLED 三屏', '电竞', '4 / 5', 0, '夜航', 8, 200, 80, ['三屏', 'OLED']],
    ['standing-desk-terminal', '升降桌终端工位', '编程', '4 / 5', 1, 'Kiko', 4, 160, 75, ['升降桌', '单屏']],
    ['color-proof-lightbox', '校色看样台', '设计师', '4 / 3', 0, 'Mono柚', 3, 180, 90, ['校色', '灯箱']],
    ['dorm-loft-setup', '宿舍上床下桌', '小户型', '1 / 1', 0, '小满', 2, 90, 55, ['宿舍', '收纳']],
    ['magnetic-cable-rail', '磁吸理线轨', '理线', '4 / 5', 1, '灰尘', 1, 150, 70, ['磁吸', '收纳']]
  ].map(function (r, i) {
    var dark = r[2] === '电竞';
    var sample = OVERRIDES[r[0]] || CAT_SAMPLE[r[2]];
    return {
      slug: r[0],
      title: r[1],
      cat: r[2],
      ratio: r[3],
      d3: !!r[4],
      by: r[5],
      saved: r[6],
      width: r[7],
      depth: r[8],
      tags: [r[2]].concat(r[9]),
      desc: sample.desc,
      items: sample.items.map(function (item) {
        return { name: item[0], kind: item[1] };
      }),
      idx: i,
      dark: dark,
      bg: dark ? DARK[i % DARK.length] : LIGHT[i % LIGHT.length]
    };
  });

  var CUBE_ICON =
    '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true"><path d="M6 1l4.5 2.5v5L6 11 1.5 8.5v-5z"></path><path d="M1.5 3.5L6 6l4.5-2.5M6 6v5"></path></svg>';
  var ARROW_ICON =
    '<svg class="arrow" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 7h9M8 3.5L11.5 7 8 10.5"></path></svg>';

  var BOOKMARK_ICON =
    '<svg width="12" height="14" viewBox="0 0 14 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M2 1.5h10v13L7 11l-5 3.5z"></path></svg>';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function motionOK() {
    return !reduceMotion.matches;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function find(slug) {
    for (var i = 0; i < SETUPS.length; i++) {
      if (SETUPS[i].slug === slug) return SETUPS[i];
    }
    return null;
  }

  function detailUrl(it) {
    return 'detail.html?slug=' + encodeURIComponent(it.slug);
  }

  // 首页链接：标签正好是分类名时用 cat，否则用关键词搜索
  function tagUrl(tag) {
    var key = CATS.indexOf(tag) > 0 ? 'cat' : 'q';
    return 'index.html?' + key + '=' + encodeURIComponent(tag);
  }

  // ---------- 收藏：存 slug 列表；浏览器禁用存储时退回到只在当前页面有效 ----------
  var SAVED_KEY = 'deskshelf:saved';
  var savedFallback = null;

  function readSaved() {
    if (savedFallback) return savedFallback;
    try {
      var list = JSON.parse(window.localStorage.getItem(SAVED_KEY));
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return [];
    }
  }

  function isSaved(slug) {
    return readSaved().indexOf(slug) >= 0;
  }

  // 返回有没有真的存下来
  function setSaved(slug, saved) {
    var list = readSaved().filter(function (s) {
      return s !== slug;
    });
    if (saved) list.push(slug);
    try {
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(list));
      savedFallback = null;
      return true;
    } catch (err) {
      savedFallback = list;
      return false;
    }
  }

  // 收藏按钮点下去之后的反馈：图标弹一下，底部出提示条
  function saveFeedback(button, saved, kept) {
    var icon = button.querySelector('svg');
    if (saved && icon && icon.animate && motionOK()) {
      icon.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }],
        { duration: 280, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
      );
    }
    if (!saved) toast('已取消收藏');
    else toast(kept ? '已收藏，保存在这台设备的浏览器里' : '已收藏，但这个浏览器存不下来，关掉页面就没了');
  }

  // 给占位图上色并放进线稿。data-shot 记着是哪张桌搭，页面转场靠它配对
  function paintShot(shot, it, art) {
    shot.dataset.shot = it.slug;
    shot.style.setProperty('--shot-bg', it.bg);
    shot.classList.toggle('shot--dark', it.dark);
    if (art) {
      var holder = el('span', 'shot__art');
      holder.innerHTML = art;
      shot.appendChild(holder);
    }
  }

  // 传了 ratio（比如 4 / 5）时比例由外层样式定，线稿按这个比例画；不传就用桌搭自己的占位比例
  function card(it, ratio) {
    var article = el('article', 'card');
    article.dataset.slug = it.slug;

    var shot = el('a', 'shot');
    shot.href = detailUrl(it);
    shot.setAttribute('aria-label', '查看桌搭：' + it.title);
    if (!ratio) shot.style.aspectRatio = it.ratio;
    paintShot(shot, it, window.DeskSketch.front(it, { ratio: ratio }));
    if (it.d3) {
      var tag = el('span', 'tag-3d');
      // 窄卡片上只留「3D」，给右上角的收藏按钮让位置
      tag.innerHTML = CUBE_ICON + '<span><span class="tag-3d__more">可 </span>3D<span class="tag-3d__more"> 复刻</span></span>';
      shot.appendChild(tag);
    }
    shot.appendChild(el('span', 'shot__label', '占位图 · ' + it.cat));

    var meta = el('div', 'card__meta');
    var path = el('a', 'card__path', '/setups/' + it.slug);
    path.href = detailUrl(it);
    path.tabIndex = -1; // 和上面的图是同一个链接，键盘只停一次
    var by = el('span', 'card__by');
    var avatar = el('span', 'avatar', it.by.charAt(0));
    avatar.setAttribute('aria-hidden', 'true');
    by.appendChild(avatar);
    by.appendChild(document.createTextNode(it.by));
    meta.appendChild(path);
    meta.appendChild(by);

    // 卡片右上角的快速收藏。和图是并列的两个控件，不嵌在链接里面
    var save = el('button', 'card__save');
    save.type = 'button';
    save.innerHTML = BOOKMARK_ICON;
    save.setAttribute('aria-label', '收藏：' + it.title);
    save.setAttribute('aria-pressed', String(isSaved(it.slug)));
    save.addEventListener('click', function () {
      var saved = save.getAttribute('aria-pressed') !== 'true';
      var kept = setSaved(it.slug, saved);
      save.setAttribute('aria-pressed', String(saved));
      saveFeedback(save, saved, kept);
    });

    article.appendChild(shot);
    article.appendChild(save);
    article.appendChild(meta);
    return article;
  }

  // 转场被打断（比如动画还没完就又点了别处）时浏览器会让这几个 promise 失败，
  // 这是正常情况，接住它，不让控制台报「未处理的错误」
  function quiet(viewTransition) {
    var noop = function () {};
    viewTransition.ready.catch(noop);
    viewTransition.updateCallbackDone.catch(noop);
    viewTransition.finished.catch(noop);
  }

  // 有变化时用浏览器的视图转场把前后两帧接起来；不支持或用户关了动效就直接换
  var localTransitions = 0;

  function transition(update) {
    if (!document.startViewTransition || !motionOK()) {
      update();
      return;
    }
    // .vt-local 告诉样式这是同一页里的转场（筛选栏不跟着淡入淡出）
    var root = document.documentElement;
    var done = function () {
      localTransitions -= 1;
      if (localTransitions === 0) root.classList.remove('vt-local');
    };
    localTransitions += 1;
    root.classList.add('vt-local');
    var running = document.startViewTransition(update);
    quiet(running);
    running.finished.then(done, done);
  }

  // ---------- 提示条 ----------
  var toastNode = null;
  var toastTimer = 0;

  function toast(message) {
    if (!toastNode) {
      toastNode = el('div', 'toast');
      toastNode.setAttribute('role', 'status');
      toastNode.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastNode);
      void toastNode.offsetWidth; // 先落一帧，第一次出现也有过渡
    }
    toastNode.textContent = message;
    toastNode.classList.add('is-open');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastNode.classList.remove('is-open');
    }, 2600);
  }

  // ---------- 登录 ----------
  // 登录还没有后端，点击后用弹层说明，而不是毫无反应
  var loginDialog = null;

  function openLogin() {
    if (!loginDialog) {
      loginDialog = el('dialog', 'dialog');
      loginDialog.setAttribute('aria-labelledby', 'login-title');
      var form = el('form');
      form.method = 'dialog';
      var title = el('h2', 'dialog__title', '登录');
      title.id = 'login-title';
      var close = el('button', 'btn btn--dark', '知道了');
      close.type = 'submit';
      form.appendChild(el('p', 'path', '/login'));
      form.appendChild(title);
      form.appendChild(el('p', 'prose', '登录功能还在开发中，暂时用不了。收藏会先保存在这台设备的浏览器里。'));
      form.appendChild(close);
      loginDialog.appendChild(form);
      // 点弹层外面的遮罩也能关
      loginDialog.addEventListener('click', function (event) {
        if (event.target === loginDialog) loginDialog.close();
      });
      document.body.appendChild(loginDialog);
    }
    if (typeof loginDialog.showModal === 'function') {
      loginDialog.showModal();
    } else {
      window.alert('登录功能还在开发中，暂时用不了。');
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-login]'), function (btn) {
    btn.addEventListener('click', openLogin);
  });

  // ---------- 页面之间的转场 ----------
  // 离开页面前只给「点中的那张」和「详情页的大图」留名字，这样只有它俩在两页之间变形，
  // 其余内容整体淡入淡出，不会满屏乱飞。
  function slugOf(url) {
    try {
      return new URL(url, window.location.href).searchParams.get('slug');
    } catch (err) {
      return null;
    }
  }

  function nameShots(keep) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-shot]'), function (shot) {
      shot.style.viewTransitionName = keep(shot) ? 'shot-' + shot.dataset.shot : 'none';
    });
    Array.prototype.forEach.call(document.querySelectorAll('.card__meta, .card__save, .filters'), function (node) {
      node.style.viewTransitionName = 'none';
    });
  }

  window.addEventListener('pageswap', function (event) {
    if (event.viewTransition) quiet(event.viewTransition);
    if (!event.viewTransition || !event.activation) return;
    var target = slugOf(event.activation.entry.url);
    nameShots(function (shot) {
      return shot.id === 'main-shot' || shot.dataset.shot === target;
    });
  });

  window.addEventListener('pagereveal', function (event) {
    if (event.viewTransition) quiet(event.viewTransition);
  });

  // 从别的页面返回时（页面可能是从缓存里恢复的），收藏状态按最新的重画一遍
  window.addEventListener('pageshow', function () {
    Array.prototype.forEach.call(document.querySelectorAll('.card'), function (node) {
      var button = node.querySelector('.card__save');
      if (button) button.setAttribute('aria-pressed', String(isSaved(node.dataset.slug)));
    });
  });

  window.Deskshelf = {
    CATS: CATS,
    LIGHT: LIGHT,
    DARK: DARK,
    SETUPS: SETUPS,
    ARROW_ICON: ARROW_ICON,
    el: el,
    find: find,
    detailUrl: detailUrl,
    tagUrl: tagUrl,
    paintShot: paintShot,
    card: card,
    motionOK: motionOK,
    transition: transition,
    toast: toast,
    slugOf: slugOf,
    isSaved: isSaved,
    setSaved: setSaved,
    saveFeedback: saveFeedback
  };
})();

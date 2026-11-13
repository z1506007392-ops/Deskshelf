/* deskshelf 占位线稿：真实照片到位之前，按桌搭数据画一张房间立面代替纯色块。
   front 是正视图（墙、地面、桌子和桌上的东西），top 是俯视图，icon 是清单里的小图标，
   spots 给出清单里每类物品在正视图上的位置，详情页用它放热点。
   只用 shared.js 里的示例数据拼 SVG，不接收用户输入。 */
(function () {
  'use strict';

  var FLOOR = 118;   // 墙和地面的交界
  var TOP = 78;      // 桌面上沿
  var WALL_TOP = 6;  // 画面再矮，也要露出这么高的墙

  function r(value) {
    return Math.round(value * 10) / 10;
  }

  function cls(name) {
    return name ? ' class="' + name + '"' : '';
  }

  function rect(x, y, w, h, radius, name) {
    return '<rect x="' + r(x) + '" y="' + r(y) + '" width="' + r(w) + '" height="' + r(h) +
      '" rx="' + r(radius || 0) + '"' + cls(name) + '></rect>';
  }

  function path(d, name) {
    return '<path d="' + d + '"' + cls(name) + '></path>';
  }

  function line(x1, y1, x2, y2, name) {
    return path('M' + r(x1) + ' ' + r(y1) + 'L' + r(x2) + ' ' + r(y2), name);
  }

  function circle(cx, cy, radius, name) {
    return '<circle cx="' + r(cx) + '" cy="' + r(cy) + '" r="' + radius + '"' + cls(name) + '></circle>';
  }

  // 局部坐标画好的小物件，按 x 平移；mirror 时左右翻转
  function at(x, width, mirror, inner) {
    var transform = mirror
      ? 'translate(' + r(x + width) + ' 0) scale(-1 1)'
      : 'translate(' + r(x) + ' 0)';
    return '<g transform="' + transform + '">' + inner + '</g>';
  }

  function scale(value, inMin, inMax, outMin, outMax) {
    var t = Math.max(0, Math.min(1, (value - inMin) / (inMax - inMin)));
    return outMin + (outMax - outMin) * t;
  }

  // fit 为 slice 时铺满容器（多出来的裁掉），否则完整显示
  function svg(box, inner, fit) {
    return '<svg class="sketch" viewBox="' + r(box.x) + ' ' + r(box.y) + ' ' + r(box.w) + ' ' + r(box.h) + '" ' +
      'preserveAspectRatio="' + (fit || 'xMidYMid meet') + '" fill="none" stroke="currentColor" stroke-width="1.25" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + inner + '</svg>';
  }

  // 宽高比可以写成数字，也可以写成 "4 / 5"
  function ratioOf(value) {
    if (typeof value === 'number' && value > 0) return value;
    var parts = String(value || '').split('/');
    var n = parseFloat(parts[0]) / (parseFloat(parts[1]) || 1);
    return n > 0 ? n : 1.5;
  }

  // 按容器的宽高比定画面范围：桌子的大小不变，画面越高，上面露出的墙越多、下面的地面越深
  function frame(ratio) {
    var w = 184;
    var h = w / ratio;
    var floor = Math.max(20, Math.min(58, h * 0.22));
    var y = FLOOR + floor - h;
    if (y > WALL_TOP) {
      // 画面偏宽：保住墙面的高度，改成往两边多露一点
      h = (FLOOR - WALL_TOP) / 0.78;
      floor = h * 0.22;
      w = h * ratio;
      y = WALL_TOP;
    }
    return { x: 100 - w / 2, y: y, w: w, h: h, floor: floor };
  }

  function reader(setup) {
    return {
      tag: function (name) {
        return setup.tags.indexOf(name) >= 0;
      },
      item: function (word) {
        return setup.items.some(function (it) {
          return it.name.indexOf(word) >= 0 || it.kind === word;
        });
      }
    };
  }

  // 屏幕怎么摆：返回种类和每块屏的宽高
  function screens(setup, has) {
    if (has.tag('CRT')) return { kind: 'crt', list: [{ w: 34, h: 30 }] };
    if (has.tag('宿舍')) return { kind: 'laptop', list: [{ w: 30, h: 19 }] };
    if (has.tag('平板')) return { kind: 'tablet', list: [{ w: 28, h: 20 }] };
    if (has.tag('三屏')) return { kind: 'flat', list: [{ w: 30, h: 21 }, { w: 42, h: 25 }, { w: 30, h: 21 }] };
    if (has.tag('带鱼屏')) return { kind: 'flat', list: [{ w: 78, h: 26 }] };
    if (has.tag('竖屏')) return { kind: 'flat', list: [{ w: 42, h: 25 }, { w: 20, h: 34, neck: 4 }] };
    if (has.tag('双屏')) return { kind: 'flat', list: [{ w: 40, h: 24 }, { w: 40, h: 24 }] };
    return { kind: 'flat', list: [setup.width <= 100 ? { w: 36, h: 22 } : { w: 46, h: 27 }] };
  }

  function hexagon(cx, cy, radius, name) {
    var d = '';
    for (var i = 0; i < 6; i++) {
      var angle = Math.PI / 3 * i;
      d += (i ? 'L' : 'M') + r(cx + radius * Math.cos(angle)) + ' ' + r(cy + radius * Math.sin(angle));
    }
    return path(d + 'z', name);
  }

  // 画一遍场景，返回线稿内容、画面范围和各类物品的位置
  function scene(setup, ratio) {
    var f = frame(ratio);
    var has = reader(setup);
    var flip = setup.idx % 2 === 1;
    var dark = setup.cat === '电竞';
    var dorm = has.tag('宿舍');
    var bay = has.tag('飘窗');
    var dw = scale(setup.width, 80, 200, 84, 172);
    var x0 = 100 - dw / 2;
    var x1 = 100 + dw / 2;
    var left = f.x - 2;
    var right = f.x + f.w + 2;
    var up = 8 - f.y; // 显示器上方多出来的墙面高度
    var wallBusy = dorm || bay || has.tag('洞洞板') || has.tag('收纳') || has.tag('校色');
    var out = [];
    var spot = {};

    // ---- 墙面上半部分：只有高卡片才有 ----
    if (bay) {
      var wy = up >= 28 ? Math.max(f.y + 30, -34) : 12;
      out.push(rect(34, wy, 132, 70 - wy, 1.5, 'sk-soft'), line(100, wy, 100, 70, 'sk-soft'), line(34, (wy + 70) / 2, 166, (wy + 70) / 2, 'sk-soft'));
    }
    if (up >= 28 && !dark && !dorm) {
      // 吊灯。左上角有「可 3D 复刻」角标时固定挂在右边，不和角标挤在一起
      var lampX = setup.d3 ? 130 : (flip ? 78 : 122);
      var ly = f.y + Math.max(20, Math.min(44, up * 0.46));
      var shade = setup.idx % 3;
      out.push(line(lampX, f.y - 2, lampX, ly - 9));
      if (shade === 0) out.push(path('M' + (lampX - 9) + ' ' + r(ly) + 'a9 9 0 0 1 18 0z', 'sk-fill'));
      else if (shade === 1) out.push(path('M' + (lampX - 3.5) + ' ' + r(ly - 9) + 'h7l6.5 9h-20z', 'sk-fill'));
      else out.push(circle(lampX, ly - 5.5, 5.5, 'sk-fill'));
      spot.pendant = [lampX, ly - 4.5];
    }
    if (up >= 50 && !dark && !dorm && !bay) {
      // 几幅挂画，和吊灯分在两边，高度上让开角标
      var artRight = flip && !setup.d3;
      var ay = f.y + Math.max(up * 0.62, 56) - 15;
      out.push(at(artRight ? 115 : 41, 42, artRight,
        rect(0, ay, 24, 30, 1, 'sk-fill') + circle(15, ay + 11, 3.2, 'sk-soft') +
        path('M4 ' + r(ay + 21) + 'h16M4 ' + r(ay + 24.5) + 'h10', 'sk-soft') +
        rect(28, ay, 14, 14, 1, 'sk-fill') + path('M31 ' + r(ay + 10.5) + 'l3.5-5 2.5 3 1.5-1.5 2 3.5', 'sk-soft') +
        rect(28, ay + 18, 14, 12, 1, 'sk-tone')));
    }
    if (dark) {
      // 电竞位：墙上的六边形灯板
      var tall = up >= 50;
      var hr = tall ? 8 : 6;
      var hx = tall ? 96 : 112;
      var hy = tall ? f.y + up * 0.5 : 24;
      [[0, 0], [1, 0.5], [2, 0], [3, 0.5], [3, -0.5], [4, 0], [5, -0.5]].forEach(function (cell, i) {
        out.push(hexagon(hx + cell[0] * 1.5 * hr, hy + cell[1] * 1.732 * hr, hr - 0.6, i % 3 === 1 ? 'sk-tone' : ''));
      });
      if (tall) out.push(rect(100 - 38, 9, 76, 2.4, 1.2, 'sk-tone'));
    }
    if (up >= 78 && !dark && !wallBusy) {
      // 显示器上方的搁板：几本书、一幅小画、一盆垂下来的植物
      var sh = 100 - 32;
      out.push(
        line(sh, 20, sh + 64, 20), path('M' + (sh + 8) + ' 20v4M' + (sh + 56) + ' 20v4'),
        rect(sh + 6, 7, 4, 13, 0.5, 'sk-fill'), rect(sh + 11, 10, 4, 10, 0.5, 'sk-fill'), rect(sh + 16, 8, 5, 12, 0.5, 'sk-fill'),
        rect(sh + 28, 8, 10, 12, 1, 'sk-tone'),
        path('M' + (sh + 51.5) + ' 14c0-5-4-6-4-9M' + (sh + 51.5) + ' 14c0-5 1-7 0-11M' + (sh + 51.5) + ' 14c0-4 4-5 5-8'),
        path('M' + (sh + 48) + ' 20l-1-6h9l-1 6z', 'sk-fill')
      );
    }

    // ---- 墙面下半部分：跟着标签走 ----
    if (dorm) {
      out.push(rect(18, 16, 164, 7, 1.5, 'sk-fill'), line(22, 23, 22, FLOOR), line(178, 23, 178, FLOOR), line(167, 23, 167, FLOOR));
      [40, 56, 72, 88, 104].forEach(function (y) {
        out.push(line(167, y, 178, y));
      });
      if (up >= 20) out.push(rect(26, 8, 112, 8, 3, 'sk-fill'), rect(142, 9, 30, 7, 3, 'sk-tone'), line(18, 2, 182, 2, 'sk-soft'), line(18, 2, 18, 16, 'sk-soft'), line(182, 2, 182, 16, 'sk-soft'));
    }
    if (has.tag('洞洞板')) {
      var bx = flip ? x1 - 60 : x0 + 8;
      out.push(rect(bx, 16, 52, 42, 2, 'sk-soft'));
      for (var row = 0; row < 4; row++) {
        for (var col = 0; col < 6; col++) {
          out.push(circle(bx + 6 + col * 8, 22 + row * 9.5, 0.7, 'sk-dot'));
        }
      }
      out.push(rect(bx + 7, 26, 9, 13, 1.5, 'sk-fill'), line(bx + 26, 45, bx + 46, 45), rect(bx + 31, 38, 6, 7, 1, 'sk-fill'));
      spot['收纳'] = [bx + 26, 34];
    } else if (has.tag('收纳') && !dorm) {
      var sx = flip ? x0 + 6 : x1 - 52;
      out.push(
        line(sx, 38, sx + 46, 38),
        path('M' + r(sx + 6) + ' 38v5M' + r(sx + 40) + ' 38v5'),
        rect(sx + 5, 24, 4, 14, 0.5, 'sk-fill'), rect(sx + 10, 27, 4, 11, 0.5, 'sk-fill'), rect(sx + 15, 25, 5, 13, 0.5, 'sk-fill'),
        rect(sx + 28, 28, 13, 10, 1.5, 'sk-tone')
      );
      spot['收纳'] = [sx + 23, 32];
    }
    if (has.tag('校色')) {
      var gx = flip ? x1 - 34 : x0 + 12;
      for (var cy = 0; cy < 2; cy++) {
        for (var cx = 0; cx < 3; cx++) {
          out.push(rect(gx + cx * 8, 24 + cy * 8, 6, 6, 1, (cx + cy) % 2 ? 'sk-tone' : 'sk-soft'));
        }
      }
      spot['校色'] = [gx + 11, 31];
    }

    // ---- 地面 ----
    out.push(rect(left, FLOOR, right - left, f.floor + 4, 0, 'sk-floor'), line(left, FLOOR, right, FLOOR, 'sk-soft'));
    if (!dorm && setup.idx % 3 !== 2 && f.floor >= 36) {
      // 地毯：方的画成近窄远宽的梯形，圆的画成扁椭圆，看起来是铺在地上的。地面太浅时不画，免得压到左下角的说明文字
      var rw = Math.min(dw * 0.9, f.w - 36);
      var rh = f.floor * 0.36;
      var ry = FLOOR + f.floor * 0.2;
      if (setup.idx % 3 === 0) {
        out.push(path('M' + r(100 - rw / 2 + 7) + ' ' + r(ry) + 'h' + r(rw - 14) + 'l7 ' + r(rh) + 'h' + r(-rw) + 'z', 'sk-rug'));
      } else {
        out.push('<ellipse cx="100" cy="' + r(ry + rh / 2) + '" rx="' + r(rw * 0.42) + '" ry="' + r(rh / 2) + '" class="sk-rug"></ellipse>');
      }
    }
    var sideX = flip ? f.x : x1;
    var sideW = flip ? x0 - f.x : f.x + f.w - x1;
    if (sideW >= 24 && !dorm) {
      // 桌子窄、旁边有空地时，放一盆落地植物或者一个收纳筐
      var px = sideX + sideW / 2;
      var py = FLOOR - 11;
      var kind = setup.idx % 3;
      if (kind === 0) {
        out.push(path('M' + r(px) + ' ' + py + 'c0-13-8-17-10-28M' + r(px) + ' ' + py + 'c0-15 2-22 1-35M' + r(px) + ' ' + py + 'c0-11 7-15 10-24'),
          path('M' + r(px - 6) + ' ' + py + 'h12l-1.5 11h-9z', 'sk-fill'));
      } else if (kind === 1) {
        out.push(path('M' + r(px - 4) + ' ' + py + 'l-1.5-20 4 20M' + r(px - 0.5) + ' ' + py + 'l0-28 3.5 28M' + r(px + 3) + ' ' + py + 'l3.5-17 0.5 17'),
          path('M' + r(px - 6) + ' ' + py + 'h12l-1.5 11h-9z', 'sk-fill'));
      } else {
        out.push(line(px - 3, FLOOR - 13, px - 5.5, FLOOR - 31), line(px + 2, FLOOR - 13, px + 4.5, FLOOR - 26),
          rect(px - 8, FLOOR - 13, 16, 13, 2, 'sk-fill'), line(px - 8, FLOOR - 9, px + 8, FLOOR - 9, 'sk-soft'));
      }
    }

    // ---- 桌下 ----
    if ((dark || setup.cat === '编程') && !dorm) {
      var tx = flip ? x1 - 37 : x0 + 22;
      out.push(rect(tx, FLOOR - 29, 15, 29, 2, 'sk-fill'));
      if (dark) {
        out.push(circle(tx + 7.5, FLOOR - 20.5, 4, 'sk-tone'), circle(tx + 7.5, FLOOR - 9, 4, 'sk-tone'));
      } else {
        out.push(line(tx + 4, FLOOR - 23, tx + 11, FLOOR - 23), line(tx + 4, FLOOR - 19.5, tx + 11, FLOOR - 19.5), circle(tx + 7.5, FLOOR - 7, 0.8, 'sk-dot'));
      }
    }
    if (setup.cat === '理线' || has.item('理线槽')) {
      out.push(path('M76 ' + (TOP + 6) + 'v6.5h48v-6.5', 'sk-fill'), rect(88, TOP + 8, 24, 3, 1.5, 'sk-tone'));
      spot['理线'] = [110, TOP + 12.5];
    }
    if (has.item('灯带')) {
      out.push('<path d="M' + r(x0 + 8) + ' ' + (TOP + 6) + 'H' + r(x1 - 8) + '" stroke-dasharray="2 5"></path>');
      spot.strip = [x0 + 10, TOP + 6];
    }

    // ---- 桌腿和桌面 ----
    if (has.tag('升降桌') || has.item('升降桌')) {
      [x0 + 15, x1 - 15].forEach(function (lx) {
        out.push(rect(lx - 2.5, TOP + 3, 5, FLOOR - TOP - 5, 1, 'sk-fill'), line(lx - 10, FLOOR - 1.5, lx + 10, FLOOR - 1.5));
      });
      spot['桌子'] = [x1 - 15, TOP + 22];
    } else {
      out.push(line(x0 + 5, TOP + 3, x0 + 5, FLOOR), line(x1 - 5, TOP + 3, x1 - 5, FLOOR));
      if (setup.cat === '复古') {
        out.push(rect(x1 - 36, TOP + 3, 28, 12, 1, 'sk-fill'), circle(x1 - 22, TOP + 9, 0.9, 'sk-dot'));
      }
      spot['桌子'] = [x1 - 5, TOP + 24];
    }
    out.push(rect(x0, TOP, dw, 3, 1.2, 'sk-fill'));

    // ---- 屏幕 ----
    var mon = screens(setup, has);
    var gap = 2.5;
    var total = mon.list.reduce(function (sum, m) { return sum + m.w; }, 0) + gap * (mon.list.length - 1);
    var mx = 100 - total / 2;
    var monL = mx;
    var monR = mx + total;
    var main = mon.list.reduce(function (best, m) { return m.w > best.w ? m : best; }, mon.list[0]);
    var mainX = 100;

    mon.list.forEach(function (m) {
      var cx = mx + m.w / 2;
      if (m === main) mainX = cx;
      if (mon.kind === 'crt') {
        out.push(rect(cx - 10, TOP - 4, 20, 4, 1, 'sk-fill'), rect(mx, TOP - 4 - m.h + 4, m.w, m.h - 4, 3.5, 'sk-fill'), rect(mx + 4, TOP - m.h + 3, m.w - 8, m.h - 11, 4.5, 'sk-tone'));
        spot['显示器'] = [cx, TOP - m.h / 2 - 2];
      } else if (mon.kind === 'laptop') {
        out.push(rect(mx, TOP - 3 - m.h, m.w, m.h, 1.5, 'sk-tone'), rect(mx - 3, TOP - 3, m.w + 6, 3, 1.2, 'sk-fill'));
        spot['显示器'] = [cx + 2, TOP - 3 - m.h * 0.7];
        spot['支架'] = [cx + 14, TOP - 1.5];
        spot['键盘'] = [cx - 12, TOP - 1.5];
      } else if (mon.kind === 'tablet') {
        out.push(line(cx + 6, TOP, cx + 2, TOP - 12), '<g transform="rotate(-9 ' + r(cx) + ' ' + TOP + ')">' + rect(mx, TOP - m.h - 1, m.w, m.h, 2.5, 'sk-tone') + '</g>');
        spot['绘图'] = [cx - 2, TOP - m.h / 2 - 2];
      } else {
        var neck = m.neck || 7;
        var bottom = TOP - neck;
        out.push(line(cx, bottom, cx, TOP), rect(cx - 7, TOP - 1.6, 14, 1.6, 0.8, 'sk-fill'), rect(mx, bottom - m.h, m.w, m.h, 1.8, 'sk-tone'));
        if (m === main) {
          spot['显示器'] = [cx - 5, bottom - m.h * 0.6];
          spot['支架'] = [cx + 8, bottom - 1];
          if (has.item('挂灯')) {
            out.push(rect(cx - 11, bottom - m.h - 3.2, 22, 2.4, 1.2, 'sk-fill'));
            spot.bar = [cx + 9, bottom - m.h - 2];
          }
        }
      }
      mx += m.w + gap;
    });

    // ---- 键盘、鼠标 ----
    var frontRight = monR;
    if (has.tag('打字机')) {
      var ty = x0 + 10;
      out.push(
        rect(ty + 7, TOP - 20, 9, 10, 0.5, 'sk-fill'),
        path('M' + r(ty) + ' ' + TOP + 'l3-8h17l3 8z', 'sk-fill'),
        line(ty + 1.5, TOP - 10.5, ty + 21.5, TOP - 10.5)
      );
      monL = Math.min(monL, ty);
      spot['键盘'] = [ty + 11.5, TOP - 5];
    } else if (mon.kind !== 'laptop') {
      if (has.item('桌垫') || has.item('鼠标垫')) {
        out.push(rect(mainX - 27, TOP - 0.9, 58, 0.9, 0.4, 'sk-tone'));
        spot['桌垫'] = [mainX - 26, TOP - 0.5];
      }
      if (has.tag('机械键盘')) {
        out.push(rect(mainX - 18, TOP - 3.2, 16, 3.2, 1.2, 'sk-fill'), rect(mainX + 2, TOP - 3.2, 16, 3.2, 1.2, 'sk-fill'));
      } else {
        out.push(rect(mainX - 17, TOP - 3.2, 34, 3.2, 1.2, 'sk-fill'));
      }
      out.push(rect(mainX + 22, TOP - 2.6, 5.5, 2.6, 1.3, 'sk-fill'));
      frontRight = Math.max(monR, mainX + 27.5);
      spot['键盘'] = [mainX - 9, TOP - 1.6];
      spot['鼠标'] = [mainX + 24.7, TOP - 1.3];
    }

    // ---- 桌面两侧的小物件：从外往里放，放不下就不放 ----
    var zone = { L: { a: x0 + 5, b: monL - 5 }, R: { a: frontRight + 5, b: x1 - 5 } };
    var near = flip ? 'R' : 'L';
    var far = flip ? 'L' : 'R';

    // 放得下时返回一个换算函数：把物件的局部横坐标换成画面里的横坐标
    function place(side, width, draw) {
      var z = zone[side];
      if (z.b - z.a < width) return null;
      var x;
      if (side === 'L') {
        x = z.a;
        z.a += width + 4;
      } else {
        x = z.b - width;
        z.b -= width + 4;
      }
      out.push(at(x, width, side === 'R', draw));
      return function (local) {
        return side === 'R' ? x + width - local : x + local;
      };
    }

    var put;
    if (has.item('台灯')) {
      put = place(near, 18, rect(2, TOP - 1.6, 10, 1.6, 0.8, 'sk-fill') +
        path('M7 ' + (TOP - 1.6) + 'L4.5 ' + (TOP - 19) + 'L12 ' + (TOP - 27)) +
        path('M10.5 ' + (TOP - 29.5) + 'l7.5 2.6-1.9 4.3-7.5-2.6z', 'sk-fill'));
      if (put) spot.lamp = [put(13), TOP - 27];
    }
    if (has.tag('收音机')) {
      put = place(near, 23, rect(0, TOP - 14, 22, 14, 2, 'sk-fill') + circle(7, TOP - 7, 3.8, 'sk-tone') +
        line(14, TOP - 9.5, 18.5, TOP - 9.5) + line(14, TOP - 5.5, 18.5, TOP - 5.5) + line(18, TOP - 14, 22.5, TOP - 24));
      if (put) spot['摆件'] = [put(13), TOP - 7];
    }
    if (has.tag('灯箱')) {
      put = place(near, 20, rect(0, TOP - 26, 20, 26, 1.5, 'sk-fill') + rect(3, TOP - 23, 14, 17, 1, 'sk-tone'));
      if (put) spot.lightbox = [put(10), TOP - 14];
    }
    if (dark) {
      var speaker = rect(0, TOP - 13, 8, 13, 1.5, 'sk-fill') + circle(4, TOP - 4.5, 2) + circle(4, TOP - 9.8, 0.8, 'sk-dot');
      place('L', 8, speaker);
      place('R', 8, speaker);
    }
    if (setup.cat === '极简' || setup.cat === '小户型' || setup.cat === '设计师') {
      place(far, 12, path('M6 ' + (TOP - 7) + 'c0-6-5-8-5-12M6 ' + (TOP - 7) + 'c0-7 1-10 0-15M6 ' + (TOP - 7) + 'c0-6 5-7 6-11') +
        path('M2 ' + TOP + 'l-1.2-7h10.4l-1.2 7z', 'sk-fill'));
    }
    if (setup.cat === '编程' || setup.cat === '复古') {
      place(far, 17, rect(0, TOP - 3, 16, 3, 0.5, 'sk-fill') + rect(1.5, TOP - 6, 14, 3, 0.5, 'sk-fill') + rect(0.5, TOP - 8.6, 13, 2.6, 0.5, 'sk-fill'));
    }
    place(far, 8, path('M0 ' + TOP + 'v-6.5h6.5v6.5z', 'sk-fill') + path('M6.5 ' + (TOP - 5) + 'h1.2a1.6 1.6 0 0 1 0 3.2h-1.2'));

    // 灯具可能是挂灯、台灯、灯带或吊灯，谁画出来了就指谁
    spot['灯具'] = spot.bar || spot.lamp || spot.strip || spot.lightbox || spot.pendant;

    return { inner: out.join(''), frame: f, spot: spot };
  }

  // opts.ratio 是容器的宽高比，不给就用桌搭自己的占位比例；opts.zoom 只画桌面那一段
  function front(setup, opts) {
    opts = opts || {};
    var ratio = ratioOf(opts.ratio || setup.ratio);
    var drawn = scene(setup, ratio);
    if (opts.zoom) {
      var zw = 86;
      var zh = zw / ratio;
      return svg({ x: 100 - zw / 2, y: 62 - zh / 2, w: zw, h: zh }, drawn.inner, 'xMidYMid slice');
    }
    return svg(drawn.frame, drawn.inner, 'xMidYMax slice');
  }

  // 清单里的物品在正视图上的位置，按品类给出，单位是画面宽高的百分比
  function spots(setup, ratio) {
    var drawn = scene(setup, ratioOf(ratio || setup.ratio));
    var f = drawn.frame;
    var result = {};
    Object.keys(drawn.spot).forEach(function (kind) {
      var at = drawn.spot[kind];
      if (!at) return;
      result[kind] = { x: r((at[0] - f.x) / f.w * 100), y: r((at[1] - f.y) / f.h * 100) };
    });
    return result;
  }

  function top(setup, opts) {
    var ratio = ratioOf((opts && opts.ratio) || 4 / 3);
    var has = reader(setup);
    var flip = setup.idx % 2 === 1;
    var dw = scale(setup.width, 80, 200, 96, 176);
    var dd = scale(setup.depth, 50, 90, 52, 86);
    var x0 = 100 - dw / 2;
    var x1 = 100 + dw / 2;
    var y0 = 60 - dd / 2;
    var mon = screens(setup, has);
    var ky = y0 + dd * 0.56;
    var out = [];

    // 地毯和椅子在桌子下面一层
    out.push(rect(100 - dw * 0.4, y0 + dd * 0.45, dw * 0.8, dd * 0.55 + 40, 3, 'sk-rug'));
    out.push(rect(100 - 15, y0 + dd + 7, 30, 25, 7, 'sk-fill'), path('M' + (100 - 13) + ' ' + r(y0 + dd + 33.5) + 'q13 5 26 0', 'sk-soft'));
    out.push(rect(x0, y0, dw, dd, 3.5, 'sk-fill'));

    if (has.item('桌垫') || has.item('鼠标垫')) {
      var mw = Math.min(dw - 24, 100);
      out.push(rect(100 - mw / 2, ky - 6, mw, 26, 2.5, 'sk-tone'));
    }

    if (mon.kind === 'crt') {
      out.push(rect(100 - 17, y0 + 5, 34, 28, 3, 'sk-fill'));
    } else if (mon.kind === 'laptop' || mon.kind === 'tablet') {
      out.push(rect(100 - 18, y0 + 10, 36, 25, 2.5, 'sk-fill'));
      if (mon.kind === 'laptop') out.push(line(100 - 14, y0 + 22, 100 + 14, y0 + 22, 'sk-soft'));
    } else {
      var gap = 3;
      var total = mon.list.reduce(function (sum, m) { return sum + m.w; }, 0) + gap * (mon.list.length - 1);
      var mx = 100 - total / 2;
      mon.list.forEach(function (m, i) {
        var cx = mx + m.w / 2;
        var turn = mon.list.length < 2 ? 0 : (i === 0 ? 9 : (i === mon.list.length - 1 ? -9 : 0));
        out.push('<g transform="rotate(' + turn + ' ' + r(cx) + ' ' + r(y0 + 11) + ')">' +
          rect(cx - 7, y0 + 7, 14, 9, 2.5, 'sk-soft') + rect(mx, y0 + 9, m.w, 3.6, 1.8, 'sk-fill') + '</g>');
        mx += m.w + gap;
      });
    }

    if (mon.kind !== 'laptop') {
      out.push(rect(100 - 19, ky, 38, 13, 2.2, 'sk-fill'), line(100 - 15, ky + 4.4, 100 + 15, ky + 4.4, 'sk-soft'), line(100 - 15, ky + 8.6, 100 + 15, ky + 8.6, 'sk-soft'));
      out.push(rect(100 + 25, ky + 1.5, 7, 10.5, 3.5, 'sk-fill'));
    }

    var nearX = flip ? x1 - 13 : x0 + 13;
    var farX = flip ? x0 + 13 : x1 - 13;
    var dir = flip ? -1 : 1;
    if (has.item('台灯')) {
      out.push(circle(nearX, y0 + 13, 5.5, 'sk-fill'), line(nearX, y0 + 13, nearX + dir * 13, y0 + 22), circle(nearX + dir * 15, y0 + 23.5, 3.2, 'sk-fill'));
    }
    if (setup.cat === '极简' || setup.cat === '小户型' || setup.cat === '设计师') {
      out.push(circle(farX, y0 + 13, 6.5, 'sk-fill'), path('M' + r(farX) + ' ' + r(y0 + 13) + 'l-4-3M' + r(farX) + ' ' + r(y0 + 13) + 'l4.5-2M' + r(farX) + ' ' + r(y0 + 13) + 'l-.5 5'));
    }
    out.push(circle(farX, y0 + dd - 14, 4.6, 'sk-fill'), circle(farX, y0 + dd - 14, 2.8, 'sk-soft'));

    // 俯视图整张都是地面，铺满容器
    var h = Math.max(156, 224 / ratio);
    var w = h * ratio;
    return svg({ x: 100 - w / 2, y: 72 - h / 2, w: w, h: h }, out.join(''), 'xMidYMid slice');
  }

  var ICONS = {
    '桌子': 'M3 8h18v2.5H3zM5.5 10.5V19M18.5 10.5V19',
    '显示器': 'M3.5 5h17v10.5h-17zM12 15.5V19M8.5 19h7',
    '键盘': 'M4.5 8h15A1.5 1.5 0 0 1 21 9.5v5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 14.5v-5A1.5 1.5 0 0 1 4.5 8zM6.5 11h.01M10 11h.01M13.5 11h.01M17 11h.01M8 13.5h8',
    '鼠标': 'M8 9a4 4 0 0 1 8 0v6a4 4 0 0 1-8 0zM12 6v4',
    '桌垫': 'M5 7h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM6.5 13.5h6',
    '灯具': 'M7 19h7M10.5 19v-6L15 6.5M12.8 4.5l5.6 3.2-1.6 2.8-5.6-3.2z',
    '理线': 'M4 8v5a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8M9 8v4M12 8v4M15 8v4',
    '支架': 'M6 20h6M9 20V9.5l6.5-3M13 4.5h6.5v5H13z',
    '椅子': 'M8.5 4h7v8h-7zM6 12h12v3H6zM12 15v3.5M8 20.5l4-2 4 2',
    '绘图': 'M3 8h13v10H3zM13.5 12.5l6-7 1.6 1.4-6 7-2.2.8z',
    '校色': 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    '收纳': 'M4 5h16v14H4zM4 12h16M10 8.5h4M10 15.5h4',
    '摆件': 'M5 9h14v10H5zM9.5 14a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0zM15 9l3.5-5',
    '配件': 'M5 9h14v6H5zM8 12h.01M11 12h.01M14 12h3'
  };

  function icon(kind) {
    return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="' +
      (ICONS[kind] || 'M5 8l7-4 7 4v8l-7 4-7-4zM5 8l7 4 7-4M12 12v8') + '"></path></svg>';
  }

  window.DeskSketch = { front: front, top: top, icon: icon, spots: spots };
})();

/* deskshelf 占位线稿：真实照片到位之前，按桌搭数据画一张线稿代替纯色块。
   front 是正视图，top 是俯视图，icon 是清单里的小图标。
   只用 shared.js 里的示例数据拼 SVG，不接收用户输入。 */
(function () {
  'use strict';

  var FLOOR = 118;
  var TOP = 78; // 桌面上沿

  function r(value) {
    return Math.round(value * 10) / 10;
  }

  function cls(name) {
    return name ? ' class="' + name + '"' : '';
  }

  function rect(x, y, w, h, radius, name) {
    return '<rect x="' + r(x) + '" y="' + r(y) + '" width="' + r(w) + '" height="' + r(h) +
      '" rx="' + (radius || 0) + '"' + cls(name) + '></rect>';
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

  function svg(viewBox, inner) {
    return '<svg class="sketch" viewBox="' + viewBox + '" fill="none" stroke="currentColor" stroke-width="1.25" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + inner + '</svg>';
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

  function front(setup, zoom) {
    var has = reader(setup);
    var flip = setup.idx % 2 === 1;
    var dw = scale(setup.width, 80, 200, 84, 172);
    var x0 = 100 - dw / 2;
    var x1 = 100 + dw / 2;
    var out = [];

    // ---- 墙面 ----
    if (has.tag('飘窗')) {
      out.push(rect(34, 12, 132, 58, 1.5, 'sk-soft'), line(100, 12, 100, 70, 'sk-soft'), line(34, 41, 166, 41, 'sk-soft'));
    }
    if (has.tag('宿舍')) {
      out.push(rect(18, 16, 164, 7, 1.5), line(22, 23, 22, FLOOR), line(178, 23, 178, FLOOR), line(167, 23, 167, FLOOR));
      [40, 56, 72, 88, 104].forEach(function (y) {
        out.push(line(167, y, 178, y));
      });
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
    } else if (has.tag('收纳') && !has.tag('宿舍')) {
      var sx = flip ? x0 + 6 : x1 - 52;
      out.push(
        line(sx, 38, sx + 46, 38),
        path('M' + r(sx + 6) + ' 38v5M' + r(sx + 40) + ' 38v5'),
        rect(sx + 5, 24, 4, 14, 0.5), rect(sx + 10, 27, 4, 11, 0.5), rect(sx + 15, 25, 5, 13, 0.5),
        rect(sx + 28, 28, 13, 10, 1.5)
      );
    }
    if (has.tag('校色')) {
      var gx = flip ? x1 - 34 : x0 + 12;
      for (var cy = 0; cy < 2; cy++) {
        for (var cx = 0; cx < 3; cx++) {
          out.push(rect(gx + cx * 8, 24 + cy * 8, 6, 6, 1, 'sk-soft'));
        }
      }
    }

    out.push(line(10, FLOOR, 190, FLOOR, 'sk-soft'));

    // ---- 桌下 ----
    if ((setup.cat === '电竞' || setup.cat === '编程') && !has.tag('宿舍')) {
      var tx = flip ? x1 - 37 : x0 + 22;
      out.push(rect(tx, FLOOR - 29, 15, 29, 2, 'sk-fill'));
      if (setup.cat === '电竞') {
        out.push(circle(tx + 7.5, FLOOR - 20.5, 4), circle(tx + 7.5, FLOOR - 9, 4));
      } else {
        out.push(line(tx + 4, FLOOR - 23, tx + 11, FLOOR - 23), line(tx + 4, FLOOR - 19.5, tx + 11, FLOOR - 19.5), circle(tx + 7.5, FLOOR - 7, 0.8, 'sk-dot'));
      }
    }
    if (setup.cat === '理线' || has.item('理线槽')) {
      out.push(path('M76 ' + (TOP + 6) + 'v6.5h48v-6.5'), rect(88, TOP + 8, 24, 3, 1.5));
    }
    if (has.item('灯带')) {
      out.push('<path d="M' + r(x0 + 8) + ' ' + (TOP + 6) + 'H' + r(x1 - 8) + '" stroke-dasharray="2 5"></path>');
    }

    // ---- 桌腿和桌面 ----
    if (has.tag('升降桌') || has.item('升降桌')) {
      [x0 + 15, x1 - 15].forEach(function (lx) {
        out.push(rect(lx - 2.5, TOP + 3, 5, FLOOR - TOP - 5, 1, 'sk-fill'), line(lx - 10, FLOOR - 1.5, lx + 10, FLOOR - 1.5));
      });
    } else {
      out.push(line(x0 + 5, TOP + 3, x0 + 5, FLOOR), line(x1 - 5, TOP + 3, x1 - 5, FLOOR));
      if (setup.cat === '复古') {
        out.push(rect(x1 - 36, TOP + 3, 28, 12, 1, 'sk-fill'), circle(x1 - 22, TOP + 9, 0.9, 'sk-dot'));
      }
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
        out.push(rect(cx - 10, TOP - 4, 20, 4, 1, 'sk-fill'), rect(mx, TOP - 4 - m.h + 4, m.w, m.h - 4, 3.5, 'sk-fill'), rect(mx + 4, TOP - m.h + 3, m.w - 8, m.h - 11, 4.5));
      } else if (mon.kind === 'laptop') {
        out.push(rect(mx, TOP - 3 - m.h, m.w, m.h, 1.5, 'sk-fill'), rect(mx - 3, TOP - 3, m.w + 6, 3, 1.2, 'sk-fill'));
      } else if (mon.kind === 'tablet') {
        out.push(line(cx + 6, TOP, cx + 2, TOP - 12), '<g transform="rotate(-9 ' + r(cx) + ' ' + TOP + ')">' + rect(mx, TOP - m.h - 1, m.w, m.h, 2.5, 'sk-fill') + '</g>');
      } else {
        var neck = m.neck || 7;
        var bottom = TOP - neck;
        out.push(line(cx, bottom, cx, TOP), rect(cx - 7, TOP - 1.6, 14, 1.6, 0.8, 'sk-fill'), rect(mx, bottom - m.h, m.w, m.h, 1.8, 'sk-fill'));
        if (m === main && has.item('挂灯')) out.push(rect(cx - 11, bottom - m.h - 3.2, 22, 2.4, 1.2, 'sk-fill'));
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
    } else if (mon.kind !== 'laptop') {
      if (has.tag('机械键盘')) {
        out.push(rect(mainX - 18, TOP - 3.2, 16, 3.2, 1.2, 'sk-fill'), rect(mainX + 2, TOP - 3.2, 16, 3.2, 1.2, 'sk-fill'));
      } else {
        out.push(rect(mainX - 17, TOP - 3.2, 34, 3.2, 1.2, 'sk-fill'));
      }
      out.push(rect(mainX + 22, TOP - 2.6, 5.5, 2.6, 1.3, 'sk-fill'));
      frontRight = Math.max(monR, mainX + 27.5);
    }

    // ---- 桌面两侧的小物件：从外往里放，放不下就不放 ----
    var zone = { L: { a: x0 + 5, b: monL - 5 }, R: { a: frontRight + 5, b: x1 - 5 } };
    var near = flip ? 'R' : 'L';
    var far = flip ? 'L' : 'R';

    function place(side, width, draw) {
      var z = zone[side];
      if (z.b - z.a < width) return;
      var x;
      if (side === 'L') {
        x = z.a;
        z.a += width + 4;
      } else {
        x = z.b - width;
        z.b -= width + 4;
      }
      out.push(at(x, width, side === 'R', draw));
    }

    if (has.item('台灯')) {
      place(near, 18, rect(2, TOP - 1.6, 10, 1.6, 0.8, 'sk-fill') +
        path('M7 ' + (TOP - 1.6) + 'L4.5 ' + (TOP - 19) + 'L12 ' + (TOP - 27)) +
        path('M10.5 ' + (TOP - 29.5) + 'l7.5 2.6-1.9 4.3-7.5-2.6z', 'sk-fill'));
    }
    if (has.tag('收音机')) {
      place(near, 23, rect(0, TOP - 14, 22, 14, 2, 'sk-fill') + circle(7, TOP - 7, 3.8) +
        line(14, TOP - 9.5, 18.5, TOP - 9.5) + line(14, TOP - 5.5, 18.5, TOP - 5.5) + line(18, TOP - 14, 22.5, TOP - 24));
    }
    if (has.tag('灯箱')) {
      place(near, 20, rect(0, TOP - 26, 20, 26, 1.5, 'sk-fill') + rect(3, TOP - 23, 14, 17, 1, 'sk-soft'));
    }
    if (setup.cat === '电竞') {
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

    return svg(zoom ? '60 36 80 56' : '8 8 184 116', out.join(''));
  }

  function top(setup) {
    var has = reader(setup);
    var flip = setup.idx % 2 === 1;
    var dw = scale(setup.width, 80, 200, 96, 176);
    var dd = scale(setup.depth, 50, 90, 52, 86);
    var x0 = 100 - dw / 2;
    var x1 = 100 + dw / 2;
    var y0 = 65 - dd / 2;
    var out = [rect(x0, y0, dw, dd, 3.5, 'sk-fill')];
    var mon = screens(setup, has);
    var ky = y0 + dd * 0.56;

    if (has.item('桌垫') || has.item('鼠标垫')) {
      var mw = Math.min(dw - 24, 100);
      out.push(rect(100 - mw / 2, ky - 6, mw, 26, 2.5, 'sk-soft'));
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

    return svg('6 12 188 106', out.join(''));
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

  window.DeskSketch = { front: front, top: top, icon: icon };
})();

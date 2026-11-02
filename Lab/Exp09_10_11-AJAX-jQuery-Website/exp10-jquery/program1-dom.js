// Exp 10, Program 1 — jQuery selectors, DOM manipulation, events and effects.
$(function () {                                   // = $(document).ready(...)
  'use strict';
  const $log = $('#log');
  const log = line => $log.text($log.text() + line + '\n');

  /* ---------- planner: DOM manipulation + delegated events ---------- */
  function updateSummary() {
    const total = $('#topics li').length;
    const done = $('#topics li.done').length;
    $('#summary').text(`${total} topic(s), ${done} done.`);
  }

  $('#topic').on('input', function () {           // keyboard input: live counter with .val()
    $('#char-count').text(`${$(this).val().length} / 40`);
  });

  $('#add-topic').on('submit', function (e) {
    e.preventDefault();
    const text = $.trim($('#topic').val());
    if (!text) { log('add: empty topic ignored'); $('#topic').trigger('focus'); return; }
    $('<li>').text(text).hide().appendTo('#topics').fadeIn(200);  // create, append, animate
    log(`$('<li>').text(${JSON.stringify(text)}).appendTo('#topics')`);
    $('#topic').val('').trigger('input');
    updateSummary();
  });

  // One handler on the <ul> serves every <li>, including ones added later.
  $('#topics').on('click', 'li', function () {
    $(this).toggleClass('done');
    log(`$('#topics').on('click', 'li') → toggleClass('done') on "${$(this).text()}"`);
    updateSummary();
  });

  $('#topics').on('dblclick', 'li', function () {
    const $li = $(this);
    log(`dblclick → fadeOut + remove "${$li.text()}"`);
    $li.fadeOut(150, function () { $li.remove(); updateSummary(); });
  });

  $('#number-them').on('click', function () {
    $('#topics li').each(function (i) {            // .each() with index
      const plain = $(this).text().replace(/^\d+\.\s/, '');
      $(this).text(`${i + 1}. ${plain}`);
    });
    log(`$('#topics li').each(...) numbered ${$('#topics li').length} items`);
  });

  $('#stripe').on('click', function () {
    $('#topics li').removeClass('hl').filter(':even').addClass('hl');
    log(`.filter(':even').addClass('hl') → ${$('#topics li.hl').length} highlighted`);
  });

  $('#clear-done').on('click', function () {
    const n = $('#topics li.done').remove().length;
    log(`$('#topics li.done').remove() → ${n} removed`);
    updateSummary();
  });

  /* ---------- effects and CSS ---------- */
  const $box = $('#box');
  function boxInfo(action) {
    $('#box-info').text(`${action}: visible=${$box.is(':visible')}, left=${$box.css('left')}, ` +
      `width=${Math.round($box.width())}px, class="${$box.attr('class')}", title="${$box.attr('title')}"`);
  }

  $('#toggle-box').on('click', () => { $box.toggle(); boxInfo('.toggle()'); log('$box.toggle()'); });
  $('#fade-box').on('click', () => $box.fadeToggle(300, () => { boxInfo('.fadeToggle()'); log('$box.fadeToggle(300)'); }));
  $('#slide-box').on('click', () => $box.slideToggle(300, () => { boxInfo('.slideToggle()'); log('$box.slideToggle(300)'); }));
  $('#animate-box').on('click', () => {
    $box.stop(true, true).show().animate({ left: '+=120px', width: '9rem' }, 400)
      .animate({ left: '0px', width: '6rem' }, 400, () => { boxInfo('.animate() there and back'); log('$box.animate({left, width}).animate(...) — queued'); });
  });
  $('#css-box').on('click', () => {
    $box.toggleClass('outlined').css('background-color', $box.hasClass('outlined') ? '#14212e' : '');
    boxInfo('.toggleClass() + .css()');
    log(`$box.toggleClass('outlined').css('background-color', …) → ${$box.css('background-color')}`);
  });
  $('#attr-box').on('click', () => {
    const next = $box.attr('title') === 'the demo box' ? 'renamed with .attr()' : 'the demo box';
    $box.attr({ title: next, 'aria-label': next });
    boxInfo('.attr()');
    log(`$box.attr('title', ${JSON.stringify(next)})`);
  });

  /* ---------- events ---------- */
  const $pad = $('#hover-pad');
  $pad.on('mouseenter focus', function (e) { $(this).addClass('hl').text(`${e.type} — handler ran`); log(`#hover-pad ${e.type}`); })
      .on('mouseleave blur', function (e) { $(this).removeClass('hl').text('Hover or focus me'); log(`#hover-pad ${e.type}`); })
      .on('keydown', function (e) { log(`#hover-pad keydown key="${e.key}"`); });

  let onceClicks = 0;
  $('#once').one('click', function () { onceClicks++; $(this).text('.one() fired — further clicks are ignored'); log(`.one('click') handler ran (count ${onceClicks})`); });
  $('#unbind').on('click', function () {
    $pad.off('mouseenter mouseleave focus blur').text('hover handlers removed with .off()');
    log("$pad.off('mouseenter mouseleave focus blur')");
  });

  updateSummary();
  log(`jQuery ${$.fn.jquery} ready — ${$('button').length} buttons wired`);
  window.__p1 = { onceClicks: () => onceClicks };
});

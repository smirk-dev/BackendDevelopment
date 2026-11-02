// Exp 10, Program 2 — jQuery AJAX helpers.
$(function () {
  'use strict';
  const $log = $('#log');
  const log = line => $log.text($log.text() + line + '\n');
  const status = (sel, text, kind) => $(sel).text(text).attr('class', 'status' + (kind ? ' ' + kind : ''));

  // Global AJAX events: any jQuery request toggles the marker.
  $(document)
    .on('ajaxStart', () => $('#spinner').addClass('on'))
    .on('ajaxStop', () => $('#spinner').removeClass('on'))
    .on('ajaxSend', (e, xhr, settings) => { log(`→ ${settings.type} ${settings.url}`); })
    .on('ajaxComplete', (e, xhr, settings) => log(`← ${xhr.status} ${settings.url}`));

  function rows(students) {
    const $tbody = $('#course-rows').empty();
    $.each(students, function (i, s) {
      const $tr = $('<tr>');
      $.each([s.id, s.name, s.course, s.email, s.semester], (j, v) => $('<td>').text(v).appendTo($tr));
      $tbody.append($tr);
    });
  }

  /* Fill the course dropdown from the data itself (distinct course names). */
  $.getJSON('data/students.json').done(function (data) {
    const courses = [...new Set($.map(data.students, s => s.course))].sort();
    $.each(courses, (i, c) => $('<option>').val(c).text(c).appendTo('#course'));
    log(`dropdown filled with ${courses.length} courses`);
  });

  /* Practice Task 3 (jQuery): load only the selected course's students. */
  $('#load-course').on('click', function () {
    const course = $('#course').val();
    status('#course-status', 'Loading…', 'busy');
    $.ajax({
      url: 'data/students.json',
      method: 'GET',
      dataType: 'json',
      success: function (data) {
        const picked = course ? $.grep(data.students, s => s.course === course) : data.students;
        rows(picked);
        status('#course-status', `${picked.length} student(s) in ${course || 'all courses'} (filtered with $.grep).`, 'ok');
      },
      error: function (xhr, textStatus, error) {
        status('#course-status', `Request failed: ${error || textStatus}`, 'err');
      }
    });
  });

  /* $.getJSON — shorthand for a GET with dataType json. */
  $('#load-catalogue').on('click', function () {
    $.getJSON('data/courses.json')
      .done(function (data) {
        const $wrap = $('#catalogue').empty();
        $.each(data.courses, function (i, c) {
          $('<article>')
            .append($('<span class="tag">').text(c.code))
            .append($('<h3>').text(c.title))
            .append($('<p>').text(c.summary))
            .append($('<p>').append($('<small>').text(`Semester ${c.semester} · ${c.credits} credits`)))
            .appendTo($wrap);
        });
        status('#catalogue-status', `${data.courses.length} courses loaded with $.getJSON.`, 'ok');
      })
      .fail((xhr, s, err) => status('#catalogue-status', `Request failed: ${err || s}`, 'err'));
  });

  /* $.get with an XML response: jQuery parses it, $(xml).find() walks it. */
  $('#load-xml').on('click', function () {
    $.get('data/students.xml', null, null, 'xml')
      .done(function (xml) {
        const $list = $('#xml-list').empty();
        $(xml).find('student').each(function () {
          const $s = $(this);
          $('<li>').text(`${$s.attr('id')} — ${$s.find('name').text()} (${$s.find('course').text()}, sem ${$s.find('semester').text()})`).appendTo($list);
        });
        status('#xml-status', `${$(xml).find('student').length} <student> nodes read with $(xml).find().`, 'ok');
      })
      .fail((xhr, s, err) => status('#xml-status', `Request failed: ${err || s}`, 'err'));
  });

  /* .load() — GET an HTML page and insert part of it. */
  $('#load-tip').on('click', function () {
    $('#tip-target').load('data/tip.html #tip', function (response, textStatus, xhr) {
      log(`.load('data/tip.html #tip') → ${textStatus} (${xhr.status}); #not-loaded inserted? ${$('#tip-target #not-loaded').length > 0}`);
    });
  });

  /* $.when — wait for two requests. */
  $('#load-both').on('click', function () {
    status('#both-status', 'Loading both…', 'busy');
    $.when($.getJSON('data/students.json'), $.getJSON('data/courses.json'))
      .done(function (studentsRes, coursesRes) {
        status('#both-status', `Both finished: ${studentsRes[0].students.length} students and ${coursesRes[0].courses.length} courses.`, 'ok');
      })
      .fail(() => status('#both-status', 'One of the requests failed.', 'err'));
  });

  /* POST JSON. ($.post sends form-encoded data; JSON needs $.ajax with contentType.) */
  $('#post-json').on('click', function () {
    const student = { id: 109, name: 'Suryansh', course: 'B.Tech CSE (Full Stack)', semester: 5 };
    $.ajax({ url: '/api/echo', method: 'POST', contentType: 'application/json', data: JSON.stringify(student), dataType: 'json' })
      .done(function (data, textStatus, xhr) {
        $('#post-out').text(`status ${xhr.status}\n${JSON.stringify(data, null, 2)}`);
        status('#post-status', 'Server echoed the student back (201 Created).', 'ok');
      })
      .fail((xhr) => status('#post-status', `Request failed: HTTP ${xhr.status} — is the Express server running (npm start)?`, 'err'));
  });

  /* Errors arrive in .fail() with the xhr object. */
  $('#load-missing').on('click', function () {
    $.getJSON('data/missing.json')
      .done(() => status('#missing-status', 'Loaded?!', 'ok'))
      .fail((xhr, textStatus, error) => status('#missing-status', `.fail() ran: status ${xhr.status}, textStatus "${textStatus}", error "${error}".`, 'err'));
  });

  log(`jQuery ${$.fn.jquery} ready`);
});

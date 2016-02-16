'use strict';

var CodeMirror = window.CodeMirror = require('codemirror');
require('codemirror/mode/javascript/javascript.js');
require('codemirror/addon/lint/lint.js');
require('codemirror/addon/edit/matchbrackets.js');
var jsonlint = require('jsonlint');
var URI = require('urijs');
require('urijs/src/URI.fragmentQuery.js');
var times = require('lodash.times');
var tracery = require('tracery-grammar');
var $ = require('jquery');

var exampleGrammar = require('./example-grammar.json');

CodeMirror.registerHelper('lint', 'json', function (text) {
  var found = [];

  jsonlint.parser.parseError = function (str, hash) {
    var loc = hash.loc;

    found.push({
      from: CodeMirror.Pos(loc.first_line - 1, loc.first_column),
      to: CodeMirror.Pos(loc.last_line - 1, loc.last_column),
      message: str
    });

    console.log('pushing');
  };

  try {
    jsonlint.parse(text);
  } catch (e) {
    // pass
  }

  console.log('found', found);

  return found;
});

$(function () {
  var editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
    extraKeys: {
      Tab: function (cm) {
        var spaces = Array(cm.getOption('indentUnit') + 1).join(' ');

        cm.replaceSelection(spaces);
      }
    },
    gutters: ['CodeMirror-lint-markers'],
    lineNumbers: true,
    lineWrapping: true,
    lint: CodeMirror.lint.json,
    matchBrackets: true,
    mode: {name: 'javascript', json: true}
  });

  var uri = URI(location.href);
  var fragment = uri.fragment(true);

  function update() {
    var value = editor.getValue();

    location.href = URI(location.href).fragment({grammar: value}).toString();

    try {
      var object = JSON.parse(value);

      var grammar = tracery.createGrammar(object);

      grammar.addModifiers(tracery.baseEngModifiers);

      $('#right').html('');

      times(50, function () {
        var trace = grammar.flatten('#origin#');

        $('#right').append('<p>' + trace + '</p>');
      });
    } catch (e) {
      console.log('Parse error:', e);
    }
  }

  if (fragment.grammar) {
    editor.setValue(fragment.grammar);
  } else {
    editor.setValue(JSON.stringify(exampleGrammar, null, 2));
  }

  editor.on('change', update);

  update();
});

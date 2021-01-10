minify index.html > ../index.html
minify css/moodle-quiz-editor.css > ../css/moodle-quiz-editor.min.css
uglifyjs --compress --mangle --source-map --output ../js/moodle-quiz-editor.min.js -- js/moodle-quiz-editor.js

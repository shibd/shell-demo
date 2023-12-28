const express = require('express');
const app = express();
const port = 3000;
const diff2html = require('diff2html');
const yaml = require('js-yaml');
const { createTwoFilesPatch } = require('diff');

app.use(express.static('public'));

app.get('/api/diff', (req, res) => {
    const oldYaml = yaml.dump({ foo: 'bar', baz: 'qux' });
    const newYaml = yaml.dump({ foo: 'bar', baz: 'quux' });

    const diffText = createTwoFilesPatch('old.yaml', 'new.yaml', oldYaml, newYaml);
    const diffHtml = diff2html.html(diffText, {
        inputFormat: 'diff',
        showFiles: false,
        matching: 'none',
        matchWordsThreshold: 0.0
    });

    res.send(diffHtml);
});


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

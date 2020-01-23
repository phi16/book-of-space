const marked = require('marked');
const fs = require('fs');

const table = fs.readFileSync("../readme.md", 'utf8');
const contentParser = new marked.Renderer();
const filePaths = [];
contentParser.link = ref => {
  filePaths.push(ref);
};
marked(table, { renderer: contentParser });

// main contents

const reviewRenderer = new marked.Renderer();

const nl = "\n", nll = "\n\n";
reviewRenderer.heading = (text,level,raw) => {
  // 2: chapter
  // 3: section
  let head = " ";
  for(let i=0;i<level-1;i++) head = "=" + head;
  return head + text + nll;
};
reviewRenderer.list = (body) => {
  return nl + body + nl;
};
reviewRenderer.listitem = (text) => {
  const lines = text.split('\n');
  for(let i=0;i<lines.length;i++) {
    if(lines[i] == '') {
      lines.splice(i,1);
      i--;
      continue;
    }
    if(/^ \*/.test(lines[i])) {
      lines[i] = lines[i].substr(1);
    } else {
      lines[i] = " " + lines[i];
    }
    lines[i] = " *" + lines[i];
  }
  return lines.join('\n') + nl;
};
reviewRenderer.blockquote = (quote) => {
  return nl + "===[notoc] も" + nll + quote + "===[/notoc]" + nll;
};
reviewRenderer.paragraph = (text) => {
  return text + nll;
};
reviewRenderer.strong = (text) => {
  return "@<b>{" + text + "}";
};
reviewRenderer.br = () => {
  return nll;
};

function md2re(fn) {
  let text = fs.readFileSync("../" + fn, 'utf8');
  text = text.replace(/\$(.*?)\$/g, "@<m>{$1}");
  return marked(text, { renderer: reviewRenderer } );
}

let maxChapter = 1;
const mainText = {};
filePaths.forEach(fn => {
  if(fn == "preface.md") {
    fs.writeFileSync("./review/preface.re", md2re(fn));
  } else {
    const m = fn.match(/(\d)-(\d)\.md/);
    if(m == null) {
      console.log("Name mismatch: " + fn);
      return;
    } else {
      const chapter = parseInt(m[1]);
      maxChapter = chapter > maxChapter ? chapter : maxChapter;
      if(mainText[chapter] == null) mainText[chapter] = "";
      mainText[chapter] += md2re(fn);
    }
  }
});

for(let i=1;i<=maxChapter;i++) {
  fs.writeFileSync("./review/" + i + ".re", mainText[i]);
}

// write catalog.yml

let chaps = [];
for(let i=1;i<=maxChapter;i++) {
  chaps.push(`  - ${i}.re`);
}

fs.writeFileSync("./review/catalog.yml",`
PREDEF:
  - preface.re
CHAPS:
${chaps.join('\n')}
APPENDIX:
POSTDEF:
`);

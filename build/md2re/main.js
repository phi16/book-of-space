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
const startNote = "[startnote]", startNoteRegex = /\[startnote\]/g;
const endNote = "[endnote]", endNoteRegex = /\[endnote\]/g;
reviewRenderer.blockquote = (quote) => {
  let lines = quote.split('\n');
  for(let i=1;i<lines.length;i++) {
    const s0 = lines[i-1].length > 0 && lines[i-1].charAt(0) != ' ';
    const s1 = lines[i].length > 0 && lines[i].charAt(0) != ' ';
    if(s0 && s1) {
      lines.splice(i,0,'');
      i++;
    }
  }
  return nl + startNote + nl + lines.join('\n') + endNote + nll;
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
  text = text.replace(/==(.*?)==/g, (_,m) => { 
    return "@<kw>{" + m + "}";
  });
  text = text.replace(/\*\*.*?\*\*/g, m => { 
    return m.replace(/ ?\$.*?\$ ?/g, "** $& **");
  });
  text = text.replace(/\$(.*?)\$/g, (_,m) => {
    const e = m
      .replace(/\*/g, "\\ast ")
      .replace(/_/g, "&#95;")
      .replace(/\\{/g, "&#123;")
      .replace(/\\}/g, "&#125;")
      .replace(/\\\\/g,"\\\\\\\\")
      .replace(/\./g, "\\qdot");
    return "@<m>$" + e + "$";
  });
  return marked(text, { renderer: reviewRenderer } )
    .replace(/&#39;/g, "'")
    .replace(/&#95;/g, "_")
    .replace(/&#123;/g, "\\{")
    .replace(/&#125;/g, "\\}")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\\qdot/g, ".\\,")
    .replace(/。/g, "．")
    .replace(/、/g, "，")
    .replace(startNoteRegex, "//embed{\n\\begin{reviewnote}\n//}")
    .replace(endNoteRegex, "//embed{\n\\end{reviewnote}\n//}");
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

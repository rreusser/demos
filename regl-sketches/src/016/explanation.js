const h = require('h');
const font = 'Open Sans'
const css = require('insert-css')(`
@import url('https://fonts.googleapis.com/css?family='+${font.replace(/\s/g,'+')});

#panel {
  font-family: ${font}, 'Helvetica', sans-serif;
  z-index: 1;
  position: relative;
  background-color: rgba(20, 20, 20, 0.8);
  display: inline-block;
  color: #eee;
  max-width: 450px;
  line-height: 1.6;
}

.title {
  transition: background-color 0.1s ease-in-out;
}

#panel .title:hover,
#panel.is-expanded .title  {
  background-color: rgba(0, 0, 0, 0.5);
}

#panel a {
  color: #bef;
  text-decoration: none;
}

.title {
  font-style: italic;
  cursor: pointer;
  padding: 8px 15px;
  user-select: none;
}

ul {
  margin: 0;
  padding: 10px;
  margin-left: -5px;
  max-height: 50vh;
  overflow: scroll;
}

li {
  list-style: none;
  float: left;
  width: 33%;
}

li a {
  min-width: 75px;
  display: inline-block;
  padding: 5px;
  transition: background-color 0.05s ease-in-out;
}

li a:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

.section {
  padding: 15px;
  margin-bottom: 1em;
}

.content {
  display: none;
}

#panel.is-expanded .content {
  display: block;
}

.title:after {
  content: '\u25BC';
  font-style: normal;
  text-decoration: none;
  color: inherit;
  margin-left: 10px;
  font-size: 0.75em;
}

#panel.is-expanded .title:after {
  content: '\u25B2';
}
`);

function render (onChange) {
  //const chevron = h('a', {href: '#', class: 'chevron'}, '▼');
  const title = h('div', {class: 'title'}, [
    'Periodic 3-body Orbits',
    //chevron
  ]);

  const initial = require('./initial-conditions');

  const content = h('div', {class: 'content'}, [
    h('ul', {class: 'section'}, Object.keys(initial).map(key => (
      h('li', [
        h('a', {href: '#', 'data-name': key}, key)
      ])
    ))),
    h('div', {class: 'section'}, [
      'The trajectories above are just a few of the ',
      h('a', {href: 'https://phys.org/news/2017-10-scientists-periodic-orbits-famous-three-body.html', target: '_blank'}, 'vast number of periodic solutions'),
      ' of the three-body problem, that is, three particles mutually attracted by gravitational force. They are adapted from the galley at ',
      h('a', {href: 'http://three-body.ipb.ac.rs/', target: '_blank'}, 'http://three-body.ipb.ac.rs/'),
      '. Due to the precision required to solve them (to say nothing of the precision required to locate them!), some of them last longer than others.'
    ]),
  ]);
  const root = h('div', {id: 'panel'}, [title, content]);

  content.addEventListener('click', function (ev) {
    var name;
    if ((name = ev.target.getAttribute('data-name'))) {
      onChange(name);
      ev.stopPropagation();
      ev.preventDefault();
    }
  });

  title.addEventListener('click', function () {
    root.classList.toggle('is-expanded');
  });

  return root;
}

module.exports = render;

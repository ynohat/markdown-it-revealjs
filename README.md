# markdown-it-revealjs

## Usage

```bash
npm install --save markdown-it-revealjs
```

```javascript
var md = require('markdown-it')();
md.use(require('markdown-it-revealjs'));
```

## Description

RevealJS allows us to write markdown within slide sections.

This markdown-it plugin allows us to write markdown to generate a markup structure that is compatible with RevealJS horizontal and vertical navigation.

The following Markdown:

```markdown
# Section 1

---

# Section 2

===

# Section 2.1

===

# Section 2.2

---

# Section 3
```

Generates the following HTML:

```html
<section class="reveal">
	<div class="slides">
		<section>
			<h1>Section 1</h1>
		</section>
		<section>
			<section>
				<h1>Section 2</h1>
			</section>
			<section>
				<h1>Section 2.1</h1>
			</section>
			<section>
				<h1>Section 2.2</h1>
			</section>
		</section>
		<section>
			<h1>Section 3</h1>
		</section>
	</div>
</section>
```

## License

MIT © Anthony Hogg


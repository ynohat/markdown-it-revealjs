"use strict";

const HSEP = "---";
const VSEP = "===";


/**
 * MarkdownIt plugin to generate revealjs friendly markup.
 * 
 * Use "---" to transition to a new horizontal slide.
 * Use "===" to transition to a vertical child slide.
 * 
 * @param {*} md 
 * @param {*} options 
 */
module.exports = function revealjs_plugin(md, options) {
    function isVSep(token) {
        return token.type === "inline" && token.content === VSEP;
    }

    function isHSep(token) {
        return token.type === "hr" && token.markup === HSEP;
    }

    function isSep(token) {
        return isHSep(token) || isVSep(token);
    }

    function renderOpening(tokens, idx, options, env, slf) {
        var token = tokens[idx];
        return `<${tokens[idx].tag}${slf.renderAttrs(tokens[idx])}>`;
    };

    function renderClosing(tokens, idx, options, env, slf) {
        var token = tokens[idx];
        return `</${tokens[idx].tag}>`;
    };

    md.renderer.rules.pres_open = renderOpening;
    md.renderer.rules.pres_close = renderClosing;
    md.renderer.rules.slide_open = renderOpening;
    md.renderer.rules.slide_close = renderClosing;

    function nextDivider(tokens, start) {
        for (let i = start; i < tokens.length; i++) {
            if (isSep(tokens[i])) {
                return i;
            }
        }
        return -1;
    }

    function previousSlideOpen(tokens, before) {
        for (let i = before - 1; i >= 0; i--) {
            if (tokens[i].type === "slide_open") {
                return i;
            }
        }
        return -1;
    }

    var openSlides = 0;

    function presentationOpen(state) {
        var token = new state.Token("pres_open", "section", 1);
        token.block = true;
        token.attrs = [
            ["class", "reveal"]
        ];
        return token;
    }

    function presentationClose(state) {
        return new state.Token("pres_close", "section", -1);
    }

    function slidesOpen(state) {
        var token = new state.Token("slides_open", "div", 1);
        token.block = true;
        token.attrs = [
            ["class", "slides"]
        ];
        return token;
    }

    function slidesClose(state) {
        return new state.Token("slides_close", "div", -1);
    }

    function slideOpen(state) {
        openSlides++;
        return new state.Token("slide_open", "section", 1);
    }

    function slideClose(state) {
        openSlides--;
        return new state.Token("slide_close", "section", -1);
    }

    md.core.ruler.push("revealjs", function(state) {
        let divIdx = 0;
        while (true) {
            divIdx = nextDivider(state.tokens, divIdx);
            if (divIdx === -1) {
                break;
            }
            let divider = state.tokens[divIdx];
            if (isSep(divider) && openSlides === 0) {
                state.tokens.unshift(slideOpen(state));
                divIdx++; // we added a token at the beginning, we need to update divIdx
            }
            let tags = [];
            if (isHSep(divider)) {
                while (openSlides > 0) {
                    tags.push(slideClose(state));
                }
                tags.push(slideOpen(state));
                // because "---" is hijacked from plain markdown, it translates
                // to one token which we remove
                state.tokens.splice(divIdx, 1, ...tags);
            } else if (isVSep(divider)) {
                // if it is a vertical separator, we need to wrap the current slide
                // in it's own section
                if (openSlides === 1) {
                    let slideOpenIdx = previousSlideOpen(state.tokens, divIdx);
                    state.tokens.splice(slideOpenIdx, 1,
                        state.tokens[slideOpenIdx], // reuse it to avoid increasing openSlides
                        slideOpen(state)
                    );
                    divIdx++; // we added a token before the divider, we need to update divIdx
                }
                // if the current slide is already a vertical child, we need to close
                // it; this will be indicated by a nesting level of two:
                // <section horizontal-parent>
                //    <section current-vertical-child>
                //    <!-- this is where we are right now -->
                if (openSlides === 2) {
                    tags.push(slideClose(state));
                }
                tags.push(slideOpen(state));
                // because this is a custom token, it is first wrapped by the processor
                // in a paragraph, so we need to replace para_open, sep, para_close
                state.tokens.splice(divIdx - 1, 3, ...tags);
            }
        }

        while (openSlides > 0) {
            state.tokens.push(slideClose(state));
        }
        state.tokens.unshift(slidesOpen(state));
        state.tokens.unshift(presentationOpen(state));
        state.tokens.push(slidesClose(state));
        state.tokens.push(presentationClose(state));
    });
};


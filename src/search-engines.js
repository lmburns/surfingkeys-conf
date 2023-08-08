import priv from "./conf.priv.js"
import util from "./util.js"

const {
  escapeHTML,
  createSuggestionItem,
  createURLItem,
  prettyDate,
  getDuckduckgoFaviconUrl,
  localStorage,
  runtimeHttpRequest,
} = util

// TODO: use a Babel loader to import these images
const wpDefaultIcon =
  "data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22utf-8%22%3F%3E%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2056%2056%22%20enable-background%3D%22new%200%200%2056%2056%22%3E%0A%20%20%20%20%3Cpath%20fill%3D%22%23eee%22%20d%3D%22M0%200h56v56h-56z%22%2F%3E%0A%20%20%20%20%3Cpath%20fill%3D%22%23999%22%20d%3D%22M36.4%2013.5h-18.6v24.9c0%201.4.9%202.3%202.3%202.3h18.7v-25c.1-1.4-1-2.2-2.4-2.2zm-6.2%203.5h5.1v6.4h-5.1v-6.4zm-8.8%200h6v1.8h-6v-1.8zm0%204.6h6v1.8h-6v-1.8zm0%2015.5v-1.8h13.8v1.8h-13.8zm13.8-4.5h-13.8v-1.8h13.8v1.8zm0-4.7h-13.8v-1.8h13.8v1.8z%22%2F%3E%0A%3C%2Fsvg%3E%0A"
const cbDefaultIcon =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAAAAAByaaZbAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAACYktHRAD/h4/MvwAAAAlwSFlzAAAOwwAADsMBx2+oZAAAAAd0SU1FB+EICxEMErRVWUQAAABOdEVYdFJhdyBwcm9maWxlIHR5cGUgZXhpZgAKZXhpZgogICAgICAyMAo0NTc4Njk2NjAwMDA0OTQ5MmEwMDA4MDAwMDAwMDAwMDAwMDAwMDAwCnwMkD0AAAGXSURBVEjH1ZRvc4IwDMb7/T8dbVr/sEPlPJQd3g22GzJdmxVOHaQa8N2WN7wwvyZ5Eh/hngzxTwDr0If/TAK67POxbqxnpgCIx9dkrkEvswYnAFiutFSgtQapS4ejwFYqbXQXBmC+QxawuI/MJb0LiCq0DICNHoZRKQdYLKQZEhATcQmwDYD5GR8DDtfqaYAMActvTiVMaUvqhZPVYhYAK2SBAwGMTHngnc4wVmFPW9L6k1PJxbSCkfvhqolKSQhsWSClizNyxwAWdzIADixQRXRmdWSHthsg+TknaztFMZgC3vh/nG/qo68TLAKrCSrUg1ulp3cH+BpItBp3DZf0lFXVOIDnBdwKkLO4D5Q3QMO6HJ+hUb1NKNWMGJn3jf4ejPKn99CXOtsuyab95obGL/rpdZ7oIJK87iPiumG01drbdggoCZuq/f0XaB8/FbG62Ta5cD97XJwuZUT7ONbZTIK5m94hBuQs8535MsL5xxPw6ZoNj0DiyzhhcyMf9BJ0Jk1uRRpNyb4y0UaM9UI7E8+kt/EHgR/R6042JzmiwgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAxNy0wOC0xMVQxNzoxMjoxOC0wNDowMLy29LgAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMTctMDgtMTFUMTc6MTI6MTgtMDQ6MDDN60wEAAAAAElFTkSuQmCC"

const locale = typeof navigator !== "undefined" ? navigator.language : ""

const completions = {}

const googleCustomSearch = opts => {
  let favicon = "https://google.com/favicon.ico"
  if (opts.favicon) {
    favicon = opts.favicon
  } else if (opts.domain) {
    favicon = getDuckduckgoFaviconUrl(`https://${opts.domain}`)
  } else if (opts.search) {
    favicon = getDuckduckgoFaviconUrl(opts.search)
  }
  return {
    favicon,
    compl: `https://www.googleapis.com/customsearch/v1?key=${
      priv.keys.google_cs
    }&cx=${priv.keys[`google_cx_${opts.alias}`]}&q=`,
    search: `https://cse.google.com/cse/publicurl?cx=${
      priv.keys[`google_cx_${opts.alias}`]
    }&q=`,
    callback: response => {
      const res = JSON.parse(response.text).items
      return res.map(s =>
        createSuggestionItem(
          `
        <div>
          <div class="title"><strong>${s.htmlTitle}</strong></div>
          <div>${s.htmlSnippet}</div>
        </div>
      `,
          {url: s.link},
        ),
      )
    },
    priv: true,
    ...opts,
  }
}

//  ╭──────────────────────────────────────────────────────────╮
//  │                        Arch Linux                        │
//  ╰──────────────────────────────────────────────────────────╯

// Arch Linux official repos
completions.al = googleCustomSearch({
  alias:  "al",
  name:   "archlinux",
  search: "https://www.archlinux.org/packages/?arch=x86_64&q=",
})

// Arch Linux AUR
completions.au = {
  alias: "au",
  name:  "AUR",
  search:
    "https://aur.archlinux.org/packages/?O=0&SeB=nd&outdated=&SB=v&SO=d&PP=100&do_Search=Go&K=",
  compl:   "https://aur.archlinux.org/rpc?v=5&type=suggest&arg=",
  favicon: cbDefaultIcon,
}

completions.au.callback = response => {
  const res = JSON.parse(response.text)
  return res.map(s =>
    createURLItem(s, `https://aur.archlinux.org/packages/${s}`),
  )
}

// Arch Linux Wiki
completions.aw = {
  alias:  "aw",
  name:   "archwiki",
  search: "https://wiki.archlinux.org/index.php?go=go&search=",
  compl:
    "https://wiki.archlinux.org/api.php?action=opensearch&format=json&formatversion=2&namespace=0&limit=10&suggest=true&search=",
}

completions.aw.callback = response => JSON.parse(response.text)[1]

// Arch Linux Forums
completions.af = googleCustomSearch({
  alias:  "af",
  name:   "archforums",
  domain: "bbs.archlinux.org",
})

// Search for Linux packages
completions.pkg = {
  alias:  "pkg",
  name:   "pkg",
  search: "https://pkgs.org/search/?q=",
}

// ╭──────────────────────────────────────────────────────────╮
// │                   Linux / Code General                   │
// ╰──────────────────────────────────────────────────────────╯

// BSD man(3) - Library Calls
completions.bsdman3 = {
  alias:  "bman3",
  name:   "bsdman_3_libcalls",
  search: "https://man.freebsd.org/cgi/man.cgi?apropos=0&sektion=3&format=html&query=",
}

// manned.org
completions.manned = {
  alias:  "aman",
  name:   "manned",
  search: "https://manned.org/browse/search?q=",
}

// man.cx - General
completions.mancx = {
  alias:  "cman",
  name:   "mancx",
  search: "https://man.cx/",
}

// man.he(1) - Programs
completions.man1 = {
  alias:  "man1",
  name:   "man_1_progs",
  search: "http://man.he.net/?section=1&topic=",
}
// man.he(2) - Syscalls
completions.man2 = {
  alias:  "man2",
  name:   "man_2_syscalls",
  search: "http://man.he.net/?section=2&topic=",
}
// man.he(3) - Library Calls
completions.man3 = {
  alias:  "man3",
  name:   "man_3_libcalls",
  search: "http://man.he.net/?section=3&topic=",
}
// man.he(4) - Devices
completions.man4 = {
  alias:  "man4",
  name:   "man_4_devices",
  search: "http://man.he.net/?section=4&topic=",
}
// man.he(5) - File Formats
completions.man5 = {
  alias:  "man5",
  name:   "man_5_fileformat",
  search: "http://man.he.net/?section=5&topic=",
}
// man.he(7) - Overview, Misc
completions.man7 = {
  alias:  "man7",
  name:   "man_7_misc",
  search: "http://man.he.net/?section=7&topic=",
}

// SourceForge
completions.sourceforge = {
  alias:  "sf",
  name:   "sourceforge",
  search: "https://sourceforge.net/ search/?words=",
}

//  ╭──────────────────────────────────────────────────────────╮
//  │                   Technical Resources                    │
//  ╰──────────────────────────────────────────────────────────╯

// AlternativeTo
completions.at = {
  alias:  "at",
  name:   "alternativeTo",
  search: "https://alternativeto.net/browse/search/?q=",
  compl:  `https://zidpns2vb0-dsn.algolia.net/1/indexes/fullitems?x-algolia-application-id=ZIDPNS2VB0&x-algolia-api-key=${priv.keys.alternativeTo}&attributesToRetrieve=Name,UrlName,TagLine,Description,Likes,HasIcon,IconId,IconExtension,InternalUrl&query=`,
  priv:   true,
}

completions.at.callback = async response => {
  const res = JSON.parse(response.text)
  return res.hits.map(s => {
    const name = escapeHTML(s.Name)
    let title = name
    let prefix = ""
    if (s._highlightResult) {
      if (s._highlightResult.Name) {
        title = s._highlightResult.Name.value
      }
    }
    if (s.Likes) {
      prefix += `[↑${s.Likes}] `
    }
    let tagline = ""
    if (s.TagLine) {
      tagline = escapeHTML(s.TagLine)
    }
    const desc = s.Description
      ? `<div class="title">${escapeHTML(s.Description)}</div>`
      : ""

    let icUrl = wpDefaultIcon
    if (s.HasIcon) {
      const icBase = "https://d2.alternativeto.net/dist/icons/"
      const icQuery = "?width=100&height=100&mode=crop&upscale=false"
      const icName = s.UrlName
      icUrl = encodeURI(
        `${icBase}${icName}_${s.IconId}${s.IconExtension}${icQuery}`,
      )
    }

    return createSuggestionItem(
      `
      <div style="padding:5px;display:grid;grid-template-columns:60px 1fr;grid-gap:15px">
        <img style="width:60px" src="${icUrl}" alt="${escapeHTML(s.Name)}">
        <div>
          <div class="title"><strong>${prefix}${title}</strong> ${tagline}</div>
          ${desc}
        </div>
      </div>
    `,
      {url: `https://${s.InternalUrl}`},
    )
  })
}

// Chrome Webstore
completions.cs = googleCustomSearch({
  alias:  "cs",
  name:   "chromestore",
  search: "https://chrome.google.com/webstore/search/",
})

const parseFirefoxAddonsRes = response =>
  JSON.parse(response.text).results.map(s => {
    let {name} = s
    if (typeof name === "object") {
      if (name[navigator.language] !== undefined) {
        name = name[navigator.language]
      } else {
        ;[name] = Object.values(name)
      }
    }
    name = escapeHTML(name)
    let prefix = ""
    switch (s.type) {
    case "extension":
      prefix += "🧩 "
      break
    case "statictheme":
      prefix += "🖌 "
      break
    default:
      break
    }

    return createSuggestionItem(
      `
    <div style="padding:5px;display:grid;grid-template-columns:2em 1fr;grid-gap:15px">
        <img style="width:2em" src="${s.icon_url}" alt="${name}">
        <div>
          <div class="title"><strong>${prefix}${name}</strong></div>
        </div>
      </div>
    `,
      {url: s.url},
    )
  })

// Firefox Addons
completions.fa = {
  alias:    "fa",
  name:     "firefox-addons",
  search:   `https://addons.mozilla.org/${locale}/firefox/search/?q=`,
  compl:    "https://addons.mozilla.org/api/v4/addons/autocomplete/?q=",
  callback: parseFirefoxAddonsRes,
}

// Firefox Themes
completions.ft = {
  alias:  "ft",
  name:   "firefox-themes",
  search: `https://addons.mozilla.org/${locale}/firefox/search/?type=statictheme&q=`,
  compl:
    "https://addons.mozilla.org/api/v4/addons/autocomplete/?type=statictheme&q=",
  callback: parseFirefoxAddonsRes,
}

// Firefox Extensions
completions.fe = {
  alias:  "fe",
  name:   "firefox-extensions",
  search: `https://addons.mozilla.org/${locale}/firefox/search/?type=extension&q=`,
  compl:
    "https://addons.mozilla.org/api/v4/addons/autocomplete/?type=extension&q=",
  callback: parseFirefoxAddonsRes,
}

// OWASP Wiki - Cybersecurity
completions.ow = {
  alias:  "ow",
  name:   "owasp",
  search: "https://www.owasp.org/index.php?go=go&search=",
  compl:
    "https://www.owasp.org/api.php?action=opensearch&format=json&formatversion=2&namespace=0&limit=10&suggest=true&search=",
}

completions.ow.callback = response => JSON.parse(response.text)[1]

// StackOverflow
completions.so = {
  alias:  "so",
  name:   "stackoverflow",
  search: "https://stackoverflow.com/search?q=",
  compl:
    "https://api.stackexchange.com/2.2/search/advanced?pagesize=10&order=desc&sort=relevance&site=stackoverflow&q=",
}

completions.so.callback = response =>
  JSON.parse(response.text).items.map(s =>
    createURLItem(`[${s.score}] ${s.title}`, s.link),
  )

// StackExchange - all sites (No completion)
completions.se = {
  alias:  "se", // "sse"
  name:   "stackexchange",
  search: "https://stackexchange.com/search?q=",
}

// StackExchange - Unix
completions.sx = {
  alias:  "sx", // "ssx"
  name:   "stackunix",
  search: "https://unix.stackexchange.com/search?q=",
}

// SuperUser
completions.su = {
  alias:  "su", // "ssu"
  name:   "superuser",
  search: "https://superuser.com/search?q=",
}

// StackExchange - Math
completions.sm = {
  alias:  "sm", // "ssm"
  name:   "stackmath",
  search: "https://math.stackexchange.com/search?q=",
}

// DockerHub repo search
completions.dh = {
  alias:  "dh",
  name:   "dockerhub",
  search: "https://hub.docker.com/search/?page=1&q=",
  compl:  "https://hub.docker.com/v2/search/repositories/?page_size=20&query=",
}

// Docker Docs
completions.ddc = {
  alias:  "ddc",
  name:   "dockerdocs",
  search: "https://docs.docker.com/search/?q=",
}

completions.dh.callback = response =>
  JSON.parse(response.text).results.map(s => {
    let meta = ""
    let repo = s.repo_name
    meta += `[★${escapeHTML(s.star_count)}] `
    meta += `[↓${escapeHTML(s.pull_count)}] `
    if (repo.indexOf("/") === -1) {
      repo = `_/${repo}`
    }
    return createSuggestionItem(
      `
      <div>
        <div class="title"><strong>${escapeHTML(repo)}</strong></div>
        <div>${meta}</div>
        <div>${escapeHTML(s.short_description)}</div>
      </div>
    `,
      {url: `https://hub.docker.com/r/${repo}`},
    )
  })

// GitHub
completions.gh = {
  alias:  "gh",
  name:   "github",
  search: "https://github.com/search?q=",
  compl:  "https://api.github.com/search/repositories?sort=stars&order=desc&q=",
}

completions.gh.callback = response =>
  JSON.parse(response.text).items.map(s => {
    let prefix = ""
    if (s.stargazers_count) {
      prefix += `[★${s.stargazers_count}] `
    }
    return createURLItem(prefix + s.full_name, s.html_url)
  })

// Gist
completions.gt = {
  alias:  "gt",
  name:   "gist",
  search: "https://gist.github.com/search?q=",
  // compl:  "https://api.github.com/search/repositories?sort=stars&order=desc&q=",
}

// GreasyFork
completions.gf = {
  alias:  "gf",
  name:   "greasyfork",
  search: "https://greasyfork.org/en/scripts?q",
  // compl:  "",
}

// SearchCode
completions.sc = {
  alias:  "sc",
  name:   "searchcode",
  search: "https://searchcode.com/?q=",
  // compl:  "",
}

// Phind - programming assistant
completions.phind = {
  alias:  "ph",
  name:   "phind",
  search: "https://www.phind.com/search?q=",
}

// Domainr - domain search
completions.do = {
  alias:  "do",
  name:   "domainr",
  search: "https://domainr.com/?q=",
  compl:  "https://5jmgqstc3m.execute-api.us-west-1.amazonaws.com/v1/domainr?q=",
}

completions.do.callback = response =>
  Object.entries(JSON.parse(response.text)).map(([domain, data]) => {
    let color = "inherit"
    let symbol = "<strong>?</strong> "
    switch (data.summary) {
    case "inactive":
      color = "#23b000"
      symbol = "✔ "
      break
    case "unknown":
      break
    default:
      color = "#ff4d00"
      symbol = "✘ "
    }
    return createSuggestionItem(
      `<div><div class="title" style="color:${color}"><strong>${symbol}${escapeHTML(
        domain,
      )}</strong></div></div>`,
      {url: `https://domainr.com/${domain}`},
    )
  })

// Vim Wiki
completions.vw = {
  alias:  "vw",
  name:   "vimwiki",
  search: "https://vim.fandom.com/wiki/Special:Search?query=",
  compl:
    "https://vim.fandom.com/api.php?action=opensearch&format=json&formatversion=2&namespace=0&limit=10&suggest=true&search=",
}

completions.vw.callback = response =>
  JSON.parse(response.text)[1].map(r =>
    createURLItem(r, `https://vim.fandom.com/wiki/${r}`),
  )

//  ╭──────────────────────────────────────────────────────────╮
//  │                     Shopping & Food                      │
//  ╰──────────────────────────────────────────────────────────╯

// Amazon
completions.az = {
  alias:  "az",
  name:   "amazon",
  search: "https://smile.amazon.com/s/?field-keywords=",
  compl:
    "https://completion.amazon.com/search/complete?method=completion&mkt=1&search-alias=aps&q=",
}

completions.az.callback = response => JSON.parse(response.text)[1]

//  ╭──────────────────────────────────────────────────────────╮
//  │       General References, Calculators & Utilities        │
//  ╰──────────────────────────────────────────────────────────╯

const parseDatamuseRes = (res, o = {}) => {
  const opts = {
    maxDefs:  -1,
    ellipsis: false,
  }
  Object.assign(opts, o)

  return res.map(r => {
    const defs = []
    let defsHtml = ""
    if (
      (opts.maxDefs <= -1 || opts.maxDefs > 0) &&
      r.defs &&
      r.defs.length > 0
    ) {
      for (const d of r.defs.slice(
        0,
        opts.maxDefs <= -1 ? undefined : opts.maxDefs,
      )) {
        const ds = d.split("\t")
        const partOfSpeech = `(${escapeHTML(ds[0])})`
        const def = escapeHTML(ds[1])
        defs.push(`<span><em>${partOfSpeech}</em> ${def}</span>`)
      }
      if (opts.ellipsis && r.defs.length > opts.maxDefs) {
        defs.push("<span><em>&hellip;</em></span>")
      }
      defsHtml = `<div>${defs.join("<br />")}</div>`
    }
    return createSuggestionItem(
      `
        <div>
          <div class="title"><strong>${escapeHTML(r.word)}</strong></div>
          ${defsHtml}
        </div>
    `,
      {url: `${opts.wordBaseURL}${r.word}`},
    )
  })
}

// Dictionary
completions.de = {
  alias:  "de",
  name:   "define",
  search: "http://onelook.com/?w=",
  compl:  "https://api.datamuse.com/words?md=d&sp=%s*",
  opts:   {
    maxDefs:     16,
    ellipsis:    true,
    wordBaseURL: "http://onelook.com/?w=",
  },
}

completions.de.callback = response => {
  const res = JSON.parse(response.text)
  return parseDatamuseRes(res, completions.de.opts)
}

// Thesaurus
completions.th = {
  alias:  "th",
  name:   "thesaurus",
  search: "https://www.onelook.com/thesaurus/?s=",
  compl:  "https://api.datamuse.com/words?md=d&ml=%s",
  opts:   {
    maxDefs:     3,
    ellipsis:    true,
    wordBaseURL: "http://onelook.com/thesaurus/?s=",
  },
}

completions.th.callback = response => {
  const res = JSON.parse(response.text)
  return parseDatamuseRes(res, completions.th.opts)
}

// Wikipedia
completions.wp = {
  alias:  "wp",
  name:   "wikipedia",
  search: "https://en.wikipedia.org/w/index.php?search=",
  compl:
    "https://en.wikipedia.org/w/api.php?action=query&format=json&generator=prefixsearch&prop=info|pageprops%7Cpageimages%7Cdescription&redirects=&ppprop=displaytitle&piprop=thumbnail&pithumbsize=100&pilimit=6&inprop=url&gpssearch=",
}

completions.wp.callback = response =>
  Object.values(JSON.parse(response.text).query.pages).map(p => {
    const img = p.thumbnail ? p.thumbnail.source : wpDefaultIcon
    const desc = p.description ? p.description : ""
    return createSuggestionItem(
      `
      <div style="padding:5px;display:grid;grid-template-columns:60px 1fr;grid-gap:15px">
        <img style="width:60px" src="${img}" alt="${p.title}">
        <div>
          <div class="title"><strong>${p.title}</strong></div>
          <div class="title">${desc}</div>
        </div>
      </div>
    `,
      {url: p.fullurl},
    )
  })

// Wikipedia - Simple English version
completions.ws = {
  alias:  "ws",
  name:   "wikipedia-simple",
  search: "https://simple.wikipedia.org/w/index.php?search=",
  compl:
    "https://simple.wikipedia.org/w/api.php?action=query&format=json&generator=prefixsearch&prop=info|pageprops%7Cpageimages%7Cdescription&redirects=&ppprop=displaytitle&piprop=thumbnail&pithumbsize=100&pilimit=6&inprop=url&gpssearch=",
  callback: completions.wp.callback,
}

// Wiktionary
completions.wt = {
  alias:  "wt",
  name:   "wiktionary",
  search: "https://en.wiktionary.org/w/index.php?search=",
  compl:
    "https://en.wiktionary.org/w/api.php?action=query&format=json&generator=prefixsearch&gpssearch=",
}

completions.wt.callback = response =>
  Object.values(JSON.parse(response.text).query.pages).map(p => p.title)

// Wikibooks
completions.wb = {
  alias:  "wb",
  name:   "wikibooks",
  search: "https://en.wikibooks.org/w/index.php?fulltext=Search&title=Special%3ASearch&search=",
}

// WolframAlpha
completions.wa = {
  alias:  "wa",
  name:   "wolframalpha",
  search: "http://www.wolframalpha.com/input/?i=",
  compl:  `http://api.wolframalpha.com/v2/query?appid=${priv.keys.wolframalpha}&format=plaintext&output=json&reinterpret=true&input=%s`,
  priv:   true,
}

completions.wa.callback = response => {
  const res = JSON.parse(response.text).queryresult

  if (res.error) {
    return [
      createSuggestionItem(
        `
      <div>
        <div class="title"><strong>Error</strong> (Code ${escapeHTML(
    res.error.code,
  )})</div>
        <div class="title">${escapeHTML(res.error.msg)}</div>
      </div>`,
        {url: "https://www.wolframalpha.com/"},
      ),
    ]
  }

  if (!res.success) {
    if (res.tips) {
      return [
        createSuggestionItem(
          `
        <div>
          <div class="title"><strong>No Results</strong></div>
          <div class="title">${escapeHTML(res.tips.text)}</div>
        </div>`,
          {url: "https://www.wolframalpha.com/"},
        ),
      ]
    }
    if (res.didyoumeans) {
      return res.didyoumeans.map(s =>
        createSuggestionItem(
          `
        <div>
            <div class="title"><strong>Did you mean...?</strong></div>
            <div class="title">${escapeHTML(s.val)}</div>
        </div>`,
          {url: "https://www.wolframalpha.com/"},
        ),
      )
    }
    return [
      createSuggestionItem(
        `
      <div>
        <div class="title"><strong>Error</strong></div>
        <div class="title">An unknown error occurred.</div>
      </div>`,
        {url: "https://www.wolframalpha.com/"},
      ),
    ]
  }

  const results = []
  res.pods.forEach(p => {
    const result = {
      title:  escapeHTML(p.title),
      values: [],
      url:    "http://www.wolframalpha.com/input/?i=",
    }
    if (p.numsubpods > 0) {
      result.url += encodeURIComponent(p.subpods[0].plaintext)
      p.subpods.forEach(sp => {
        if (!sp.plaintext) return
        let v = ""
        if (sp.title) {
          v += `<strong>${escapeHTML(sp.title)}</strong>: `
        }
        v += escapeHTML(sp.plaintext)
        result.values.push(`<div class="title">${v}</div>`)
      })
    }
    if (result.values.length > 0) {
      results.push(result)
    }
  })

  return results.map(r =>
    createSuggestionItem(
      `
    <div>
      <div class="title"><strong>${r.title}</strong></div>
      ${r.values.join("\n")}
    </div>`,
      {url: r.url},
    ),
  )
}

// Creative Commons - creative works
completions.creativecommons = {
  alias:  "ccsearch",
  name:   "creativecommons",
  search: "https://search.creativecommons.org/search?q=",
}

// Openverse - creative works
completions.openverse = {
  alias:  "openv",
  name:   "openverse",
  search: "https://openverse.org/search/?q=",
}

//  ╭──────────────────────────────────────────────────────────╮
//  │                      Search Engines                      │
//  ╰──────────────────────────────────────────────────────────╯

// DuckDuckGo
completions.dd = {
  alias:  "dd",
  name:   "duckduckgo",
  search: "https://duckduckgo.com/?q=",
  compl:  "https://duckduckgo.com/ac/?q=",
}

completions.ddg = completions.dd

completions.dd.callback = response =>
  JSON.parse(response.text).map(r => r.phrase)

// DuckDuckGo - I'm Feeling Lucky
completions.D = {
  alias:    "D",
  name:     "duckduckgo-lucky",
  search:   "https://duckduckgo.com/?q=\\",
  compl:    "https://duckduckgo.com/ac/?q=\\",
  callback: completions.dd.callback,
}

// DuckDuckGo Images
completions.di = {
  alias:    "di",
  name:     "duckduckgo-images",
  search:   "https://duckduckgo.com/?ia=images&iax=images&q=",
  compl:    "https://duckduckgo.com/ac/?ia=images&iax=images&q=",
  callback: completions.dd.callback,
}

// DuckDuckGo Videos
completions.dv = {
  alias:    "dv",
  name:     "duckduckgo-videos",
  search:   "https://duckduckgo.com/?ia=videos&iax=videos&q=",
  compl:    "https://duckduckgo.com/ac/?ia=videos&iax=videos&q=",
  callback: completions.dd.callback,
}

// DuckDuckGo News
completions.dn = {
  alias:    "dn",
  name:     "duckduckgo-news",
  search:   "https://duckduckgo.com/?iar=news&ia=news&q=",
  compl:    "https://duckduckgo.com/ac/?iar=news&ia=news&q=",
  callback: completions.dd.callback,
}

// DuckDuckGo Maps
completions.dm = {
  alias:    "dm",
  name:     "duckduckgo-maps",
  search:   "https://duckduckgo.com/?ia=maps&iax=maps&iaxm=places&q=",
  compl:    "https://duckduckgo.com/ac/?ia=maps&iax=maps&iaxm=places&q=",
  callback: completions.dd.callback,
}

// Google
completions.go = {
  alias:  "go",
  name:   "google",
  search: "https://www.google.com/search?q=",
  compl:
    "https://www.google.com/complete/search?client=chrome-omni&gs_ri=chrome-ext&oit=1&cp=1&pgcl=7&q=",

  // https://suggestqueries.google.com/complete/search?output=toolbar&hl=en&q=
}

completions.go.callback = response => JSON.parse(response.text)[1]

// Google Images
completions.gi = {
  alias:  "gi",
  name:   "google-images",
  search: "https://www.google.com/search?tbm=isch&q=",
  compl:
    "https://www.google.com/complete/search?client=chrome-omni&gs_ri=chrome-ext&oit=1&cp=1&pgcl=7&ds=i&q=",
  callback: completions.go.callback,
}

// Google Images (reverse image search by URL)
completions.gI = {
  alias:  "gI",
  name:   "google-reverse-image",
  search: "https://www.google.com/searchbyimage?image_url=",
}

// Google - I'm Feeling Lucky
completions.G = {
  alias:  "G",
  name:   "google-lucky",
  search: "https://www.google.com/search?btnI=1&q=",
  compl:
    "https://www.google.com/complete/search?client=chrome-omni&gs_ri=chrome-ext&oit=1&cp=1&pgcl=7&q=",
  callback: completions.go.callback,
}

// Google Scholar
completions.gs = {
  alias:  "gs",
  name:   "google-scholar",
  search: "https://scholar.google.com/scholar?q=",
  compl:  "https://scholar.google.com/scholar_complete?q=",
}

completions.gs.callback = response => JSON.parse(response.text).l

// Kagi
completions.ka = {
  alias:    "ka",
  name:     "kagi",
  search:   "https://kagi.com/search?q=",
  compl:    "https://kagi.com/autosuggest?q=",
  callback: response =>
    JSON.parse(response.text).map(r => {
      const u = new URL("https://kagi.com/search")
      u.searchParams.append("q", r.t)
      if (r.goto) {
        u.href = r.goto
      }

      const thumbImg = document.createElement("img")
      thumbImg.style = "width: 32px"
      thumbImg.src = r.img ? new URL(r.img, "https://kagi.com") : wpDefaultIcon

      const txtNode = document.createElement("div")
      txtNode.className = "title"
      txtNode.innerText = r.txt ?? ""

      return createSuggestionItem(
        `
      <div style="padding: 5px; display: grid; grid-template-columns: 32px 1fr; grid-gap: 15px">
        ${thumbImg.outerHTML}
        <div>
          <div class="title"><strong>${r.t}</strong></div>
          ${txtNode.outerHTML}
        </div>
      </div>
    `,
        {url: u.href},
      )
    }),
}

// Searx - coppedge.info
completions.sxc = {
  alias:  "sxc", // "coppedge"
  name:   "searx-coppedge",
  search: "https://coppedge.info/search?language=en-US&safesearch=0&q=",
  // compl:  "https://coppedge.info/opensearch.xml?method=POST&autocomplete=duckduckgo",
  compl:  "https://duckduckgo.com/ac/?q=",
}

// Searx - baresearch.org
completions.sxb = {
  alias:  "sxb", // "baresearch"
  name:   "searx-baresearch",
  search: "https://baresearch.org/search?language=en-US&safesearch=0&q=",
}

// Searx - paulgo
completions.paulgo = {
  alias:  "sxp", // "paulgo"
  name:   "searx-paulgo",
  search: "https://paulgo.io/search?q=",
}

// Brave
completions.br = {
  alias:  "br", // "b"
  name:   "brave",
  search: "https://search.brave.com/search?q=",
  compl:  "https://search.brave.com/api/suggest?q=",
}

// Startpage
completions.sp = {
  alias: "sp",
  name:  "startpage",
  search:
    "https://www.startpage.com/sp/search?cat=web&pl=opensearch&language=english&query=",
  compl: "https://www.startpage.com/do/suggest?query=",
}

// Yandex
completions.yd = {
  alias:  "yd",
  name:   "yandex",
  search: "https://yandex.com/search/?text=",
  // compl:  "https://www.startpage.com/do/suggest?query=",
}

// You
completions.yo = {
  alias:  "yo",
  name:   "you",
  search: "https://you.com/search?q=",
  // compl:  "https://www.startpage.com/do/suggest?query=",
}

// Whoogle
completions.who = {
  alias:  "who",
  name:   "whoogle",
  search: "https://www.whoogle.click/search?q=",
  // compl:  "https://www.startpage.com/do/suggest?query=",
}

// Presearch
completions.ps = {
  alias:  "ps", // "presearch"
  name:   "presearch",
  search: "https://presearch.com/search?q=",
  // compl:  "https://www.startpage.com/do/suggest?query=",
}

// Ecosia
completions.ec = {
  alias:  "ec", // "ecosia"
  name:   "ecosia",
  search: "https://www.ecosia.org/search?q=",
  // compl:  "https://search.brave.com/api/suggest?q=",
}

// Metager
completions.met = {
  alias:  "met", // "ecosia"
  name:   "metager",
  search: "https://metager.org/meta/meta.ger3?eingabe=",
}

// Qwant
completions.qw = {
  alias:  "qw", // "qwant"
  name:   "qwant",
  search: "https://www.qwant.com/?client=brz-brave&q=",
}

// DSearch
completions.ds = {
  alias:  "ds", // "dsearch"
  name:   "dsearch",
  search: "https://dsearch.com/search?q=",
}

//  ╭──────────────────────────────────────────────────────────╮
//  │                          Golang                          │
//  ╰──────────────────────────────────────────────────────────╯

// Golang Docs
completions.gg = googleCustomSearch({
  alias:  "gg",
  name:   "golang",
  domain: "golang.org",
})

// Godoc
completions.gd = {
  alias:  "gd",
  name:   "godoc",
  search: "https://godoc.org/?q=",
  compl:  "https://api.godoc.org/search?q=",
}

completions.gd.callback = response =>
  JSON.parse(response.text).results.map(s => {
    let prefix = ""
    if (s.import_count) {
      prefix += `[↓${s.import_count}] `
    }
    if (s.stars) {
      prefix += `[★${s.stars}] `
    }
    return createURLItem(prefix + s.path, `https://godoc.org/${s.path}`)
  })

//  ╭──────────────────────────────────────────────────────────╮
//  │                           Ruby                           │
//  ╰──────────────────────────────────────────────────────────╯

completions.gems = {
  alias:  "gems",
  name:   "rubygems",
  search: "https://rubygems.org/search?utf8=✓&query=",
  // compl:  "",
}

//  ╭──────────────────────────────────────────────────────────╮
//  │                          Python                          │
//  ╰──────────────────────────────────────────────────────────╯

completions.pyp = {
  alias:  "pyp",
  name:   "pypi",
  search: "https://pypi.python.org/pypi?%3Aaction=search&term=",
  // compl:  "",
}

//  ╭──────────────────────────────────────────────────────────╮
//  │                           Rust                           │
//  ╰──────────────────────────────────────────────────────────╯

// Rust std docs (doc.rust-lang.org)
completions.rsi = {
  alias:  "rsi",
  name:   "rust_docs",
  search: "https://doc.rust-lang.org/std/index.html?search=",
}

// Rust crate docs (docs.rs)
completions.rsd = {
  alias:  "rsd",
  name:   "rust_crate_docs",
  search: "https://docs.rs/releases/search?query=",
}

// Rust library search (lib.rs)
completions.rsl = {
  alias:  "rsl",
  name:   "rust_lib",
  search: "https://lib.rs/search?q=?",
}

// Rust packages (crates.io)
completions.rsp = {
  alias:  "rsp",
  name:   "rust_packages",
  search: "https://crates.io/search?q=",
}

//  ╭──────────────────────────────────────────────────────────╮
//  │              HTML, CSS, JavaScript, NodeJS               │
//  ╰──────────────────────────────────────────────────────────╯

// caniuse
completions.ci = {
  alias:   "ci",
  name:    "caniuse",
  search:  "https://caniuse.com/?search=",
  compl:   "https://caniuse.com/process/query.php?search=",
  favicon: "https://caniuse.com/img/favicon-128.png",
}

completions.ci.getData = async () => {
  const storageKey = "completions.ci.data"
  const storedData = await localStorage.get(storageKey)
  // if (storedData) {
  //   console.log("data found in localStorage", { storedData })
  //   return JSON.parse(storedData)
  // }
  console.log("data not found in localStorage", {storedData})
  const data = JSON.parse(
    await runtimeHttpRequest("https://caniuse.com/data.json"),
  )
  // console.log({ dataRes })
  // const data = await dataRes.json()
  //
  console.log({data})
  localStorage.set(storageKey, JSON.stringify(data))
  return data
}

completions.ci.callback = async response => {
  const {featureIds} = JSON.parse(response.text)
  const allData = await completions.ci.getData()
  console.log("featureIds", featureIds)
  console.log("allData", allData)
  return featureIds
    .map(featId => {
      const feat = allData.data[featId]
      return feat
        ? createSuggestionItem(
          `
          <div>
            <div class="title"><strong>${feat.title}</strong></div>
            <div>${feat.description}</div>
          </div>
        `,
          {url: "https://caniuse.com/?search="},
        )
        : null
    })
    .filter(Boolean)

  // const [allDataRes, featureDataRes] = await Promise.all([
  //   completions.ci.getData(),
  //   fetch(`https://caniuse.com/process/get_feat_data.php?type=support-data&feat=${featureIds.join(",")}`),
  // ])
  // const featureData = await featureDataRes.json()
  // console.log("featureIds", featureIds)
  // console.log("featureData", featureData)
  // return featureData.map((feat) =>
  //   createSuggestionItem(`
  //     <div>
  //       <span>${feat.description ?? feat.title ?? ""}</span>
  //     </div>
  //   `, { url: "https://caniuse.com/?search=" }))
}

// jQuery API documentation
completions.jq = googleCustomSearch({
  alias:  "jqu",
  name:   "jquery",
  domain: "jquery.com",
})

// NodeJS standard library documentation
completions.no = googleCustomSearch({
  alias:  "no",
  name:   "node",
  domain: "nodejs.org",
})

// Mozilla Developer Network (MDN)
completions.md = {
  alias:  "md",
  name:   "mdn",
  search: "https://developer.mozilla.org/search?q=",
  compl:  "https://developer.mozilla.org/api/v1/search?q=",
}

completions.md.callback = response => {
  // console.log({response})
  const res = JSON.parse(response.text)
  return res.documents.map(s =>
    createSuggestionItem(
      `
      <div>
        <div class="title"><strong>${escapeHTML(s.title)}</strong></div>
        <div style="font-size:0.8em"><em>${escapeHTML(s.slug)}</em></div>
        <div>${escapeHTML(s.summary)}</div>
      </div>
    `,
      {url: `https://developer.mozilla.org/${s.locale}/docs/${s.slug}`},
    ),
  )
}

// NPM registry search
completions.np = {
  alias:   "np",
  name:    "npm",
  search:  "https://www.npmjs.com/search?q=",
  compl:   "https://api.npms.io/v2/search/suggestions?size=20&q=",
  favicon: getDuckduckgoFaviconUrl("https://www.npmjs.com"),
}

completions.np.callback = response =>
  JSON.parse(response.text).map(s => {
    let flags = ""
    let desc = ""
    let date = ""
    if (s.package.description) {
      desc = escapeHTML(s.package.description)
    }
    if (s.flags) {
      Object.keys(s.flags).forEach(f => {
        flags += `[<span style='color:#ff4d00'>⚑</span> ${escapeHTML(f)}] `
      })
    }
    if (s.package.date) {
      date = prettyDate(new Date(s.package.date))
    }
    return createSuggestionItem(
      `
      <div>
        <style>
          .title > em {
            font-weight: bold;
          }
        </style>
        <div>
          <span class="title">${s.highlight}</span>
          <span style="font-size: 0.8em">v${s.package.version}</span>
        </div>
        <div>
          <span>${date}</span>
          <span>${flags}</span>
        </div>
        <div>${desc}</div>
      </div>
    `,
      {url: s.package.links.npm},
    )
  })

//  ╭──────────────────────────────────────────────────────────╮
//  │               Social Media & Entertainment               │
//  ╰──────────────────────────────────────────────────────────╯

// Hacker News (YCombinator)
completions.hn = {
  alias:  "hn",
  name:   "hackernews",
  domain: "news.ycombinator.com",
  search: "https://hn.algolia.com/?query=",
  compl:  "https://hn.algolia.com/api/v1/search?tags=(story,comment)&query=",
}

completions.hn.callback = response => {
  const res = JSON.parse(response.text)
  return res.hits.map(s => {
    let title = ""
    let prefix = ""
    if (s.points) {
      prefix += `[↑${s.points}] `
    }
    if (s.num_comments) {
      prefix += `[↲${s.num_comments}] `
    }
    switch (s._tags[0]) {
    case "story":
      title = s.title
      break
    case "comment":
      title = s.comment_text
      break
    default:
      title = s.objectID
    }
    const re = new RegExp(`(${res.query.split(" ").join("|")})`, "ig")
    title = title.replace(re, "<strong>$&</strong>")
    const url = `https://news.ycombinator.com/item?id=${s.objectID}`
    return createSuggestionItem(
      `
      <div>
        <div class="title">${prefix + title}</div>
        <div class="url">${url}</div>
      </div>
    `,
      {url},
    )
  })
}

// Twitter
completions.tw = {
  alias:  "tw",
  name:   "twitter",
  search: "https://twitter.com/search?q=",
}

// Reddit
completions.re = {
  alias:  "re",
  name:   "reddit",
  search: "https://www.reddit.com/search?sort=relevance&t=all&q=",
  compl:
    "https://api.reddit.com/search?syntax=plain&sort=relevance&limit=20&q=",
}

completions.re.callback = response =>
  JSON.parse(response.text).data.children.map(s =>
    createURLItem(
      `[${s.data.score}] ${s.data.title}`,
      `https://reddit.com${s.data.permalink}`,
    ),
  )

// YouTube
completions.yt = {
  alias:  "yt",
  name:   "youtube",
  search: "https://www.youtube.com/search?q=",
  compl:  `https://www.googleapis.com/youtube/v3/search?maxResults=20&part=snippet&type=video,channel&key=${priv.keys.google_yt}&safeSearch=none&q=`,
  priv:   true,
}

completions.yt.callback = response =>
  JSON.parse(response.text)
    .items.map(s => {
      switch (s.id.kind) {
      case "youtube#channel":
        return createURLItem(
          `${s.snippet.channelTitle}: ${s.snippet.description}`,
          `https://youtube.com/channel/${s.id.channelId}`,
        )
      case "youtube#video":
        return createURLItem(
          ` ▶ ${s.snippet.title}`,
          `https://youtu.be/${s.id.videoId}`,
        )
      default:
        return null
      }
    })
    .filter(s => s !== null)

// BitChute
completions.bs = {
  alias:  "bs",
  name:   "bitchute",
  search: "https://bitchute.com/search/?query=",
}

// Youtube Alt
completions.yta = {
  alias:  "yta",
  name:   "piped (youtube-alt)",
  search: "https://piped.kavin.rocks/results?search_query=",
}

// 4plebs
completions.fp = {
  alias:  "fp", // "4"
  name:   "4plebs",
  search: "https://archive.4plebs.org/pol/search/text/",
}

// ╭──────────────────────────────────────────────────────────╮
// │                          Piracy                          │
// ╰──────────────────────────────────────────────────────────╯

// PDFDrive
completions.pdf = {
  alias:  "pdf",
  name:   "pdfdrive",
  search: "https://www.pdfdrive.com/search?q=",
}

// LibGen.is
completions.libg = {
  alias:  "libg", // "lg"
  name:   "libgen.is",
  search: "http://libgen.rs/search.php?req=",
}

// LibGen.rs
completions.libr = {
  alias:  "libr", // "lgr"
  name:   "libgen.rs",
  search: "http://libgen.rs/search.php?req=",
}

// Sci-Hub
completions.scihub = {
  alias:  "sci",
  name:   "scihub",
  search: "https://sci-hub.ru/",
}

// ╭──────────────────────────────────────────────────────────╮
// │                          Other                           │
// ╰──────────────────────────────────────────────────────────╯

// Cryptome
completions.cr = {
  alias:  "cr",
  name:   "cryptome",
  search: "https://google.com/search?q=site%3Acryptome.org+",
}

// Wikileaks
completions.wl = {
  alias:  "wl",
  name:   "wikileaks",
  search: "https://search.wikileaks.org/?q=",
}

// Wikispooks
completions.wo = {
  alias:  "wo",
  name:   "wikispooks",
  search: "https://wikispooks.com/w/index.php?fulltext=Search&title=Special%3ASearch&search=",
}

// PGP - MIT
completions.pgpmit = {
  alias:  "pgpm",
  name:   "pgp_mit",
  search: "https://pgp.mit.edu/pks/lookup?op=index&search=",
}

// PGP - OpenPGP
completions.pgpopen = {
  alias:  "pgpo",
  name:   "pgp_openpgp",
  search: "https://keys.openpgp.org/search?q=",
}

// TODO:

// // Pastebin
// completions.pastebin = {
//   alias:  "pb",
//   name:   "pastebin",
//   search: "http://pastebin.com/search?ie=UTF-8&q=",
// }
//
// // Wikidata
// completions.wd = {
//   alias:  "wd",
//   name:   "wikidata",
//   search: "https://wikidata.org/w/index.php?fulltext=Search&title=Special%3ASearch&search=",
// }
//
// // Wikimedia
// completions.wm = {
//   alias:  "wm",
//   name:   "wikimedia",
//   search: "https://commons.wikimedia.org/w/index.php?fulltext=Search&title=Special%3AMediaSearch&type=image&search=",
// }
//
// // Wikiquote
// completions.wq = {
//   alias:  "wq",
//   name:   "wikiquote",
//   search: "https://en.wikiquote.org/w/index.php?fulltext=Search&title=Special%3ASearch&search=",
// }
//
// // Wikisource
// completions.wr = {
//   alias:  "wr",
//   name:   "wikisource",
//   search: "https://en.wikisource.org/w/index.php?fulltext=Search&title=Special%3ASearch&search=",
// }
//
// // man7.org
// completions.man7s = googleCustomSearch({
//   alias:  "man7s",
//   name:   "man7_website",
//   search: "man7.org",
//   // search: "https://www.google.com/search?q=%s&sitesearch=man7.org%2Flinux%2Fman-pages&sa=Search+online+pages",
// })
//
// // man.cx(3) - Library Calls
// completions.mancx3 = {
//   alias:  "cman3",
//   name:   "mancx_3_libcalls",
//   search: "https://man.cx/%s(3)",
// }

export default completions

import conf from "./conf.js"
import help from "./help.js"
import api from "./api.js"

const {categories} = help
const {
  mapkey,
  map,
  unmap,
  imap,
  imapkey,
  vmap,
  vmapkey,
  cmap,
  aceVimMap,
  addVimMapKey,
  Visual,
  Hints,
  Clipboard,
  Front,
  removeSearchAlias,
  addSearchAlias,
} = api

const registerKey = (domain, mapObj, siteleader) => {
  const {
    alias,
    callback,
    leader = domain === "global" ? "" : siteleader,
    category = categories.misc,
    description = "",
    path = "(/.*)?",
  } = mapObj

  const opts = {}
  const key = `${leader}${alias}`

  if (domain !== "global" && domain !== "vim") {
    const d = domain.replace(".", "\\.")
    opts.domain = new RegExp(`^http(s)?://(([a-zA-Z0-9-_]+\\.)*)(${d})${path}`)
  }

  if (domain === "vim") {
    if (typeof mapObj.mode !== "undefined") {
      aceVimMap(alias, mapObj.map, mapObj.mode)
    } else {
      const newObj = {keys: alias, ...mapObj}
      delete newObj.alias
      addVimMapKey(newObj)
    }
  } else {
    const fullDescription = `#${category} ${description}`

    let mapFns = [map, mapkey]
    switch (mapObj.mode) {
      case "v":
      case "visual":
        mapFns = [vmap, vmapkey]
        break
      case "i":
      case "insert":
        mapFns = [imap, imapkey]
        break
      case "c":
      case "command":
        mapFns = [cmap, null]
        break
      default:
    }

    if (typeof mapObj.map !== "undefined") {
      mapFns[0](alias, mapObj.map)
    } else {
      mapFns[1](key, fullDescription, callback, opts)
    }
  }
}

const registerKeys = (maps, aliases, siteleader) => {
  const hydratedAliases = Object.entries(aliases).flatMap(
    ([baseDomain, aliasDomains]) =>
      aliasDomains.flatMap(a => ({[a]: maps[baseDomain]})),
  )

  const mapsAndAliases = Object.assign({}, maps, ...hydratedAliases)

  Object.entries(mapsAndAliases).forEach(([domain, domainMaps]) =>
    domainMaps.forEach(mapObj => registerKey(domain, mapObj, siteleader)),
  )
}

const registerSearchEngines = (searchEngines, searchleader) =>
  Object.values(searchEngines).forEach(s => {
    const options = {
      favicon_url: s.favicon,
    }

    addSearchAlias(
      s.alias, // alias
      s.name, // prompt
      s.search, // search_url
      searchleader, // search_leader_key=s
      s.compl, // suggestion_url=null
      s.callback, // callback_to_parse_suggestion=null
      undefined, // only_this_site_key=o
      options, // options=null
    )
    mapkey(`${searchleader}${s.alias}`, `#8Search ${s.name}`, () =>
      Front.openOmnibar({type: "SearchEngine", extra: s.alias}),
    )
    mapkey(
      `c${searchleader}${s.alias}`,
      `#8Search ${s.name} with clipboard contents`,
      () => {
        Clipboard.read(c => {
          Front.openOmnibar({
            type:  "SearchEngine",
            pref:  c.data,
            extra: s.alias,
          })
        })
      },
    )
    if (searchleader !== "o") {
      unmap(`o${s.alias}`)
    }
  })

function main() {
  window.surfingKeys = api
  // eslint-disable-next-line no-console
  console.log({window, surfingKeys: window.surfingKeys})

  // settings
  if (conf.settings) {
    Object.assign(
      settings,
      typeof conf.settings === "function" ? conf.settings() : conf.settings,
    )
  }

  // keys: unmap
  if (conf.keys && conf.keys.unmaps) {
    const {unmaps} = conf.keys
    if (unmaps.mappings) {
      unmaps.mappings.forEach(m => unmap(m))
    }
    if (unmaps.searchAliases) {
      Object.entries(unmaps.searchAliases).forEach(([leader, items]) => {
        items.forEach(v => removeSearchAlias(v, leader))
      })
    }
  }

  // search engines
  if (conf.searchEngines) {
    registerSearchEngines(conf.searchEngines, conf.searchleader ?? "o")
  }

  // keys: map
  if (conf.keys && conf.keys.maps) {
    const {keys} = conf
    const {maps, aliases = {}} = keys
    registerKeys(maps, aliases, conf.siteleader)
  }

  Visual.style("cursor", "background-color: #9065b7;")
  Hints.style(
    // eslint-disable-next-line no-multi-str
    "padding: 1px !important;\
     border: solid 1px #483270 !important;\
     color: #eef5fb !important;\
     background: none !important;\
     background-color: #7a57a4 !important;",
  )
  Hints.style(
    // eslint-disable-next-line no-multi-str
    "div {\
        padding: 1px !important;\
        border: solid 1px #d7b0ff !important;\
        color: #eef5fb !important;\
        background: none !important;\
        background-color: #483270 !important;\
    }\
    div.begin{\
        color:#7a57a4 !important;\
    }",
    "text",
  )
}

if (typeof window !== "undefined") {
  main()
  // try {
  //   main()
  // } catch (err) {
  //   console.trace(err)
  // }
}

// vim: ft=javascript:et:sw=2:ts=2:sts=2:tw=100

const api = typeof browser !== "undefined" ? browser : chrome;
const canvas = document.getElementById("canvas");

function copyText(element) {
  element.classList.add("copied")
  navigator.clipboard.writeText(element.textContent)
  setTimeout(() => {
    element.classList.remove("copied")
  }, 1000)
};

(async () => {
  canvas.textContent = ""

  try {
    const [tab] = await api.tabs.query({ active: true, currentWindow: true })
    if (!tab || !tab.id)
      throw new Error("No active tab.")

    const res = await api.scripting.executeScript({
      target: { tabId: tab.id },
      args: [["iframe", "frame", "video", "source"]],
      func: (types) => {
        let ret = []

        document.querySelectorAll(types.join(", ")).forEach(node => {
          if (node.nodeType !== Node.ELEMENT_NODE || !types.includes(node.tagName.toLocaleLowerCase()))
            return

          if (node.src && node.src !== "about:blank")
            ret.push({
              src: node.src,
              type: node.getAttribute("type") || node.tagName
            })
          if (node.currentSrc && node.currentSrc !== "about:blank")
            ret.push({
              src: node.currentSrc,
              type: node.getAttribute("type") || node.tagName
            })
          if (node.srcSet && node.srcSet !== "about:blank")
            ret.push({
              src: node.srcSet,
              type: node.getAttribute("type") || node.tagName
            })
        })

        return ret
      }
    })

    const sources = res[0].result
    const sourceList = document.createElement("div")
    sourceList.className = "source-list"

    sources.forEach(node => {
      let i = 0
      var srcText = node.src
      var tags = [node.type.toLowerCase()]

      if (srcText.startsWith("http://"))
        tags.push("http")

      if (!node.src.startsWith("http") && node.src.includes(":")) {
        tags.push(node.src.split(":")[0])
        srcText = srcText.replace(node.src.split(":")[0] + ":", "")
      }

      if (node.src.split("https://").length > 2 || node.src.split("http://").length > 2) {
        tags.push("redirect")
        const splitIt = node.src.split("https://").length > 2 ? node.src.split("https://") : node.src.split("http://").length > 2 ? node.src.split("http://") : null
        if (splitIt)
          srcText = `${node.src.startsWith("https://") ? "https://" : "http://"}${splitIt.pop()}`
      }

      const perSource = document.createElement("a")
      perSource.className = "box"
      perSource.innerHTML = `<pre>${srcText}</pre>`
      perSource.id = "#" + i
      perSource.href = "#" + i
      sourceList.appendChild(perSource)

      const srcTags = document.createElement("div")
      srcTags.className = "tags"
      tags.forEach(tag => {
        if (!tag)
          return

        const srcTag = document.createElement("p")
        srcTag.className = "tag"
        srcTag.setAttribute("data-text", tag)
        srcTags.appendChild(srcTag)
      })
      perSource.appendChild(srcTags)

      perSource.addEventListener("click", () => { copyText(perSource) })

      i++
    })

    canvas.appendChild(sourceList)
  }
  catch (error) {
    const errMsg = document.createElement("div")
    errMsg.className = "error box"
    errMsg.textContent = error.message || error
    canvas.appendChild(errMsg)
  }

  if (canvas.textContent === "") {
    const errMsg = document.createElement("div")
    errMsg.className = "error box"
    errMsg.textContent = "No source found."
    canvas.appendChild(errMsg)
  }
})();

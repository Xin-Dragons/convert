self.addEventListener("message", async (event) => {
  const { wallet, collection, creator } = event.data

  const res = await fetch(`/api/get-nfts/${wallet}`, {
    method: "POST",
    headers: {
      ContentType: "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ collection, creator }),
  })

  const { digitalAssets } = await res.json()

  self.postMessage({
    digitalAssets,
  })
})

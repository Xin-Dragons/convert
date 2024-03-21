self.addEventListener("message", async (event) => {
  const { wallet, collection } = event.data

  const res = await fetch(`/api/get-nfts/${wallet}`, {
    method: "POST",
    headers: {
      ContentType: "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ collection }),
  })

  const { digitalAssets } = await res.json()

  self.postMessage({
    digitalAssets,
  })
})
